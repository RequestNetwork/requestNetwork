import { PaymentTypes } from '@requestnetwork/types';
import { getTheGraphClient, TheGraphClient } from '.';

// FIXME#1: when Near subgraphes can retrieve a txHash, replace the custom IPaymentNetworkEvent with PaymentTypes.ETHPaymentNetworkEvent
interface NearSubGraphPaymentEvent extends PaymentTypes.IETHPaymentEventParameters {
  receiptId: string;
}

/**
 * Gets a list of transfer events for a set of Near payment details
 */
export class NearInfoRetriever {
  private client: TheGraphClient<'near'>;
  /**
   * @param paymentReference The reference to identify the payment
   * @param toAddress Address to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The id of network we want to check
   */
  constructor(
    private paymentReference: string,
    private toAddress: string,
    private proxyContractName: string,
    private eventName: PaymentTypes.EVENTS_NAMES,
    private network: string,
  ) {
    if (this.network !== 'aurora' && this.network !== 'aurora-testnet') {
      throw new Error('Near input data info-retriever only works with Near mainnet and testnet');
    }
    if (this.network !== 'aurora') {
      // FIXME: remove this check and implement testnet detection once aurora-testnet subgraphes are available
      throw new Error(
        'FIXME: getTransactionsFromNearSubGraph() only implemented for aurora mainnet',
      );
    }
    this.network = this.network.replace('aurora', 'near');
    if (this.proxyContractName !== 'requestnetwork.near') {
      throw new Error(
        `Proxy contract "${proxyContractName}" not supported by Near subgraph retriever`,
      );
    }
    this.client = getTheGraphClient<'near'>(this.network);
  }

  public async getTransferEvents(): Promise<
    PaymentTypes.IPaymentNetworkEvent<NearSubGraphPaymentEvent>[]
  > {
    const payments = await this.client.GetNearPayments({
      reference: this.paymentReference,
      to: this.toAddress,
    });
    return payments.payments.map((p) => ({
      amount: p.amount,
      name: this.eventName,
      parameters: {
        block: p.block,
        confirmations: p.block,
        // Cf. FIXME#1 above
        // txHash: transaction.txHash,
        receiptId: p.receiptId,
      },
      timestamp: Number(p.timestamp),
    }));
  }
}
