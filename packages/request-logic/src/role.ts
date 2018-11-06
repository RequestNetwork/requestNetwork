import * as RequestEnum from './enum';
import Identity from './identity';
import * as Types from './types';

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
 * @returns RequestEnum.REQUEST_LOGIC_ROLE the role of indentity in parameters
 */
function getRole(
  identity: Types.IRequestLogicIdentity,
  parameters: any,
): RequestEnum.REQUEST_LOGIC_ROLE {
  if (parameters.payee && Identity.areEqual(parameters.payee, identity)) {
    return RequestEnum.REQUEST_LOGIC_ROLE.PAYEE;
  }
  if (parameters.payer && Identity.areEqual(parameters.payer, identity)) {
    return RequestEnum.REQUEST_LOGIC_ROLE.PAYER;
  }

  return RequestEnum.REQUEST_LOGIC_ROLE.THIRD_PARTY;
}
