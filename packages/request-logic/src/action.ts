import {
  Identity as IdentityTypes,
  RequestLogic as Types,
  SignatureProvider as SignatureProviderTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import Role from './role';
import Version from './version';

/**
 * Function to manage Request logic action (object that will be interpreted to create or modify a request)
 */
export default {
  createAction,
  getRequestId,
  getRoleInAction,
  getRoleInUnsignedAction,
  getSignerIdentityFromAction,
  getVersionFromAction,
  isActionVersionSupported,
};

/**
 * Creates an action from an unsigned action data and a signature parameters object
 *
 * @notice it will sign the hash (keccak256) of the action data
 *
 * @param IRequestLogicUnsignedAction unsignedAction The unsigned action to sign
 * @param IIdentity signerIdentity Identity of the signer
 * @param ISignatureProvider signatureProvider Signature provider in charge of the signature
 *
 * @returns IRequestLogicAction the action with the signature
 */
function createAction(
  unsignedAction: Types.IRequestLogicUnsignedAction,
  signerIdentity: IdentityTypes.IIdentity,
  signatureProvider: SignatureProviderTypes.ISignatureProvider,
): Types.IRequestLogicAction {
  return signatureProvider.sign(unsignedAction, signerIdentity);
}

/**
 * Function to get the signer identity from a action
 *
 * @param ISignatureParameters action action to check
 *
 * @returns RequestEnum.REQUEST_LOGIC_ROLE the role of the signer (payee, payer or third party)
 */
function getSignerIdentityFromAction(action: Types.IRequestLogicAction): IdentityTypes.IIdentity {
  return Utils.signature.recover(action);
}

/**
 * Function to get the role of an identity in an action
 *
 * @param IIdentity identity the identity to check
 * @param IRequestLogicAction action the action
 *
 * @returns RequestEnum.REQUEST_LOGIC_ROLE the role of the signer
 */
function getRoleInAction(
  identity: IdentityTypes.IIdentity,
  action: Types.IRequestLogicAction,
): Types.REQUEST_LOGIC_ROLE {
  return getRoleInUnsignedAction(identity, action.data);
}

/**
 * Function to get the role of an identity in an unsigned action
 *
 * @param IIdentity identity the identity to check
 * @param IRequestLogicUnsignedAction unsignedAction the unsigned action
 *
 * @returns RequestEnum.REQUEST_LOGIC_ROLE the role of the signer
 */
function getRoleInUnsignedAction(
  identity: IdentityTypes.IIdentity,
  unsignedAction: Types.IRequestLogicUnsignedAction,
): Types.REQUEST_LOGIC_ROLE {
  return Role.getRole(identity, unsignedAction.parameters);
}

/**
 * Function to create a requestId from the creation action or get the requestId parameter otherwise
 *
 * @param IRequestLogicAction creation action of the request
 *
 * @returns RequestIdType the requestId
 */
function getRequestId(action: Types.IRequestLogicAction): Types.RequestLogicRequestId {
  // if a creation we need to compute the hash
  if (action.data.name === Types.REQUEST_LOGIC_ACTION_NAME.CREATE) {
    return getActionHash(action);
  }
  return action.data.parameters.requestId;
}

/**
 * Function to check if an action is supported
 *
 * @param IRequestLogicAction action action to check
 *
 * @returns boolean true, if action is supported false otherwise
 */
function isActionVersionSupported(action: Types.IRequestLogicAction): boolean {
  return Version.isSupported(action.data.version);
}

/**
 * Function to get the version of an action
 *
 * @param IRequestLogicAction action action to check
 *
 * @returns string version
 */
function getVersionFromAction(action: Types.IRequestLogicAction): string {
  return action.data.version;
}

/**
 * Function to get the hash of an action
 *
 * @param IRequestLogicAction action action to get the hash
 *
 * @returns string the hash
 */
function getActionHash(action: Types.IRequestLogicAction): string {
  return Utils.crypto.normalizeKeccak256Hash(action.data);
}
