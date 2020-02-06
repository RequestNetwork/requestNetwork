import { PaymentTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import fetch from 'node-fetch';
const bigNumber: any = require('bn.js');

/* eslint-disable spellcheck/spell-checker */

// Maximum number of api requests to retry when an error is encountered (ECONNRESET, EPIPE, ENOTFOUND)
const BLOCKSTREAMINFO_REQUEST_MAX_RETRY = 3;

// Delay between retries in ms
const BLOCKSTREAMINFO_REQUEST_RETRY_DELAY = 100;

// Number of transactions per page
const TXS_PER_PAGE = 25;

/**
 * The Bitcoin Info retriever give access to the bitcoin blockchain through the api of blockstream.info
 */
export default class BlockstreamInfo implements PaymentTypes.IBitcoinDetectionProvider {
  /**
   * Gets BTC address info using blockstream.info public API
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
    const baseUrl = this.getBaseUrl(bitcoinNetworkId);
    const queryUrl = `${baseUrl}/address/${address}/txs`;
    try {
      const res = await Utils.retry(async () => fetch(queryUrl), {
        maxRetries: BLOCKSTREAMINFO_REQUEST_MAX_RETRY,
        retryDelay: BLOCKSTREAMINFO_REQUEST_RETRY_DELAY,
      })();

      // tslint:disable-next-line:no-magic-numbers
      if (res.status >= 400) {
        throw new Error(`Error ${res.status}. Bad response from server ${queryUrl}`);
      }
      let txs: any[] = await res.json();

      let checkForMoreTransactions = txs.length === TXS_PER_PAGE;
      // if there are 'TXS_PER_PAGE' transactions, need to check the pagination
      while (checkForMoreTransactions) {
        const lastTxHash = txs[txs.length - 1].txid;

        const resExtraPage = await Utils.retry(
          async () => fetch(`${baseUrl}/address/${address}/txs/chain/${lastTxHash}`),
          {
            maxRetries: BLOCKSTREAMINFO_REQUEST_MAX_RETRY,
            retryDelay: BLOCKSTREAMINFO_REQUEST_RETRY_DELAY,
          },
        )();

        // tslint:disable-next-line:no-magic-numbers
        if (resExtraPage.status >= 400) {
          throw new Error(
            `Error ${resExtraPage.status}. Bad response from server ${baseUrl}/${address}`,
          );
        }
        const extraTxs = await resExtraPage.json();

        checkForMoreTransactions = extraTxs.length === TXS_PER_PAGE;

        // gather all the transactions retrieved
        txs = txs.concat(extraTxs);
      }

      return this.parse({ address, txs }, eventName);
    } catch (err) {
      // tslint:disable-next-line:no-console
      console.warn(err.message || err);
      return { balance: '-1', events: [] };
    }
  }

  /**
   * Parses the address information from the data of blockstream.info
   *
   * @param addressInfo Data from blockstream.info
   * @param eventName Indicates if it is an address for payment or refund
   * @returns Balance with events
   */
  public parse(
    addressInfo: any,
    eventName: PaymentTypes.EVENTS_NAMES,
  ): PaymentTypes.BTCBalanceWithEvents {
    const events: PaymentTypes.BTCPaymentNetworkEvent[] = addressInfo.txs
      // exclude the transactions coming from the same address
      .filter((tx: any) => {
        const autoVin = tx.vin.filter(
          (input: any) => input.prevout.scriptpubkey_address === addressInfo.address,
        );
        return autoVin.length === 0;
      })
      .reduce((allOutput: any[], tx: any) => {
        return [
          ...allOutput,
          ...tx.vout.map((output: any) => ({
            blockHeight: tx.status.block_height,
            output,
            timestamp: tx.status.block_time,
            txHash: tx.txid,
          })),
        ];
      }, [])
      .filter((output: any) => output.output.scriptpubkey_address === addressInfo.address)
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

    const balance: string = events
      .reduce((balanceAccumulator: any, event: PaymentTypes.BTCPaymentNetworkEvent) => {
        return balanceAccumulator.add(new bigNumber(event.amount));
      }, new bigNumber('0'))
      .toString();

    return { balance, events };
  }

  /**
   * Gets the base url to fetch according to the networkId
   *
   * @param bitcoinNetworkId the Bitcoin network ID: 0 (mainnet) or 3 (testnet)
   * @returns The blockchain info URL
   */
  private getBaseUrl(bitcoinNetworkId: number): string {
    if (bitcoinNetworkId === 0) {
      return 'https://blockstream.info/api/';
    }
    if (bitcoinNetworkId === 3) {
      return 'https://blockstream.info/testnet/api/';
    }

    throw new Error(
      `Invalid network 0 (mainnet) or 3 (testnet) was expected but ${bitcoinNetworkId} was given`,
    );
  }
}
