import { erc20FeeProxyArtifact } from '@requestnetwork/smart-contracts';
import {
  CurrencyTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { CurrencyDefinition, ICurrencyManager, NearChains } from '@requestnetwork/currency';
import ProxyInfoRetriever from './proxy-info-retriever';

import { loadCurrencyFromContract } from './currency';
import { FeeReferenceBasedDetector } from '../fee-reference-based-detector';
import { makeGetDeploymentInformation } from '../utils';
import { ITheGraphBaseInfoRetriever, TheGraphClient, TheGraphInfoRetriever } from '../thegraph';
import { PaymentNetworkOptions, ReferenceBasedDetectorOptions } from '../types';
import { NearInfoRetriever } from '../near';
import { NearPaymentEvent } from '../near/retrievers/near-info-retriever';
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
  TExtension extends ExtensionTypes.PnFeeReferenceBased.IFeeReferenceBased,
  TPaymentEventParameters extends PaymentTypes.IERC20FeePaymentEventParameters,
> extends FeeReferenceBasedDetector<TExtension, TPaymentEventParameters> {
  /**
   * @param extension The advanced logic payment network extensions
   */
  protected constructor(
    paymentNetworkId: ExtensionTypes.PAYMENT_NETWORK_ID,
    extension: TExtension,
    currencyManager: ICurrencyManager,
  ) {
    super(paymentNetworkId, extension, currencyManager);
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
}

/**
 * Handle payment networks with ERC20 fee proxy contract extension
 */
export class ERC20FeeProxyPaymentDetector<
  TGraphClientVariant extends 'near' | null = null,
  // TRetriever extends ReturnType<typeof new TheGraphInfoRetriever<TGraphClientVariant>
  // TRetriever extends TheGraphBaseInfoRetriever<PaymentTypes.IERC20FeePaymentEventParameters> = TheGraphInfoRetriever,
> extends ERC20FeeProxyPaymentDetectorBase<
  ExtensionTypes.PnFeeReferenceBased.IFeeReferenceBased,
  PaymentTypes.IERC20FeePaymentEventParameters
> {
  protected readonly getSubgraphClient: PaymentNetworkOptions<TGraphClientVariant>['getSubgraphClient'];
  constructor({
    advancedLogic,
    currencyManager,
    getSubgraphClient,
  }: ReferenceBasedDetectorOptions &
    Pick<PaymentNetworkOptions<TGraphClientVariant>, 'getSubgraphClient'>) {
    super(
      ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
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
    if (!toAddress) {
      return Promise.resolve({
        paymentEvents: [],
      });
    }

    const { address: proxyContractAddress, creationBlockNumber: proxyCreationBlockNumber } =
      ERC20FeeProxyPaymentDetector.getDeploymentInformation(paymentChain, paymentNetwork.version);

    let graphInfoRetriever:
      | ITheGraphBaseInfoRetriever<PaymentTypes.IERC20FeePaymentEventParameters | NearPaymentEvent>
      | undefined = undefined;

    try {
      NearChains.assertChainSupported(paymentChain);
      graphInfoRetriever = new NearInfoRetriever(
        paymentReference,
        toAddress,
        proxyContractAddress,
        eventName,
        paymentChain,
        requestCurrency.value,
      );
    } catch {
      const subgraphClient = this.getSubgraphClient(paymentChain);
      if (subgraphClient) {
        graphInfoRetriever = new TheGraphInfoRetriever(
          subgraphClient as TheGraphClient,
          this.currencyManager,
        );
      }
    }
    if (graphInfoRetriever) {
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
export class ERC20NearFeeProxyPaymentDetector extends ERC20FeeProxyPaymentDetector<'near'> {
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
    super({ advancedLogic, currencyManager, getSubgraphClient, extension });
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
    paymentChain: CurrencyTypes.NearChainName | undefined,
    paymentNetwork: ExtensionTypes.IState,
  ): Promise<PaymentTypes.AllNetworkEvents<PaymentTypes.IERC20FeePaymentEventParameters>> {
    if (paymentChain && paymentChain !== network)
      if (!toAddress) {
        return Promise.resolve({
          paymentEvents: [],
        });
      }

    const { address: proxyContractAddress } = ERC20FeeProxyPaymentDetector.getDeploymentInformation(
      paymentChain,
      paymentNetwork.version,
    );

    let graphInfoRetriever:
      | ITheGraphBaseInfoRetriever<PaymentTypes.IERC20FeePaymentEventParameters | NearPaymentEvent>
      | undefined = undefined;

    try {
      NearChains.assertChainSupported(paymentChain);
      graphInfoRetriever = new NearInfoRetriever(
        paymentReference,
        toAddress,
        proxyContractAddress,
        eventName,
        paymentChain,
        requestCurrency.value,
      );
      if (graphInfoRetriever) {
        return graphInfoRetriever.getTransferEvents({
          eventName,
          paymentReference,
          toAddress,
          contractAddress: proxyContractAddress,
          paymentChain,
          acceptedTokens: [requestCurrency.value],
        });
      }
    } catch {
      // Do nothing
    }
    throw new NetworkNotSupported(
      `Unconfigured near-detector chain '${chainName}' and version '${version}'`,
    );
    // TODO throw?
  }

  /*
   * Returns deployment information for the underlying smart contract for a given payment network version
   */
  public static getDeploymentInformation = makeGetDeploymentInformation(
    erc20FeeProxyArtifact,
    PROXY_CONTRACT_ADDRESS_MAP,
  );
}
