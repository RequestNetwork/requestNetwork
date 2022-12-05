import { PaymentTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import { FlowUpdatedEvent, SentEvent } from '../thegraph/generated/graphql-superfluid';
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
      reference: `0xbeefac${this.paymentReference}`,
      to: this.toAddress,
      tokenAddress: this.tokenContractAddress,
    };
  }

  /**
   * Chronological sorting of events having payment reference and closing events without payment reference
   * @returns List of streaming events
   */
  protected async getStreamingEvents(): Promise<Partial<FlowUpdatedEvent>[]> {
    const variables = this.getGraphVariables();
    const { flow, untagged } = await this.client.GetSuperFluidEvents(variables);
    return flow.concat(untagged).sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Chronological sorting of one off payment events having payment reference
   * @returns List of one off payment events
   */
  protected async getOneOffPaymentEvents(): Promise<Partial<SentEvent>[]> {
    const variables = this.getGraphVariables();
    const { payment } = await this.client.GetSuperFluidEvents(variables);
    return payment.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * First MVP version which convert :
   * stream events queried from SuperFluid subgraph
   * into payment events with the parameters expected by extractEvents function
   * to compute balance from amounts in ERC20 style transactions
   */
  public async getTransferEvents(): Promise<PaymentTypes.ERC777PaymentNetworkEvent[]> {
    const streamEvents = await this.getStreamingEvents();
    const oneOffPaymentEvents = await this.getOneOffPaymentEvents();
    const paymentEvents: PaymentTypes.ERC777PaymentNetworkEvent[] = [];

    const TYPE_BEGIN = 0;
    // const TYPE_UPDATE = 1;
    const TYPE_END = 2;
    const StreamEventMap: Record<number, PaymentTypes.STREAM_EVENT_NAMES> = {
      0: PaymentTypes.STREAM_EVENT_NAMES.START_STREAM,
      1: PaymentTypes.STREAM_EVENT_NAMES.UPDATE_STREAM,
      2: PaymentTypes.STREAM_EVENT_NAMES.END_STREAM,
    };
    const getEventName = (flowEvent: Partial<FlowUpdatedEvent>) => {
      if (flowEvent.type) {
        return StreamEventMap[flowEvent.type];
      }
    };

    if (streamEvents.length >= 1) {
      // if last event is ongoing stream then create end of stream to help compute balance
      const lastEventOngoing = streamEvents[streamEvents.length - 1].flowRate > 0;
      if (lastEventOngoing) {
        streamEvents.push({
          oldFlowRate: streamEvents[streamEvents.length - 1].flowRate,
          flowRate: 0,
          timestamp: Utils.getCurrentTimestampInSecond(),
          blockNumber: parseInt(streamEvents[streamEvents.length - 1].blockNumber.toString()),
          transactionHash: streamEvents[streamEvents.length - 1].transactionHash,
        } as FlowUpdatedEvent);
      }
      for (let index = 1; index < streamEvents.length; index++) {
        // we have to manage update of flowrate to pay different payment references with the same token
        // but we do not manage in the MVP updating flowrate of ongoing payment
        // so we should care only about pairs of begin or update event (type 0 or 1) followed by end or update event (type 2 or 1)
        // for each update of static flowrate between these 2 chronological sorted events:
        // amount paid is the difference of flowrates at the start multiplied by the difference of time
        if (streamEvents[index - 1].type === TYPE_END || streamEvents[index].type === TYPE_BEGIN) {
          continue;
        }
        const diffFlowRate = streamEvents[index - 1].flowRate - streamEvents[index - 1].oldFlowRate;
        if (diffFlowRate < 0) {
          // FIXME:Handle decreasing flowrate of ongoing payment without closing it
          continue;
        }
        const amount =
          diffFlowRate * (streamEvents[index].timestamp - streamEvents[index - 1].timestamp);
        paymentEvents.push({
          amount: amount.toString(),
          name: this.eventName,
          parameters: {
            to: this.toAddress,
            block: parseInt(streamEvents[index].blockNumber.toString()),
            txHash: streamEvents[index].transactionHash,
            streamEventName: getEventName(streamEvents[index]),
          },
          timestamp: streamEvents[index].timestamp,
        });
      }
      if (paymentEvents.length > 0) {
        const newLastParameters = paymentEvents[paymentEvents.length - 1].parameters;
        if (lastEventOngoing && newLastParameters) {
          newLastParameters.streamEventName = PaymentTypes.STREAM_EVENT_NAMES.START_STREAM;
          paymentEvents[paymentEvents.length - 1].parameters = newLastParameters;
        }
      }
    }

    // Transform the one off payment events into ERC777PaymentNetworkEvent
    const oneOffPaymentEventsUpdated = oneOffPaymentEvents.map((event) => {
      return {
        amount: event.amount.toString(),
        name: this.eventName,
        parameters: {
          to: this.toAddress,
          block: parseInt(event.blockNumber.toString()),
          txHash: event.transactionHash,
          // This is always the case:
          //  - If no previous payment event we can consider it an an END_STREAM event
          //  - If last payment event is END_STREAM this one is as well
          //  - If last payment event is START_STREAM, the last payment event after sorting will be of type START_STREAM,
          //    so we can consider this one as END_STREAM
          streamEventName: PaymentTypes.STREAM_EVENT_NAMES.END_STREAM,
        },
        timestamp: event.timestamp,
      } as PaymentTypes.ERC777PaymentNetworkEvent;
    });

    // Insert the transformed one off payment events into the payments events, sort them and update their streamEventName parameter
    return paymentEvents.concat(oneOffPaymentEventsUpdated).sort((a, b) => {
      if (!a.timestamp || !b.timestamp) return 0;
      return a.timestamp - b.timestamp;
    });
  }
}
