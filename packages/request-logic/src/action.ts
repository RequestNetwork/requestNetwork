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
 * @param IUnsignedAction unsignedAction The unsigned action to sign
 * @param IIdentity signerIdentity Identity of the signer
 * @param ISignatureProvider signatureProvider Signature provider in charge of the signature
 *
 * @returns IAction the action with the signature
 */
function createAction(
  unsignedAction: Types.IUnsignedAction,
  signerIdentity: IdentityTypes.IIdentity,
  signatureProvider: SignatureProviderTypes.ISignatureProvider,
): Promise<Types.IAction> {
  return signatureProvider.sign(unsignedAction, signerIdentity);
}

/**
 * Function to get the signer identity from a action
 *
 * @param ISignatureParameters action action to check
 *
 * @returns RequestEnum.ROLE the role of the signer (payee, payer or third party)
 */
function getSignerIdentityFromAction(action: Types.IAction): IdentityTypes.IIdentity {
  return Utils.signature.recover(action);
}

/**
 * Function to get the role of an identity in an action
 *
 * @param IIdentity identity the identity to check
 * @param IAction action the action
 *
 * @returns RequestEnum.ROLE the role of the signer
 */
function getRoleInAction(identity: IdentityTypes.IIdentity, action: Types.IAction): Types.ROLE {
  return getRoleInUnsignedAction(identity, action.data);
}

/**
 * Function to get the role of an identity in an unsigned action
 *
 * @param IIdentity identity the identity to check
 * @param IUnsignedAction unsignedAction the unsigned action
 *
 * @returns RequestEnum.ROLE the role of the signer
 */
function getRoleInUnsignedAction(
  identity: IdentityTypes.IIdentity,
  unsignedAction: Types.IUnsignedAction,
): Types.ROLE {
  return Role.getRole(identity, unsignedAction.parameters);
}

/**
 * Function to create a requestId from the creation action or get the requestId parameter otherwise
 *
 * @param IAction creation action of the request
 *
 * @returns RequestIdType the requestId
 */
function getRequestId(action: Types.IAction): Types.RequestId {
  // if a creation we need to compute the hash
  if (action.data.name === Types.ACTION_NAME.CREATE) {
    return getActionHash(action);
  }
  return action.data.parameters.requestId;
}

/**
 * Function to check if an action is supported
 *
 * @param IAction action action to check
 *
 * @returns boolean true, if action is supported false otherwise
 */
function isActionVersionSupported(action: Types.IAction): boolean {
  return Version.isSupported(action.data.version);
}

/**
 * Function to get the version of an action
 *
 * @param IAction action action to check
 *
 * @returns string version
 */
function getVersionFromAction(action: Types.IAction): string {
  return action.data.version;
}

/**
 * Function to get the hash of an action
 *
 * @param IAction action action to get the hash
 *
 * @returns string the hash
 */
function getActionHash(action: Types.IAction): string {
  return Utils.crypto.normalizeKeccak256Hash(action.data);
}
