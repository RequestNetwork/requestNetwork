import {
  AdvancedLogicTypes,
  ChainTypes,
  ExtensionTypes,
  PaymentTypes,
} from '@requestnetwork/types';
import { PaymentDetectorBase } from './payment-detector-base';
import { GetDeploymentInformation } from './utils';
import type { CurrencyDefinition, ICurrencyManager } from '@requestnetwork/currency';
import type { providers } from 'ethers';
import type { TheGraphClient } from './thegraph';

export interface ContractBasedDetector {
  getDeploymentInformation: GetDeploymentInformation<false>;
}

/** Generic info retriever interface */

/** Params for TheGraph-based getTransferEvents */
export type TransferEventsParams = {
  /** The reference to identify the payment*/
  paymentReference: string;
  /** The recipient of the transfer */
  toAddress: string;
  /** The address of the payment proxy */
  contractAddress: string;
  /** The chain to check for payment */
  paymentChain: ChainTypes.VMChain;
  /** Indicates if it is an address for payment or refund */
  eventName: PaymentTypes.EVENTS_NAMES;
  /** The list of ERC20 tokens addresses accepted for payments and refunds OR undefined for native tokens (e.g. ETH) */
  acceptedTokens?: string[];
};

export type ConversionTransferEventsParams = TransferEventsParams & {
  /** The maximum span between the time the rate was fetched and the payment */
  maxRateTimespan?: number;
  /** Request denomination (usually fiat) */
  requestCurrency: CurrencyDefinition;
};

export interface IPaymentRetriever<
  TPaymentNetworkEvent extends PaymentTypes.IPaymentNetworkEvent<unknown, TEventNames>,
  TEventNames = PaymentTypes.EVENTS_NAMES,
> {
  getTransferEvents(): Promise<TPaymentNetworkEvent[]>;
}

export interface ITheGraphBaseInfoRetriever<
  // Type of retrieved objects
  TPaymentEvent extends PaymentTypes.IETHPaymentEventParameters,
  // Type of queries
  TTransferEventsParams extends TransferEventsParams = TransferEventsParams,
> {
  getTransferEvents(
    params: TTransferEventsParams,
  ): Promise<PaymentTypes.AllNetworkEvents<TPaymentEvent>>;
}

/** Generic info retriever interface without transfers */
export interface IEventRetriever<
  TPaymentNetworkEvent extends PaymentTypes.IPaymentNetworkBaseEvent<TEventNames>,
  TEventNames = PaymentTypes.EVENTS_NAMES,
> {
  getContractEvents(): Promise<TPaymentNetworkEvent[]>;
}

/** Object interface to list the payment network module by id */
export type IPaymentNetworkModuleByType<
  TPaymentEventParameters extends
    PaymentTypes.GenericEventParameters = PaymentTypes.GenericEventParameters,
> = Partial<
  Record<
    ExtensionTypes.PAYMENT_NETWORK_ID,
    new (
      ...pnParams: any
    ) => PaymentDetectorBase<ExtensionTypes.IExtension, TPaymentEventParameters>
  >
>;

/** Object interface to list the payment network module by network */
export interface ISupportedPaymentNetworkByNetwork<
  TPaymentEventParameters extends
    PaymentTypes.GenericEventParameters = PaymentTypes.GenericEventParameters,
> {
  [network: string]: IPaymentNetworkModuleByType<TPaymentEventParameters>;
}

/** Object interface to list the payment network id and its module by currency */
export interface ISupportedPaymentNetworkByCurrency<
  TPaymentEventParameters extends
    PaymentTypes.GenericEventParameters = PaymentTypes.GenericEventParameters,
> {
  [currency: string]: ISupportedPaymentNetworkByNetwork<TPaymentEventParameters>;
}

export type TGetSubGraphClient<TChain extends ChainTypes.IChain> = (
  network: ChainTypes.IChain,
) => TChain extends ChainTypes.VMChain ? TheGraphClient<TChain> | undefined : undefined;

export type PaymentNetworkOptions<TChain extends ChainTypes.IChain = ChainTypes.IChain> = {
  /** override default bitcoin detection provider */
  bitcoinDetectionProvider?: PaymentTypes.IBitcoinDetectionProvider;
  /** the explorer API (e.g. Etherscan) api keys, for PNs that rely on it. Record by network name  */
  explorerApiKeys: Partial<Record<string, string>>;
  /** override the default Subgraph for payment detection (EVM, Near) */
  getSubgraphClient: TGetSubGraphClient<TChain>;
  /** override the default RPC provider (EVM) */
  getRpcProvider: (network: string) => providers.Provider;
};

export type ReferenceBasedDetectorOptions = {
  advancedLogic: AdvancedLogicTypes.IAdvancedLogic;
  currencyManager: ICurrencyManager;
};

export type NativeDetectorOptions = ReferenceBasedDetectorOptions & {
  network: ChainTypes.INearChain;
  /** override the default Subgraph for payment detection (EVM, Near) */
  getSubgraphClient: TGetSubGraphClient<ChainTypes.INearChain>;
};
