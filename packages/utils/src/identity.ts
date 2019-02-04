import { Identity as IdentityTypes } from '@requestnetwork/types';

/**
 * Module to manage Request Logic Identity
 */
export default {
  areEqual,
  normalizeIdentityValue,
};

/**
 * Checks if two identities are equals
 *
 * @param IIdentity id1 first identity
 * @param IIdentity id2 second identity
 * @returns boolean
 */
function areEqual(id1: IdentityTypes.IIdentity, id2: IdentityTypes.IIdentity): boolean {
  return (
    id1.type === id2.type && normalizeIdentityValue(id1.value) === normalizeIdentityValue(id2.value)
  );
}

/**
 * Normalizes identity values
 *
 * @param string value value to normalize
 * @returns string value normalized
 */
function normalizeIdentityValue(value: string): string {
  return value.toLowerCase();
}
