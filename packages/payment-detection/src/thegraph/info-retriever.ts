import { PaymentTypes } from '@requestnetwork/types';
import { ICurrencyManager } from '@requestnetwork/currency';
import { utils } from 'ethers';
import { pick, mapValues } from 'lodash';
import type { TheGraphClient } from '.';
import type { EscrowEventResultFragment, PaymentEventResultFragment } from './generated/graphql';
import { unpadAmountFromChainlink } from '../utils';

type TransferEventsParams = {
  /** The reference to identify the payment*/
  paymentReference: string;
  /** The recipient of the transfer */
  toAddress: string;
  /** The address of the payment proxy */
  contractAddress: string;
  /** The chain to check for payment */
  paymentChain: string;
  eventName: PaymentTypes.EVENTS_NAMES;
  acceptedTokens?: string[];
  maxRateTimespan?: number;
};

export class TheGraphInfoRetriever {
  constructor(
    private readonly client: TheGraphClient,
    private readonly currencyManager: ICurrencyManager,
  ) {}

  public async getTransferEvents(
    params: TransferEventsParams,
  ): Promise<PaymentTypes.AllNetworkEvents<PaymentTypes.IERC20FeePaymentEventParameters>> {
    const { payments, escrowEvents } = await this.client.GetPaymentsAndEscrowState({
      reference: utils.keccak256(`0x${params.paymentReference}`),
      to: params.toAddress,
    });

    params.contractAddress = utils.getAddress(params.contractAddress);
    params.acceptedTokens = params.acceptedTokens?.map(utils.getAddress) || [];
    return {
      paymentEvents: payments
        .filter((payment) => this.filterPaymentEvents(payment, params))
        .map((payment) => this.mapPaymentEvents(payment, params)),
      escrowEvents: escrowEvents.map((escrow) => this.mapEscrowEvents(escrow, params)),
    };
  }

  private filterPaymentEvents(payment: PaymentEventResultFragment, params: TransferEventsParams) {
    // Check contract address matches expected
    if (utils.getAddress(payment.contractAddress) !== params.contractAddress) {
      return false;
    }
    // Check paid token tokens matches expected (conversion only)
    if (
      payment.tokenAddress &&
      !params.acceptedTokens?.includes(utils.getAddress(payment.tokenAddress))
    ) {
      return false;
    }
    // Check payment was done within expected delays (conversion only)
    if (
      payment.maxRateTimespan !== undefined &&
      payment.maxRateTimespan !== null &&
      params.maxRateTimespan !== undefined &&
      payment.maxRateTimespan < params.maxRateTimespan
    ) {
      return false;
    }
    return true;
  }

  private mapPaymentEvents(payment: PaymentEventResultFragment, params: TransferEventsParams) {
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
        to: utils.getAddress(payment.to),
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
          String,
        ),
        // Make sure the checksum is right for addresses.
        ...mapValues(pick(payment, 'from', 'feeAddress', 'tokenAddress'), (str) =>
          str ? utils.getAddress(str) : undefined,
        ),
      },
    };
  }

  private mapEscrowEvents(escrow: EscrowEventResultFragment, params: TransferEventsParams) {
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
