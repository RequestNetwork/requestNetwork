import Utils from '@requestnetwork/utils';

/**
 * Compute the payment reference
 *
 * @param requestId The requestId
 * @param salt The salt for the request
 * @param address Payment or refund address
 */
function calculate(requestId: string, salt: string, address: string): string {
  if (!requestId || !salt || !address) {
    throw new Error('RequestId, salt and address are mandatory to calculate the payment reference');
  }
  // "The value is the last 8 bytes of a salted hash of the requestId: `last8Bytes(hash(requestId + salt + address))`"
  // tslint:disable:no-magic-numbers
  return Utils.crypto.keccak256Hash((requestId + salt + address).toLowerCase()).slice(-16);
}

export default { calculate };
