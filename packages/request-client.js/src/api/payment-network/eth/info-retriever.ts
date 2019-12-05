import { ethers } from 'ethers';
import * as Types from '../../../types';

/**
 * Gets a list of transfer events for an address and payment reference
 */
export default class ETHInfoRetriever
  implements Types.IPaymentNetworkInfoRetriever<Types.ETHPaymentNetworkEvent> {
  /**
   * @param address Address to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The id of network we want to check
   * @param paymentReference The reference to identify the payment
   * @param etherscanApiToken The etherscan API token
   */
  constructor(
    private toAddress: string,
    private eventName: Types.EVENTS_NAMES,
    private network: string,
    private paymentReference: string,
    private etherscanApiKey?: string,
  ) {}

  public async getTransferEvents(): Promise<Types.ETHPaymentNetworkEvent[]> {
    if (this.network === 'private') {
      throw new Error(
        'ETH input data info-retriever works with etherscan and cannot work on a local network',
      );
    }
    const provider = new ethers.providers.EtherscanProvider(this.network, this.etherscanApiKey);
    const history = await provider.getHistory(this.toAddress);

    const events = history
      // keep only when address is the destination
      .filter(
        transaction =>
          transaction.to && transaction.to.toLowerCase() === this.toAddress.toLowerCase(),
      )
      // keep only if data contains the payment reference
      .filter(
        transaction =>
          transaction.data.toLowerCase() === '0x' + this.paymentReference.toLowerCase(),
      )
      .map(transaction => ({
        amount: transaction.value.toString(),
        block: transaction.blockNumber,
        name: this.eventName,
        parameters: {
          confirmations: transaction.confirmations,
        },
        timestamp: transaction.timestamp,
        txHash: transaction.hash,
      }));

    return events;
  }
}
