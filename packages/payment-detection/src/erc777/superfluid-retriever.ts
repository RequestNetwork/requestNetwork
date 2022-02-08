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

  public async getTransferEvents(): Promise<PaymentTypes.ERC20PaymentNetworkEvent[]> {
    const variables = this.getGraphVariables();
    const streamEvents = (await this.client.GetSuperFluidFlowEvents(variables)).flowUpdatedEvents;
    // console.log('streamEvents:', streamEvents.length);

    const untaggedEvents = (await this.client.GetSuperFluidUntaggedEvents(variables))
      .flowUpdatedEvents;
    // console.log('streamEvents:', streamEvents.length);

    streamEvents.push(...untaggedEvents);
    streamEvents.sort((a, b) => a.timestamp - b.timestamp);
    if (streamEvents[streamEvents.length - 1].flowRate > 0) {
      streamEvents.push({
        flowRate: 0,
        timestamp: Math.floor(Date.now() / 1000),
      } as FlowUpdatedEvent);
      // console.log(
      //   'Adding flowrate 0 for timestamp:',
      //   streamEvents[streamEvents.length - 1].timestamp,
      // );
    }
    const paymentEvents: PaymentTypes.ERC20PaymentNetworkEvent[] = [];
    for (let index = 1; index < streamEvents.length; index++) {
      // console.log('streamEvents[index - 1].flowRate:', streamEvents[index - 1].flowRate);
      // console.log('streamEvents[index - 1].oldFlowRate', streamEvents[index - 1].oldFlowRate);
      // console.log(
      //   'difference:',
      //   streamEvents[index - 1].flowRate - streamEvents[index - 1].oldFlowRate,
      // );
      // console.log('streamEvents[index].timestamp:', streamEvents[index].timestamp);
      // console.log('streamEvents[index - 1].timestamp):', streamEvents[index - 1].timestamp);
      // console.log('difference:', streamEvents[index].timestamp - streamEvents[index - 1].timestamp);

      const amount =
        (streamEvents[index - 1].flowRate - streamEvents[index - 1].oldFlowRate) *
        (streamEvents[index].timestamp - streamEvents[index - 1].timestamp);
      if (amount > 0) {
        paymentEvents.push({
          amount: amount.toString(),
          name: this.eventName,
          parameters: { to: this.toAddress },
          timestamp: streamEvents[index].timestamp,
        });
      }
    }
    return paymentEvents;
  }
}
