import {
  Identity as IdentityTypes,
  RequestLogic as Types,
  SignatureProvider as SignatureProviderTypes,
} from '@requestnetwork/types';
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
 * @param acceptParameters IRequestLogicAcceptParameters parameters to accept a request
 * @param IIdentity signerIdentity Identity of the signer
 * @param ISignatureProvider signatureProvider Signature provider in charge of the signature
 *
 * @returns IRequestLogicAction  the action with the signature
 */
function format(
  acceptParameters: Types.IRequestLogicAcceptParameters,
  signerIdentity: IdentityTypes.IIdentity,
  signatureProvider: SignatureProviderTypes.ISignatureProvider,
): Types.IRequestLogicAction {
  const unsignedAction: Types.IRequestLogicUnsignedAction = {
    name: Types.REQUEST_LOGIC_ACTION_NAME.ACCEPT,
    parameters: acceptParameters,
    version: Version.currentVersion,
  };

  return Action.createAction(unsignedAction, signerIdentity, signatureProvider);
}

/**
 * Function to apply an Accept action on a request
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

  if (!request.payer) {
    throw new Error('the request must have a payer');
  }

  if (request.state !== Types.REQUEST_LOGIC_STATE.CREATED) {
    throw new Error('the request state must be created');
  }

  const signer: IdentityTypes.IIdentity = Action.getSignerIdentityFromAction(action);
  const signerRole = Request.getRoleInRequest(signer, request);

  if (signerRole === Types.REQUEST_LOGIC_ROLE.PAYER) {
    request.state = Types.REQUEST_LOGIC_STATE.ACCEPTED;
  } else {
    throw new Error('Signer must be the payer');
  }

  request = Request.pushExtensionsData(request, action.data.parameters.extensionsData);
  request.events.push(generateEvent(action, signer));

  return request;
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
    name: Types.REQUEST_LOGIC_ACTION_NAME.ACCEPT,
    parameters: {
      extensionsDataLength: params.extensionsData ? params.extensionsData.length : 0,
    },
  };
  return event;
}
