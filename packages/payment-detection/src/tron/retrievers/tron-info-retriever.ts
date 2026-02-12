import { CurrencyTypes, PaymentTypes } from '@requestnetwork/types';
import { utils } from 'ethers';
import { ITheGraphBaseInfoRetriever, TransferEventsParams } from '../../types';
import { HasuraClient, HasuraPayment } from './hasura-client';

/**
 * TRON-specific payment event parameters
 */
export interface TronPaymentEvent extends PaymentTypes.IERC20FeePaymentEventParameters {
  txHash: string;
  // TRON-specific resource consumption fields
  energyUsed?: string;
  energyFee?: string;
  netFee?: string;
}

/**
 * Gets a list of transfer events for TRON payments via Hasura
 * Retriever for ERC20 Fee Proxy payments on TRON blockchain.
 */
export class TronInfoRetriever implements ITheGraphBaseInfoRetriever<TronPaymentEvent> {
  constructor(protected readonly client: HasuraClient) {}

  public async getTransferEvents(
    params: TransferEventsParams,
  ): Promise<PaymentTypes.AllNetworkEvents<TronPaymentEvent>> {
    const { paymentReference, toAddress, contractAddress, acceptedTokens, paymentChain } = params;

    if (acceptedTokens && acceptedTokens.length > 1) {
      throw new Error(`TronInfoRetriever does not support multiple accepted tokens.`);
    }

    // Map chain name to the chain identifier used in the database
    const chainIdentifier = this.getChainIdentifier(paymentChain);

    // The substream stores the keccak256 hash of the payment reference (from the indexed event topic)
    // so we must hash the raw reference before querying, matching the TheGraph-based retriever behavior
    const hashedReference = utils.keccak256(`0x${paymentReference}`);

    const payments = await this.client.getPaymentsByReference({
      paymentReference: hashedReference,
      toAddress,
      chain: chainIdentifier,
      tokenAddress: acceptedTokens?.[0],
      contractAddress,
    });

    return {
      paymentEvents: payments.map((p) => this.mapPaymentEvent(p, params)),
    };
  }

  private getChainIdentifier(paymentChain: CurrencyTypes.VMChainName): string {
    // Map SDK chain names to the chain identifiers stored in Hasura
    const chainMap: Record<string, string> = {
      tron: 'tron',
      nile: 'tron-nile',
    };

    return chainMap[paymentChain.toLowerCase()] || paymentChain.toLowerCase();
  }

  private mapPaymentEvent(
    payment: HasuraPayment,
    params: TransferEventsParams,
  ): PaymentTypes.IPaymentNetworkEvent<TronPaymentEvent> {
    // Note: TRON addresses use Base58 format, not Ethereum checksum format
    // So we don't use formatAddress which expects EVM addresses
    // Hasura returns NUMERIC fields as JSON numbers; we must coerce to strings
    // since IPaymentNetworkEvent.amount and feeAmount expect string types
    return {
      amount: String(payment.amount),
      name: params.eventName,
      timestamp: payment.timestamp,
      parameters: {
        txHash: payment.tx_hash,
        feeAmount: String(payment.fee_amount),
        block: payment.block_number,
        to: payment.to_address,
        from: payment.from_address,
        feeAddress: payment.fee_address || undefined,
        tokenAddress: payment.token_address || undefined,
        // TRON-specific resource fields
        energyUsed: payment.energy_used || undefined,
        energyFee: payment.energy_fee || undefined,
        netFee: payment.net_fee || undefined,
      },
    };
  }
}
