import { ExtensionTypes, PaymentTypes } from '@requestnetwork/types';
import { PaymentDetectorBase } from './payment-detector-base';
import { GetDeploymentInformation } from './utils';

export interface ContractBasedDetector {
  getDeploymentInformation: GetDeploymentInformation<false>;
}

/** Generic info retriever interface */
export interface IPaymentRetriever<
  TPaymentNetworkEvent extends PaymentTypes.IPaymentNetworkEvent<unknown, TEventNames>,
  TEventNames = PaymentTypes.EVENTS_NAMES,
> {
  getTransferEvents(): Promise<TPaymentNetworkEvent[]>;
}

export interface IGraphEventsRetriever<
  TPaymentNetworkEvent extends PaymentTypes.IPaymentNetworkEvent<unknown, TEventNames>,
  TEventNames = PaymentTypes.EVENTS_NAMES,
> {
  getTransferEvents(): Promise<PaymentTypes.AllNetworkRetrieverEvents<TPaymentNetworkEvent>>;
}

/** Generic info retriever interface without transfers */
export interface IEventRetriever<
  TPaymentNetworkEvent extends PaymentTypes.IPaymentNetworkBaseEvent<TEventNames>,
  TEventNames = PaymentTypes.EVENTS_NAMES,
> {
  getContractEvents(): Promise<TPaymentNetworkEvent[]>;
}

/** Object interface to list the payment network module by id */
export type IPaymentNetworkModuleByType = Partial<
  Record<
    PaymentTypes.PAYMENT_NETWORK_ID,
    new (...pnParams: any) => PaymentDetectorBase<ExtensionTypes.IExtension, any>
  >
>;

/** Object interface to list the payment network module by network */
export interface ISupportedPaymentNetworkByNetwork {
  [network: string]: IPaymentNetworkModuleByType;
}

/** Object interface to list the payment network id and its module by currency */
export interface ISupportedPaymentNetworkByCurrency {
  [currency: string]: ISupportedPaymentNetworkByNetwork;
}
