import { PaymentTypes } from '@requestnetwork/types';
import { CurrencyDefinition } from '@requestnetwork/currency';
import { NearInfoRetriever, NearPaymentEvent } from './near-info-retriever';

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
  constructor(
    protected requestCurrency: CurrencyDefinition,
    protected paymentReference: string,
    protected toAddress: string,
    protected proxyContractName: string,
    protected eventName: PaymentTypes.EVENTS_NAMES,
    protected network: string,
    protected maxRateTimespan: number = 0,
  ) {
    super(paymentReference, toAddress, proxyContractName, eventName, network);
  }

  public async getTransferEvents(): Promise<PaymentTypes.AllNetworkEvents<NearPaymentEvent>> {
    const payments = await this.client.GetNearConversionPayments({
      reference: this.paymentReference,
      to: this.toAddress,
      currency: this.requestCurrency.symbol,
      maxRateTimespan: this.maxRateTimespan,
      contractAddress: this.proxyContractName,
    });
    return {
      paymentEvents: payments.payments.map((p: any) => ({
        amount: p.amount,
        name: this.eventName,
        parameters: {
          block: p.block,
          feeAddress: p.feeAddress || undefined,
          feeAmount: p.feeAmount,
          feeAmountInCrypto: p.feeAmountInCrypto || undefined,
          amountInCrypto: p.amountInCrypto,
          to: this.toAddress,
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
