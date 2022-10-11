import { AdvancedLogicTypes, PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';
import { ICurrencyManager } from '@requestnetwork/currency';
import {
  IPaymentNetworkModuleByType,
  ISupportedPaymentNetworkByCurrency,
  PaymentNetworkOptions,
} from './types';
import { BtcMainnetAddressBasedDetector } from './btc/mainnet-address-based';
import { BtcTestnetAddressBasedDetector } from './btc/testnet-address-based';
import { DeclarativePaymentDetector } from './declarative';
import { ERC20AddressBasedPaymentDetector } from './erc20/address-based';
import { ERC20FeeProxyPaymentDetector } from './erc20/fee-proxy-contract';
import { ERC20ProxyPaymentDetector } from './erc20/proxy-contract';
import { SuperFluidPaymentDetector } from './erc777/superfluid-detector';
import { EthInputDataPaymentDetector } from './eth/input-data';
import { EthFeeProxyPaymentDetector } from './eth/fee-proxy-detector';
import { AnyToERC20PaymentDetector } from './any/any-to-erc20-proxy';
import { NearConversionNativeTokenPaymentDetector, NearNativeTokenPaymentDetector } from './near';
import { AnyToEthFeeProxyPaymentDetector } from './any/any-to-eth-proxy';
import { getPaymentNetworkExtension } from './utils';
import { getTheGraphClient } from './thegraph';
import { getDefaultProvider } from './provider';

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
    private readonly currencyManager: ICurrencyManager,
    options?: Partial<PaymentNetworkOptions>,
  ) {
    this.options = this.buildOptions(options || {});
  }

  private buildOptions(options: Partial<PaymentNetworkOptions>): PaymentNetworkOptions {
    const defaultOptions: PaymentNetworkOptions = {
      getSubgraphClient: (network) => {
        return network === 'private'
          ? undefined
          : getTheGraphClient(
              `https://api.thegraph.com/subgraphs/name/requestnetwork/request-payments-${network}`,
            );
      },
      explorerApiKeys: {},
      getRpcProvider: getDefaultProvider,
    };
    return { ...defaultOptions, ...options };
  }

  /**
   * Creates a payment network according to payment network creation parameters
   * It throws if the payment network given is not supported by this library
   *
   * @param currency the currency of the request
   * @param paymentNetworkCreationParameters creation parameters of payment network
   * @returns the module to handle the payment network
   */
  public createPaymentNetwork(
    paymentNetworkId: PaymentTypes.PAYMENT_NETWORK_ID,
    currencyType: RequestLogicTypes.CURRENCY,
    currencyNetwork?: string,
  ): PaymentTypes.IPaymentNetwork {
    const currencyPaymentMap =
      supportedPaymentNetwork[currencyType]?.[currencyNetwork || 'mainnet'] ||
      supportedPaymentNetwork[currencyType]?.['*'] ||
      {};
    const paymentNetworkMap = {
      ...currencyPaymentMap,
      ...anyCurrencyPaymentNetwork,
    };

    if (!paymentNetworkMap[paymentNetworkId]) {
      throw new Error(
        `the payment network id: ${paymentNetworkId} is not supported for the currency: ${currencyType} on network ${
          currencyNetwork || 'mainnet'
        }`,
      );
    }
    return new paymentNetworkMap[paymentNetworkId]({
      advancedLogic: this.advancedLogic,
      currencyManager: this.currencyManager,
      ...this.options,
    });
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
