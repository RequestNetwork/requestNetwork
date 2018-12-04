import {
  Identity as IdentityTypes,
  RequestLogic as Types,
  Signature as SignatureTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import Action from '../action';
import Amount from '../amount';
import Version from '../version';

/**
 * Implementation of the request logic specification
 */
export default {
  createRequest,
  format,
};

/**
 * Function to format  action to create a Request
 *
 * @param requestParameters IRequestLogicCreateParameters parameters to create a request
 * @param ISignatureParameters signatureParams Signature parameters
 *
 *
 * @returns IRequestLogicAction  the action with the signature
 */
function format(
  requestParameters: Types.IRequestLogicCreateParameters,
  signatureParams: SignatureTypes.ISignatureParameters,
): Types.IRequestLogicAction {
  if (!requestParameters.payee && !requestParameters.payer) {
    throw new Error('payee or PayerId must be given');
  }

  if (!Amount.isValid(requestParameters.expectedAmount)) {
    throw new Error('expectedAmount must be a positive integer');
  }

  if (
    requestParameters.payee &&
    requestParameters.payee.type !== IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS
  ) {
    throw new Error('payee.type not supported');
  }

  if (
    requestParameters.payer &&
    requestParameters.payer.type !== IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS
  ) {
    throw new Error('payer.type not supported');
  }

  // convert expectedAmount to string to have a consistent numbering
  requestParameters.expectedAmount = requestParameters.expectedAmount.toString();
  const version = Version.currentVersion;

  const unsignedAction: Types.IRequestLogicUnsignedAction = {
    name: Types.REQUEST_LOGIC_ACTION_NAME.CREATE,
    parameters: requestParameters,
    version,
  };
  const signerIdentity: IdentityTypes.IIdentity = Utils.signature.getIdentityFromSignatureParams(
    signatureParams,
  );
  const signerRole: Types.REQUEST_LOGIC_ROLE = Action.getRoleInUnsignedAction(
    signerIdentity,
    unsignedAction,
  );

  if (
    signerRole !== Types.REQUEST_LOGIC_ROLE.PAYEE &&
    signerRole !== Types.REQUEST_LOGIC_ROLE.PAYER
  ) {
    throw new Error('Signer must be the payee or the payer');
  }

  return Action.createAction(unsignedAction, signatureParams);
}

/**
 * Function to create a request (create a request)
 *
 * @param Types.IRequestLogicAction action the action to evaluate
 *
 * @returns Types.IRequestLogicRequest the new request
 */
function createRequest(action: Types.IRequestLogicAction): Types.IRequestLogicRequest {
  if (!action.data.parameters.payee && !action.data.parameters.payer) {
    throw new Error('action.parameters.payee or action.parameters.payer must be given');
  }

  if (
    !Utils.isString(action.data.parameters.expectedAmount) ||
    !Amount.isValid(action.data.parameters.expectedAmount)
  ) {
    throw new Error(
      'action.parameters.expectedAmount must be a string representing a positive integer',
    );
  }

  const signer: IdentityTypes.IIdentity = Action.getSignerIdentityFromAction(action);

  // Copy to not modify the action itself
  const request: Types.IRequestLogicRequest = Utils.deepCopy(action.data.parameters);
  request.requestId = Action.getRequestId(action);
  request.version = Action.getVersionFromAction(action);
  request.events = [generateEvent(action, signer)];

  const signerRole = Action.getRoleInAction(signer, action);
  if (signerRole === Types.REQUEST_LOGIC_ROLE.PAYEE) {
    request.state = Types.REQUEST_LOGIC_STATE.CREATED;
    request.creator = action.data.parameters.payee;
    return request;
  }
  if (signerRole === Types.REQUEST_LOGIC_ROLE.PAYER) {
    request.state = Types.REQUEST_LOGIC_STATE.ACCEPTED;
    request.creator = action.data.parameters.payer;
    return request;
  }

  throw new Error('Signer must be the payee or the payer');
}

/**
 * Private function to generate the event 'Create' from an action
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
    name: Types.REQUEST_LOGIC_ACTION_NAME.CREATE,
    parameters: {
      expectedAmount: params.expectedAmount,
      extensionsDataLength: params.extensionsData ? params.extensionsData.length : 0,
      isSignedRequest: false,
    },
  };
  return event;
}
