import { ExtensionTypes } from '.';
import {
  ICreationParameters,
  IOriginalRequestCreationParameters,
  ISubsequentRequestCreationParameters,
} from './extensions/pn-any-stream-reference-based-types';

/*
 * Helper to properly type keys of an enum with string values.
 * See: https://www.petermorlion.com/iterating-a-typescript-enum/
 */
function enumKeys<O extends Record<string, unknown>, K extends keyof O = keyof O>(obj: O): K[] {
  return Object.keys(obj).filter((k) => Number.isNaN(+k)) as K[];
}

/**
 * Types a value like ExtensionType into a paymentNetworkID enum element if possible
 * @param value Example: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT
 */
export function isPaymentNetworkId(value: any): value is ExtensionTypes.PAYMENT_NETWORK_ID {
  for (const pn of enumKeys(ExtensionTypes.PAYMENT_NETWORK_ID)) {
    if (ExtensionTypes.PAYMENT_NETWORK_ID[pn] === value) {
      return true;
    }
  }

  return false;
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
