import { AdvancedLogicTypes, ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import * as Types from '../../../types';
import proxyInfoRetriever from './proxy-info-retriever';

const bigNumber: any = require('bn.js');

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

    if (!request.currency.network) {
      throw new Error(
        `Payment network not supported by ERC20 payment detection: ${paymentNetworkId}`,
      );
    }

    const proxyContractAddress = paymentNetwork.values.proxyContractAddress;
    const paymentAddress = paymentNetwork.values.paymentAddress;
    const refundAddress = paymentNetwork.values.refundAddress;

    let payments: Types.IBalanceWithEvents = { balance: '0', events: [] };
    if (paymentAddress) {
      payments = await this.extractBalanceAndEvents(
        paymentAddress,
        Types.EVENTS_NAMES.PAYMENT,
        request.requestId,
        request.currency.network,
        proxyContractAddress,
      );
    }

    let refunds: Types.IBalanceWithEvents = { balance: '0', events: [] };
    if (refundAddress) {
      refunds = await this.extractBalanceAndEvents(
        refundAddress,
        Types.EVENTS_NAMES.REFUND,
        request.requestId,
        request.currency.network,
        proxyContractAddress,
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
    toAddress: string,
    eventName: Types.EVENTS_NAMES,
    requestId: string,
    network: string,
    proxyContractAddress: string,
  ): Promise<Types.IBalanceWithEvents> {
    let tokenContractAddress = '';
    // TODO - Should not be hard coded
    if (network === 'private') {
      tokenContractAddress = '0x9FBDa871d559710256a2502A2517b794B482Db40';
    } else if (network === 'rinkeby') {
      tokenContractAddress = '0xfab46e002bbf0b4509813474841e0716e6730136';
    } else if (network === 'mainnet') {
      // TODO !
      tokenContractAddress = 'TODO';
    }

    return proxyInfoRetriever(
      eventName,
      tokenContractAddress,
      requestId,
      toAddress,
      network,
      proxyContractAddress,
    );
  }
}
