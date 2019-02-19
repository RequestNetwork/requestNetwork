import {
  Identity as IdentityTypes,
  RequestLogic as Types,
  SignatureProvider as SignatureProviderTypes,
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
 * If requestParameters.timestamp not given, "Date.now() / 1000" will be used as default
 *
 * @param requestParameters ICreateParameters parameters to create a request
 * @param IIdentity signerIdentity Identity of the signer
 * @param ISignatureProvider signatureProvider Signature provider in charge of the signature
 *
 * @returns IAction  the action with the signature
 */
function format(
  requestParameters: Types.ICreateParameters,
  signerIdentity: IdentityTypes.IIdentity,
  signatureProvider: SignatureProviderTypes.ISignatureProvider,
): Types.IAction {
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

  if (!requestParameters.timestamp) {
    requestParameters.timestamp = Utils.getCurrentTimestampInSecond();
  }

  // convert expectedAmount to string to have a consistent numbering
  requestParameters.expectedAmount = requestParameters.expectedAmount.toString();
  const version = Version.currentVersion;

  const unsignedAction: Types.IUnsignedAction = {
    name: Types.ACTION_NAME.CREATE,
    parameters: requestParameters,
    version,
  };

  const signerRole: Types.ROLE = Action.getRoleInUnsignedAction(signerIdentity, unsignedAction);

  if (signerRole !== Types.ROLE.PAYEE && signerRole !== Types.ROLE.PAYER) {
    throw new Error('Signer must be the payee or the payer');
  }

  return Action.createAction(unsignedAction, signerIdentity, signatureProvider);
}

/**
 * Function to create a request (create a request)
 *
 * @param Types.IAction action the action to evaluate
 *
 * @returns Types.IRequest the new request
 */
function createRequest(action: Types.IAction): Types.IRequest {
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
  const request: Types.IRequest = Utils.deepCopy(action.data.parameters);
  request.extensions = {};
  request.requestId = Action.getRequestId(action);
  request.version = Action.getVersionFromAction(action);
  request.events = [generateEvent(action, signer)];

  const signerRole = Action.getRoleInAction(signer, action);
  if (signerRole === Types.ROLE.PAYEE) {
    request.state = Types.STATE.CREATED;
    request.creator = action.data.parameters.payee;
    return request;
  }
  if (signerRole === Types.ROLE.PAYER) {
    request.state = Types.STATE.ACCEPTED;
    request.creator = action.data.parameters.payer;
    return request;
  }

  throw new Error('Signer must be the payee or the payer');
}

/**
 * Private function to generate the event 'Create' from an action
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
    name: Types.ACTION_NAME.CREATE,
    parameters: {
      expectedAmount: params.expectedAmount,
      extensionsDataLength: params.extensionsData ? params.extensionsData.length : 0,
      isSignedRequest: false,
    },
  };
  return event;
}
