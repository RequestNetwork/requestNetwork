import { AdvancedLogicTypes, ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import * as Types from '../../../types';

import ERC20AddressBased from './address-based';

const PAYMENT_NETWORK_ERC20_ADDRESS_BASED = ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_ADDRESS_BASED;

// ERC20 DAI contract address
// TODO: currently hard-coded to DAI, should get from ERC20 token list
const erc20ContractAddress = '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359';

/**
 * Handle payment networks with mainnet BTC based address extension
 *
 * @class PaymentNetworkERC20AddressBased
 */
export default class PaymentNetworkERC20AddressBased implements Types.IPaymentNetwork {
  private erc20AddressBased: ERC20AddressBased;

  /**
   * @param advancedLogic Instance of Advanced Logic layer, to get the extension
   */
  public constructor(advancedLogic: AdvancedLogicTypes.IAdvancedLogic) {
    this.erc20AddressBased = new ERC20AddressBased(advancedLogic.extensions.addressBasedErc20);
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
   * @param the request to check
   * @returns the balance and the payment/refund events
   */
  public async getBalance(request: RequestLogicTypes.IRequest): Promise<Types.IBalanceWithEvents> {
    return this.erc20AddressBased.getBalance(
      request,
      PAYMENT_NETWORK_ERC20_ADDRESS_BASED,
      erc20ContractAddress,
    );
  }
}
