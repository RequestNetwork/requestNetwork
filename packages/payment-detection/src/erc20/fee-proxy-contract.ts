import { erc20FeeProxyArtifact } from '@requestnetwork/smart-contracts';
import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import getBalanceErrorObject from '../balance-error';
import PaymentReferenceCalculator from '../payment-reference-calculator';
import ProxyInfoRetriever from './proxy-info-retriever';

const bigNumber: any = require('bn.js');

// tslint:disable:max-classes-per-file
/** Exception when network not supported */
class NetworkNotSupported extends Error {}
/** Exception when version not supported */
class VersionNotSupported extends Error {}

/**
 * Handle payment networks with ERC20 fee proxy contract extension
 */
export default class PaymentNetworkERC20FeeProxyContract implements PaymentTypes.IPaymentNetwork {
  private extension: ExtensionTypes.PnFeeReferenceBased.IFeeReferenceBased;
  /**
   * @param extension The advanced logic payment network extensions
   */
  public constructor({ advancedLogic }: { advancedLogic: AdvancedLogicTypes.IAdvancedLogic }) {
    this.extension = advancedLogic.extensions.feeProxyContractErc20;
  }

  /**
   * Creates the extensions data for the creation of this extension.
   * Will set a salt if none is already given
   *
   * @param paymentNetworkCreationParameters Parameters to create the extension
   * @returns The extensionData object
   */
  public async createExtensionsDataForCreation(
    paymentNetworkCreationParameters: PaymentTypes.IFeeReferenceBasedCreationParameters,
  ): Promise<ExtensionTypes.IAction> {
    // If no salt is given, generate one
    const salt =
      paymentNetworkCreationParameters.salt || (await Utils.crypto.generate8randomBytes());

    return this.extension.createCreationAction({
      feeAddress: paymentNetworkCreationParameters.feeAddress,
      feeAmount: paymentNetworkCreationParameters.feeAmount,
      paymentAddress: paymentNetworkCreationParameters.paymentAddress,
      refundAddress: paymentNetworkCreationParameters.refundAddress,
      salt,
    });
  }

  /**
   * Creates the extensions data to add payment address
   *
   * @param parameters to add payment information
   * @returns The extensionData object
   */
  public createExtensionsDataForAddPaymentInformation(
    parameters: ExtensionTypes.PnReferenceBased.IAddPaymentAddressParameters,
  ): ExtensionTypes.IAction {
    return this.extension.createAddPaymentAddressAction({
      paymentAddress: parameters.paymentAddress,
    });
  }

  /**
   * Creates the extensions data to add refund address
   *
   * @param Parameters to add refund information
   * @returns The extensionData object
   */
  public createExtensionsDataForAddRefundInformation(
    parameters: ExtensionTypes.PnReferenceBased.IAddRefundAddressParameters,
  ): ExtensionTypes.IAction {
    return this.extension.createAddRefundAddressAction({
      refundAddress: parameters.refundAddress,
    });
  }

  /**
   * Creates the extensions data to add fee address and amount
   *
   * @param Parameters to add refund information
   * @returns The extensionData object
   */
  public createExtensionsDataForAddFeeInformation(
    parameters: ExtensionTypes.PnFeeReferenceBased.IAddFeeParameters,
  ): ExtensionTypes.IAction {
    return this.extension.createAddFeeAction({
      feeAddress: parameters.feeAddress,
      feeAmount: parameters.feeAmount,
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
  public async getBalance(
    request: RequestLogicTypes.IRequest,
  ): Promise<PaymentTypes.IBalanceWithEvents> {
    const paymentNetworkId = ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT;
    const paymentNetwork = request.extensions[paymentNetworkId];

    if (!paymentNetwork) {
      return getBalanceErrorObject(
        `The request does not have the extension : ${paymentNetworkId}`,
        PaymentTypes.BALANCE_ERROR_CODE.WRONG_EXTENSION,
      );
    }
    try {
      const paymentAddress = paymentNetwork.values.paymentAddress;
      const refundAddress = paymentNetwork.values.refundAddress;
      const feeAddress = paymentNetwork.values.feeAddress;
      const salt = paymentNetwork.values.salt;

      let payments: PaymentTypes.IBalanceWithEvents = { balance: '0', events: [] };
      if (paymentAddress) {
        payments = await this.extractBalanceAndEvents(
          request,
          salt,
          paymentAddress,
          PaymentTypes.EVENTS_NAMES.PAYMENT,
          paymentNetwork.version,
        );
      }

      let refunds: PaymentTypes.IBalanceWithEvents = { balance: '0', events: [] };
      if (refundAddress) {
        refunds = await this.extractBalanceAndEvents(
          request,
          salt,
          refundAddress,
          PaymentTypes.EVENTS_NAMES.REFUND,
          paymentNetwork.version,
        );
      }

      const fees = this.extractFeeAndEvents(feeAddress, [...payments.events, ...refunds.events]);
      // TODO (PROT-1219): this is not ideal, since we're directly changing the request extension
      // once the fees feature and similar payment extensions are more well established, we should define
      // a better place to retrieve them from the request object them.
      paymentNetwork.values.feeBalance = fees;

      const balance: string = new bigNumber(payments.balance || 0)
        .sub(new bigNumber(refunds.balance || 0))
        .toString();

      const events: PaymentTypes.ERC20PaymentNetworkEvent[] = [
        ...payments.events,
        ...refunds.events,
      ].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      return {
        balance,
        events,
      };
    } catch (error) {
      let code: PaymentTypes.BALANCE_ERROR_CODE | undefined;
      if (error instanceof NetworkNotSupported) {
        code = PaymentTypes.BALANCE_ERROR_CODE.NETWORK_NOT_SUPPORTED;
      }
      if (error instanceof VersionNotSupported) {
        code = PaymentTypes.BALANCE_ERROR_CODE.VERSION_NOT_SUPPORTED;
      }
      return getBalanceErrorObject(error.message, code);
    }
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
  public async extractBalanceAndEvents(
    request: RequestLogicTypes.IRequest,
    salt: string,
    toAddress: string,
    eventName: PaymentTypes.EVENTS_NAMES,
    paymentNetworkVersion: string,
  ): Promise<PaymentTypes.IBalanceWithEvents> {
    const network = request.currency.network;

    if (!network) {
      throw new NetworkNotSupported(`Payment network not supported by ERC20 payment detection`);
    }

    const deploymentInformation = erc20FeeProxyArtifact.getDeploymentInformation(
      network,
      paymentNetworkVersion,
    );

    if (!deploymentInformation) {
      throw new VersionNotSupported(
        `Payment network version not supported: ${paymentNetworkVersion}`,
      );
    }

    const proxyContractAddress: string | undefined = deploymentInformation.address;
    const proxyCreationBlockNumber: number = deploymentInformation.creationBlockNumber;

    if (!proxyContractAddress) {
      throw new NetworkNotSupported(
        `Network not supported for this payment network: ${request.currency.network}`,
      );
    }

    const paymentReference = PaymentReferenceCalculator.calculate(
      request.requestId,
      salt,
      toAddress,
    );

    const infoRetriever = new ProxyInfoRetriever(
      paymentReference,
      proxyContractAddress,
      proxyCreationBlockNumber,
      request.currency.value,
      toAddress,
      eventName,
      network,
    );

    const events = await infoRetriever.getTransferEvents();

    const balance = events
      .reduce((acc, event) => acc.add(new bigNumber(event.amount)), new bigNumber(0))
      .toString();

    return {
      balance,
      events,
    };
  }

  /**
   * Extract the fee balance from a list of payment events
   *
   * @param feeAddress The fee address the extracted fees will be paid to
   * @param paymentEvents The payment events to extract fees from
   */
  public extractFeeAndEvents(feeAddress: string, paymentEvents: PaymentTypes.ERC20PaymentNetworkEvent[]): PaymentTypes.IBalanceWithEvents {
    if (!feeAddress) {
      return {
        balance: '0',
        events: [],
      };
    }

    return paymentEvents.reduce(
      (
        feeBalance: PaymentTypes.IBalanceWithEvents,
        event: PaymentTypes.IPaymentNetworkEvent<PaymentTypes.IERC20FeePaymentEventParameters>,
      ): PaymentTypes.IBalanceWithEvents => {

        // Skip if feeAddress or feeAmount are not set, or if feeAddress doesn't match the PN one
        if (
          !event.parameters?.feeAddress ||
          !event.parameters?.feeAmount ||
          event.parameters.feeAddress !== feeAddress
        ) {
          return feeBalance;
        }

        feeBalance = {
          balance: new bigNumber(feeBalance.balance).add(new bigNumber(event.parameters.feeAmount)).toString(),
          events: [... feeBalance.events, event],
        };

        return feeBalance;
      },
      { balance: '0', events: []},
    );
  }
}
