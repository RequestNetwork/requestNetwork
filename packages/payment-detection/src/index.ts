import Utils from '@requestnetwork/utils';
import { PaymentNetworkFactory } from './payment-network-factory';
import PaymentReferenceCalculator from './payment-reference-calculator';
import * as BtcPaymentNetwork from './btc';
import { DeclarativePaymentDetector } from './declarative';
import * as Erc20PaymentNetwork from './erc20';
import { AnyToERC20PaymentDetector, AnyToEthFeeProxyPaymentDetector } from './any';
import { EthFeeProxyPaymentDetector, EthInputDataPaymentDetector } from './eth';
import { getTheGraphClient, getTheGraphNearClient } from './thegraph';
import {
  calculateEscrowState,
  formatAddress,
  getPaymentNetworkExtension,
  getPaymentReference,
  padAmountForChainlink,
  parseLogArgs,
  unpadAmountFromChainlink,
} from './utils';
import { NearConversionNativeTokenPaymentDetector, NearNativeTokenPaymentDetector } from './near';
import { FeeReferenceBasedDetector } from './fee-reference-based-detector';
import { SuperFluidPaymentDetector } from './erc777/superfluid-detector';
import { EscrowERC20InfoRetriever } from './erc20/escrow-info-retriever';
import { SuperFluidInfoRetriever } from './erc777/superfluid-retriever';
import { PaymentNetworkOptions } from './types';

export type { TheGraphClient } from './thegraph';

const setProviderFactory = Utils.setProviderFactory;
const initPaymentDetectionApiKeys = Utils.initPaymentDetectionApiKeys;
const getDefaultProvider = Utils.getDefaultProvider;

export {
  PaymentNetworkFactory,
  PaymentNetworkOptions,
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
  NearConversionNativeTokenPaymentDetector,
  EscrowERC20InfoRetriever,
  SuperFluidInfoRetriever,
  setProviderFactory,
  initPaymentDetectionApiKeys,
  getDefaultProvider,
  getTheGraphClient,
  getTheGraphNearClient,
  parseLogArgs,
  padAmountForChainlink,
  unpadAmountFromChainlink,
  calculateEscrowState,
  getPaymentNetworkExtension,
  getPaymentReference,
  formatAddress,
};
