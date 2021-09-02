import PaymentNetworkFactory from './payment-network-factory';
import PaymentReferenceCalculator from './payment-reference-calculator';

import * as BtcPaymentNetwork from './btc';
import DeclarativePaymentNetwork from './declarative';
import * as Erc20PaymentNetwork from './erc20';
import { InputData as EthPaymentNetwork } from './eth';
import { initPaymentDetectionApiKeys, setProviderFactory, getDefaultProvider } from './provider';
import { getTheGraphClient, networkSupportsTheGraph } from './thegraph';
import { parseLogArgs, padAmountForChainlink, unpadAmountFromChainlink } from './utils';
import { NearInfoRetriever } from './near-info-retriever';
import NearNativeTokenPaymentDetector from './near-detector';

export type { TheGraphClient } from './thegraph';

const Near = {
  InfoRetriever: NearInfoRetriever,
  getContractName: NearNativeTokenPaymentDetector.getNearContractName,
};

export {
  PaymentNetworkFactory,
  PaymentReferenceCalculator,
  BtcPaymentNetwork,
  DeclarativePaymentNetwork,
  Erc20PaymentNetwork,
  EthPaymentNetwork,
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
