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
 * Implementation of the action cancel from request logic specification
 */
export default {
  applyActionToRequest,
  format,
};

/**
 * Function to format an action to cancel a Request
 *
 * @param ICancelParameters cancelParameters parameters to cancel a request
 * @param IIdentity signerIdentity Identity of the signer
 * @param ISignatureProvider signatureProvider Signature provider in charge of the signature
 *
 * @returns IAction  the action with the signature
 */
function format(
  cancelParameters: Types.ICancelParameters,
  signerIdentity: IdentityTypes.IIdentity,
  signatureProvider: SignatureProviderTypes.ISignatureProvider,
): Types.IAction {
  const unsignedAction: Types.IUnsignedAction = {
    name: Types.ACTION_NAME.CANCEL,
    parameters: cancelParameters,
    version: Version.currentVersion,
  };

  return Action.createAction(unsignedAction, signerIdentity, signatureProvider);
}

/**
 * Function to apply an Cancel action an a request
 *
 * @param Types.IAction action the action to apply
 *
 * @returns Types.IRequest the new request
 */
function applyActionToRequest(action: Types.IAction, request: Types.IRequest): Types.IRequest {
  if (!action.data.parameters.requestId) {
    throw new Error('requestId must be given');
  }

  const signer: IdentityTypes.IIdentity = Action.getSignerIdentityFromAction(action);
  const signerRole = Request.getRoleInRequest(signer, request);

  // avoid to mutate the request
  let requestCopied: Types.IRequest = Utils.deepCopy(request);
  requestCopied = Request.pushExtensionsData(requestCopied, action.data.parameters.extensionsData);
  requestCopied.events.push(generateEvent(action, signer));

  if (signerRole === Types.ROLE.PAYER) {
    if (request.state !== Types.STATE.CREATED) {
      throw new Error('A payer cancel need to be done on a request with the state created');
    }
    requestCopied.state = Types.STATE.CANCELED;
    return requestCopied;
  }

  if (signerRole === Types.ROLE.PAYEE) {
    if (request.state === Types.STATE.CANCELED) {
      throw new Error('Cannot cancel an already canceled request');
    }
    requestCopied.state = Types.STATE.CANCELED;
    return requestCopied;
  }

  throw new Error('Signer must be the payer or the payee');
}

/**
 * Private function to generate the event 'Cancel' from an action
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
    name: Types.ACTION_NAME.CANCEL,
    parameters: {
      extensionsDataLength: params.extensionsData ? params.extensionsData.length : 0,
    },
  };
  return event;
}
