import * as SmartContracts from '@requestnetwork/smart-contracts';
import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';

import { ICurrencyManager } from '@requestnetwork/currency';

import { AnyToEthInfoRetriever } from './retrievers/any-to-eth-proxy';
import { AnyToAnyDetector } from '../any-to-any-detector';
import { getDeploymentInformation } from '../utils';

// interface of the object indexing the proxy contract version
interface IProxyContractVersion {
  [version: string]: string;
}

const PROXY_CONTRACT_ADDRESS_MAP: IProxyContractVersion = {
  ['0.1.0']: '0.1.0',
};

/**
 * Handle payment networks with ETH input data extension
 */
export class AnyToEthFeeProxyPaymentDetector extends AnyToAnyDetector<PaymentTypes.IETHPaymentEventParameters> {
  /**
   * @param extension The advanced logic payment network extensions
   */
  public constructor({
    advancedLogic,
    currencyManager,
  }: {
    advancedLogic: AdvancedLogicTypes.IAdvancedLogic;
    currencyManager: ICurrencyManager;
  }) {
    super(
      advancedLogic,
      advancedLogic.extensions.anyToEthProxy,
      ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ETH_PROXY,
      currencyManager,
    );
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
    address: string,
    eventName: PaymentTypes.EVENTS_NAMES,
    requestCurrency: RequestLogicTypes.ICurrency,
    paymentReference: string,
    paymentNetwork: ExtensionTypes.IState<any>,
  ): Promise<PaymentTypes.ETHPaymentNetworkEvent[]> {
    const network = this.getPaymentChain(requestCurrency, paymentNetwork);

    const contractInfo = AnyToEthFeeProxyPaymentDetector.getDeploymentInformation(
      network,
      paymentNetwork.version,
    );

    if (!contractInfo) {
      throw Error('ETH conversion proxy contract not found');
    }
    const abi = SmartContracts.ethConversionArtifact.getContractAbi(contractInfo.contractVersion);

    const currency = this.currencyManager.fromStorageCurrency(requestCurrency);
    if (!currency) {
      throw Error('requestCurrency not found in currency manager');
    }

    const proxyInfoRetriever = new AnyToEthInfoRetriever(
      currency,
      paymentReference,
      contractInfo.address,
      contractInfo.creationBlockNumber,
      abi,
      address,
      eventName,
      network,
      undefined,
      paymentNetwork.values?.maxRateTimespan,
    );

    return await proxyInfoRetriever.getTransferEvents();
  }

  /**
   * Get the network of the payment
   *
   * @param requestCurrency The request currency
   * @param paymentNetwork the payment network
   * @returns The network of payment
   */
  protected getPaymentChain(
    _requestCurrency: RequestLogicTypes.ICurrency,
    paymentNetwork: ExtensionTypes.IState<any>,
  ): string {
    const network = paymentNetwork.values.network;
    if (!network) {
      throw Error('paymentNetwork.values.network must be defined');
    }
    return network;
  }

  /*
   * Returns deployment information for the underlying smart contract for a given payment network version
   */
  public static getDeploymentInformation = getDeploymentInformation(
    SmartContracts.ethConversionArtifact,
    PROXY_CONTRACT_ADDRESS_MAP,
  );
}
