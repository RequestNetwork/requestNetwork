import fetch from 'node-fetch';
import * as Types from '../../../types';
const bigNumber: any = require('bn.js');

/**
 * The Bitcoin Info retriever give access to the bitcoin blockchain through the api of blockchain.info
 */
export default class PaymentNetworkBTCBitcoinInfoRetriever {
  /**
   * Gets BTC address info using blockchain.info public API
   *
   * @param bitcoinNetworkId The Bitcoin network ID: 0 (mainnet) or 3 (testnet)
   * @param address BTC address to check
   * @param eventName Indicates if it is an address for payment or refund
   * @returns Object containing address info
   */
  public static async getAddressInfo(
    bitcoinNetworkId: number,
    address: string,
    eventName: Types.EVENTS_NAMES,
  ): Promise<Types.IBalanceWithEvents> {
    const blockchainInfoUrl = this.getBlockchainInfoUrl(bitcoinNetworkId);

    try {
      // eslint-disable-next-line spellcheck/spell-checker
      const res = await fetch(`${blockchainInfoUrl}/rawaddr/${address}?cors=true`);
      // tslint:disable-next-line:no-magic-numbers
      if (res.status >= 400) {
        throw new Error(`Error ${res.status}. Bad response from server ${blockchainInfoUrl}`);
      }
      const addressInfo = await res.json();

      return this.parseBlockchainInfo(addressInfo, eventName);
    } catch (err) {
      throw err;
    }
  }

  /**
   * Parses the address information from the data of blockchain.info
   *
   * @param addressInfo Data of blockchain.info
   * @param eventName Indicates if it is an address for payment or refund
   * @returns Balance with events
   */
  public static parseBlockchainInfo(
    addressInfo: any,
    eventName: Types.EVENTS_NAMES,
  ): Types.IBalanceWithEvents {
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
      // eslint-disable-next-line spellcheck/spell-checker
      .filter((output: any) => output.output.addr === address)
      .map(
        (output: any): Types.IPaymentNetworkEvent => ({
          name: eventName,
          parameters: {
            amount: output.output.value,
            block: output.blockHeight,
            timestamp: output.timestamp,
            txHash: output.txHash,
          },
        }),
      )
      .filter((elem: any) => elem !== undefined);

    return { balance, events };
  }

  /**
   * Gets the BlockchainInfo url to fetch according to the networkId
   *
   * @param bitcoinNetworkId the Bitcoin network ID: 0 (mainnet) or 3 (testnet)
   * @returns The blockchain info URL
   */
  private static getBlockchainInfoUrl(bitcoinNetworkId: number): string {
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
