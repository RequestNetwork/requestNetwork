import PaymentNetworkFactory from './payment-network-factory';
import PaymentReferenceCalculator from './payment-reference-calculator';

import * as BtcPaymentNetwork from './btc';
import { DeclarativePaymentDetector } from './declarative';
import * as Erc20PaymentNetwork from './erc20';
import { AnyToERC20PaymentDetector, AnyToEthFeeProxyPaymentDetector } from './any';
import { EthFeeProxyPaymentDetector, EthInputDataPaymentDetector } from './eth';
import { initPaymentDetectionApiKeys, setProviderFactory, getDefaultProvider } from './provider';
import { getTheGraphClient, getTheGraphNearClient, networkSupportsTheGraph } from './thegraph';
import {
  parseLogArgs,
  padAmountForChainlink,
  unpadAmountFromChainlink,
  calculateEscrowState,
  getPaymentNetworkExtension,
  getPaymentReference,
} from './utils';
import { NearNativeTokenPaymentDetector } from './near-detector';
import { FeeReferenceBasedDetector } from './fee-reference-based-detector';
import { SuperFluidPaymentDetector } from './erc777/superfluid-detector';
import { EscrowERC20InfoRetriever } from './erc20/escrow-info-retriever';

export type { TheGraphClient } from './thegraph';

export {
  PaymentNetworkFactory,
  PaymentReferenceCalculator,
  BtcPaymentNetwork,
  DeclarativePaymentDetector,
  Erc20PaymentNetwork,
  EthInputDataPaymentDetector,
  EthFeeProxyPaymentDetector,
  AnyToERC20PaymentDetector,
  AnyToEthFeeProxyPaymentDetector,
  FeeReferenceBasedDetector,
  SuperFluidPaymentDetector,
  NearNativeTokenPaymentDetector,
  EscrowERC20InfoRetriever,
  setProviderFactory,
  initPaymentDetectionApiKeys,
  getDefaultProvider,
  getTheGraphClient,
  getTheGraphNearClient,
  networkSupportsTheGraph,
  parseLogArgs,
  padAmountForChainlink,
  unpadAmountFromChainlink,
  calculateEscrowState,
  getPaymentNetworkExtension,
  getPaymentReference,
};
