import { PaymentTypes } from '@requestnetwork/types';
import TheGraphInfoRetriever, { GraphPaymentQueryParams } from './thegraph-info-retriever';

export class NativeGraphInfoRetriever extends TheGraphInfoRetriever {
  /**
   * @param paymentReference The reference to identify the payment
   * @param proxyContractAddress The address of the proxy contract
   * @param toAddress Address of the balance we want to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The Ethereum network to use
   */
  constructor(
    protected paymentReference: string,
    protected proxyContractAddress: string,
    protected toAddress: string,
    protected eventName: PaymentTypes.EVENTS_NAMES,
    protected network: string,
  ) {
    super(paymentReference, proxyContractAddress, '', toAddress, eventName, network);
  }

  protected getGraphVariables(): GraphPaymentQueryParams {
    return {
      contractAddress: this.proxyContractAddress,
      reference: this.paymentReference,
      to: this.toAddress,
      tokenAddress: null,
    };
  }
}

export default NativeGraphInfoRetriever;
