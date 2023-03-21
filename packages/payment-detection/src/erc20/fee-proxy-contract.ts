import { erc20FeeProxyArtifact } from '@requestnetwork/smart-contracts';
import {
  CurrencyTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import {
  CurrencyDefinition,
  EvmChains,
  ICurrencyManager,
  NearChains,
} from '@requestnetwork/currency';
import ProxyInfoRetriever from './proxy-info-retriever';

import { loadCurrencyFromContract } from './currency';
import { FeeReferenceBasedDetector } from '../fee-reference-based-detector';
import { makeGetDeploymentInformation } from '../utils';
import { TheGraphClient, TheGraphInfoRetriever } from '../thegraph';
import { PaymentNetworkOptions, ReferenceBasedDetectorOptions } from '../types';
import { NearInfoRetriever } from '../near';
import { NetworkNotSupported } from '../balance-error';

const PROXY_CONTRACT_ADDRESS_MAP = {
  ['0.1.0']: '0.1.0',
  ['0.2.0']: '0.2.0',
  ['NEAR-0.1.0']: 'near',
};

/**
 * Handle payment networks with ERC20 fee proxy contract extension, or derived
 */

export abstract class ERC20FeeProxyPaymentDetectorBase<
  TExtension extends ExtensionTypes.PnFeeReferenceBased.IFeeReferenceBased = ExtensionTypes.PnFeeReferenceBased.IFeeReferenceBased,
  TPaymentEventParameters extends PaymentTypes.IERC20FeePaymentEventParameters = PaymentTypes.IERC20FeePaymentEventParameters,
> extends FeeReferenceBasedDetector<TExtension, TPaymentEventParameters> {
  /**
   * @param extension The advanced logic payment network extensions
   */
  protected constructor(extension: TExtension, currencyManager: ICurrencyManager) {
    super(ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT, extension, currencyManager);
  }

  protected async getCurrency(
    storageCurrency: RequestLogicTypes.ICurrency,
  ): Promise<CurrencyDefinition> {
    const currency = this.currencyManager.fromStorageCurrency(storageCurrency);
    if (currency) {
      return currency;
    }

    if (storageCurrency.type !== RequestLogicTypes.CURRENCY.ERC20) {
      throw new Error(`Currency ${storageCurrency.value} not known`);
    }

    const contractCurrency = await loadCurrencyFromContract(storageCurrency);
    if (!contractCurrency) {
      throw new Error(
        `Cannot retrieve currency for contrat ${storageCurrency.value} (${storageCurrency.network})`,
      );
    }
    return contractCurrency;
  }

  /*
   * Returns deployment information for the underlying smart contract for a given payment network version
   */
  public static getDeploymentInformation = makeGetDeploymentInformation(
    erc20FeeProxyArtifact,
    PROXY_CONTRACT_ADDRESS_MAP,
  );
}

/**
 * Handle payment networks with ERC20 fee proxy contract extension
 */
export class ERC20FeeProxyPaymentDetector extends ERC20FeeProxyPaymentDetectorBase {
  protected readonly getSubgraphClient: PaymentNetworkOptions['getSubgraphClient'];
  constructor({
    advancedLogic,
    currencyManager,
    getSubgraphClient,
  }: ReferenceBasedDetectorOptions & Pick<PaymentNetworkOptions, 'getSubgraphClient'>) {
    super(
      // TODO: This extension is wrong if the network is NEAR
      // 1/ We add the network to this detector instanciation
      // 2/ We update the extension in methods where we have a network (weird)
      // 3/ We create a sub-class
      advancedLogic.extensions.feeProxyContractErc20,
      currencyManager,
    );
    this.getSubgraphClient = getSubgraphClient;
  }

  /**
   * Extracts the payment events of a request
   */
  protected async extractEvents(
    eventName: PaymentTypes.EVENTS_NAMES,
    toAddress: string | undefined,
    paymentReference: string,
    requestCurrency: RequestLogicTypes.ICurrency,
    paymentChain: CurrencyTypes.VMChainName,
    paymentNetwork: ExtensionTypes.IState,
  ): Promise<PaymentTypes.AllNetworkEvents<PaymentTypes.IERC20FeePaymentEventParameters>> {
    EvmChains.assertChainSupported(paymentChain);
    if (!toAddress) {
      return Promise.resolve({
        paymentEvents: [],
      });
    }

    const { address: proxyContractAddress, creationBlockNumber: proxyCreationBlockNumber } =
      ERC20FeeProxyPaymentDetector.getDeploymentInformation(paymentChain, paymentNetwork.version);

    const subgraphClient = this.getSubgraphClient(paymentChain);
    if (subgraphClient) {
      const graphInfoRetriever = new TheGraphInfoRetriever(
        subgraphClient as TheGraphClient,
        this.currencyManager,
      );
      return graphInfoRetriever.getTransferEvents({
        eventName,
        paymentReference,
        toAddress,
        contractAddress: proxyContractAddress,
        paymentChain,
        acceptedTokens: [requestCurrency.value],
      });
    } else {
      const proxyInfoRetriever = new ProxyInfoRetriever(
        paymentReference,
        proxyContractAddress,
        proxyCreationBlockNumber,
        requestCurrency.value,
        toAddress,
        eventName,
        paymentChain,
      );
      const paymentEvents = await proxyInfoRetriever.getTransferEvents();
      return {
        paymentEvents,
      };
    }
  }
}

/**
 * Handle payment networks with ERC20 fee proxy contract extension
 */
export class ERC20NearFeeProxyPaymentDetector extends ERC20FeeProxyPaymentDetectorBase {
  // protected readonly getSubgraphClient: PaymentNetworkOptions<'near'>['getSubgraphClient'];
  protected readonly network: CurrencyTypes.NearChainName;
  constructor({
    advancedLogic,
    currencyManager,
    // getSubgraphClient,
    network,
  }: ReferenceBasedDetectorOptions & { // Pick<PaymentNetworkOptions<'near'>, 'getSubgraphClient'> &
    network: CurrencyTypes.NearChainName;
  }) {
    const extension = advancedLogic.getFeeProxyContractErc20ForNetwork(network);
    if (!extension) {
      throw new NetworkNotSupported(
        `Unconfigured ERC20NearFeeProxyPaymentDetector for chain '${network}'`,
      );
    }
    super(extension, currencyManager);
    this.network = network;
    // this.getSubgraphClient = getSubgraphClient;
  }

  /**
   * Extracts the payment events of a request
   */
  protected async extractEvents(
    eventName: PaymentTypes.EVENTS_NAMES,
    toAddress: string | undefined,
    paymentReference: string,
    requestCurrency: RequestLogicTypes.ICurrency,
    paymentChain: CurrencyTypes.VMChainName,
    paymentNetwork: ExtensionTypes.IState,
  ): Promise<PaymentTypes.AllNetworkEvents<PaymentTypes.IERC20FeePaymentEventParameters>> {
    if (paymentChain !== this.network) {
      throw new NetworkNotSupported(
        `Unsupported network '${paymentChain}' for payment detector instanciated with '${this.network}'`,
      );
    }
    NearChains.assertChainSupported(paymentChain);
    if (!toAddress) {
      return Promise.resolve({
        paymentEvents: [],
      });
    }

    const { address: proxyContractAddress } =
      ERC20NearFeeProxyPaymentDetector.getDeploymentInformation(
        this.network,
        paymentNetwork.version,
      );

    const graphInfoRetriever = new NearInfoRetriever(
      paymentReference,
      toAddress,
      proxyContractAddress,
      eventName,
      paymentChain,
      requestCurrency.value,
    );
    return graphInfoRetriever.getTransferEvents();
  }
}
