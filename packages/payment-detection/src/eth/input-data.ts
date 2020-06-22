import * as SmartContracts from '@requestnetwork/smart-contracts';
import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import getBalanceErrorObject from '../balance-error';
import PaymentReferenceCalculator from '../payment-reference-calculator';

import EthInputDataInfoRetriever from './info-retriever';
import EthProxyInputDataInfoRetriever from './proxy-info-retriever';

const bigNumber: any = require('bn.js');
const supportedNetworks = ['mainnet', 'rinkeby', 'private'];

// interface of the object indexing the proxy contract version
interface IProxyContractVersion {
  [version: string]: string;
}

// the versions 0.1.0 and 0.2.0 have the same contracts
const PROXY_CONTRACT_ADDRESS_MAP: IProxyContractVersion = {
  ['0.1.0']: '0.1.0',
  ['0.2.0']: '0.1.0',
};

/**
 * Handle payment networks with ETH input data extension
 */
export default class PaymentNetworkETHInputData
  implements PaymentTypes.IPaymentNetwork<PaymentTypes.IETHPaymentEventParameters> {
  private extension: ExtensionTypes.PnReferenceBased.IReferenceBased;
  /**
   * @param extension The advanced logic payment network extensions
   */
  public constructor({ advancedLogic }: { advancedLogic: AdvancedLogicTypes.IAdvancedLogic }) {
    this.extension = advancedLogic.extensions.ethereumInputData;
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
   * Gets the balance and the payment/refund events
   *
   * @param request the request to check
   * @returns the balance and the payment/refund events
   */
  public async getBalance(
    request: RequestLogicTypes.IRequest,
  ): Promise<PaymentTypes.ETHBalanceWithEvents> {
    if (!request.currency.network) {
      request.currency.network = 'mainnet';
    }
    if (!supportedNetworks.includes(request.currency.network)) {
      return getBalanceErrorObject(
        `Payment network ${
          request.currency.network
        } not supported by ETH payment detection. Supported networks: ${supportedNetworks.join(
          ', ',
        )}`,
        PaymentTypes.BALANCE_ERROR_CODE.NETWORK_NOT_SUPPORTED,
      );
    }
    const paymentNetwork = request.extensions[ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA];

    if (!paymentNetwork) {
      return getBalanceErrorObject(
        `The request does not have the extension: ${
          ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA
        }`,
        PaymentTypes.BALANCE_ERROR_CODE.WRONG_EXTENSION,
      );
    }

    try {
      const paymentAddress = paymentNetwork.values.paymentAddress;
      const refundAddress = paymentNetwork.values.refundAddress;

      let payments: PaymentTypes.ETHBalanceWithEvents = { balance: '0', events: [] };
      if (paymentAddress) {
        const paymentReferencePayment = PaymentReferenceCalculator.calculate(
          request.requestId,
          paymentNetwork.values.salt,
          paymentAddress,
        );
        payments = await this.extractBalanceAndEvents(
          paymentAddress,
          PaymentTypes.EVENTS_NAMES.PAYMENT,
          request.currency.network,
          paymentReferencePayment,
          paymentNetwork.version,
        );
      }

      let refunds: PaymentTypes.ETHBalanceWithEvents = { balance: '0', events: [] };
      if (refundAddress) {
        const paymentReferenceRefund = PaymentReferenceCalculator.calculate(
          request.requestId,
          paymentNetwork.values.salt,
          refundAddress,
        );
        refunds = await this.extractBalanceAndEvents(
          refundAddress,
          PaymentTypes.EVENTS_NAMES.REFUND,
          request.currency.network,
          paymentReferenceRefund,
          paymentNetwork.version,
        );
      }

      const balance: string = new bigNumber(payments.balance || 0)
        .sub(new bigNumber(refunds.balance || 0))
        .toString();

      const events: PaymentTypes.ETHPaymentNetworkEvent[] = [
        ...payments.events,
        ...refunds.events,
      ].sort(
        (a: PaymentTypes.ETHPaymentNetworkEvent, b: PaymentTypes.ETHPaymentNetworkEvent) =>
          (a.timestamp || 0) - (b.timestamp || 0),
      );

      return {
        balance,
        events,
      };
    } catch (error) {
      return getBalanceErrorObject(error.message);
    }
  }

  /**
   * Extracts the balance and events of an address
   *
   * @private
   * @param address Address to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The id of network we want to check
   * @param paymentReference The reference to identify the payment
   * @param paymentNetworkVersion the version of the payment network
   * @returns The balance
   */
  private async extractBalanceAndEvents(
    address: string,
    eventName: PaymentTypes.EVENTS_NAMES,
    network: string,
    paymentReference: string,
    paymentNetworkVersion: string,
  ): Promise<PaymentTypes.ETHBalanceWithEvents> {
    const contractVersion = PROXY_CONTRACT_ADDRESS_MAP[paymentNetworkVersion];
    const proxyContractAddress = SmartContracts.ethereumProxyArtifact.getAddress(
      network,
      contractVersion,
    );
    const proxyCreationBlockNumber = SmartContracts.ethereumProxyArtifact.getCreationBlockNumber(
      network,
      contractVersion,
    );

    const infoRetriever = new EthInputDataInfoRetriever(
      address,
      eventName,
      network,
      paymentReference,
    );

    const eventsInputData = await infoRetriever.getTransferEvents();

    const proxyInfoRetriever = new EthProxyInputDataInfoRetriever(
      paymentReference,
      proxyContractAddress,
      proxyCreationBlockNumber,
      address,
      eventName,
      network,
    );

    const eventsFromProxy = await proxyInfoRetriever.getTransferEvents();

    const events = eventsInputData
      .concat(eventsFromProxy)
      .sort(
        (a: PaymentTypes.ETHPaymentNetworkEvent, b: PaymentTypes.ETHPaymentNetworkEvent) =>
          (a.timestamp || 0) - (b.timestamp || 0),
      );
    const balance = events
      .reduce((acc, event) => acc.add(new bigNumber(event.amount)), new bigNumber(0))
      .toString();

    return {
      balance,
      events,
    };
  }
}
