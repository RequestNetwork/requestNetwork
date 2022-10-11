import { AdvancedLogicTypes, PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';
import { ICurrencyManager } from '@requestnetwork/currency';
import {
  ContractBasedDetector,
  IPaymentNetworkModuleByType,
  ISupportedPaymentNetworkByCurrency,
} from './types';
import { BtcMainnetAddressBasedDetector, BtcTestnetAddressBasedDetector } from './btc';
import { DeclarativePaymentDetector } from './declarative';
import {
  ERC20AddressBasedPaymentDetector,
  ERC20FeeProxyPaymentDetector,
  ERC20ProxyPaymentDetector,
} from './erc20';
import { SuperFluidPaymentDetector } from './erc777/superfluid-detector';
import { EthFeeProxyPaymentDetector, EthInputDataPaymentDetector } from './eth';
import { AnyToERC20PaymentDetector, AnyToEthFeeProxyPaymentDetector } from './any';
import { NearConversionNativeTokenPaymentDetector, NearNativeTokenPaymentDetector } from './near';
import { getPaymentNetworkExtension } from './utils';

const PN_ID = PaymentTypes.PAYMENT_NETWORK_ID;

/** Register the payment network by currency and type */
const supportedPaymentNetwork: ISupportedPaymentNetworkByCurrency = {
  BTC: {
    mainnet: {
      [PN_ID.BITCOIN_ADDRESS_BASED]: BtcMainnetAddressBasedDetector,
    },
    testnet: {
      [PN_ID.TESTNET_BITCOIN_ADDRESS_BASED]: BtcTestnetAddressBasedDetector,
    },
  },
  ERC777: {
    '*': {
      [PN_ID.ERC777_STREAM]: SuperFluidPaymentDetector,
    },
  },
  ERC20: {
    '*': {
      [PN_ID.ERC20_ADDRESS_BASED]: ERC20AddressBasedPaymentDetector,
      [PN_ID.ERC20_PROXY_CONTRACT]: ERC20ProxyPaymentDetector,
      [PN_ID.ERC20_FEE_PROXY_CONTRACT]: ERC20FeeProxyPaymentDetector,
    },
  },
  ETH: {
    aurora: { [PN_ID.NATIVE_TOKEN]: NearNativeTokenPaymentDetector },
    'aurora-testnet': {
      [PN_ID.NATIVE_TOKEN]: NearNativeTokenPaymentDetector,
    },
    '*': {
      [PN_ID.ETH_INPUT_DATA]: EthInputDataPaymentDetector,
      [PN_ID.ETH_FEE_PROXY_CONTRACT]: EthFeeProxyPaymentDetector,
    },
  },
};

const anyCurrencyPaymentNetwork: IPaymentNetworkModuleByType = {
  [PN_ID.ANY_TO_ERC20_PROXY]: AnyToERC20PaymentDetector,
  [PN_ID.DECLARATIVE]: DeclarativePaymentDetector,
  [PN_ID.ANY_TO_ETH_PROXY]: AnyToEthFeeProxyPaymentDetector,
  [PN_ID.ANY_TO_NATIVE]: NearConversionNativeTokenPaymentDetector,
};

export type PaymentNetworkOptions = {
  /** override default bitcoin detection provider */
  bitcoinDetectionProvider?: PaymentTypes.IBitcoinDetectionProvider;
  /** the explorer API (eg Etherscan) api keys, for PNs that rely on it. Record by network name  */
  explorerApiKeys?: Record<string, string>;
};

/** Factory to create the payment network according to the currency and payment network type */
export class PaymentNetworkFactory {
  /**
   *
   * @param advancedLogic the advanced-logic layer in charge of the extensions
   * @param currencyManager the currency manager handling supported currencies
   * @param options the payment network options
   */
  constructor(
    private readonly advancedLogic: AdvancedLogicTypes.IAdvancedLogic,
    private readonly currencyManager: ICurrencyManager,
    private readonly options?: PaymentNetworkOptions,
  ) {}

  /**
   * Creates a payment network according to payment network creation parameters
   * It throws if the payment network given is not supported by this library
   *
   * @param paymentNetworkId the ID of the payment network to instantiate
   * @param currencyType the currency type of the request
   * @param currencyNetwork the network of the currency of the payment to detect
   * @returns the module to handle the payment network
   */
  public createPaymentNetwork(
    paymentNetworkId: PaymentTypes.PAYMENT_NETWORK_ID,
    currencyType: RequestLogicTypes.CURRENCY,
    currencyNetwork?: string,
  ): PaymentTypes.IPaymentNetwork {
    const network = currencyNetwork || 'mainnet';
    const currencyPaymentMap =
      supportedPaymentNetwork[currencyType]?.[network] ||
      supportedPaymentNetwork[currencyType]?.['*'] ||
      {};
    const paymentNetworkMap = {
      ...currencyPaymentMap,
      ...anyCurrencyPaymentNetwork,
    };

    const detectorClass = paymentNetworkMap[paymentNetworkId];

    if (!detectorClass) {
      throw new Error(
        `the payment network id: ${paymentNetworkId} is not supported for the currency: ${currencyType} on network ${network}`,
      );
    }

    const detector = new detectorClass({
      advancedLogic: this.advancedLogic,
      currencyManager: this.currencyManager,
      ...this.options,
    });

    if ('getDeploymentInformation' in detectorClass) {
      // this throws if the contract isn't deployed but is mandatory for payment detection
      (detectorClass as ContractBasedDetector).getDeploymentInformation(
        network,
        detector.extension.currentVersion,
      );
    }

    return detector;
  }

  /**
   * Gets the module to the payment network of a request
   * It throws if the payment network found is not supported by this library
   *
   * @param request the request
   * @returns the module to handle the payment network or null if no payment network found
   */
  public getPaymentNetworkFromRequest(
    request: RequestLogicTypes.IRequest,
  ): PaymentTypes.IPaymentNetwork | null {
    const pn = getPaymentNetworkExtension(request);

    if (!pn) {
      return null;
    }

    const paymentNetworkId = pn.id as unknown as PaymentTypes.PAYMENT_NETWORK_ID;
    return this.createPaymentNetwork(
      paymentNetworkId,
      request.currency.type,
      request.currency.network,
    );
  }
}
