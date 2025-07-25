import {
  AdvancedLogicTypes,
  CurrencyTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import {
  ContractBasedDetector,
  IPaymentNetworkModuleByType,
  ISupportedPaymentNetworkByCurrency,
  PaymentNetworkOptions,
} from './types';
import { BtcMainnetAddressBasedDetector, BtcTestnetAddressBasedDetector } from './btc';
import { DeclarativePaymentDetector } from './declarative';
import { MetaDetector } from './meta-payment-detector';
import {
  ERC20AddressBasedPaymentDetector,
  ERC20FeeProxyPaymentDetector,
  ERC20ProxyPaymentDetector,
  ERC20TransferableReceivablePaymentDetector,
} from './erc20';
import { SuperFluidPaymentDetector } from './erc777/superfluid-detector';
import { EthFeeProxyPaymentDetector, EthInputDataPaymentDetector } from './eth';
import { AnyToERC20PaymentDetector, AnyToEthFeeProxyPaymentDetector } from './any';
import { NearConversionNativeTokenPaymentDetector, NearNativeTokenPaymentDetector } from './near';
import { getPaymentNetworkExtension } from './utils';
import { getTheGraphClient } from './thegraph';
import { getDefaultProvider } from 'ethers';

const PN_ID = ExtensionTypes.PAYMENT_NETWORK_ID;

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
    aurora: {
      [PN_ID.ERC20_FEE_PROXY_CONTRACT]: ERC20FeeProxyPaymentDetector<CurrencyTypes.NearChainName>,
    },
    'aurora-testnet': {
      [PN_ID.ERC20_FEE_PROXY_CONTRACT]: ERC20FeeProxyPaymentDetector<CurrencyTypes.NearChainName>,
    },
    'near-testnet': {
      [PN_ID.ERC20_FEE_PROXY_CONTRACT]: ERC20FeeProxyPaymentDetector<CurrencyTypes.NearChainName>,
    },

    '*': {
      [PN_ID.ERC20_ADDRESS_BASED]: ERC20AddressBasedPaymentDetector,
      [PN_ID.ERC20_PROXY_CONTRACT]: ERC20ProxyPaymentDetector,
      [PN_ID.ERC20_FEE_PROXY_CONTRACT]: ERC20FeeProxyPaymentDetector,
      [PN_ID.ERC20_TRANSFERABLE_RECEIVABLE]: ERC20TransferableReceivablePaymentDetector,
    },
  },
  ETH: {
    aurora: { [PN_ID.NATIVE_TOKEN]: NearNativeTokenPaymentDetector },
    'aurora-testnet': {
      [PN_ID.NATIVE_TOKEN]: NearNativeTokenPaymentDetector,
    },
    'near-testnet': {
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
  [PN_ID.ANY_DECLARATIVE]: DeclarativePaymentDetector,
  [PN_ID.ANY_TO_ETH_PROXY]: AnyToEthFeeProxyPaymentDetector,
  [PN_ID.ANY_TO_NATIVE_TOKEN]: NearConversionNativeTokenPaymentDetector,
  [PN_ID.META]: MetaDetector,
};

/** Factory to create the payment network according to the currency and payment network type */
export class PaymentNetworkFactory {
  private readonly options: Readonly<PaymentNetworkOptions>;
  /**
   *
   * @param advancedLogic the advanced-logic layer in charge of the extensions
   * @param currencyManager the currency manager handling supported currencies
   * @param options the payment network options
   */
  constructor(
    private readonly advancedLogic: AdvancedLogicTypes.IAdvancedLogic,
    private readonly currencyManager: CurrencyTypes.ICurrencyManager,
    options?: Partial<PaymentNetworkOptions>,
  ) {
    this.options = this.buildOptions(options || {});
  }

  private buildOptions(options: Partial<PaymentNetworkOptions>): PaymentNetworkOptions {
    const defaultOptions: PaymentNetworkOptions = {
      getSubgraphClient: getTheGraphClient,
      explorerApiKeys: {},
      getRpcProvider: getDefaultProvider,
    };
    return { ...defaultOptions, ...options };
  }

  /**
   * Creates a payment network interpretor according to payment network creation parameters
   * It throws if the payment network given is not supported by this library
   *
   * @param paymentNetworkId the ID of the payment network to instantiate
   * @param currencyType the currency type of the request
   * @param paymentChain Different from request.currency.network for on-chain conversion payment networks (any-to-something)
   * @returns the module to handle the payment network
   */
  public createPaymentNetwork<PN_ID extends ExtensionTypes.PAYMENT_NETWORK_ID>(
    paymentNetworkId: PN_ID,
    currencyType: RequestLogicTypes.CURRENCY,
    paymentChain?: CurrencyTypes.ChainName,
    paymentNetworkVersion?: string,
  ): PaymentTypes.IPaymentNetwork<
    PaymentTypes.GenericEventParameters,
    Extract<PaymentTypes.PaymentNetworkCreateParameters, { id: PN_ID }>['parameters']
  > {
    const network = paymentChain ?? 'mainnet';
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
      network,
      advancedLogic: this.advancedLogic,
      currencyManager: this.currencyManager,
      options: this.options,
      ...this.options,
    });

    if (detector.extension && 'getDeploymentInformation' in detectorClass) {
      // this throws when the contract isn't deployed and was mandatory for payment detection
      (detectorClass as ContractBasedDetector).getDeploymentInformation(
        network as CurrencyTypes.VMChainName,
        paymentNetworkVersion || detector.extension.currentVersion,
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
  ): PaymentTypes.IPaymentNetwork<PaymentTypes.GenericEventParameters, any> | null {
    const pn = getPaymentNetworkExtension(request);
    if (!pn) {
      return null;
    }

    const detectionChain = pn.values?.network ?? request.currency.network;

    const { id, version } = pn;
    return this.createPaymentNetwork(id, request.currency.type, detectionChain, version);
  }
}
