import {
  Identity as IdentityTypes,
  RequestLogic as Types,
  SignatureProvider as SignatureProviderTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import Action from '../action';
import Amount from '../amount';
import Request from '../request';
import Version from '../version';

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
  increaseAmountParameters: Types.IIncreaseExpectedAmountParameters,
  signerIdentity: IdentityTypes.IIdentity,
  signatureProvider: SignatureProviderTypes.ISignatureProvider,
): Types.IAction {
  if (!Amount.isValid(increaseAmountParameters.deltaAmount)) {
    throw new Error('deltaAmount must be a string representing a positive integer');
  }

  const unsignedAction: Types.IUnsignedAction = {
    name: Types.ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
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
function applyActionToRequest(action: Types.IAction, request: Types.IRequest): Types.IRequest {
  if (!action.data.parameters.requestId) {
    throw new Error('requestId must be given');
  }
  if (!request.payer) {
    throw new Error('the request must have a payer');
  }
  if (!action.data.parameters.deltaAmount) {
    throw new Error('deltaAmount must be given');
  }
  if (!Amount.isValid(action.data.parameters.deltaAmount)) {
    throw new Error('deltaAmount must be a string representing a positive integer');
  }

  const signer: IdentityTypes.IIdentity = Action.getSignerIdentityFromAction(action);
  const signerRole = Request.getRoleInRequest(signer, request);

  // avoid to mutate the request
  let requestCopied: Types.IRequest = Utils.deepCopy(request);
  requestCopied = Request.pushExtensionsData(requestCopied, action.data.parameters.extensionsData);
  requestCopied.events.push(generateEvent(action, signer));

  if (signerRole === Types.ROLE.PAYER) {
    if (request.state === Types.STATE.CANCELED) {
      throw new Error('the request must not be canceled');
    }
    // increase the expected amount and store it as string
    requestCopied.expectedAmount = Amount.add(
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
function generateEvent(action: Types.IAction, actionSigner: IdentityTypes.IIdentity): Types.IEvent {
  const params = action.data.parameters;

  const event: Types.IEvent = {
    actionSigner,
    name: Types.ACTION_NAME.INCREASE_EXPECTED_AMOUNT,
    parameters: {
      deltaAmount: action.data.parameters.deltaAmount,
      extensionsDataLength: params.extensionsData ? params.extensionsData.length : 0,
    },
  };
  return event;
}
