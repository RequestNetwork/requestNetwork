import { AdvancedLogicTypes, ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import * as Types from '../../../types';
import PaymentReferenceCalculator from '../payment-reference-calculator';
import ProxyInfoRetriever from './proxy-info-retriever';

const bigNumber: any = require('bn.js');

interface IProxyContractByVersionByNetwork {
  [version: string]: {
    [network: string]: string;
  };
}

const PROXY_CONTRACT_ADDRESS_BY_VERSION_BY_NETWORK: IProxyContractByVersionByNetwork = {
  ['0.1.0']: {
    mainnet: '0x5f821c20947ff9be22e823edc5b3c709b33121b3',
    private: '0x2c2b9c9a4a25e24b174f26114e8926a9f2128fe4',
    rinkeby: '0x162edb802fae75b9ee4288345735008ba51a4ec9',
  },
};

/**
 * Handle payment networks with ERC20 proxy contract extension
 */
export default class PaymentNetworkERC20ProxyContract implements Types.IPaymentNetwork {
  private extension: ExtensionTypes.PnReferenceBased.IReferenceBased;
  /**
   * @param extension The advanced logic payment network extensions
   */
  public constructor({ advancedLogic }: { advancedLogic: AdvancedLogicTypes.IAdvancedLogic }) {
    this.extension = advancedLogic.extensions.proxyContractErc20;
  }

  /**
   * Creates the extensions data for the creation of this extension.
   * Will set a salt if none is already given
   *
   * @param paymentNetworkCreationParameters Parameters to create the extension
   * @returns The extensionData object
   */
  public createExtensionsDataForCreation(
    paymentNetworkCreationParameters: Types.IReferenceBasedCreationParameters,
  ): ExtensionTypes.IAction {
    // If no salt is given, generate one
    const salt = paymentNetworkCreationParameters.salt || Utils.crypto.generate8randomBytes();

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
   * @param paymentNetworkId payment network id
   * @param tokenContractAddress the address of the token contract
   * @returns the balance and the payment/refund events
   */
  public async getBalance(request: RequestLogicTypes.IRequest): Promise<Types.IBalanceWithEvents> {
    const paymentNetworkId = ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT;
    const paymentNetwork = request.extensions[paymentNetworkId];

    if (!paymentNetwork) {
      throw new Error(`The request do not have the extension : ${paymentNetworkId}`);
    }

    const paymentAddress = paymentNetwork.values.paymentAddress;
    const refundAddress = paymentNetwork.values.refundAddress;
    const salt = paymentNetwork.values.salt;

    let payments: Types.IBalanceWithEvents = { balance: '0', events: [] };
    if (paymentAddress) {
      payments = await this.extractBalanceAndEvents(
        request,
        salt,
        paymentAddress,
        Types.EVENTS_NAMES.PAYMENT,
        paymentNetwork.version,
      );
    }

    let refunds: Types.IBalanceWithEvents = { balance: '0', events: [] };
    if (refundAddress) {
      refunds = await this.extractBalanceAndEvents(
        request,
        salt,
        refundAddress,
        Types.EVENTS_NAMES.REFUND,
        paymentNetwork.version,
      );
    }

    const balance: string = new bigNumber(payments.balance || 0)
      .sub(new bigNumber(refunds.balance || 0))
      .toString();

    const events: Types.ERC20PaymentNetworkEvent[] = [...payments.events, ...refunds.events].sort(
      (a, b) => (a.timestamp || 0) - (b.timestamp || 0),
    );

    return {
      balance,
      events,
    };
  }

  /**
   * Extracts the balance and events of an address
   *
   * @private
   * @param address Address to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The id of network we want to check
   * @param tokenContractAddress the address of the token contract
   * @returns The balance
   */
  private async extractBalanceAndEvents(
    request: RequestLogicTypes.IRequest,
    salt: string,
    toAddress: string,
    eventName: Types.EVENTS_NAMES,
    paymentNetworkVersion: string,
  ): Promise<Types.IBalanceWithEvents> {
    const network = request.currency.network;

    if (!network) {
      throw new Error(`Payment network not supported by ERC20 payment detection`);
    }

    if (!PROXY_CONTRACT_ADDRESS_BY_VERSION_BY_NETWORK[paymentNetworkVersion]) {
      throw new Error(`Payment network version not supported: ${paymentNetworkVersion}`);
    }

    const proxyContractAddress: string | undefined =
      PROXY_CONTRACT_ADDRESS_BY_VERSION_BY_NETWORK[paymentNetworkVersion][network];

    if (!proxyContractAddress) {
      throw new Error(
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
}
