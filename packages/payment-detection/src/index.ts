import PaymentNetworkFactory from './payment-network-factory';
import PaymentReferenceCalculator from './payment-reference-calculator';

import * as BtcPaymentNetwork from './btc';
import { DeclarativePaymentDetector } from './declarative';
import * as Erc20PaymentNetwork from './erc20';
import { AnyToERC20PaymentDetector, AnyToEthFeeProxyPaymentDetector } from './any';
import { EthFeeProxyPaymentDetector, EthInputDataPaymentDetector } from './eth';
import { initPaymentDetectionApiKeys, setProviderFactory, getDefaultProvider } from './provider';
import { getTheGraphClient, networkSupportsTheGraph } from './thegraph';
import { parseLogArgs, padAmountForChainlink, unpadAmountFromChainlink } from './utils';
import { NearInfoRetriever } from './near-info-retriever';
import { NearNativeTokenPaymentDetector } from './near-detector';
import { FeeReferenceBasedDetector } from './fee-reference-based-detector';
import { SuperFluidPaymentDetector } from './erc777/superfluid-detector';

export type { TheGraphClient } from './thegraph';

const Near = {
  InfoRetriever: NearInfoRetriever,
  getContractName: NearNativeTokenPaymentDetector.getNearContractName,
};

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
  Near,
  setProviderFactory,
  initPaymentDetectionApiKeys,
  getDefaultProvider,
  getTheGraphClient,
  networkSupportsTheGraph,
  parseLogArgs,
  padAmountForChainlink,
  unpadAmountFromChainlink,
};
