import * as SmartContracts from '@requestnetwork/smart-contracts';
import {
  CurrencyTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';

import { EvmChains, UnsupportedCurrencyError } from '@requestnetwork/currency';

import { AnyToEthInfoRetriever } from './retrievers/any-to-eth-proxy';
import { AnyToAnyDetector } from '../any-to-any-detector';
import { makeGetDeploymentInformation } from '../utils';
import { TheGraphConversionInfoRetriever } from '../thegraph/conversion-info-retriever';
import { PaymentNetworkOptions, ReferenceBasedDetectorOptions } from '../types';

// interface of the object indexing the proxy contract version
interface IProxyContractVersion {
  [version: string]: string;
}

const PROXY_CONTRACT_ADDRESS_MAP: IProxyContractVersion = {
  ['0.1.0']: '0.1.0',
  ['0.2.0']: '0.2.0',
};

/**
 * Handle payment networks with ETH input data extension
 */
export class AnyToEthFeeProxyPaymentDetector extends AnyToAnyDetector<
  ExtensionTypes.PnAnyToEth.IAnyToEth,
  PaymentTypes.IETHFeePaymentEventParameters
> {
  private readonly getSubgraphClient: PaymentNetworkOptions<CurrencyTypes.EvmChainName>['getSubgraphClient'];
  /**
   * @param extension The advanced logic payment network extensions
   */
  public constructor({
    advancedLogic,
    currencyManager,
    getSubgraphClient,
  }: ReferenceBasedDetectorOptions &
    Pick<PaymentNetworkOptions<CurrencyTypes.EvmChainName>, 'getSubgraphClient'>) {
    super(
      ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ETH_PROXY,
      advancedLogic.extensions.anyToEthProxy,
      currencyManager,
    );
    this.getSubgraphClient = getSubgraphClient;
  }

  /**
   * Extracts payment events of an address matching an address and a payment reference
   *
   * @param toAddress Address to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param requestCurrency The request currency
   * @param paymentReference The reference to identify the payment
   * @param paymentNetwork the payment network
   * @returns The balance
   */
  protected async extractEvents(
    eventName: PaymentTypes.EVENTS_NAMES,
    toAddress: string | undefined,
    paymentReference: string,
    requestCurrency: RequestLogicTypes.ICurrency,
    paymentChain: CurrencyTypes.EvmChainName,
    paymentNetwork: ExtensionTypes.IState<ExtensionTypes.PnAnyToEth.ICreationParameters>,
  ): Promise<PaymentTypes.AllNetworkEvents<PaymentTypes.IETHPaymentEventParameters>> {
    if (!toAddress) {
      return {
        paymentEvents: [],
      };
    }

    const contractInfo = AnyToEthFeeProxyPaymentDetector.getDeploymentInformation(
      paymentChain,
      paymentNetwork.version,
    );

    const currency = this.currencyManager.fromStorageCurrency(requestCurrency);
    if (!currency) {
      throw new UnsupportedCurrencyError(requestCurrency.value);
    }

    const subgraphClient = this.getSubgraphClient(paymentChain);
    if (subgraphClient) {
      const infoRetriever = new TheGraphConversionInfoRetriever(
        subgraphClient,
        this.currencyManager,
      );
      return await infoRetriever.getTransferEvents({
        paymentReference,
        contractAddress: contractInfo.address,
        toAddress,
        eventName,
        paymentChain,
        maxRateTimespan: paymentNetwork.values?.maxRateTimespan,
        requestCurrency: currency,
      });
    }

    const abi = SmartContracts.ethConversionArtifact.getContractAbi(contractInfo.contractVersion);

    const infoRetriever = new AnyToEthInfoRetriever(
      currency,
      paymentReference,
      contractInfo.address,
      contractInfo.creationBlockNumber,
      abi,
      toAddress,
      eventName,
      paymentChain,
      undefined,
      paymentNetwork.values?.maxRateTimespan,
    );
    const paymentEvents = await infoRetriever.getTransferEvents();
    return {
      paymentEvents,
    };
  }

  /**
   * Get the network of the payment
   *
   * @param requestCurrency The request currency
   * @param paymentNetwork the payment network
   * @returns The network of payment
   */
  protected getPaymentChain(request: RequestLogicTypes.IRequest): CurrencyTypes.EvmChainName {
    const network = this.getPaymentExtension(request).values.network;
    if (!network) {
      throw Error(`request.extensions[${this.paymentNetworkId}].values.network must be defined`);
    }
    EvmChains.assertChainSupported(network);
    return network;
  }

  /*
   * Returns deployment information for the underlying smart contract for a given payment network version
   */
  public static getDeploymentInformation = makeGetDeploymentInformation(
    SmartContracts.ethConversionArtifact,
    PROXY_CONTRACT_ADDRESS_MAP,
  );
}
