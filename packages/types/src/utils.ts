import { PaymentTypes } from '.';

/**
 * Types a value like ExtensionType into a paymentNetworkID enum element if possible
 * @param value Example: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT
 */
export function isPaymentNetworkId(value: any): value is PaymentTypes.PAYMENT_NETWORK_ID {
  for (const pn in PaymentTypes.PAYMENT_NETWORK_ID) {
    if (PaymentTypes.PAYMENT_NETWORK_ID[pn] === value) {
      return true;
    }
  }

  return false;
}
