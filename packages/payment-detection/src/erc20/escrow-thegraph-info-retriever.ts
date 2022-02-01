import { PaymentTypes } from '@requestnetwork/types';
// import { utils } from 'ethers';

import { getTheGraphClient, TheGraphClient, TheGraphClientOptions } from '../thegraph';
import { hashReference } from '../utils';
/**
 * Retrieves all events from the EscrowERC20 contract.
 */
export default class EscrowERC20GraphInfoRetriever
  implements
    PaymentTypes.IPaymentNetworkBaseInfoRetriever<
      PaymentTypes.ICustomNetworkEvent<PaymentTypes.GenericEventParameters>,
      PaymentTypes.ESCROW_EVENTS_NAMES
    > {
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

  protected getEscrowEventName(graphEventName: string): PaymentTypes.ESCROW_EVENTS_NAMES {
    const eventNameMap: Record<string, PaymentTypes.ESCROW_EVENTS_NAMES> = {
      paidEscrow: PaymentTypes.ESCROW_EVENTS_NAMES.INIT_ESCROW,
      initiateEmergencyClaim: PaymentTypes.ESCROW_EVENTS_NAMES.INITIATED_EMERGENCY_CLAIM,
      revertEmergencyClaim: PaymentTypes.ESCROW_EVENTS_NAMES.REVERTED_EMERGENCY_CLAIM,
      freezeEscrow: PaymentTypes.ESCROW_EVENTS_NAMES.FROZEN_PAYMENT,
    };
    return eventNameMap[graphEventName];
  }

  public async getAllContractEvents(): Promise<
    PaymentTypes.ICustomNetworkEvent<
      PaymentTypes.GenericEventParameters,
      PaymentTypes.ESCROW_EVENTS_NAMES
    >[]
  > {
    const variables = this.getGraphEscrowEventsVariables();
    const escrowEventList = await this.client.GetEscrowEvents(variables);
    return escrowEventList.escrowEvents.map((p) => ({
      name: this.getEscrowEventName(p.eventName),
      amount: 0,
      parameters: {
        block: p.block,
        txHash: p.txHash,
      },
      timestamp: p.timestamp,
    }));
  }

  public async getEscrow(): Promise<PaymentTypes.Escrow[]> {
    const variables = this.getGraphEscrowEventsVariables();
    const queryResults = await this.client.GetEscrowState(variables);
    return queryResults.escrows.map((p) => ({
      creationBlock: p.creationBlock,
      creationTimestamp: p.creationTimestamp,
      escrowState: p.escrowState,
      tokenAddress: p.tokenAddress,
      amount: p.amount,
      payer: p.payer,
      payee: p.payee,
      feeAmount: p.feeAmount,
      feeAddress: p.feeAddress,
    }));
  }
}
