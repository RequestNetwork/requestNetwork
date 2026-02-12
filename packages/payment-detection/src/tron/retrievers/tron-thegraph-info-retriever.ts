import { CurrencyTypes, PaymentTypes } from '@requestnetwork/types';
import { utils } from 'ethers';
import { TheGraphClient } from '../../thegraph';
import { GetTronPaymentsQuery } from '../../thegraph/generated/graphql-tron';
import { ITheGraphBaseInfoRetriever, TransferEventsParams } from '../../types';

/**
 * TRON-specific payment event parameters (TheGraph-based)
 */
export interface TronTheGraphPaymentEvent extends PaymentTypes.IERC20FeePaymentEventParameters {
  txHash: string;
}

/**
 * TheGraph-based info retriever for ERC20 Fee Proxy payments on TRON.
 * Uses the TRON subgraph (Substreams-powered) via TheGraphClient.
 */
export class TronTheGraphInfoRetriever
  implements ITheGraphBaseInfoRetriever<TronTheGraphPaymentEvent>
{
  constructor(protected readonly client: TheGraphClient<CurrencyTypes.TronChainName>) {}

  public async getTransferEvents(
    params: TransferEventsParams,
  ): Promise<PaymentTypes.AllNetworkEvents<TronTheGraphPaymentEvent>> {
    const { paymentReference, toAddress, contractAddress, acceptedTokens } = params;

    if (acceptedTokens && acceptedTokens.length > 1) {
      throw new Error('TronTheGraphInfoRetriever does not support multiple accepted tokens.');
    }

    const reference = utils.keccak256(`0x${paymentReference}`);

    const payments =
      acceptedTokens?.length === 1
        ? await this.client.GetTronPayments({
            reference,
            to: toAddress,
            tokenAddress: acceptedTokens[0],
            contractAddress,
          })
        : await this.client.GetTronPaymentsAnyToken({
            reference,
            to: toAddress,
            contractAddress,
          });

    return {
      paymentEvents: payments.payments.map((p) => this.mapPaymentEvent(p, params)),
    };
  }

  private mapPaymentEvent(
    payment: GetTronPaymentsQuery['payments'][0],
    params: TransferEventsParams,
  ): PaymentTypes.IPaymentNetworkEvent<TronTheGraphPaymentEvent> {
    return {
      amount: payment.amount,
      name: params.eventName,
      timestamp: payment.timestamp,
      parameters: {
        txHash: payment.txHash,
        feeAmount: payment.feeAmount,
        block: payment.block,
        to: params.toAddress,
        from: payment.from,
        feeAddress: payment.feeAddress ?? undefined,
        tokenAddress: payment.tokenAddress ?? undefined,
      },
    };
  }
}
