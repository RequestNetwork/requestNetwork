import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import AddressBasedPaymentNetwork from '../address-based';

const CURRENT_VERSION = '0.1.0';

/**
 * Implementation of the payment network to pay in ERC20 tokens based on an Ethereum address
 * With this extension one request can have two dedicated Ethereum addresses (one for payment and one for refund)
 * Every ERC20 ethereum transaction, using the request currency ERC20, that reaches these addresses will be interpreted as payment or refund.
 * Important: the addresses must be exclusive to the request
 */
export default class Erc20AddressBasedPaymentNetwork extends AddressBasedPaymentNetwork {
  public constructor() {
    super(
      ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_ADDRESS_BASED,
      CURRENT_VERSION,
      RequestLogicTypes.CURRENCY.ERC20,
    );
  }
}
