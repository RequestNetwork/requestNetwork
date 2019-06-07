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
 * Implementation of the action reduceExpectedAmount from request logic specification
 */
export default {
  applyActionToRequest,
  format,
};

/**
 * Function to format an action to reduce expected amount of a Request
 *
 * @param IReduceExpectedAmountParameters reduceAmountParameters parameters to reduce expected amount of a request
 * @param IIdentity signerIdentity Identity of the signer
 * @param ISignatureProvider signatureProvider Signature provider in charge of the signature
 *
 * @returns IAction  the action with the signature
 */
function format(
  reduceAmountParameters: RequestLogicTypes.IReduceExpectedAmountParameters,
  signerIdentity: IdentityTypes.IIdentity,
  signatureProvider: SignatureProviderTypes.ISignatureProvider,
): Promise<RequestLogicTypes.IAction> {
  if (!Utils.amount.isValid(reduceAmountParameters.deltaAmount)) {
    throw new Error('deltaAmount must be a string representing a positive integer');
  }

  const unsignedAction: RequestLogicTypes.IUnsignedAction = {
    name: RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
    parameters: reduceAmountParameters,
    version: Version.currentVersion,
  };

  return Action.createAction(unsignedAction, signerIdentity, signatureProvider);
}

/**
 * Function to apply an reduceExpectedAmount action on a request
 *
 * @param Types.IAction action the action to apply
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
  if (!request.payee) {
    throw new Error('the request must have a payee');
  }
  if (!action.data.parameters.deltaAmount) {
    throw new Error('deltaAmount must be given');
  }
  if (!Utils.amount.isValid(action.data.parameters.deltaAmount)) {
    throw new Error('deltaAmount must be a string representing a positive integer');
  }

  const signer: IdentityTypes.IIdentity = Action.getSignerIdentityFromAction(action);
  const signerRole = Request.getRoleInRequest(signer, request);

  // avoid to mutate the request
  let requestCopied: RequestLogicTypes.IRequest = Utils.deepCopy(request);
  requestCopied = Request.pushExtensionsData(requestCopied, action.data.parameters.extensionsData);
  requestCopied.events.push(generateEvent(action, timestamp, signer));

  if (signerRole === RequestLogicTypes.ROLE.PAYEE) {
    if (request.state === RequestLogicTypes.STATE.CANCELED) {
      throw new Error('the request must not be canceled');
    }
    // reduce the expected amount and store it as string or throw if the result is not valid
    requestCopied.expectedAmount = Utils.amount.reduce(
      request.expectedAmount,
      action.data.parameters.deltaAmount,
    );

    return requestCopied;
  }

  throw new Error('signer must be the payee');
}

/**
 * Private function to generate the event 'ReduceExpectedAmount' from an action
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
    name: RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
    parameters: {
      deltaAmount: action.data.parameters.deltaAmount,
      extensionsDataLength: params.extensionsData ? params.extensionsData.length : 0,
    },
    timestamp,
  };
  return event;
}
