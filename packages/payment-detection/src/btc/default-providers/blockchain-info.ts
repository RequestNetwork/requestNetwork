import { PaymentTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import fetch from 'node-fetch';

const bigNumber: any = require('bn.js');

/* eslint-disable spellcheck/spell-checker */

// Maximum number of api requests to retry when an error is encountered (ECONNRESET, EPIPE, ENOTFOUND)
const BLOCKCHAININFO_REQUEST_MAX_RETRY = 3;

// Delay between retries in ms
const BLOCKCHAININFO_REQUEST_RETRY_DELAY = 100;

// Number of transactions per page
const TXS_PER_PAGE = 50;

/**
 * The Bitcoin Info retriever give access to the bitcoin blockchain through the api of blockchain.info
 */
export default class BlockchainInfo implements PaymentTypes.IBitcoinDetectionProvider {
  /**
   * Gets BTC address info using blockchain.info public API
   *
   * @param bitcoinNetworkId The Bitcoin network ID: 0 (mainnet) or 3 (testnet)
   * @param address BTC address to check
   * @param eventName Indicates if it is an address for payment or refund
   * @returns Object containing address info
   */
  public async getAddressBalanceWithEvents(
    bitcoinNetworkId: number,
    address: string,
    eventName: PaymentTypes.EVENTS_NAMES,
  ): Promise<PaymentTypes.BTCBalanceWithEvents> {
    const blockchainInfoUrl = this.getBlockchainInfoUrl(bitcoinNetworkId);

    const queryUrl = `${blockchainInfoUrl}/rawaddr/${address}?cors=true`;
    try {
      const res = await Utils.retry(async () => fetch(queryUrl), {
        maxRetries: BLOCKCHAININFO_REQUEST_MAX_RETRY,
        retryDelay: BLOCKCHAININFO_REQUEST_RETRY_DELAY,
      })();

      // tslint:disable-next-line:no-magic-numbers
      if (res.status >= 400) {
        throw new Error(`Error ${res.status}. Bad response from server ${queryUrl}`);
      }
      const addressInfo = await res.json();

      // count the number of extra pages to retrieve
      const numberOfExtraPages = Math.floor(addressInfo.n_tx / (TXS_PER_PAGE + 1));

      // get all the transactions from the whole pagination
      for (let i = 1; i <= numberOfExtraPages; i++) {
        const resExtraPage = await Utils.retry(
          async () =>
            fetch(`${blockchainInfoUrl}/rawaddr/${address}?cors=true&offset=${i * TXS_PER_PAGE}`),
          {
            maxRetries: BLOCKCHAININFO_REQUEST_MAX_RETRY,
            retryDelay: BLOCKCHAININFO_REQUEST_RETRY_DELAY,
          },
        )();

        // tslint:disable-next-line:no-magic-numbers
        if (resExtraPage.status >= 400) {
          throw new Error(
            `Error ${resExtraPage.status}. Bad response from server ${blockchainInfoUrl}`,
          );
        }
        const extraPageAddressInfo = await resExtraPage.json();

        // gather all the transactions retrieved
        addressInfo.txs = addressInfo.txs.concat(extraPageAddressInfo.txs);
      }

      return this.parse(addressInfo, eventName);
    } catch (err) {
      // tslint:disable-next-line:no-console
      console.warn(err.message || err);
      return { balance: '-1', events: [] };
    }
  }

  /**
   * Parses the address information from the data of blockchain.info
   *
   * @param addressInfo Data of blockchain.info
   * @param eventName Indicates if it is an address for payment or refund
   * @returns Balance with events
   */
  public parse(
    addressInfo: any,
    eventName: PaymentTypes.EVENTS_NAMES,
  ): PaymentTypes.BTCBalanceWithEvents {
    const address = addressInfo.address;
    const balance = new bigNumber(addressInfo.total_received).toString();

    const events: PaymentTypes.BTCPaymentNetworkEvent[] = addressInfo.txs
      // exclude the transactions coming from the same address
      .filter((tx: any) => {
        const selfInputs = tx.inputs.filter(
          (input: any) => input.prev_out.addr === addressInfo.address,
        );
        return selfInputs.length === 0;
      })
      .reduce((allOutput: any[], tx: any) => {
        return [
          ...allOutput,
          ...tx.out.map((output: any) => ({
            blockHeight: tx.block_height,
            output,
            timestamp: tx.time,
            txHash: tx.hash,
          })),
        ];
      }, [])
      .filter((output: any) => output.output.addr === address)
      .map(
        (output: any): PaymentTypes.BTCPaymentNetworkEvent => ({
          amount: output.output.value.toString(),
          name: eventName,
          parameters: {
            block: output.blockHeight,
            txHash: output.txHash,
          },
          timestamp: output.timestamp,
        }),
      );

    return { balance, events };
  }

  /**
   * Gets the BlockchainInfo url to fetch according to the networkId
   *
   * @param bitcoinNetworkId the Bitcoin network ID: 0 (mainnet) or 3 (testnet)
   * @returns The blockchain info URL
   */
  private getBlockchainInfoUrl(bitcoinNetworkId: number): string {
    if (bitcoinNetworkId === 0) {
      return 'https://blockchain.info';
    }
    if (bitcoinNetworkId === 3) {
      return 'https://testnet.blockchain.info';
    }

    throw new Error(
      `Invalid network 0 (mainnet) or 3 (testnet) was expected but ${bitcoinNetworkId} was given`,
    );
  }
}
