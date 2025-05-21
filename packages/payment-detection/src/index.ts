import {
  getDefaultProvider,
  initPaymentDetectionApiKeys,
  setProviderFactory,
} from '@requestnetwork/utils';
import { PaymentNetworkFactory } from './payment-network-factory';
import * as PaymentReferenceCalculator from './payment-reference-calculator';
import * as BtcPaymentNetwork from './btc';
import { DeclarativePaymentDetector } from './declarative';
import * as Erc20PaymentNetwork from './erc20';
import { ERC20TransferableReceivablePaymentDetector } from './erc20';
import { AnyToERC20PaymentDetector, AnyToEthFeeProxyPaymentDetector } from './any';
import { EthFeeProxyPaymentDetector, EthInputDataPaymentDetector } from './eth';
import { getTheGraphClient, getTheGraphEvmClient, getTheGraphNearClient } from './thegraph';
import {
  calculateEscrowState,
  flattenRequestByPnId,
  formatAddress,
  getPaymentNetworkExtension,
  getPaymentReference,
  getPaymentReferencesForMetaPnRequest,
  hashReference,
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
import { MetaDetector } from './meta-payment-detector';

export type { TheGraphClient } from './thegraph';

export type { PaymentNetworkOptions };
export {
  PaymentNetworkFactory,
  PaymentReferenceCalculator,
  BtcPaymentNetwork,
  DeclarativePaymentDetector,
  Erc20PaymentNetwork,
  ERC20TransferableReceivablePaymentDetector,
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
  MetaDetector,
  setProviderFactory,
  initPaymentDetectionApiKeys,
  getDefaultProvider,
  getTheGraphClient,
  getTheGraphEvmClient,
  getTheGraphNearClient,
  parseLogArgs,
  padAmountForChainlink,
  unpadAmountFromChainlink,
  calculateEscrowState,
  flattenRequestByPnId,
  getPaymentNetworkExtension,
  getPaymentReference,
  getPaymentReferencesForMetaPnRequest,
  hashReference,
  formatAddress,
};
