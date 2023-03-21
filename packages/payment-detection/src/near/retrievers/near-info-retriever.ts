import { PaymentTypes } from '@requestnetwork/types';
import { getTheGraphNearClient, ITheGraphBaseInfoRetriever, TheGraphClient } from '../../thegraph';
import { NearChains } from '@requestnetwork/currency';
import { GetNearPaymentsQuery } from 'payment-detection/src/thegraph/generated/graphql-near';

// FIXME#1: when Near subgraphes can retrieve a txHash, replace the custom IPaymentNetworkEvent with PaymentTypes.ETHPaymentNetworkEvent
export interface NearPaymentEvent extends PaymentTypes.IERC20FeePaymentEventParameters {
  receiptId: string;
}

/**
 * Gets a list of transfer events for a set of Near payment details
 */
export class NearInfoRetriever
  //<
  // TPaymentEvent extends NearSubGraphPaymentEvent = NearSubGraphPaymentEvent,
  //>
  implements ITheGraphBaseInfoRetriever<NearPaymentEvent>
{
  protected client: TheGraphClient<'near'>;
  /**
   * @param paymentReference The reference to identify the payment
   * @param toAddress Address to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The id of network we want to check
   *
   */
  constructor(
    protected paymentReference: string,
    protected toAddress: string,
    protected proxyContractName: string,
    protected eventName: PaymentTypes.EVENTS_NAMES,
    network: string,
    protected tokenAddress?: string, // protected currency?: string,
  ) {
    try {
      NearChains.assertChainSupported(network);
    } catch {
      throw new Error('Near input data info-retriever only works with Near mainnet and testnet');
    }

    network = network.replace('aurora', 'near');
    this.client = getTheGraphNearClient(
      `https://api.thegraph.com/subgraphs/name/requestnetwork/request-payments-${network}`,
    );
  }

  public async getTransferEvents(): Promise<PaymentTypes.AllNetworkEvents<NearPaymentEvent>> {
    const payments = this.tokenAddress
      ? await this.client.GetFungibleTokenPayments({
          reference: this.paymentReference,
          to: this.toAddress,
          contractAddress: this.proxyContractName,
          tokenAddress: this.tokenAddress,
        })
      : await this.client.GetNearPayments({
          reference: this.paymentReference,
          to: this.toAddress,
          contractAddress: this.proxyContractName,
        });
    return {
      paymentEvents: payments.payments.map((p) => this.mapPaymentEvent(p)),
    };
  }

  private mapPaymentEvent(
    payment: GetNearPaymentsQuery['payments'][0],
  ): PaymentTypes.IPaymentNetworkEvent<NearPaymentEvent> {
    // const block: number = payment.block;
    return {
      amount: payment.amount,
      name: this.eventName,
      parameters: {
        // amount: payment.amount,
        // timestamp: payment.timestamp,
        feeAmount: payment.feeAmount,
        // currency: payment.currency,
        receiptId: payment.receiptId,
        // block: Number(payment.block) as number,
        // gasUsed: payment.gasUsed,
        // gasPrice: payment.gasPrice,
        // amountInCrypto: payment.amountInCrypto,
        // feeAmountInCrypto: payment.feeAmountInCrypto,
        to: this.toAddress,
        from: payment.from,
        feeAddress: payment.feeAddress ?? undefined,
        tokenAddress: this.tokenAddress,
        // contractAddress: this.proxyContractName,
      },
    };
  }
}
