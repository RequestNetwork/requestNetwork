import {
  Identity as IdentityTypes,
  RequestLogic as Types,
  Signature as SignatureTypes,
} from '@requestnetwork/types';

import Action from '../action';
import Amount from '../amount';
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
 * @param IRequestLogicReduceExpectedAmountParameters reduceAmountParameters parameters to reduce expected amount of a request
 * @param ISignatureParameters signatureParams Signature parameters
 *
 * @returns IRequestLogicAction  the action with the signature
 */
function format(
  reduceAmountParameters: Types.IRequestLogicReduceExpectedAmountParameters,
  signatureParams: SignatureTypes.ISignatureParameters,
): Types.IRequestLogicAction {
  if (!Amount.isValid(reduceAmountParameters.deltaAmount)) {
    throw new Error('deltaAmount must be a string representing a positive integer');
  }

  const unsignedAction: Types.IRequestLogicUnsignedAction = {
    name: Types.REQUEST_LOGIC_ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
    parameters: reduceAmountParameters,
    version: Version.currentVersion,
  };

  return Action.createAction(unsignedAction, signatureParams);
}

/**
 * Function to apply an reduceExpectedAmount action on a request
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
  if (!request.payee) {
    throw new Error('the request must have a payee');
  }
  if (!action.data.parameters.deltaAmount) {
    throw new Error('deltaAmount must be given');
  }
  if (!Amount.isValid(action.data.parameters.deltaAmount)) {
    throw new Error('deltaAmount must be a string representing a positive integer');
  }

  const signer: IdentityTypes.IIdentity = Action.getSignerIdentityFromAction(action);
  const signerRole = Request.getRoleInRequest(signer, request);

  request = Request.pushExtensionsData(request, action.data.parameters.extensionsData);
  request.events.push(generateEvent(action, signer));

  if (signerRole === Types.REQUEST_LOGIC_ROLE.PAYEE) {
    if (request.state === Types.REQUEST_LOGIC_STATE.CANCELLED) {
      throw new Error('the request must not be canceled');
    }
    // reduce the expected amount and store it as string or throw if the result is not valid
    request.expectedAmount = Amount.reduce(
      request.expectedAmount,
      action.data.parameters.deltaAmount,
    );

    return request;
  }

  throw new Error('signer must be the payee');
}

/**
 * Private function to generate the event 'ReduceExpectedAmount' from an action
 *
 * @param Types.IRequestLogicAction action the action data that create the event
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
    name: Types.REQUEST_LOGIC_ACTION_NAME.REDUCE_EXPECTED_AMOUNT,
    parameters: {
      deltaAmount: action.data.parameters.deltaAmount,
      extensionsDataLength: params.extensionsData ? params.extensionsData.length : 0,
    },
  };
  return event;
}
