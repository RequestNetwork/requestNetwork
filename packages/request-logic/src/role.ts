import { RequestLogic as Types } from '@requestnetwork/types';
import Identity from './identity';

/**
 * Function to manage Request Logic Role
 */
export default {
  getRole,
};

/*
 * Function to get the role of an identity in an object
 *
 * @param any parameters the object to check
 * @param IRequestLogicIdentity identity the identity to check
 *
 * @returns Types.REQUEST_LOGIC_ROLE the role of indentity in parameters
 */
function getRole(identity: Types.IRequestLogicIdentity, parameters: any): Types.REQUEST_LOGIC_ROLE {
  if (parameters.payee && Identity.areEqual(parameters.payee, identity)) {
    return Types.REQUEST_LOGIC_ROLE.PAYEE;
  }
  if (parameters.payer && Identity.areEqual(parameters.payer, identity)) {
    return Types.REQUEST_LOGIC_ROLE.PAYER;
  }

  return Types.REQUEST_LOGIC_ROLE.THIRD_PARTY;
}
