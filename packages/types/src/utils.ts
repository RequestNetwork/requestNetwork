import { PaymentTypes } from '.';
import {
  ICreationParameters,
  IMasterRequestCreationParameters,
  ISubsequentRequestCreationParameters,
} from './extensions/pn-any-stream-reference-based-types';

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

/**
 * Types the creation parameters as IMasterRequestCreationParameters if it satisfies the condition
 * @param parameters to test
 */
export const isMasterRequestCreationParameters = (
  parameters: ICreationParameters,
): parameters is IMasterRequestCreationParameters => {
  return Object.keys(parameters).includes('expectedFlowRate');
};

/**
 * Types the creation parameters as ISubsequentRequestCreationParameters if it satisfies the condition
 * @param parameters to test
 */
export const isSubsequentRequestCreationParameters = (
  parameters: ICreationParameters,
): parameters is ISubsequentRequestCreationParameters => {
  return Object.keys(parameters).includes('masterRequestId');
};
