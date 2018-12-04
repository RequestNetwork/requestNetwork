import {
  Identity as IdentityTypes,
  RequestLogic as Types,
  Signature as SignatureTypes,
} from '@requestnetwork/types';
import Action from '../action';
import Request from '../request';
import Version from '../version';

/**
 * Implementation of the action cancel from request logic specification
 */
export default {
  applyActionToRequest,
  format,
};

/**
 * Function to format an action to cancel a Request
 *
 * @param IRequestLogicCancelParameters cancelParameters parameters to cancel a request
 * @param ISignatureParameters signatureParams Signature parameters
 *
 * @returns IRequestLogicAction  the action with the signature
 */
function format(
  cancelParameters: Types.IRequestLogicCancelParameters,
  signatureParams: SignatureTypes.ISignatureParameters,
): Types.IRequestLogicAction {
  const unsignedAction: Types.IRequestLogicUnsignedAction = {
    name: Types.REQUEST_LOGIC_ACTION_NAME.CANCEL,
    parameters: cancelParameters,
    version: Version.currentVersion,
  };

  return Action.createAction(unsignedAction, signatureParams);
}

/**
 * Function to apply an Cancel action an a request
 *
 * @param Types.IRequestLogicAction action the action to apply
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

  const signer: IdentityTypes.IIdentity = Action.getSignerIdentityFromAction(action);
  const signerRole = Request.getRoleInRequest(signer, request);

  request = Request.pushExtensionsData(request, action.data.parameters.extensionsData);
  request.events.push(generateEvent(action, signer));

  if (signerRole === Types.REQUEST_LOGIC_ROLE.PAYER) {
    if (request.state !== Types.REQUEST_LOGIC_STATE.CREATED) {
      throw new Error('A payer cancel need to be done on a request with the state created');
    }
    request.state = Types.REQUEST_LOGIC_STATE.CANCELLED;
    return request;
  }

  if (signerRole === Types.REQUEST_LOGIC_ROLE.PAYEE) {
    if (request.state === Types.REQUEST_LOGIC_STATE.CANCELLED) {
      throw new Error('Cannot cancel an already cancelled request');
    }
    request.state = Types.REQUEST_LOGIC_STATE.CANCELLED;
    return request;
  }

  throw new Error('Signer must be the payer or the payee');
}

/**
 * Private function to generate the event 'Cancel' from an action
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
    name: Types.REQUEST_LOGIC_ACTION_NAME.CANCEL,
    parameters: {
      extensionsDataLength: params.extensionsData ? params.extensionsData.length : 0,
    },
  };
  return event;
}
