import {
  getDefaultProvider,
  initPaymentDetectionApiKeys,
  setProviderFactory,
} from '@requestnetwork/utils';
import { PaymentNetworkFactory } from './payment-network-factory.js';
import PaymentReferenceCalculator from './payment-reference-calculator.js';
import * as BtcPaymentNetwork from './btc.js';
import { DeclarativePaymentDetector } from './declarative.js';
import * as Erc20PaymentNetwork from './erc20/index.js';
import { AnyToERC20PaymentDetector, AnyToEthFeeProxyPaymentDetector } from './any.js';
import { EthFeeProxyPaymentDetector, EthInputDataPaymentDetector } from './eth.js';
import { getTheGraphClient, getTheGraphNearClient } from './thegraph.js';
import {
  calculateEscrowState,
  formatAddress,
  getPaymentNetworkExtension,
  getPaymentReference,
  hashReference,
  padAmountForChainlink,
  parseLogArgs,
  unpadAmountFromChainlink,
} from './utils';
import {
  NearConversionNativeTokenPaymentDetector,
  NearNativeTokenPaymentDetector,
} from './near.js';
import { FeeReferenceBasedDetector } from './fee-reference-based-detector.js';
import { SuperFluidPaymentDetector } from './erc777/superfluid-detector.js';
import { EscrowERC20InfoRetriever } from './erc20/escrow-info-retriever.js';
import { SuperFluidInfoRetriever } from './erc777/superfluid-retriever.js';
import { PaymentNetworkOptions } from './types.js';
import { ERC20TransferableReceivablePaymentDetector } from './erc20/index.js';

export type { TheGraphClient } from './thegraph.js';

export {
  PaymentNetworkFactory,
  PaymentNetworkOptions,
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
  hashReference,
  formatAddress,
};
