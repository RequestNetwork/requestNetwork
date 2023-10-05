import { CurrencyTypes, PaymentTypes } from '@requestnetwork/types';
import { TheGraphClient } from '../../thegraph';
import { GetNearPaymentsQuery } from 'payment-detection/src/thegraph/generated/graphql-near';
import { ITheGraphBaseInfoRetriever } from 'payment-detection/src/types';

// FIXME#1: when Near subgraphes can retrieve a txHash, replace the custom IPaymentNetworkEvent with PaymentTypes.ETHPaymentNetworkEvent
export interface NearPaymentEvent extends PaymentTypes.IERC20FeePaymentEventParameters {
  receiptId: string;
}

export type TransferEventsParams = {
  /** The reference to identify the payment*/
  paymentReference: string;
  /** The recipient of the transfer */
  toAddress: string;
  /** The address of the payment proxy */
  contractAddress: string;
  /** The chain to check for payment */
  paymentChain: CurrencyTypes.VMChainName;
  /** Indicates if it is an address for payment or refund */
  eventName: PaymentTypes.EVENTS_NAMES;
  /** The list of ERC20 tokens addresses accepted for payments and refunds. Set to `undefined` for payments in NEAR token. */
  acceptedTokens?: string[];
};
/**
 * Gets a list of transfer events for a set of Near payment details
 * TheGraph-based etriever for ERC20 Fee Proxy and Native token payments.
 */
export class NearInfoRetriever implements ITheGraphBaseInfoRetriever<NearPaymentEvent> {
  /**
   * @param paymentReference The reference to identify the payment
   * @param toAddress Address to check
   * @param eventName Indicate if it is an address for payment or refund
   *
   */
  constructor(protected readonly client: TheGraphClient<CurrencyTypes.NearChainName>) {}

  public async getTransferEvents(
    params: TransferEventsParams,
  ): Promise<PaymentTypes.AllNetworkEvents<NearPaymentEvent>> {
    const { paymentReference, toAddress, contractAddress, acceptedTokens } = params;
    if (acceptedTokens && acceptedTokens.length > 1)
      throw new Error(`NearInfoRetriever does not support multiple accepted tokens.`);
    const payments =
      acceptedTokens?.length === 1
        ? await this.client.GetFungibleTokenPayments({
            reference: paymentReference,
            to: toAddress,
            contractAddress,
            tokenAddress: acceptedTokens[0],
          })
        : await this.client.GetNearPayments({
            reference: paymentReference,
            to: toAddress,
            contractAddress,
          });
    return {
      paymentEvents: payments.payments.map((p) => this.mapPaymentEvent(p, params)),
    };
  }

  private mapPaymentEvent(
    payment: GetNearPaymentsQuery['payments'][0],
    params: TransferEventsParams,
  ): PaymentTypes.IPaymentNetworkEvent<NearPaymentEvent> {
    return {
      amount: payment.amount,
      name: params.eventName,
      timestamp: Number(payment.timestamp),
      parameters: {
        feeAmount: payment.feeAmount,
        receiptId: payment.receiptId,
        block: payment.block,
        to: params.toAddress,
        from: payment.from,
        feeAddress: payment.feeAddress ?? undefined,
        tokenAddress: params.acceptedTokens ? params.acceptedTokens[0] : undefined,
      },
    };
  }
}
