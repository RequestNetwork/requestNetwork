import { PaymentTypes } from '@requestnetwork/types';

/** Generic info retriever interface */
export interface IPaymentRetriever<
  TPaymentNetworkEvent extends PaymentTypes.IPaymentNetworkEvent<unknown, TEventNames>,
  TEventNames = PaymentTypes.EVENTS_NAMES
> {
  getTransferEvents(): Promise<TPaymentNetworkEvent[]>;
}

/** Generic info retriever interface without transfers */
export interface IEventRetriever<
  TPaymentNetworkEvent extends PaymentTypes.IPaymentNetworkBaseEvent<TEventNames>,
  TEventNames = PaymentTypes.EVENTS_NAMES
> {
  getContractEvents(): Promise<TPaymentNetworkEvent[]>;
}
