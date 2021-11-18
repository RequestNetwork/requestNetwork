import { erc20ConversionProxy } from '@requestnetwork/smart-contracts';
import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import { ICurrencyManager } from '@requestnetwork/currency';
import { ERC20FeeProxyPaymentDetectorBase } from '../erc20/fee-proxy-contract';
import PaymentReferenceCalculator from '../payment-reference-calculator';
import { AnyToErc20InfoRetriever } from './retrievers/any-to-erc20-proxy';
import { TheGraphAnyToErc20Retriever } from './retrievers/thegraph';
import { networkSupportsTheGraph } from '../thegraph';
import { makeGetDeploymentInformation } from '../utils';
import { VersionNotSupported } from '../balance-error';

const PROXY_CONTRACT_ADDRESS_MAP = {
  ['0.1.0']: '0.1.0',
};

type PaymentEventParameters =
  | PaymentTypes.ConversionPaymentNetworkEventParameters
  | PaymentTypes.IDeclarativePaymentEventParameters;

/**
 * Handle payment networks with conversion proxy contract extension
 */
export class AnyToERC20PaymentDetector extends ERC20FeeProxyPaymentDetectorBase<
  ExtensionTypes.PnAnyToErc20.IAnyToERC20,
  PaymentEventParameters
> {
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
      PaymentTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY,
      advancedLogic.extensions.anyToErc20Proxy,
      currencyManager,
    );
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
  public async extractEvents(
    request: RequestLogicTypes.IRequest,
    salt: string,
    toAddress: string,
    eventName: PaymentTypes.EVENTS_NAMES,
    paymentNetwork: ExtensionTypes.IState,
  ): Promise<PaymentTypes.IPaymentNetworkEvent<PaymentEventParameters>[]> {
    const network = paymentNetwork.values.network;
    const acceptedTokens = paymentNetwork.values.acceptedTokens;
    const maxRateTimespan = paymentNetwork.values.maxRateTimespan || 0;

    const conversionDeploymentInformation = AnyToERC20PaymentDetector.getDeploymentInformation(
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
      : new AnyToErc20InfoRetriever(
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

    const declaredEvents = this.getDeclarativeEvents(request);
    const transferEvents = await infoRetriever.getTransferEvents();
    return this.sortEvents<PaymentEventParameters>([...declaredEvents, ...transferEvents]);
  }

  public static getDeploymentInformation = makeGetDeploymentInformation(
    erc20ConversionProxy,
    PROXY_CONTRACT_ADDRESS_MAP,
  );
}
