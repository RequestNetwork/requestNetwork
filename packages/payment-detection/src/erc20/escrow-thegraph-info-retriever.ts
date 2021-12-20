import { PaymentTypes } from '@requestnetwork/types';
// import { utils } from 'ethers';

import { getTheGraphClient, TheGraphClient, TheGraphClientOptions } from '../thegraph';
import { hashReference } from '../utils';
// import { GraphPaymentQueryParams } from './thegraph-info-retriever';
/**
 * Retrieves all events from the EscrowERC20 contract.
 */
export default class EscrowERC20GraphInfoRetriever {
  private client: TheGraphClient;
  constructor(
    private paymentReference: string,
    private escrowContractAddress: string,
    private network: string,
    private options?: TheGraphClientOptions,
  ) {
    this.client = getTheGraphClient(this.network, this.options);
  }

  private getGraphEscrowEventsVariables() {
    return {
      contractAddress: this.escrowContractAddress,
      reference: hashReference(this.paymentReference),
    };
  }

  public async getEscrowEvents(): Promise<PaymentTypes.EscrowEvents[]> {
    const variables = this.getGraphEscrowEventsVariables();
    const escrowEventList = await this.client.GetEscrowEvents(variables);
    return escrowEventList.escrowEvents.map((p) => ({
      block: p.block,
      txHash: p.txHash,
      eventType: p.eventType,
      from: p.from,
      timestamp: p.timestamp,
    }));
  }
}
