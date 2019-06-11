import fetch from 'node-fetch';
import * as Types from '../../../../types';
const bigNumber: any = require('bn.js');

/* eslint-disable spellcheck/spell-checker */

/**
 * The Bitcoin Info retriever give access to the bitcoin blockchain through the api of blockchain.info
 */
export default class BlockchainInfo implements Types.IBitcoinProvider {
  /**
   * Gets BTC address info using blockchain.info public API
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
    const blockchainInfoUrl = this.getBlockchainInfoUrl(bitcoinNetworkId);

    try {
      const res = await fetch(`${blockchainInfoUrl}/rawaddr/${address}?cors=true`);
      // tslint:disable-next-line:no-magic-numbers
      if (res.status >= 400) {
        throw new Error(`Error ${res.status}. Bad response from server ${blockchainInfoUrl}`);
      }
      const addressInfo = await res.json();

      return this.parse(addressInfo, eventName);
    } catch (err) {
      // tslint:disable-next-line:no-console
      console.warn(err);
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
  public parse(addressInfo: any, eventName: Types.EVENTS_NAMES): Types.IBalanceWithEvents {
    const address = addressInfo.address;
    const balance = new bigNumber(addressInfo.total_received).toString();

    const events: Types.IPaymentNetworkEvent[] = addressInfo.txs
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
