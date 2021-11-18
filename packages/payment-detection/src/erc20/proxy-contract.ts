import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import { erc20ProxyArtifact } from '@requestnetwork/smart-contracts';
import { BalanceError, NetworkNotSupported, VersionNotSupported } from '../balance-error';
import PaymentReferenceCalculator from '../payment-reference-calculator';
import ProxyInfoRetriever from './proxy-info-retriever';
import TheGraphInfoRetriever from './thegraph-info-retriever';
import { networkSupportsTheGraph } from '../thegraph';
import { DeclarativePaymentDetectorBase } from '../declarative';
import { makeGetDeploymentInformation } from '../utils';

const PROXY_CONTRACT_ADDRESS_MAP = {
  ['0.1.0']: '0.1.0',
};

/**
 * Handle payment networks with ERC20 proxy contract extension
 */
export class ERC20ProxyPaymentDetector extends DeclarativePaymentDetectorBase<
  ExtensionTypes.PnReferenceBased.IReferenceBased,
  PaymentTypes.IERC20PaymentEventParameters | PaymentTypes.IDeclarativePaymentEventParameters
> {
  /**
   * @param extension The advanced logic payment network extensions
   */
  public constructor({ advancedLogic }: { advancedLogic: AdvancedLogicTypes.IAdvancedLogic }) {
    super(
      PaymentTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT,
      advancedLogic.extensions.proxyContractErc20,
      (request) => this.getEvents(request),
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
    paymentNetworkCreationParameters: PaymentTypes.IReferenceBasedCreationParameters,
  ): Promise<ExtensionTypes.IAction> {
    // If no salt is given, generate one
    const salt =
      paymentNetworkCreationParameters.salt || (await Utils.crypto.generate8randomBytes());

    return this.extension.createCreationAction({
      paymentAddress: paymentNetworkCreationParameters.paymentAddress,
      refundAddress: paymentNetworkCreationParameters.refundAddress,
      salt,
    });
  }

  /**
   * Creates the extensions data to add payment address
   *
   * @param parameters to add payment address
   * @returns The extensionData object
   */
  public createExtensionsDataForAddPaymentAddress(
    parameters: ExtensionTypes.PnReferenceBased.IAddPaymentAddressParameters,
  ): ExtensionTypes.IAction {
    return this.extension.createAddPaymentAddressAction({
      paymentAddress: parameters.paymentAddress,
    });
  }

  /**
   * Creates the extensions data to add refund address
   *
   * @param Parameters to add refund address
   * @returns The extensionData object
   */
  public createExtensionsDataForAddRefundAddress(
    parameters: ExtensionTypes.PnReferenceBased.IAddRefundAddressParameters,
  ): ExtensionTypes.IAction {
    return this.extension.createAddRefundAddressAction({
      refundAddress: parameters.refundAddress,
    });
  }

  /**
   * Gets the balance and the payment/refund events
   *
   * @param request the request to check
   * @param paymentNetworkId payment network id
   * @param tokenContractAddress the address of the token contract
   * @returns the balance and the payment/refund events
   */
  private async getEvents(
    request: RequestLogicTypes.IRequest,
  ): Promise<
    (PaymentTypes.ERC20PaymentNetworkEvent | PaymentTypes.DeclarativePaymentNetworkEvent)[]
  > {
    const paymentNetworkId = ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT;
    const paymentNetwork = request.extensions[paymentNetworkId];

    if (!paymentNetwork) {
      throw new BalanceError(
        `The request does not have the extension : ${paymentNetworkId}`,
        PaymentTypes.BALANCE_ERROR_CODE.WRONG_EXTENSION,
      );
    }
    const paymentAddress = paymentNetwork.values.paymentAddress;
    const refundAddress = paymentNetwork.values.refundAddress;
    const salt = paymentNetwork.values.salt;

    const paymentEvents = await this.extractTransferEvents(
      request,
      salt,
      paymentAddress,
      PaymentTypes.EVENTS_NAMES.PAYMENT,
      paymentNetwork.version,
    );

    const refundEvents = await this.extractTransferEvents(
      request,
      salt,
      refundAddress,
      PaymentTypes.EVENTS_NAMES.REFUND,
      paymentNetwork.version,
    );

    const declaredEvents = this.getDeclarativeEvents(request);
    return [...declaredEvents, ...paymentEvents, ...refundEvents];
  }

  /**
   * Extracts the balance and events of an address
   *
   * @private
   * @param address Address to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The id of network we want to check
   * @param tokenContractAddress the address of the token contract
   * @returns The balance and events
   */
  private async extractTransferEvents(
    request: RequestLogicTypes.IRequest,
    salt: string,
    toAddress: string,
    eventName: PaymentTypes.EVENTS_NAMES,
    paymentNetworkVersion: string,
  ): Promise<PaymentTypes.ERC20PaymentNetworkEvent[]> {
    if (!toAddress) {
      return [];
    }
    const network = request.currency.network;

    if (!network) {
      throw new NetworkNotSupported(`Payment network not supported by ERC20 payment detection`);
    }

    let proxyContractAddress: string;
    let proxyCreationBlockNumber: number;
    try {
      const info = ERC20ProxyPaymentDetector.getDeploymentInformation(
        network,
        paymentNetworkVersion,
      );
      proxyContractAddress = info.address;
      proxyCreationBlockNumber = info.creationBlockNumber;
    } catch (e) {
      const errMessage = (e as Error)?.message || '';
      if (errMessage.startsWith('No deployment for network')) {
        throw new NetworkNotSupported(
          `Network not supported for this payment network: ${request.currency.network}`,
        );
      }
      if (
        errMessage.startsWith('No contract matches payment network version') ||
        errMessage.startsWith('No deployment for version')
      ) {
        throw new VersionNotSupported(errMessage);
      }
      throw e;
    }

    const paymentReference = PaymentReferenceCalculator.calculate(
      request.requestId,
      salt,
      toAddress,
    );

    const infoRetriever = networkSupportsTheGraph(network)
      ? new TheGraphInfoRetriever(
          paymentReference,
          proxyContractAddress,
          request.currency.value,
          toAddress,
          eventName,
          network,
        )
      : new ProxyInfoRetriever(
          paymentReference,
          proxyContractAddress,
          proxyCreationBlockNumber,
          request.currency.value,
          toAddress,
          eventName,
          network,
        );

    return infoRetriever.getTransferEvents();
  }
  /*
   * Returns deployment information for the underlying smart contract for a given payment network version
   */
  public static getDeploymentInformation = makeGetDeploymentInformation(
    erc20ProxyArtifact,
    PROXY_CONTRACT_ADDRESS_MAP,
  );
}
