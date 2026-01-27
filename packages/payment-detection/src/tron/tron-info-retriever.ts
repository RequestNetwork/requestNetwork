import { CurrencyTypes, PaymentTypes } from '@requestnetwork/types';
import { utils } from 'ethers';
import type { TheGraphClient } from '../thegraph';
import type { GetTronPaymentsQuery } from '../thegraph/generated/graphql-tron';
import { ITheGraphBaseInfoRetriever, TransferEventsParams } from '../types';

/**
 * TRON payment event parameters
 */
export interface TronPaymentEvent extends PaymentTypes.IERC20FeePaymentEventParameters {
  txHash: string;
}

/**
 * TheGraph info retriever for ERC20FeeProxy payments on TRON
 * Retrieves TransferWithReferenceAndFee events from the TRON Substreams-powered subgraph
 */
export class TronInfoRetriever implements ITheGraphBaseInfoRetriever<TronPaymentEvent> {
  constructor(protected readonly client: TheGraphClient<CurrencyTypes.TronChainName>) {}

  public async getTransferEvents(
    params: TransferEventsParams,
  ): Promise<PaymentTypes.AllNetworkEvents<TronPaymentEvent>> {
    const { paymentReference, toAddress, contractAddress, acceptedTokens } = params;

    if (acceptedTokens && acceptedTokens.length > 1) {
      throw new Error(`TronInfoRetriever does not support multiple accepted tokens.`);
    }

    // Hash the payment reference as done in EVM subgraphs
    const hashedReference = utils.keccak256(`0x${paymentReference}`);

    let payments: GetTronPaymentsQuery['payments'];

    if (acceptedTokens?.length === 1) {
      const result = await this.client.GetTronPayments({
        reference: hashedReference,
        to: toAddress,
        tokenAddress: acceptedTokens[0],
        contractAddress,
      });
      payments = result.payments;
    } else {
      const result = await this.client.GetTronPaymentsAnyToken({
        reference: hashedReference,
        to: toAddress,
        contractAddress,
      });
      payments = result.payments;
    }

    return {
      paymentEvents: payments.map((p: GetTronPaymentsQuery['payments'][0]) =>
        this.mapPaymentEvent(p, params),
      ),
    };
  }

  private mapPaymentEvent(
    payment: GetTronPaymentsQuery['payments'][0],
    params: TransferEventsParams,
  ): PaymentTypes.IPaymentNetworkEvent<TronPaymentEvent> {
    return {
      amount: String(payment.amount),
      name: params.eventName,
      timestamp: payment.timestamp,
      parameters: {
        feeAmount: payment.feeAmount ? String(payment.feeAmount) : undefined,
        txHash: payment.txHash,
        block: payment.block,
        to: params.toAddress,
        from: payment.from,
        feeAddress: payment.feeAddress ?? undefined,
        tokenAddress: payment.tokenAddress,
      },
    };
  }
}
