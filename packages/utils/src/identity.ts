import { IdentityTypes } from '@requestnetwork/types';

const supportedIdentities: IdentityTypes.TYPE[] = [
  IdentityTypes.TYPE.ETHEREUM_ADDRESS,
  IdentityTypes.TYPE.ETHEREUM_SMART_CONTRACT,
  IdentityTypes.TYPE.POSEIDON_ADDRESS,
];

/**
 * Module to manage Request Logic Identity
 */
export { areEqualIdentities, identityHasError, normalizeIdentityValue, supportedIdentities };

/**
 * Checks if two identities are equals
 *
 * @param IIdentity id1 first identity
 * @param IIdentity id2 second identity
 * @returns boolean
 */
function areEqualIdentities(id1?: IdentityTypes.IIdentity, id2?: IdentityTypes.IIdentity): boolean {
  return (
    !!id1 &&
    !!id2 &&
    id1.type === id2.type &&
    normalizeIdentityValue(id1.value) === normalizeIdentityValue(id2.value)
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

/**
 * Checks if the identity has an error
 *
 * @param id identity to check
 * @returns the error or null if valid
 */
function identityHasError(id: IdentityTypes.IIdentity): string | null {
  if (!supportedIdentities.includes(id.type)) {
    return 'identity type not supported';
  }
  // TODO: check addresses eth & poseidon  
  // if (id.value.match(/^0x[a-fA-F0-9]{40}$/) === null) {
  //   return 'identity value must be an ethereum address';
  // }
  return null;
}
