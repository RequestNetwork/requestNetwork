import { BigNumber } from 'ethers';
import { erc20ConversionProxy } from '@requestnetwork/smart-contracts';
import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import { ICurrencyManager } from '@requestnetwork/currency';
import PaymentNetworkERC20FeeProxyContract, {
  DeploymentInformationGetter,
} from '../erc20/fee-proxy-contract';
import PaymentReferenceCalculator from '../payment-reference-calculator';
import ProxyInfoRetriever from './any-to-erc20-proxy-info-retriever';
import TheGraphAnyToErc20Retriever from './thegraph-info-retriever';
import { networkSupportsTheGraph } from '../thegraph';

/* eslint-disable max-classes-per-file */
/** Exception when version not supported */
class VersionNotSupported extends Error {}

/**
 * Handle payment networks with conversion proxy contract extension
 */
export default class PaymentNetworkAnyToERC20 extends PaymentNetworkERC20FeeProxyContract<ExtensionTypes.PnAnyToErc20.IAnyToERC20> {
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
    super({
      advancedLogic,
      currencyManager,
    });
    this._extensionTypeId = ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY;
    this._extension = advancedLogic.extensions.anyToErc20Proxy;
  }

  /**
   * Creates the extensions data for the creation of this extension.
   * Will set a salt if none is already given
   *
   * @param paymentNetworkCreationParameters Parameters to create the extension
   * @returns The extensionData object
   */
  public async createExtensionsDataForCreation(
    paymentNetworkCreationParameters: PaymentTypes.IAnyToErc20CreationParameters,
  ): Promise<ExtensionTypes.IAction> {
    // If no salt is given, generate one
    const salt =
      paymentNetworkCreationParameters.salt || (await Utils.crypto.generate8randomBytes());

    return this.extension.createCreationAction({
      feeAddress: paymentNetworkCreationParameters.feeAddress,
      feeAmount: paymentNetworkCreationParameters.feeAmount,
      paymentAddress: paymentNetworkCreationParameters.paymentAddress,
      refundAddress: paymentNetworkCreationParameters.refundAddress,
      network: paymentNetworkCreationParameters.network,
      acceptedTokens: paymentNetworkCreationParameters.acceptedTokens,
      maxRateTimespan: paymentNetworkCreationParameters.maxRateTimespan,
      salt,
    });
  }

  /**
   * Extracts the balance and events of a request
   *
   * @private
   * @param request Address to check
   * @param salt Payment reference salt
   * @param toAddress Payee address
   * @param eventName Indicate if it is an address for payment or refund
   * @param paymentNetwork Payment network state
   * @returns The balance and events
   */
  public async extractBalanceAndEvents(
    request: RequestLogicTypes.IRequest,
    salt: string,
    toAddress: string,
    eventName: PaymentTypes.EVENTS_NAMES,
    paymentNetwork: ExtensionTypes.IState,
  ): Promise<PaymentTypes.IBalanceWithEvents> {
    const network = paymentNetwork.values.network;
    const acceptedTokens = paymentNetwork.values.acceptedTokens;
    const maxRateTimespan = paymentNetwork.values.maxRateTimespan || 0;

    const conversionDeploymentInformation = erc20ConversionProxy.getDeploymentInformation(
      network,
      paymentNetwork.version,
    );

    const conversionProxyAbi = erc20ConversionProxy.getContractAbi(paymentNetwork.version);

    if (!conversionDeploymentInformation) {
      throw new VersionNotSupported(
        `Payment network version not supported: ${paymentNetwork.version}`,
      );
    }

    const conversionProxyContractAddress: string | undefined =
      conversionDeploymentInformation.address;
    const conversionProxyCreationBlockNumber: number =
      conversionDeploymentInformation.creationBlockNumber;

    const paymentReference = PaymentReferenceCalculator.calculate(
      request.requestId,
      salt,
      toAddress,
    );

    const currency = await this.getCurrency(request.currency);

    const infoRetriever = networkSupportsTheGraph(network)
      ? new TheGraphAnyToErc20Retriever(
          currency,
          paymentReference,
          conversionProxyContractAddress,

          toAddress,
          eventName,
          network,
          acceptedTokens,
          maxRateTimespan,
        )
      : new ProxyInfoRetriever(
          currency,
          paymentReference,
          conversionProxyContractAddress,
          conversionProxyCreationBlockNumber,
          conversionProxyAbi,
          toAddress,
          eventName,
          network,
          acceptedTokens,
          maxRateTimespan,
        );

    const events = await infoRetriever.getTransferEvents();

    const balance = events
      .reduce((acc, event) => acc.add(BigNumber.from(event.amount)), BigNumber.from(0))
      .toString();

    return {
      balance,
      events,
    };
  }

  protected getDeploymentInformation: DeploymentInformationGetter =
    erc20ConversionProxy.getDeploymentInformation;
}
