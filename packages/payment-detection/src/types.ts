import {
  AdvancedLogicTypes,
  CurrencyTypes,
  ExtensionTypes,
  PaymentTypes,
} from '@requestnetwork/types';
import { PaymentDetectorBase } from './payment-detector-base';
import { GetDeploymentInformation } from './utils';
import type { ICurrencyManager } from '@requestnetwork/currency';
import type { providers } from 'ethers';
import type { TheGraphClient } from './thegraph';

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
    ExtensionTypes.PAYMENT_NETWORK_ID,
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

export type PaymentNetworkOptions = {
  /** override default bitcoin detection provider */
  bitcoinDetectionProvider?: PaymentTypes.IBitcoinDetectionProvider;
  /** the explorer API (e.g. Etherscan) api keys, for PNs that rely on it. Record by network name  */
  explorerApiKeys: Partial<Record<CurrencyTypes.ChainName, string>>;
  /** override the default Subgraph for payment detection (EVM, Near) */
  getSubgraphClient: (network: CurrencyTypes.ChainName) => TheGraphClient | undefined;
  /** override the default RPC provider (EVM) */
  getRpcProvider: (network: CurrencyTypes.ChainName) => providers.Provider;
};

export type ReferenceBasedDetectorOptions = {
  advancedLogic: AdvancedLogicTypes.IAdvancedLogic;
  currencyManager: ICurrencyManager;
};

export type NativeDetectorOptions = ReferenceBasedDetectorOptions & {
  network: CurrencyTypes.ChainName;
};
