import { IdentityTypes, RequestLogicTypes, SignatureProviderTypes } from '@requestnetwork/types';

import Action from '../action';
import Request from '../request';
import Version from '../version';
import { addAmount, deepCopy, isValidAmount } from '@requestnetwork/utils';

/**
 * Implementation of the action increaseExpectedAmount from request logic specification
 */
export default {
  applyActionToRequest,
  format,
};

/**
 * Function to format an action to increase expected amount of a Request
 *
 * @param IIncreaseExpectedAmountParameters increaseAmountParameters parameters to increase expected amount of a request
 * @param IIdentity signerIdentity Identity of the signer
 * @param ISignatureProvider signatureProvider Signature provider in charge of the signature
 *
 * @returns IAction  the action with the signature
 */
function format(
  increaseAmountParameters: RequestLogicTypes.IIncreaseExpectedAmountParameters,
  signerIdentity: IdentityTypes.IIdentity,
  signatureProvider: SignatureProviderTypes.ISignatureProvider,
): Promise<RequestLogicTypes.IAction> {
  if (!isValidAmount(increaseAmountParameters.deltaAmount)) {
    throw new Error('deltaAmount must be a string representing a positive integer');
  }

  const unsignedAction: RequestLogicTypes.IUnsignedAction = {
    name: RequestLogicTypes.ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
    parameters: increaseAmountParameters,
    version: Version.currentVersion,
  };

  return Action.createAction(unsignedAction, signerIdentity, signatureProvider);
}

/**
 * Function to apply an increaseExpectedAmount action on a request
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
  if (!request.payer) {
    throw new Error('the request must have a payer');
  }
  if (!action.data.parameters.deltaAmount) {
    throw new Error('deltaAmount must be given');
  }
  if (!isValidAmount(action.data.parameters.deltaAmount)) {
    throw new Error('deltaAmount must be a string representing a positive integer');
  }

  const signer: IdentityTypes.IIdentity = await Action.getSignerIdentityFromAction(action);
  const signerRole = Request.getRoleInRequest(signer, request);

  // avoid to mutate the request
  let requestCopied: RequestLogicTypes.IRequest = deepCopy(request);
  requestCopied = Request.pushExtensionsData(requestCopied, action.data.parameters.extensionsData);
  requestCopied.events.push(generateEvent(action, timestamp, signer));

  if (signerRole === RequestLogicTypes.ROLE.PAYER) {
    if (request.state === RequestLogicTypes.STATE.CANCELED) {
      throw new Error('the request must not be canceled');
    }
    // increase the expected amount and store it as string
    requestCopied.expectedAmount = addAmount(
      request.expectedAmount,
      action.data.parameters.deltaAmount,
    );

    return requestCopied;
  }

  throw new Error('signer must be the payer');
}

/**
 * Private function to generate the event 'IncreaseExpectedAmount' from an action
 *
 * @param Types.IAction action the action data that create the event
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
    name: RequestLogicTypes.ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
    parameters: {
      deltaAmount: action.data.parameters.deltaAmount,
      extensionsDataLength: params.extensionsData ? params.extensionsData.length : 0,
    },
    timestamp,
  };
  return event;
}
