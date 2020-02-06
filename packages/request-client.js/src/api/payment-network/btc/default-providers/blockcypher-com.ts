import { PaymentTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import fetch from 'node-fetch';
const bigNumber: any = require('bn.js');

/* eslint-disable spellcheck/spell-checker */

// Maximum number of api requests to retry when an error is encountered (ECONNRESET, EPIPE, ENOTFOUND)
const BLOCKCYPHER_REQUEST_MAX_RETRY = 3;

// Delay between retries in ms
const BLOCKCYPHER_REQUEST_RETRY_DELAY = 100;

/**
 * The Bitcoin Info retriever give access to the bitcoin blockchain through the api of blockcypher.com
 */
export default class BlockcypherCom implements PaymentTypes.IBitcoinDetectionProvider {
  /**
   * Gets BTC address info using blockcypher.com public API
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
    const queryUrl = `${baseUrl}/addrs/${address}`;
    try {
      const res = await Utils.retry(async () => fetch(queryUrl), {
        maxRetries: BLOCKCYPHER_REQUEST_MAX_RETRY,
        retryDelay: BLOCKCYPHER_REQUEST_RETRY_DELAY,
      })();

      // tslint:disable-next-line:no-magic-numbers
      if (res.status >= 400) {
        throw new Error(`Error ${res.status}. Bad response from server ${queryUrl}`);
      }
      const addressInfo = await res.json();

      return this.parse(addressInfo, eventName);
    } catch (err) {
      // tslint:disable-next-line:no-console
      console.warn(err.message || err);
      return { balance: '-1', events: [] };
    }
  }

  /**
   * Parses the address information from the data of blockcypher.com
   *
   * @param addressInfo Data of blockchain.info
   * @param eventName Indicates if it is an address for payment or refund
   * @returns Balance with events
   */
  public parse(
    addressInfo: any,
    eventName: PaymentTypes.EVENTS_NAMES,
  ): PaymentTypes.BTCBalanceWithEvents {
    const balance = new bigNumber(addressInfo.total_received).toString();

    // Retrieves all the transaction hash of the transactions having as input the current address
    const inputTxHashes = addressInfo.txrefs
      .filter((tx: any) => tx.tx_output_n === -1)
      .map((tx: any) => tx.tx_hash);

    const events: PaymentTypes.BTCPaymentNetworkEvent[] = addressInfo.txrefs
      // keep only the transaction with this address as output
      .filter((tx: any) => tx.tx_input_n === -1)
      // exclude the transactions coming from the same address
      .filter((tx: any) => !inputTxHashes.includes(tx.tx_hash))
      .map(
        (tx: any): PaymentTypes.BTCPaymentNetworkEvent => ({
          amount: tx.value.toString(),
          name: eventName,
          parameters: {
            block: tx.block_height,
            txHash: tx.tx_hash,
          },
          // timestamp - not given by this API
        }),
      );

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
      return 'https://api.blockcypher.com/v1/btc/main/';
    }
    if (bitcoinNetworkId === 3) {
      return 'https://api.blockcypher.com/v1/btc/test3';
    }

    throw new Error(
      `Invalid network 0 (mainnet) or 3 (testnet) was expected but ${bitcoinNetworkId} was given`,
    );
  }
}
