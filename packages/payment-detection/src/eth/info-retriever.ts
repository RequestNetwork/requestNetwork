import { PaymentTypes } from '@requestnetwork/types';
import { MultichainExplorerApiProvider } from './multichainExplorerApiProvider';

/**
 * Gets a list of transfer events for an address and payment reference
 */
export class EthInputDataInfoRetriever
  implements PaymentTypes.IPaymentNetworkInfoRetriever<PaymentTypes.ETHPaymentNetworkEvent> {
  /**
   * @param toAddress Address to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The id of network we want to check
   * @param paymentReference The reference to identify the payment
   * @param explorerApiKey The explorer (etherscan...) API key
   */
  constructor(
    private toAddress: string,
    private eventName: PaymentTypes.EVENTS_NAMES,
    private network: string,
    private paymentReference: string,
    private explorerApiKey?: string,
  ) {}

  public async getTransferEvents(): Promise<PaymentTypes.ETHPaymentNetworkEvent[]> {
    if (this.network === 'private') {
      throw new Error(
        'ETH input data info-retriever works with etherscan and cannot work on a local network',
      );
    }
    const provider = new MultichainExplorerApiProvider(this.network, this.explorerApiKey);
    const history = await provider.getHistory(this.toAddress);

    const events = history
      // remove potential duplicates (eg. if sender and receiver are the same)
      .filter(
        (transaction, index) => history.findIndex((x) => x.hash === transaction.hash) === index,
      )
      // keep only when address is the destination
      .filter(
        (transaction) =>
          transaction.to && transaction.to.toLowerCase() === this.toAddress.toLowerCase(),
      )
      // keep only if data contains the payment reference
      .filter(
        (transaction) =>
          transaction.data.toLowerCase() === '0x' + this.paymentReference.toLowerCase(),
      )
      .map((transaction) => ({
        amount: transaction.value.toString(),
        name: this.eventName,
        parameters: {
          block: transaction.blockNumber,
          confirmations: transaction.confirmations,
          txHash: transaction.hash,
        },
        timestamp: transaction.timestamp,
      }));

    return events;
  }
}
