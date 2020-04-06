import { IdentityTypes, RequestLogicTypes, SignatureProviderTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import * as Semver from 'semver';
import Action from '../action';
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
  requestParameters: RequestLogicTypes.ICreateParameters,
  signerIdentity: IdentityTypes.IIdentity,
  signatureProvider: SignatureProviderTypes.ISignatureProvider,
): Promise<RequestLogicTypes.IAction> {
  if (!requestParameters.payee && !requestParameters.payer) {
    throw new Error('payee or PayerId must be given');
  }

  if (!Utils.amount.isValid(requestParameters.expectedAmount)) {
    throw new Error('expectedAmount must be a positive integer');
  }

  if (requestParameters.payee && Utils.identity.hasError(requestParameters.payee)) {
    throw new Error(`payee: ${Utils.identity.hasError(requestParameters.payee)}̀`);
  }

  if (requestParameters.payer && Utils.identity.hasError(requestParameters.payer)) {
    throw new Error(`payer: ${Utils.identity.hasError(requestParameters.payer)}̀`);
  }

  if (!requestParameters.timestamp) {
    requestParameters.timestamp = Utils.getCurrentTimestampInSecond();
  }

  // convert expectedAmount to string to have a consistent numbering
  requestParameters.expectedAmount = requestParameters.expectedAmount.toString();
  const version = Version.currentVersion;

  const unsignedAction: RequestLogicTypes.IUnsignedAction = {
    name: RequestLogicTypes.ACTION_NAME.CREATE,
    parameters: requestParameters,
    version,
  };

  const signerRole: RequestLogicTypes.ROLE = Action.getRoleInUnsignedAction(
    signerIdentity,
    unsignedAction,
  );

  if (signerRole !== RequestLogicTypes.ROLE.PAYEE && signerRole !== RequestLogicTypes.ROLE.PAYER) {
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
function createRequest(
  action: RequestLogicTypes.IAction,
  timestamp: number,
): RequestLogicTypes.IRequest {
  if (!action.data.parameters.payee && !action.data.parameters.payer) {
    throw new Error('action.parameters.payee or action.parameters.payer must be given');
  }

  if (action.data.parameters.payee && Utils.identity.hasError(action.data.parameters.payee)) {
    throw new Error(`payee: ${Utils.identity.hasError(action.data.parameters.payee)}̀`);
  }

  if (action.data.parameters.payer && Utils.identity.hasError(action.data.parameters.payer)) {
    throw new Error(`payer: ${Utils.identity.hasError(action.data.parameters.payer)}̀`);
  }

  if (
    !Utils.isString(action.data.parameters.expectedAmount) ||
    !Utils.amount.isValid(action.data.parameters.expectedAmount)
  ) {
    throw new Error(
      'action.parameters.expectedAmount must be a string representing a positive integer',
    );
  }

  const signer: IdentityTypes.IIdentity = Action.getSignerIdentityFromAction(action);

  // Copy to not modify the action itself
  const request: RequestLogicTypes.IRequest = Utils.deepCopy(action.data.parameters);
  request.extensions = {};
  request.requestId = Action.getRequestId(action);
  request.version = Action.getVersionFromAction(action);
  request.events = [generateEvent(action, timestamp, signer)];

  // If we're creating an older version of a request, we convert the string currency type to the new ICurrency one
  if (Semver.lt(action.data.version, '2.0.2')) {
    request.currency = legacyEnumToICurrencyConvert(action.data.parameters.currency);
  }

  const signerRole = Action.getRoleInAction(signer, action);
  if (signerRole === RequestLogicTypes.ROLE.PAYEE) {
    request.state = RequestLogicTypes.STATE.CREATED;
    request.creator = action.data.parameters.payee;
    return request;
  }
  if (signerRole === RequestLogicTypes.ROLE.PAYER) {
    request.state = RequestLogicTypes.STATE.ACCEPTED;
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
function generateEvent(
  action: RequestLogicTypes.IAction,
  timestamp: number,
  actionSigner: IdentityTypes.IIdentity,
): RequestLogicTypes.IEvent {
  const params = action.data.parameters;

  const event: RequestLogicTypes.IEvent = {
    actionSigner,
    name: RequestLogicTypes.ACTION_NAME.CREATE,
    parameters: {
      expectedAmount: params.expectedAmount,
      extensionsDataLength: params.extensionsData ? params.extensionsData.length : 0,
      isSignedRequest: false,
    },
    timestamp,
  };
  return event;
}

/**
 * Converts legacy enum CURRENCY format to ICurrency object
 *
 * @param currency The old currency string format
 * @returns The ICurrency object
 */
function legacyEnumToICurrencyConvert(currency: string): RequestLogicTypes.ICurrency {
  switch (currency) {
    case 'BTC':
      return {
        network: 'mainnet',
        type: RequestLogicTypes.CURRENCY.BTC,
        value: 'BTC',
      };
    case 'ETH':
      return {
        network: 'mainnet',
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      };
    case 'EUR':
      return {
        type: RequestLogicTypes.CURRENCY.ISO4217,
        value: 'EUR',
      };
    case 'USD':
      return {
        type: RequestLogicTypes.CURRENCY.ISO4217,
        value: 'USD',
      };
    case 'DAI': // DON'T RENAME: DAI was the name used by the legacy requests for SAI
      return {
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359', // SAI
      };
    default:
      throw new Error('Unsupported currency when getting request from transactions.');
  }
}
