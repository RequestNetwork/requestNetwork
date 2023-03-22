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
  protected constructor(
    extensionId: ExtensionTypes.PAYMENT_NETWORK_ID,
    extension: TExtension,
    currencyManager: ICurrencyManager,
  ) {
    super(extensionId, extension, currencyManager);
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

export type GetSubGraphClient = (
  network: CurrencyTypes.ChainName,
) => TheGraphClient | TheGraphClient<'near'>;

/**
 * Handle payment networks with ERC20 fee proxy contract extension
 */
export class ERC20FeeProxyPaymentDetector extends ERC20FeeProxyPaymentDetectorBase {
  protected readonly network: CurrencyTypes.VMChainName | undefined;
  private readonly getSubgraphClient: GetSubGraphClient;
  constructor({
    advancedLogic,
    currencyManager,
    getSubgraphClient,
    network,
  }: ReferenceBasedDetectorOptions & {
    network?: CurrencyTypes.VMChainName;
    getSubgraphClient: GetSubGraphClient;
  }) {
    super(
      ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
      advancedLogic.getFeeProxyContractErc20ForNetwork(network) ??
        advancedLogic.extensions.feeProxyContractErc20,
      currencyManager,
    );
    this.getSubgraphClient = getSubgraphClient;
    this.network = network;
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
    if (this.network && paymentChain !== this.network) {
      throw new NetworkNotSupported(
        `Unsupported network '${paymentChain}' for payment detector instanciated with '${this.network}'`,
      );
    }
    if (!toAddress) {
      return Promise.resolve({
        paymentEvents: [],
      });
    }

    const { address: proxyContractAddress, creationBlockNumber: proxyCreationBlockNumber } =
      ERC20FeeProxyPaymentDetector.getDeploymentInformation(paymentChain, paymentNetwork.version);

    const subgraphClient = this.getSubgraphClient(paymentChain);
    if (subgraphClient) {
      const graphInfoRetriever = EvmChains.isChainSupported(paymentChain)
        ? new TheGraphInfoRetriever(subgraphClient as TheGraphClient, this.currencyManager)
        : NearChains.isChainSupported(paymentChain) && this.network
        ? new NearInfoRetriever(subgraphClient as TheGraphClient<'near'>)
        : undefined;
      if (!graphInfoRetriever) {
        throw new Error(
          `Could not find graphInfoRetriever for chain ${paymentChain} in payment detector`,
        );
      }
      return graphInfoRetriever.getTransferEvents({
        eventName,
        paymentReference,
        toAddress,
        contractAddress: proxyContractAddress,
        paymentChain,
        acceptedTokens: [requestCurrency.value],
      });
    } else {
      EvmChains.assertChainSupported(paymentChain);
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
  protected readonly getSubgraphClient: PaymentNetworkOptions<'near'>['getSubgraphClient'];
  protected readonly network: CurrencyTypes.NearChainName;
  constructor({
    advancedLogic,
    currencyManager,
    getSubgraphClient,
    network,
  }: ReferenceBasedDetectorOptions &
    Pick<PaymentNetworkOptions<'near'>, 'getSubgraphClient'> & {
      network: CurrencyTypes.NearChainName;
    }) {
    const extension = advancedLogic.getFeeProxyContractErc20ForNetwork(network);
    if (!extension) {
      throw new NetworkNotSupported(
        `Unconfigured ERC20NearFeeProxyPaymentDetector for chain '${network}'`,
      );
    }
    super(ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT, extension, currencyManager);
    this.network = network;
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
    if (paymentChain !== this.network) {
      throw new NetworkNotSupported(
        `Unsupported network '${paymentChain}' for payment detector instanciated with '${this.network}'`,
      );
    }
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

    const subgraphClient = this.getSubgraphClient(paymentChain);
    if (!subgraphClient) {
      throw new Error(`Error getting subgraph client for ${paymentChain}`);
    }
    const graphInfoRetriever = new NearInfoRetriever(subgraphClient);
    return graphInfoRetriever.getTransferEvents({
      paymentReference,
      toAddress,
      contractAddress: proxyContractAddress,
      eventName,
      paymentChain,
      acceptedTokens: [requestCurrency.value],
    });
  }
}
