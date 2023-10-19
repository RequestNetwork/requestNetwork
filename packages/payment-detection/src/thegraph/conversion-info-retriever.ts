import { PaymentTypes } from '@requestnetwork/types';
import { ICurrencyManager } from '@requestnetwork/currency';
import { utils } from 'ethers';
import { TheGraphClient } from './client.js';
import { TheGraphInfoRetriever } from './info-retriever.js';
import type { PaymentEventResultFragment } from './generated/graphql.js';
import { ConversionTransferEventsParams } from '../types.js';

/**
 * TheGraph info retriever for conversion payments on EVMs, with no escrow support
 */
export class TheGraphConversionInfoRetriever extends TheGraphInfoRetriever<ConversionTransferEventsParams> {
  constructor(
    protected readonly client: TheGraphClient,
    protected readonly currencyManager: ICurrencyManager,
  ) {
    super(client, currencyManager);
  }

  public async getTransferEvents(
    params: ConversionTransferEventsParams,
  ): Promise<PaymentTypes.AllNetworkEvents<PaymentTypes.IERC20FeePaymentEventParameters>> {
    const { payments } = params.acceptedTokens
      ? await this.client.GetAnyToFungiblePayments({
          reference: utils.keccak256(`0x${params.paymentReference}`),
          to: params.toAddress.toLowerCase(),
          currency: params.requestCurrency.hash.toLowerCase(),
          acceptedTokens: params.acceptedTokens.map((t) => t.toLowerCase()),
          contractAddress: params.contractAddress.toLowerCase(),
        })
      : await this.client.GetAnyToNativePayments({
          reference: utils.keccak256(`0x${params.paymentReference}`),
          to: params.toAddress.toLowerCase(),
          currency: params.requestCurrency.hash.toLowerCase(),
          contractAddress: params.contractAddress.toLowerCase(),
        });

    return {
      paymentEvents: payments
        .filter((payment) => this.filterPaymentEvents(payment, params))
        .map((payment) => this.mapPaymentEvents(payment, params)),
      escrowEvents: [],
    };
  }

  protected filterPaymentEvents(
    payment: PaymentEventResultFragment,
    params: ConversionTransferEventsParams,
  ): boolean {
    // FIXME: move maxRateTimespan filter to TheGraph when they support the OR operator
    return !(
      payment.maxRateTimespan !== undefined &&
      payment.maxRateTimespan !== null &&
      params.maxRateTimespan !== undefined &&
      payment.maxRateTimespan < params.maxRateTimespan
    );
  }
}
