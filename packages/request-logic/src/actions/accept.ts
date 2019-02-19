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
 * Implementation of the action accept from request logic specification
 */
export default {
  applyActionToRequest,
  format,
};

/**
 * Function to format an action to accept a Request
 *
 * @param acceptParameters parameters to accept a request
 * @param IIdentity Identity of the signer
 * @param ISignatureProvider Signature provider in charge of the signature
 *
 * @returns IAction  the action with the signature
 */
function format(
  acceptParameters: Types.IAcceptParameters,
  signerIdentity: IdentityTypes.IIdentity,
  signatureProvider: SignatureProviderTypes.ISignatureProvider,
): Types.IAction {
  const unsignedAction: Types.IUnsignedAction = {
    name: Types.ACTION_NAME.ACCEPT,
    parameters: acceptParameters,
    version: Version.currentVersion,
  };

  return Action.createAction(unsignedAction, signerIdentity, signatureProvider);
}

/**
 * Function to apply an Accept action on a request
 *
 * @param Types.IAction action  the action to apply
 *
 * @returns Types.IRequest the new request
 */
function applyActionToRequest(action: Types.IAction, request: Types.IRequest): Types.IRequest {
  if (!action.data.parameters.requestId) {
    throw new Error('requestId must be given');
  }

  if (!request.payer) {
    throw new Error('the request must have a payer');
  }

  if (request.state !== Types.STATE.CREATED) {
    throw new Error('the request state must be created');
  }

  const signer: IdentityTypes.IIdentity = Action.getSignerIdentityFromAction(action);
  const signerRole = Request.getRoleInRequest(signer, request);

  if (signerRole === Types.ROLE.PAYER) {
    request.state = Types.STATE.ACCEPTED;
  } else {
    throw new Error('Signer must be the payer');
  }
  // avoid to mutate the request
  let requestCopied: Types.IRequest = Utils.deepCopy(request);
  requestCopied = Request.pushExtensionsData(requestCopied, action.data.parameters.extensionsData);
  requestCopied.events.push(generateEvent(action, signer));

  return requestCopied;
}

/**
 * Private function to generate the event 'Accept' from an action
 *
 * @param Types.IAction action the action that create the event
 * @param IdentityTypes.IIdentity actionSigner the signer of the action
 *
 * @returns Types.IEvent the event generated
 */
function generateEvent(action: Types.IAction, actionSigner: IdentityTypes.IIdentity): Types.IEvent {
  const params = action.data.parameters;

  const event: Types.IEvent = {
    actionSigner,
    name: Types.ACTION_NAME.ACCEPT,
    parameters: {
      extensionsDataLength: params.extensionsData ? params.extensionsData.length : 0,
    },
  };
  return event;
}
