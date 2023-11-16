import { CurrencyTypes, PaymentTypes } from '@requestnetwork/types';
import { utils } from 'ethers';
import { pick, mapValues } from 'lodash';
import type { TheGraphClient } from './client';
import type { EscrowEventResultFragment, PaymentEventResultFragment } from './generated/graphql';
import { formatAddress, unpadAmountFromChainlink } from '../utils';
import { TransferEventsParams, ITheGraphBaseInfoRetriever } from '../types';

/**
 * TheGraph info retriever for payments without conversion on EVMs
 */
export class TheGraphInfoRetriever<TGraphQuery extends TransferEventsParams = TransferEventsParams>
  implements ITheGraphBaseInfoRetriever<PaymentTypes.IERC20FeePaymentEventParameters>
{
  constructor(
    protected readonly client: TheGraphClient,
    protected readonly currencyManager: CurrencyTypes.ICurrencyManager,
  ) {}

  public async getTransferEvents(
    params: TGraphQuery,
  ): Promise<PaymentTypes.AllNetworkEvents<PaymentTypes.IERC20FeePaymentEventParameters>> {
    if (params.acceptedTokens && params.acceptedTokens.length > 1) {
      throw new Error('TheGraphInfoRetriever only supports no or 1 acceptedToken.');
    }
    const { payments, escrowEvents } = await this.client.GetPaymentsAndEscrowState({
      reference: utils.keccak256(`0x${params.paymentReference}`),
      to: params.toAddress.toLowerCase(),
      tokenAddress: params.acceptedTokens ? params.acceptedTokens[0].toLowerCase() : null,
      contractAddress: params.contractAddress.toLowerCase(),
    });

    return {
      paymentEvents: payments.map((payment) => this.mapPaymentEvents(payment, params)),
      escrowEvents: escrowEvents.map((escrow) => this.mapEscrowEvents(escrow, params)),
    };
  }

  // FIXME: this method should probably have the same filter as `getTransferEvents`.
  public async getReceivableEvents(
    params: TGraphQuery,
  ): Promise<PaymentTypes.AllNetworkEvents<PaymentTypes.IERC20FeePaymentEventParameters>> {
    if (params.acceptedTokens && params.acceptedTokens.length > 1) {
      throw new Error('TheGraphInfoRetriever only supports no or 1 acceptedToken.');
    }
    const { payments, escrowEvents } = await this.client.GetPaymentsAndEscrowStateForReceivables({
      reference: utils.keccak256(`0x${params.paymentReference}`),
      tokenAddress: params.acceptedTokens ? params.acceptedTokens[0].toLowerCase() : null,
      contractAddress: params.contractAddress.toLowerCase(),
    });

    return {
      paymentEvents: payments.map((payment) => this.mapPaymentEvents(payment, params)),
      escrowEvents: escrowEvents.map((escrow) => this.mapEscrowEvents(escrow, params)),
    };
  }

  protected mapPaymentEvents(
    payment: PaymentEventResultFragment,
    params: TGraphQuery,
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

  private mapEscrowEvents(escrow: EscrowEventResultFragment, params: TGraphQuery) {
    return {
      name: PaymentTypes.EVENTS_NAMES.ESCROW,
      timestamp: escrow.timestamp,
      parameters: {
        to: params.toAddress,
        from: escrow.from,
        txHash: escrow.txHash,
        block: escrow.block,
        eventName: escrow.eventName,
        gasUsed: escrow.gasUsed,
        gasPrice: escrow.gasPrice,
      },
    };
  }
}
