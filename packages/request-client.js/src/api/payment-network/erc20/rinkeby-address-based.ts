import { AdvancedLogicTypes, ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import * as Types from '../../../types';

import ERC20AddressBased from './address-based';

const PAYMENT_NETWORK_RINKEBY_ERC20_ADDRESS_BASED =
  ExtensionTypes.ID.PAYMENT_NETWORK_RINKEBY_ERC20_ADDRESS_BASED;
const RINKEBY_NETWORK_ID = 4;

/**
 * Handle payment networks with rinkeby testnet ERC20 based address extension
 *
 * @class PaymentNetworkERC20AddressBased
 */
export default class PaymentNetworkErc20RinkebyAddressBased implements Types.IPaymentNetwork {
  private erc20AddressBased: ERC20AddressBased;

  /**
   * @param advancedLogic Instance of Advanced Logic layer, to get the extension
   */
  public constructor(advancedLogic: AdvancedLogicTypes.IAdvancedLogic) {
    this.erc20AddressBased = new ERC20AddressBased(
      advancedLogic.extensions.addressBasedRinkebyErc20,
    );
  }

  /**
   * Creates the extensions data for the creation of this extension
   *
   * @param paymentNetworkCreationParameters
   *
   * @returns the extensions data object
   */
  public createExtensionsDataForCreation(
    paymentNetworkCreationParameters: ExtensionTypes.PnAddressBased.ICreationParameters,
  ): ExtensionTypes.IAction {
    return this.erc20AddressBased.createExtensionsDataForCreation(paymentNetworkCreationParameters);
  }

  /**
   * Creates the extensions data to add payment address
   *
   * @param parameters
   *
   * @returns the extensions data object
   */
  public createExtensionsDataForAddPaymentInformation(
    parameters: ExtensionTypes.PnAddressBased.IAddPaymentAddressParameters,
  ): ExtensionTypes.IAction {
    return this.erc20AddressBased.createExtensionsDataForAddPaymentInformation(parameters);
  }

  /**
   * Creates the extensions data to add refund address
   *
   * @param parameters
   *
   * @returns the extensions data object
   */
  public createExtensionsDataForAddRefundInformation(
    parameters: ExtensionTypes.PnAddressBased.IAddRefundAddressParameters,
  ): ExtensionTypes.IAction {
    return this.erc20AddressBased.createExtensionsDataForAddRefundInformation(parameters);
  }

  /**
   * Gets the balance and the payment/refund events
   *
   * @param request The request to check
   * @returns the balance and the payment/refund events
   */
  public async getBalance(request: RequestLogicTypes.IRequest): Promise<Types.IBalanceWithEvents> {
    return this.erc20AddressBased.getBalance(
      request,
      PAYMENT_NETWORK_RINKEBY_ERC20_ADDRESS_BASED,
      RINKEBY_NETWORK_ID,
    );
  }
}
