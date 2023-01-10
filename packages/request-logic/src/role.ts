import { IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';
import { areEqualIdentities } from '@requestnetwork/utils';

/**
 * Function to manage Request Logic Role
 */
export default {
  getRole,
};

/**
 * Function to get the role of an identity in an object
 *
 * @param any parameters the object to check
 * @param IIdentity identity the identity to check
 *
 * @returns Types.ROLE the role of identity in parameters
 */
function getRole(identity: IdentityTypes.IIdentity, parameters: any): RequestLogicTypes.ROLE {
  if (parameters.payee && areEqualIdentities(parameters.payee, identity)) {
    return RequestLogicTypes.ROLE.PAYEE;
  }
  if (parameters.payer && areEqualIdentities(parameters.payer, identity)) {
    return RequestLogicTypes.ROLE.PAYER;
  }

  return RequestLogicTypes.ROLE.THIRD_PARTY;
}
