import type { AdvancedLogicTypes, PaymentTypes } from '@requestnetwork/types';
import type { ICurrencyManager } from '@requestnetwork/currency';
import type { providers } from 'ethers';
import type { TheGraphClient } from './thegraph';

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
export interface IPaymentNetworkModuleByType {
  [type: string]: any;
}

/** Object interface to list the payment network module by network */
export interface ISupportedPaymentNetworkByNetwork {
  [network: string]: IPaymentNetworkModuleByType;
}

/** Object interface to list the payment network id and its module by currency */
export interface ISupportedPaymentNetworkByCurrency {
  [currency: string]: ISupportedPaymentNetworkByNetwork;
}

export type PaymentNetworkOptions = {
  /** override default bitcoin detection provider */
  bitcoinDetectionProvider?: PaymentTypes.IBitcoinDetectionProvider;
  /** the explorer API (eg Etherscan) api keys, for PNs that rely on it. Record by network name  */
  explorerApiKeys: Record<string, string>;
  /** override the default Subgraph for payment detection (EVM, Near) */
  getSubgraphClient: (network: string) => TheGraphClient | undefined;
  /** override the default RPC provider (EVM) */
  getRpcProvider: (network: string) => providers.Provider;
};

export type ReferenceBasedDetectorOptions = {
  advancedLogic: AdvancedLogicTypes.IAdvancedLogic;
  currencyManager: ICurrencyManager;
};
