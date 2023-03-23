import { PaymentTypes } from '@requestnetwork/types';
import { ICurrencyManager } from '@requestnetwork/currency';
import { utils } from 'ethers';
import { pick, mapValues } from 'lodash';
import { TheGraphClient, TheGraphInfoRetriever } from '.';
import type { PaymentEventResultFragment } from './generated/graphql';
import { formatAddress, unpadAmountFromChainlink } from '../utils';
import { ConversionTransferEventsParams } from '../types';

/**
 * TheGraph info retriever for conversion payments on EVMs
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
    const { payments } = await this.client.GetAnyToFungiblePaymentsAndEscrowState({
      reference: utils.keccak256(`0x${params.paymentReference}`),
      to: params.toAddress,
      currency: params.requestCurrency,
      acceptedTokens: params.acceptedTokens
        ? params.acceptedTokens.map((t) => t.toLowerCase())
        : [null],
      contractAddress: params.contractAddress.toLowerCase(),
    });

    params.acceptedTokens =
      params.acceptedTokens?.map((tok) => formatAddress(tok, 'acceptedTokens')) || [];
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
    // FIXME: move to TheGraph when they support OR operator
    return (
      payment.maxRateTimespan !== undefined &&
      payment.maxRateTimespan !== null &&
      params.maxRateTimespan !== undefined &&
      payment.maxRateTimespan < params.maxRateTimespan
    );
  }

  protected mapPaymentEvents(
    payment: PaymentEventResultFragment,
    params: ConversionTransferEventsParams,
  ): PaymentTypes.IPaymentNetworkEvent<PaymentTypes.IERC20FeePaymentEventParameters> {
    let amount: string = payment.amount;
    let feeAmount: string = payment.feeAmount;

    if (payment.currency) {
      // account for the possibility the searched currency is of type ISO4217 and has no network
      const ccy =
        this.currencyManager.fromHash(payment.currency, params.paymentChain) ||
        this.currencyManager.fromHash(payment.currency);
      if (!ccy) {
        throw new Error(`Currency with hash ${payment.currency} is unknown`);
      }
      amount = unpadAmountFromChainlink(amount, ccy).toString();
      feeAmount = unpadAmountFromChainlink(feeAmount, ccy).toString();
    }

    return {
      amount,
      name: params.eventName,
      timestamp: payment.timestamp,
      parameters: {
        feeAmount,
        block: payment.block,
        to: formatAddress(payment.to, 'to'),
        ...mapValues(
          pick(
            payment,
            'txHash',
            'gasUsed',
            'gasPrice',
            'amountInCrypto',
            'feeAmountInCrypto',
            'maxRateTimespan',
          ),
          (val) => (val !== null ? String(val) : undefined),
        ),
        // Make sure the checksum is right for addresses.
        ...mapValues(pick(payment, 'from', 'feeAddress', 'tokenAddress'), (str, key) =>
          str ? formatAddress(str, key) : undefined,
        ),
      },
    };
  }
}
