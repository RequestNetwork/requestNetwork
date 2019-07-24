import {
  IdentityTypes,
  RequestLogicTypes,
  SignatureProviderTypes,
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
  acceptParameters: RequestLogicTypes.IAcceptParameters,
  signerIdentity: IdentityTypes.IIdentity,
  signatureProvider: SignatureProviderTypes.ISignatureProvider,
): Promise<RequestLogicTypes.IAction> {
  const unsignedAction: RequestLogicTypes.IUnsignedAction = {
    name: RequestLogicTypes.ACTION_NAME.ACCEPT,
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
function applyActionToRequest(
  action: RequestLogicTypes.IAction,
  timestamp: number,
  request: RequestLogicTypes.IRequest,
): RequestLogicTypes.IRequest {
  if (!action.data.parameters.requestId) {
    throw new Error('requestId must be given');
  }

  if (!request.payer) {
    throw new Error('the request must have a payer');
  }

  if (request.state !== RequestLogicTypes.STATE.CREATED) {
    throw new Error('the request state must be created');
  }

  const signer: IdentityTypes.IIdentity = Action.getSignerIdentityFromAction(action);
  const signerRole = Request.getRoleInRequest(signer, request);

  if (signerRole === RequestLogicTypes.ROLE.PAYER) {
    request.state = RequestLogicTypes.STATE.ACCEPTED;
  } else {
    throw new Error('Signer must be the payer');
  }
  // avoid to mutate the request
  let requestCopied: RequestLogicTypes.IRequest = Utils.deepCopy(request);
  requestCopied = Request.pushExtensionsData(requestCopied, action.data.parameters.extensionsData);
  requestCopied.events.push(generateEvent(action, timestamp, signer));

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
function generateEvent(
  action: RequestLogicTypes.IAction,
  timestamp: number,
  actionSigner: IdentityTypes.IIdentity,
): RequestLogicTypes.IEvent {
  const params = action.data.parameters;

  const event: RequestLogicTypes.IEvent = {
    actionSigner,
    name: RequestLogicTypes.ACTION_NAME.ACCEPT,
    parameters: {
      extensionsDataLength: params.extensionsData ? params.extensionsData.length : 0,
    },
    timestamp,
  };
  return event;
}
