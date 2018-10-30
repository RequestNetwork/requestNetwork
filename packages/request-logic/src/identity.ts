import * as Types from './types';

/**
 * Function to manage Request Logic Identity
 */
export default {
  areEqual,
  normalizeIdentityValue,
};

/*
 * Function to check if two identities are equals
 *
 * @param IRequestLogicIdentity id1 one identity
 * @param IRequestLogicIdentity id1 another identity
 *
 * @returns boolean
 */
function areEqual(id1: Types.IRequestLogicIdentity, id2: Types.IRequestLogicIdentity): boolean {
  return (
    id1.type === id2.type && normalizeIdentityValue(id1.value) === normalizeIdentityValue(id2.value)
  );
}

/*
 * Function to normalize identity value
 *
 * @param string value value to normalize
 *
 * @returns string value normalized
 */
function normalizeIdentityValue(value: string): string {
  return value.toLowerCase();
}
