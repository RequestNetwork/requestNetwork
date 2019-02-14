import {
  Identity as IdentityTypes,
  RequestLogic as Types,
  SignatureProvider as SignatureProviderTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import Action from '../action';
import Request from '../request';
import Version from '../version';

/**
 * Implementation of the action add extensions data from request logic specification
 */
export default {
  applyActionToRequest,
  format,
};

/**
 * Function to format an action to add extensions data to a Request
 *
 * @param IRequestLogicAddExtensionsDataParameters acceptParameters parameters to accept a request
 * @param IIdentity signerIdentity Identity of the signer
 * @param ISignatureProvider signatureProvider Signature provider in charge of the signature
 *
 * @returns IRequestLogicAction  the action with the signature
 */
function format(
  addExtensionsDataParameters: Types.IRequestLogicAddExtensionsDataParameters,
  signerIdentity: IdentityTypes.IIdentity,
  signatureProvider: SignatureProviderTypes.ISignatureProvider,
): Types.IRequestLogicAction {
  if (
    !addExtensionsDataParameters.extensionsData ||
    addExtensionsDataParameters.extensionsData.length === 0
  ) {
    throw new Error('extensionsData must be given');
  }

  const unsignedAction: Types.IRequestLogicUnsignedAction = {
    name: Types.REQUEST_LOGIC_ACTION_NAME.ADD_EXTENSIONS_DATA,
    parameters: addExtensionsDataParameters,
    version: Version.currentVersion,
  };

  return Action.createAction(unsignedAction, signerIdentity, signatureProvider);
}

/**
 * Function to apply an addition of extensions data to a request
 *
 * @param Types.IRequestLogicAction action  the action to apply
 *
 * @returns Types.IRequestLogicRequest the new request
 */
function applyActionToRequest(
  action: Types.IRequestLogicAction,
  request: Types.IRequestLogicRequest,
): Types.IRequestLogicRequest {
  if (!action.data.parameters.requestId) {
    throw new Error('requestId must be given');
  }
  if (
    !action.data.parameters.extensionsData ||
    action.data.parameters.extensionsData.length === 0
  ) {
    throw new Error('extensionsData must be given');
  }

  const signer: IdentityTypes.IIdentity = Action.getSignerIdentityFromAction(action);

  // avoid to mutate the request
  let requestCopied: Types.IRequestLogicRequest = Utils.deepCopy(request);
  requestCopied = Request.pushExtensionsData(requestCopied, action.data.parameters.extensionsData);
  requestCopied.events.push(generateEvent(action, signer));

  return requestCopied;
}

/**
 * Private function to generate the event 'Accept' from an action
 *
 * @param Types.IRequestLogicAction action the action that create the event
 * @param IdentityTypes.IIdentity actionSigner the signer of the action
 *
 * @returns Types.IRequestLogicEvent the event generated
 */
function generateEvent(
  action: Types.IRequestLogicAction,
  actionSigner: IdentityTypes.IIdentity,
): Types.IRequestLogicEvent {
  const params = action.data.parameters;

  const event: Types.IRequestLogicEvent = {
    actionSigner,
    name: Types.REQUEST_LOGIC_ACTION_NAME.ADD_EXTENSIONS_DATA,
    parameters: {
      extensionsDataLength: params.extensionsData ? params.extensionsData.length : 0,
    },
  };
  return event;
}
