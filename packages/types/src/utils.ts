import * as ExtensionTypes from './extension-types.js';
import {
  ICreationParameters,
  IOriginalRequestCreationParameters,
  ISubsequentRequestCreationParameters,
} from './extensions/pn-any-stream-reference-based-types';

/**
 * Types a value like ExtensionType into a paymentNetworkID enum element if possible
 * @param value Example: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT
 */
export function isPaymentNetworkId(value: any): value is ExtensionTypes.PAYMENT_NETWORK_ID {
  return Object.values(ExtensionTypes.PAYMENT_NETWORK_ID).includes(value);
}

/**
 * Types the creation parameters as IOriginalRequestCreationParameters if it satisfies the condition
 * @param parameters to test
 */
export const isOriginalRequestCreationParameters = (
  parameters: ICreationParameters,
): parameters is IOriginalRequestCreationParameters => {
  return Object.keys(parameters).includes('expectedFlowRate');
};

/**
 * Types the creation parameters as ISubsequentRequestCreationParameters if it satisfies the condition
 * @param parameters to test
 */
export const isSubsequentRequestCreationParameters = (
  parameters: ICreationParameters,
): parameters is ISubsequentRequestCreationParameters => {
  return Object.keys(parameters).includes('originalRequestId');
};
