import { PaymentTypes } from '@requestnetwork/types';
import { utils } from 'ethers';
import { FlowUpdatedEvent } from '../thegraph/generated/graphql-superfluid';
import { getTheGraphClient, TheGraphClient, TheGraphClientOptions } from '../thegraph/superfluid';

/** Parameters for getting payment events from theGraph */
type GraphPaymentQueryParams = {
  reference: string;
  to: string;
  tokenAddress: string | null;
};

export class SuperFluidInfoRetriever {
  private client: TheGraphClient;

  /**
   * @param paymentReference The reference to identify the payment
   * @param tokenContractAddress The address of the ERC777 contract
   * @param toAddress Address of the balance we want to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The Ethereum network to use
   * @param options Extra options to GraphQL client
   */
  constructor(
    private paymentReference: string,
    private tokenContractAddress: string | null,
    private toAddress: string,
    private eventName: PaymentTypes.EVENTS_NAMES,
    private network: string,
    private options?: TheGraphClientOptions,
  ) {
    this.client = getTheGraphClient(this.network, this.options);
  }

  private getGraphVariables(): GraphPaymentQueryParams {
    return {
      reference: utils.keccak256(`0x${this.paymentReference}`),
      to: this.toAddress,
      tokenAddress: this.tokenContractAddress,
    };
  }

  // First MVP version which convert :
  // stream events queried from SuperFluid subgraph
  // into payment events with the parameters expected by extractEvents function
  // to compute balance from amounts in ERC20 style transactions
  public async getTransferEvents(): Promise<PaymentTypes.ERC20PaymentNetworkEvent[]> {
    const variables = this.getGraphVariables();
    const { flow, untagged } = await this.client.GetSuperFluidEvents(variables);

    const streamEvents = flow.concat(untagged).sort((a, b) => a.timestamp - b.timestamp);
    if (streamEvents[streamEvents.length - 1].flowRate > 0) {
      streamEvents.push({
        flowRate: 0,
        timestamp: Math.floor(Date.now() / 1000),
        blockNumber: 0,
        transactionHash: '0x',
      } as FlowUpdatedEvent);
    }
    const paymentEvents: PaymentTypes.ERC20PaymentNetworkEvent[] = [];
    for (let index = 1; index < streamEvents.length; index++) {
      const amount =
        (streamEvents[index - 1].flowRate - streamEvents[index - 1].oldFlowRate) *
        (streamEvents[index].timestamp - streamEvents[index - 1].timestamp);
      if (amount > 0) {
        paymentEvents.push({
          amount: amount.toString(),
          name: this.eventName,
          parameters: {
            to: this.toAddress,
            block: streamEvents[index].blockNumber,
            txHash: streamEvents[index].transactionHash,
          },
          timestamp: streamEvents[index].timestamp,
        });
      }
    }
    return paymentEvents;
  }
}
