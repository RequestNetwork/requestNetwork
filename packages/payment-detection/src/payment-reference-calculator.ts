import { keccak256Hash } from '@requestnetwork/utils';

/**
 * Compute the payment reference
 *
 * @param requestId The requestId
 * @param salt The salt for the request
 * @param address Payment or refund address
 */

export function calculate(requestId: string, salt: string, address: string): string {
  if (!requestId || !salt || !address) {
    throw new Error('RequestId, salt and address are mandatory to calculate the payment reference');
  }
  // "The value is the last 8 bytes of a salted hash of the requestId: `last8Bytes(hash(requestId + salt + address))`"
  /* eslint-disable no-magic-numbers */
  return keccak256Hash((requestId + salt + address).toLowerCase()).slice(-16);
}
