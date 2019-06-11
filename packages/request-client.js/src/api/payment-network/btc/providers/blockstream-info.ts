import fetch from 'node-fetch';
import * as Types from '../../../../types';
const bigNumber: any = require('bn.js');

/* eslint-disable spellcheck/spell-checker */

/**
 * The Bitcoin Info retriever give access to the bitcoin blockchain through the api of blockstream.info
 */
export default class BlockstreamInfo implements Types.IBitcoinProvider {
  /**
   * Gets BTC address info using blockstream.info public API
   *
   * @param bitcoinNetworkId The Bitcoin network ID: 0 (mainnet) or 3 (testnet)
   * @param address BTC address to check
   * @param eventName Indicates if it is an address for payment or refund
   * @returns Object containing address info
   */
  public async getAddressInfo(
    bitcoinNetworkId: number,
    address: string,
    eventName: Types.EVENTS_NAMES,
  ): Promise<Types.IBalanceWithEvents> {
    const baseUrl = this.getBaseUrl(bitcoinNetworkId);

    try {
      const res = await fetch(`${baseUrl}/address/${address}/txs`);
      // tslint:disable-next-line:no-magic-numbers
      if (res.status >= 400) {
        throw new Error(`Error ${res.status}. Bad response from server ${baseUrl}/${address}`);
      }
      const txs = await res.json();

      return this.parse({ address, txs }, eventName);
    } catch (err) {
      // tslint:disable-next-line:no-console
      console.warn(err);
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
  public parse(addressInfo: any, eventName: Types.EVENTS_NAMES): Types.IBalanceWithEvents {
    const events: Types.IPaymentNetworkEvent[] = addressInfo.txs
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
        (output: any): Types.IPaymentNetworkEvent => ({
          name: eventName,
          parameters: {
            amount: output.output.value.toString(),
            block: output.blockHeight,
            timestamp: output.timestamp,
            txHash: output.txHash,
          },
        }),
      );

    const balance: string = events
      .reduce((balanceAccumulator: any, event: Types.IPaymentNetworkEvent) => {
        return balanceAccumulator.add(new bigNumber(event.parameters.amount));
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
