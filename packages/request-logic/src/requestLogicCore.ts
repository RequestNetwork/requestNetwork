import { AdvancedLogicTypes, RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import Action from './action';
import Request from './request';

import AcceptAction from './actions/accept';
import AddExtensionsData from './actions/addExtensionsData';
import CancelAction from './actions/cancel';
import CreateAction from './actions/create';
import IncreaseExpectedAmountAction from './actions/increaseExpectedAmount';
import ReduceExpectedAmountAction from './actions/reduceExpectedAmount';

/**
 * Implementation of Request Logic Core
 */
export default {
  applyActionToRequest,
  formatAccept: AcceptAction.format,
  formatAddExtensionsData: AddExtensionsData.format,
  formatCancel: CancelAction.format,
  formatCreate: CreateAction.format,
  formatIncreaseExpectedAmount: IncreaseExpectedAmountAction.format,
  formatReduceExpectedAmount: ReduceExpectedAmountAction.format,
  getRequestIdFromAction,
};

/**
 * Function Entry point to apply any action to a request
 * If advancedLogic given, the extensions will be handled
 *
 * @param Types.IRequest request The request before update, null for creation - will not be modified
 * @param Types.IAction action The action to apply
 * @param AdvancedLogicTypes.IAdvancedLogic advancedLogic module to handle exception
 *
 * @returns Types.IRequest  The request updated
 */
function applyActionToRequest(
  request: RequestLogicTypes.IRequest | null,
  action: RequestLogicTypes.IAction,
  timestamp: number,
  advancedLogic?: AdvancedLogicTypes.IAdvancedLogic,
): RequestLogicTypes.IRequest {
  if (!Action.isActionVersionSupported(action)) {
    throw new Error('action version not supported');
  }

  // we don't want to modify the original request state
  const requestCopied: RequestLogicTypes.IRequest | null = request ? Utils.deepCopy(request) : null;

  let requestAfterApply: RequestLogicTypes.IRequest | null = null;

  // Creation request
  if (action.data.name === RequestLogicTypes.ACTION_NAME.CREATE) {
    if (requestCopied) {
      throw new Error('no request is expected at the creation');
    }
    requestAfterApply = CreateAction.createRequest(action, timestamp);
  } else {
    // Update request
    if (!requestCopied) {
      throw new Error('request is expected');
    }

    // Will throw if the request is not valid
    Request.checkRequest(requestCopied);

    if (action.data.name === RequestLogicTypes.ACTION_NAME.ACCEPT) {
      requestAfterApply = AcceptAction.applyActionToRequest(action, timestamp, requestCopied);
    }

    if (action.data.name === RequestLogicTypes.ACTION_NAME.CANCEL) {
      requestAfterApply = CancelAction.applyActionToRequest(action, timestamp, requestCopied);
    }

    if (action.data.name === RequestLogicTypes.ACTION_NAME.INCREASE_EXPECTED_AMOUNT) {
      requestAfterApply = IncreaseExpectedAmountAction.applyActionToRequest(
        action,
        timestamp,
        requestCopied,
      );
    }

    if (action.data.name === RequestLogicTypes.ACTION_NAME.REDUCE_EXPECTED_AMOUNT) {
      requestAfterApply = ReduceExpectedAmountAction.applyActionToRequest(
        action,
        timestamp,
        requestCopied,
      );
    }

    if (action.data.name === RequestLogicTypes.ACTION_NAME.ADD_EXTENSIONS_DATA) {
      requestAfterApply = AddExtensionsData.applyActionToRequest(action, timestamp, requestCopied);
    }
  }

  if (!requestAfterApply) {
    throw new Error(`Unknown action ${action.data.name}`);
  }

  // skip extension application if no extension given or no advanced logic layer given
  if (action.data.parameters.extensionsData && advancedLogic) {
    // Apply the extension on the state
    requestAfterApply.extensions = action.data.parameters.extensionsData.reduce(
      (extensionState: RequestLogicTypes.IExtensionStates, extensionAction: any) => {
        return advancedLogic.applyActionToExtensions(
          extensionState,
          extensionAction,
          requestAfterApply as RequestLogicTypes.IRequest,
          Action.getSignerIdentityFromAction(action),
          timestamp,
        );
      },
      requestAfterApply.extensions,
    );
  }

  return requestAfterApply;
}

/**
 * Function to create a requestId from the creation action or get the requestId parameter otherwise
 *
 * @param IAction action action
 *
 * @returns RequestIdType the requestId
 */
function getRequestIdFromAction(action: RequestLogicTypes.IAction): RequestLogicTypes.RequestId {
  return Action.getRequestId(action);
}
