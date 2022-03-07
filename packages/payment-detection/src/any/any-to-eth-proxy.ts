import * as SmartContracts from '@requestnetwork/smart-contracts';
import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';

import { ICurrencyManager, UnsupportedCurrencyError } from '@requestnetwork/currency';

import { AnyToEthInfoRetriever } from './retrievers/any-to-eth-proxy';
import { AnyToAnyDetector } from '../any-to-any-detector';
import { makeGetDeploymentInformation } from '../utils';
import { networkSupportsTheGraph } from '../thegraph';
import { TheGraphConversionRetriever } from './retrievers/thegraph';
import { DeploymentInformation } from '@requestnetwork/smart-contracts';

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
  PaymentTypes.IETHPaymentEventParameters
> {
  private useTheGraph: (network: string) => boolean;
  /**
   * @param extension The advanced logic payment network extensions
   */
  public constructor({
    advancedLogic,
    currencyManager,
    useTheGraph = networkSupportsTheGraph,
  }: {
    advancedLogic: AdvancedLogicTypes.IAdvancedLogic;
    currencyManager: ICurrencyManager;
    useTheGraph?: typeof networkSupportsTheGraph;
  }) {
    super(
      PaymentTypes.PAYMENT_NETWORK_ID.ANY_TO_ETH_PROXY,
      advancedLogic.extensions.anyToEthProxy,
      currencyManager,
    );
    this.useTheGraph = useTheGraph;
  }

  /**
   * Extracts payment events of an address matching an address and a payment reference
   *
   * @param address Address to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param requestCurrency The request currency
   * @param paymentReference The reference to identify the payment
   * @param paymentNetwork the payment network
   * @returns The balance
   */
  protected async extractEvents(
    eventName: PaymentTypes.EVENTS_NAMES,
    address: string | undefined,
    paymentReference: string,
    requestCurrency: RequestLogicTypes.ICurrency,
    paymentChain: string,
    paymentNetwork: ExtensionTypes.IState<ExtensionTypes.PnAnyToEth.ICreationParameters>,
  ): Promise<PaymentTypes.AllNetworkEvents<PaymentTypes.IETHPaymentEventParameters>> {
    if (!address) {
      return {
        paymentEvents: [],
        escrowEvents: [],
      };
    }

    const contractInfo = AnyToEthFeeProxyPaymentDetector.getDeploymentInformation(
      paymentChain,
      paymentNetwork.version,
    );

    const abi = SmartContracts.ethConversionArtifact.getContractAbi(contractInfo.contractVersion);

    const currency = this.currencyManager.fromStorageCurrency(requestCurrency);
    if (!currency) {
      throw new UnsupportedCurrencyError(requestCurrency.value);
    } else {
      const proxyInfoRetriever = this.useTheGraph(paymentChain)
        ? new TheGraphConversionRetriever(
            currency,
            paymentReference,
            contractInfo.address,
            address,
            eventName,
            paymentChain,
            undefined,
            paymentNetwork.values?.maxRateTimespan,
          )
        : new AnyToEthInfoRetriever(
            currency,
            paymentReference,
            contractInfo.address,
            contractInfo.creationBlockNumber,
            abi,
            address,
            eventName,
            paymentChain,
            undefined,
            paymentNetwork.values?.maxRateTimespan,
          );
      const paymentEvents = await proxyInfoRetriever.getTransferEvents();
      return {
        paymentEvents,
        escrowEvents: [],
      };
    }
  }

  /**
   * Get the network of the payment
   *
   * @param requestCurrency The request currency
   * @param paymentNetwork the payment network
   * @returns The network of payment
   */
  protected getPaymentChain(request: RequestLogicTypes.IRequest): string {
    const network = this.getPaymentExtension(request).values.network;
    if (!network) {
      throw Error(`request.extensions[${this.paymentNetworkId}].values.network must be defined`);
    }
    return network;
  }

  protected getProxyDeploymentInformation(
    networkName: string,
    version: string,
  ): DeploymentInformation {
    return AnyToEthFeeProxyPaymentDetector.getDeploymentInformation(networkName, version);
  }

  /*
   * Returns deployment information for the underlying smart contract for a given payment network version
   */
  public static getDeploymentInformation = makeGetDeploymentInformation(
    SmartContracts.ethConversionArtifact,
    PROXY_CONTRACT_ADDRESS_MAP,
  );
}
