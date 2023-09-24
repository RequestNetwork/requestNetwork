import { IdentityTypes, RequestLogicTypes, SignatureProviderTypes } from '@requestnetwork/types';
import { deepCopy } from '@requestnetwork/utils';

import Action from '../action';
import Request from '../request';
import Version from '../version';

/**
 * Implementation of the action add stakeholder from request logic specification
 */
export default {
  applyActionToRequest,
  format,
};

/**
 * Function to format an action to add stakeholders to a Request
 *
 * @param IAddStakeholdersParameters addStakeholdersParameters parameters to add stakeholders to a request
 * @param IIdentity signerIdentity Identity of the signer
 * @param ISignatureProvider signatureProvider Signature provider in charge of the signature
 *
 * @returns IAction  the action with the signature
 */
function format(
  addStakeholderParameters: RequestLogicTypes.IAddStakeholdersParameters,
  signerIdentity: IdentityTypes.IIdentity,
  signatureProvider: SignatureProviderTypes.ISignatureProvider,
): Promise<RequestLogicTypes.IAction> {
  const unsignedAction: RequestLogicTypes.IUnsignedAction = {
    name: RequestLogicTypes.ACTION_NAME.ADD_STAKEHOLDERS,
    parameters: addStakeholderParameters,
    version: Version.currentVersion,
  };

  return Action.createAction(unsignedAction, signerIdentity, signatureProvider);
}

/**
 * Function to apply an addStakeholder action to a request
 *
 * @param Types.IAction action the action to apply
 *
 * @returns Types.IRequest the new request
 */
async function applyActionToRequest(
  action: RequestLogicTypes.IAction,
  timestamp: number,
  request: RequestLogicTypes.IRequest,
): Promise<RequestLogicTypes.IRequest> {
  if (!action.data.parameters.requestId) {
    throw new Error('requestId must be given');
  }

  const signer: IdentityTypes.IIdentity = await Action.getSignerIdentityFromAction(action);

  // avoid to mutate the request
  let requestCopied: RequestLogicTypes.IRequest = deepCopy(request);
  requestCopied = Request.pushExtensionsData(requestCopied, action.data.parameters.extensionsData);
  requestCopied.events.push(generateEvent(action, timestamp, signer));

  return requestCopied;
}

/**
 * Private function to generate the event 'addStakeholder' from an action
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
    name: RequestLogicTypes.ACTION_NAME.ADD_STAKEHOLDERS,
    parameters: {
      extensionsDataLength: params.extensionsData ? params.extensionsData.length : 0,
    },
    timestamp,
  };
  return event;
}
