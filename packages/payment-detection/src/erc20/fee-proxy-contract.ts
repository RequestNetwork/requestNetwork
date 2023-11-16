import { erc20FeeProxyArtifact } from '@requestnetwork/smart-contracts';
import {
  CurrencyTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { EvmChains, NearChains, isSameChain } from '@requestnetwork/currency';
import ProxyInfoRetriever from './proxy-info-retriever';

import { loadCurrencyFromContract } from './currency';
import { FeeReferenceBasedDetector } from '../fee-reference-based-detector';
import { makeGetDeploymentInformation } from '../utils';
import { TheGraphClient, TheGraphInfoRetriever } from '../thegraph';
import { ReferenceBasedDetectorOptions, TGetSubGraphClient } from '../types';
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
  TExtension extends ExtensionTypes.PnFeeReferenceBased.IFeeReferenceBased,
  TPaymentEventParameters extends PaymentTypes.IERC20FeePaymentEventParameters,
> extends FeeReferenceBasedDetector<TExtension, TPaymentEventParameters> {
  /**
   * @param extension The advanced logic payment network extensions
   */
  protected constructor(
    paymentNetworkId: ExtensionTypes.PAYMENT_NETWORK_ID,
    extension: TExtension,
    currencyManager: CurrencyTypes.ICurrencyManager,
  ) {
    super(paymentNetworkId, extension, currencyManager);
  }

  protected async getCurrency(
    storageCurrency: RequestLogicTypes.ICurrency,
  ): Promise<CurrencyTypes.CurrencyDefinition> {
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
 * Handle payment networks with ERC20 fee proxy contract extension on EVM (default) or Near chains
 */
export class ERC20FeeProxyPaymentDetector<
  TChain extends CurrencyTypes.VMChainName = CurrencyTypes.EvmChainName,
> extends ERC20FeeProxyPaymentDetectorBase<
  ExtensionTypes.PnFeeReferenceBased.IFeeReferenceBased,
  PaymentTypes.IERC20FeePaymentEventParameters
> {
  private readonly getSubgraphClient: TGetSubGraphClient<TChain>;
  protected readonly network: TChain | undefined;
  constructor({
    advancedLogic,
    currencyManager,
    getSubgraphClient,
    network,
  }: ReferenceBasedDetectorOptions & {
    network?: TChain;
    getSubgraphClient: TGetSubGraphClient<TChain>;
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
    paymentChain: TChain,
    paymentNetwork: ExtensionTypes.IState,
  ): Promise<PaymentTypes.AllNetworkEvents<PaymentTypes.IERC20FeePaymentEventParameters>> {
    if (this.network && !isSameChain(paymentChain, this.network)) {
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
      const graphInfoRetriever = this.getTheGraphInfoRetriever(paymentChain, subgraphClient);
      return graphInfoRetriever.getTransferEvents({
        eventName,
        paymentReference,
        toAddress,
        contractAddress: proxyContractAddress,
        paymentChain,
        acceptedTokens: [requestCurrency.value],
      });
    } else {
      if (!EvmChains.isChainSupported(paymentChain)) {
        throw new Error(
          `Could not get a TheGraph-based info retriever for chain ${paymentChain} and RPC-based info retrievers are only compatible with EVM chains.`,
        );
      }
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

  protected getTheGraphInfoRetriever(
    paymentChain: TChain,
    subgraphClient: TheGraphClient | TheGraphClient<CurrencyTypes.NearChainName>,
  ): TheGraphInfoRetriever | NearInfoRetriever {
    const graphInfoRetriever = EvmChains.isChainSupported(paymentChain)
      ? new TheGraphInfoRetriever(subgraphClient as TheGraphClient, this.currencyManager)
      : NearChains.isChainSupported(paymentChain) && this.network
      ? new NearInfoRetriever(subgraphClient as TheGraphClient<CurrencyTypes.NearChainName>)
      : undefined;
    if (!graphInfoRetriever) {
      throw new Error(
        `Could not find graphInfoRetriever for chain ${paymentChain} in payment detector`,
      );
    }
    return graphInfoRetriever;
  }
}
