import { CurrencyTypes, PaymentTypes } from '@requestnetwork/types';
import { NearInfoRetriever, NearPaymentEvent } from './near-info-retriever';
import { TheGraphClient } from '../../thegraph';

export type TransferEventsParams = {
  /** The reference to identify the payment*/
  paymentReference: string;
  /** Request denomination (usually fiat) */
  requestCurrency: CurrencyTypes.CurrencyDefinition;
  /** The recipient of the transfer */
  toAddress: string;
  /** The address of the payment proxy */
  contractAddress: string;
  /** The chain to check for payment */
  paymentChain: CurrencyTypes.VMChainName;
  /** Indicates if it is an address for payment or refund */
  eventName: PaymentTypes.EVENTS_NAMES;
  /** The maximum span between the time the rate was fetched and the payment */
  maxRateTimespan?: number;
};

/**
 * Gets a list of transfer events for a set of Near payment details
 */
export class NearConversionInfoRetriever extends NearInfoRetriever {
  /**
   * @param paymentReference The reference to identify the payment
   * @param toAddress Address to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The id of network we want to check
   */
  constructor(protected readonly client: TheGraphClient<CurrencyTypes.NearChainName>) {
    super(client);
  }
  public async getTransferEvents(
    params: TransferEventsParams,
  ): Promise<PaymentTypes.AllNetworkEvents<NearPaymentEvent>> {
    const {
      requestCurrency,
      paymentReference,
      toAddress,
      contractAddress,
      eventName,
      maxRateTimespan,
    } = params;
    const payments = await this.client.GetAnyToNativePayments({
      reference: paymentReference,
      to: toAddress,
      currency: requestCurrency.symbol,
      maxRateTimespan: maxRateTimespan ?? 0,
      contractAddress: contractAddress,
    });
    return {
      paymentEvents: payments.payments.map((p: any) => ({
        amount: p.amount,
        name: eventName,
        parameters: {
          block: p.block,
          feeAddress: p.feeAddress || undefined,
          feeAmount: p.feeAmount,
          feeAmountInCrypto: p.feeAmountInCrypto || undefined,
          amountInCrypto: p.amountInCrypto,
          to: toAddress,
          maxRateTimespan: p.maxRateTimespan?.toString(),
          from: p.from,
          gasUsed: p.gasUsed,
          gasPrice: p.gasPrice,
          receiptId: p.receiptId,
          currency: p.currency,
        },
        timestamp: Number(p.timestamp),
      })),
    };
  }
}
