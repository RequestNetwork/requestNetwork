import { PaymentTypes } from '@requestnetwork/types';
import * as converterBTC from 'satoshi-bitcoin';
import { BigNumber } from 'ethers';
import { retry } from '@requestnetwork/utils';

// Maximum number of api requests to retry when an error is encountered (ECONNRESET, EPIPE, ENOTFOUND)
const CHAINSO_REQUEST_MAX_RETRY = 3;

// Delay between retries in ms
const CHAINSO_REQUEST_RETRY_DELAY = 100;

/**
 * The Bitcoin Info retriever give access to the bitcoin blockchain through the api of chain.so
 */
export class ChainSoProvider implements PaymentTypes.IBitcoinDetectionProvider {
  /**
   * Gets BTC address info using chain.so public API
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
    const queryUrl = `${baseUrl}${address}`;

    try {
      const res = await retry(fetch, {
        maxRetries: CHAINSO_REQUEST_MAX_RETRY,
        retryDelay: CHAINSO_REQUEST_RETRY_DELAY,
      })(queryUrl);

      // eslint-disable-next-line no-magic-numbers
      if (res.status >= 400) {
        throw new Error(`Error ${res.status}. Bad response from server ${queryUrl}`);
      }
      const data = await res.json();

      if (data.status === 'fail') {
        throw new Error(`Error bad response from ${baseUrl}: ${data.message}`);
      }

      return this.parse(data, eventName);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(err.message || err);
      return { balance: '-1', events: [] };
    }
  }

  /**
   * Parses the address information from the data of chain.so
   *
   * @param addressInfo Data of chain.so
   * @param eventName Indicates if it is an address for payment or refund
   * @returns Balance with events
   */
  public parse(
    addressInfo: any,
    eventName: PaymentTypes.EVENTS_NAMES,
  ): PaymentTypes.BTCBalanceWithEvents {
    const events: PaymentTypes.BTCPaymentNetworkEvent[] = addressInfo.data.txs
      // keep only the transaction with value incoming to the address
      .filter((tx: any) => tx.incoming !== undefined)
      // delete transactions that are from this address
      .filter((tx: any) => tx.outgoing === undefined)
      .map(
        (tx: any): PaymentTypes.BTCPaymentNetworkEvent => ({
          amount: converterBTC.toSatoshi(tx.incoming.value).toString(),
          name: eventName,
          parameters: {
            block: tx.block_no,
            txHash: tx.txid,
          },
          timestamp: tx.time,
        }),
      );

    // Compute the balance making the sum of all the transactions amount
    const balance: string = events
      .reduce((balanceAccumulator: any, event: PaymentTypes.BTCPaymentNetworkEvent) => {
        return balanceAccumulator.add(BigNumber.from(event.amount));
      }, BigNumber.from('0'))
      .toString();

    return { balance, events };
  }

  /**
   * Gets the base url to fetch according to the networkId
   *
   * @param bitcoinNetworkId the Bitcoin network ID: 0 (mainnet) or 3 (testnet)
   * @returns The chain.so info URL
   */
  private getBaseUrl(bitcoinNetworkId: number): string {
    if (bitcoinNetworkId === 0) {
      return 'https://chain.so/api/v2/address/BTC/';
    }
    if (bitcoinNetworkId === 3) {
      return 'https://chain.so/api/v2/address/BTCTEST/';
    }

    throw new Error(
      `Invalid network 0 (mainnet) or 3 (testnet) was expected but ${bitcoinNetworkId} was given`,
    );
  }
}
