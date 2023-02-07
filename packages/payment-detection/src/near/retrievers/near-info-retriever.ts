import { CurrencyTypes, PaymentTypes } from '@requestnetwork/types';
import { getTheGraphNearClient, TheGraphClient } from '../../thegraph';
import { NearChains } from '@requestnetwork/currency';

// FIXME#1: when Near subgraphes can retrieve a txHash, replace the custom IPaymentNetworkEvent with PaymentTypes.ETHPaymentNetworkEvent
interface NearSubGraphPaymentEvent extends PaymentTypes.IETHPaymentEventParameters {
  receiptId: string;
}

/**
 * Gets a list of transfer events for a set of Near payment details
 */
export class NearInfoRetriever {
  protected client: TheGraphClient<'near'>;
  /**
   * @param paymentReference The reference to identify the payment
   * @param toAddress Address to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The id of network we want to check
   *
   */
  constructor(
    protected paymentReference: string,
    protected toAddress: string,
    protected proxyContractName: string,
    protected eventName: PaymentTypes.EVENTS_NAMES,
    network: string,
  ) {
    if (!NearChains.chainNames.includes(network as CurrencyTypes.NearChainName)) {
      throw new Error('Near input data info-retriever only works with Near mainnet and testnet');
    }

    network = network.replace('aurora', 'near');
    this.client = getTheGraphNearClient(
      `https://api.thegraph.com/subgraphs/name/requestnetwork/request-payments-${network}`,
    );
  }

  public async getTransferEvents(): Promise<
    PaymentTypes.IPaymentNetworkEvent<NearSubGraphPaymentEvent>[]
  > {
    const payments = await this.client.GetNearPayments({
      reference: this.paymentReference,
      to: this.toAddress,
      contractAddress: this.proxyContractName,
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
