import { PaymentTypes } from '@requestnetwork/types';
import { utils } from 'ethers';
import { FlowUpdatedEvent } from '../thegraph/generated/graphql-superfluid';
import {
  getTheGraphSuperfluidClient,
  TheGraphSuperfluidClient,
  TheGraphClientOptions,
} from '../thegraph/superfluid';

/** Parameters for getting payment events from theGraph */
type GraphPaymentQueryParams = {
  reference: string;
  to: string;
  tokenAddress: string | null;
};

export class SuperFluidInfoRetriever {
  private client: TheGraphSuperfluidClient;

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
    this.client = getTheGraphSuperfluidClient(this.network, this.options);
  }

  private getGraphVariables(): GraphPaymentQueryParams {
    return {
      reference: utils.keccak256(`0x${this.paymentReference}`),
      to: this.toAddress,
      tokenAddress: this.tokenContractAddress,
    };
  }

  /**
   * First MVP version which convert :
   * stream events queried from SuperFluid subgraph
   * into payment events with the parameters expected by extractEvents function
   * to compute balance from amounts in ERC20 style transactions
   */
  public async getTransferEvents(): Promise<PaymentTypes.ERC20PaymentNetworkEvent[]> {
    const variables = this.getGraphVariables();
    const { flow, untagged } = await this.client.GetSuperFluidEvents(variables);
    // Chronological sorting of events having payment reference and closing events without payment reference
    const streamEvents = flow.concat(untagged).sort((a, b) => a.timestamp - b.timestamp);
    const paymentEvents: PaymentTypes.ERC20PaymentNetworkEvent[] = [];
    if (streamEvents.length < 1) {
      return paymentEvents;
    }

    // if last event is ongoing stream then create end of stream to help compute balance
    if (streamEvents[streamEvents.length - 1].flowRate > 0) {
      streamEvents.push({
        oldFlowRate: streamEvents[streamEvents.length - 1].flowRate,
        flowRate: 0,
        timestamp: Math.floor(Date.now() / 1000),
        blockNumber: null,
        transactionHash: null,
      } as FlowUpdatedEvent);
    }

    for (let index = 1; index < streamEvents.length; index++) {
      // we have to manage update of flowrate to pay different payment references with the same token
      // so we should care only about pairs of begin or update event (type 0 or 1) followed by end or update event (type 2 or 1)
      // for each update of static flowrate between these 2 chronological sorted events:
      // amount paid is the difference of previous flowrate multiplied by the difference of time
      if (streamEvents[index - 1].type === 2 || streamEvents[index].type === 0) {
        continue;
      }
      const amount =
        (streamEvents[index].oldFlowRate - streamEvents[index - 1].oldFlowRate) *
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
