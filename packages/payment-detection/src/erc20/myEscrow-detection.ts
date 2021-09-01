// Import the MYEscrow artifact.
import { myEscrowArtifact } from '@requestnetwork/smart-contracts';
// Import Request Network Types.
import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import getBalanceErrorObject from '../balance-error';
import PaymentReferenceCalculator from '../payment-reference-calculator';
// TODO: Escrow-info-retriever
import ProxyInfoRetriever from './proxy-info-retriever';

import { BigNumber } from 'ethers';
// TODO: What is thegraph?
import { networkSupportsTheGraph } from '../thegraph';
import TheGraphInfoRetriever from './thegraph-info-retriever';

/* eslint-disable max-classes-per-file */
/** Exception when network not supported */
class NetworkNotSupported extends Error {}
/** Exception when version not supported */
class VersionNotSupported extends Error {}

/**
 * Gets the payment proxy deployment information
 */
export type DeploymentInformationGetter = (
  networkName: string,
  artifactsVersion?: string,
) => {
  address: string;
  creationBlockNumber: number;
};

/**
 * Handle payment networks with MyEscrow contract extension
 */
export default class PaymentNetworkMyEscrowContract<
  ExtensionType extends ExtensionTypes.PnFeeReferenceBased.IFeeReferenceBased = ExtensionTypes.PnFeeReferenceBased.IFeeReferenceBased
> implements PaymentTypes.IPaymentNetwork {
  protected _paymentNetworkId: ExtensionTypes.ID;
  protected _extension: ExtensionType;

  /**
   * @param extension The advanced logic payment network extensions
   */
  public constructor({ advancedLogic }: { advancedLogic: AdvancedLogicTypes.IAdvancedLogic }) {
    this._paymentNetworkId = ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_TIME_LOCKED_ESCROW;
    //  TODO:
    this._extension = advancedLogic.extensions.feeProxyContractErc20;
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

    return this._extension.createCreationAction({
      feeAddress: paymentNetworkCreationParameters.feeAddress,
      feeAmount: paymentNetworkCreationParameters.feeAmount,
      paymentAddress: paymentNetworkCreationParameters.paymentAddress,
      // TODO: Refund?
      //refundAddress: paymentNetworkCreationParameters.refundAddress,
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
    return this._extension.createAddPaymentAddressAction({
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
    return this._extension.createAddRefundAddressAction({
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
    return this._extension.createAddFeeAction({
      feeAddress: parameters.feeAddress,
      feeAmount: parameters.feeAmount,
    });
  }

  /**
   * Gets the balance and the payment/refund events
   *
   * @param request the request to check
   * @returns A promise resulting to the balance and the payment/refund events
   */
  public async getBalance(
    request: RequestLogicTypes.IRequest,
  ): Promise<PaymentTypes.IBalanceWithEvents> {
    const paymentNetwork = request.extensions[this._paymentNetworkId];

    if (!paymentNetwork) {
      return getBalanceErrorObject(
        `The request does not have the extension : ${this._paymentNetworkId}`,
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
          paymentNetwork,
        );
      }

      let refunds: PaymentTypes.IBalanceWithEvents = { balance: '0', events: [] };
      if (refundAddress) {
        refunds = await this.extractBalanceAndEvents(
          request,
          salt,
          refundAddress,
          PaymentTypes.EVENTS_NAMES.REFUND,
          paymentNetwork,
        );
      }

      const fees = this.extractFeeAndEvents(feeAddress, [...payments.events, ...refunds.events]);
      // TODO (PROT-1219): this is not ideal, since we're directly changing the request extension
      // once the fees feature and similar payment extensions are more well established, we should define
      // a better place to retrieve them from the request object them.
      paymentNetwork.values.feeBalance = fees;

      const balance: string = BigNumber.from(payments.balance || 0)
        .sub(BigNumber.from(refunds.balance || 0))
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
    const network = request.currency.network;

    if (!network) {
      throw new NetworkNotSupported(`Payment network not supported by ERC20 payment detection`);
    }

    const deploymentInformation = myEscrowArtifact.getDeploymentInformation(
      network,
      paymentNetwork.version,
    );

    if (!deploymentInformation) {
      throw new VersionNotSupported(
        `Payment network version not supported: ${paymentNetwork.version}`,
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
    const events = await infoRetriever.getTransferEvents();

    const balance = events
      .reduce((acc, event) => acc.add(BigNumber.from(event.amount)), BigNumber.from(0))
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
  public extractFeeAndEvents(
    feeAddress: string,
    paymentEvents: PaymentTypes.ERC20PaymentNetworkEvent[],
  ): PaymentTypes.IBalanceWithEvents {
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
          balance: BigNumber.from(feeBalance.balance)
            .add(BigNumber.from(event.parameters.feeAmount))
            .toString(),
          events: [...feeBalance.events, event],
        };

        return feeBalance;
      },
      { balance: '0', events: [] },
    );
  }

  /**
   * Get the detected payment network ID
   */
  get paymentNetworkId(): ExtensionTypes.ID {
    return this._paymentNetworkId;
  }
}
