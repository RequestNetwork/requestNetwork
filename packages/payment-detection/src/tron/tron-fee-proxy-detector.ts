import { erc20FeeProxyArtifact } from '@requestnetwork/smart-contracts';
import {
  CurrencyTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { TronChains, isSameChain } from '@requestnetwork/currency';

import { ERC20FeeProxyPaymentDetectorBase } from '../erc20/fee-proxy-contract';
import { NetworkNotSupported } from '../balance-error';
import { ReferenceBasedDetectorOptions } from '../types';
import { TronInfoRetriever, TronPaymentEvent } from './retrievers/tron-info-retriever';
import { getHasuraClient, HasuraClientOptions } from './retrievers/hasura-client';

/**
 * Handle payment networks with ERC20 fee proxy contract extension on TRON chains
 */
export class TronERC20FeeProxyPaymentDetector extends ERC20FeeProxyPaymentDetectorBase<
  ExtensionTypes.PnFeeReferenceBased.IFeeReferenceBased,
  TronPaymentEvent
> {
  private readonly hasuraClientOptions?: Partial<HasuraClientOptions>;
  protected readonly network: CurrencyTypes.TronChainName | undefined;

  constructor({
    advancedLogic,
    currencyManager,
    network,
    hasuraClientOptions,
  }: ReferenceBasedDetectorOptions & {
    network?: CurrencyTypes.TronChainName;
    hasuraClientOptions?: Partial<HasuraClientOptions>;
  }) {
    super(
      ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
      advancedLogic.getFeeProxyContractErc20ForNetwork(network) ??
        advancedLogic.extensions.feeProxyContractErc20,
      currencyManager,
    );
    this.hasuraClientOptions = hasuraClientOptions;
    this.network = network;
  }

  /**
   * Gets the deployment information for the ERC20FeeProxy contract on TRON
   */
  public static getDeploymentInformation(
    network: CurrencyTypes.VMChainName,
    _paymentNetworkVersion?: string,
  ): { address: string; creationBlockNumber: number; contractVersion: string } {
    void _paymentNetworkVersion; // Parameter kept for API compatibility

    // Validate that the network is a TRON chain
    if (network !== 'tron' && network !== 'nile') {
      throw new Error(
        `TronERC20FeeProxyPaymentDetector only supports TRON networks, got: ${network}`,
      );
    }

    // For TRON, we use the 'tron' version of the artifact
    const tronNetwork = network as CurrencyTypes.TronChainName;
    const address = erc20FeeProxyArtifact.getAddress(tronNetwork, 'tron');
    const creationBlockNumber =
      tronNetwork === 'tron'
        ? 79216121 // TRON mainnet
        : 63208782; // Nile testnet

    return { address, creationBlockNumber, contractVersion: 'tron' };
  }

  /**
   * Extracts the payment events of a request on TRON
   */
  protected async extractEvents(
    eventName: PaymentTypes.EVENTS_NAMES,
    toAddress: string | undefined,
    paymentReference: string,
    requestCurrency: RequestLogicTypes.ICurrency,
    paymentChain: CurrencyTypes.TronChainName,
    _paymentNetwork: ExtensionTypes.IState,
  ): Promise<PaymentTypes.AllNetworkEvents<TronPaymentEvent>> {
    void _paymentNetwork; // Parameter required by parent class signature
    // Validate that the payment chain is a supported TRON chain
    if (!TronChains.isChainSupported(paymentChain)) {
      throw new NetworkNotSupported(
        `Unsupported TRON network '${paymentChain}' for TRON payment detector`,
      );
    }

    if (this.network && !isSameChain(paymentChain, this.network)) {
      throw new NetworkNotSupported(
        `Unsupported network '${paymentChain}' for payment detector instantiated with '${this.network}'`,
      );
    }

    if (!toAddress) {
      return {
        paymentEvents: [],
      };
    }

    const { address: proxyContractAddress } =
      TronERC20FeeProxyPaymentDetector.getDeploymentInformation(paymentChain);

    const hasuraClient = getHasuraClient(paymentChain, this.hasuraClientOptions);

    if (!hasuraClient) {
      throw new Error(
        `Could not get a Hasura client for TRON chain ${paymentChain}. ` +
          `Ensure HASURA_GRAPHQL_URL is configured or the network is supported.`,
      );
    }

    const infoRetriever = new TronInfoRetriever(hasuraClient);

    return infoRetriever.getTransferEvents({
      eventName,
      paymentReference,
      toAddress,
      contractAddress: proxyContractAddress,
      paymentChain,
      acceptedTokens: [requestCurrency.value],
    });
  }
}
