import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';

import Utils from '@requestnetwork/utils';

/**
 * Implementation of the exchange rate extension
 */
const exchangeRate: ExtensionTypes.PcExchangeRate.IExchangeRate = {
  applyActionToExtension,
  createCreationAction,
};
export default exchangeRate;

const CURRENT_VERSION = '0.1.0';

/**
 * Creates the extensionsData to create the extension pc-exchange-rate
 *
 * @param extensions IAdvancedLogicExtensionsCreationParameters extensions parameters to create
 *
 * @returns IExtensionCreationAction the extensionsData to be store in the request
 */
function createCreationAction(
  creationParameters: ExtensionTypes.PcExchangeRate.ICreationParameters,
): ExtensionTypes.IAction {
  throw Error('TODO Payment Context: Exchange rate');

  return {
    action: ExtensionTypes.PcExchangeRate.ACTION.CREATE,
    id: ExtensionTypes.ID.PAYMENT_CONTEXT_EXCHANGE_RATE,
    parameters: creationParameters,
    version: CURRENT_VERSION,
  };
}

/**
 * Applies the extension action to the request
 * Is called to interpret the extensions data when applying the transaction
 *
 * @param extensionsState IExtensionStates previous state of the extensions
 * @param extensionAction IAction action to apply
 * @param requestState IRequest request state read-only
 *
 * @returns state of the request updated
 */
function applyActionToExtension(
  extensionsState: RequestLogicTypes.IExtensionStates,
  extensionAction: ExtensionTypes.IAction,
  //requestState: RequestLogicTypes.IRequest,
): RequestLogicTypes.IExtensionStates {
  if (extensionAction.action !== ExtensionTypes.PcExchangeRate.ACTION.CREATE) {
    throw Error(`Unknown action: ${extensionAction.action}`);
  }

  throw Error('TODO Payment Context: Exchange rate');

  // Deep copy to not mutate the input parameter
  const copiedExtensionState: RequestLogicTypes.IExtensionStates = Utils.deepCopy(extensionsState);

  copiedExtensionState[ExtensionTypes.ID.PAYMENT_CONTEXT_EXCHANGE_RATE] = {
    events: [
      /* 
      * TODO
      */
    ],
    id: ExtensionTypes.ID.PAYMENT_CONTEXT_EXCHANGE_RATE,
    type: ExtensionTypes.TYPE.PAYMENT_CONTEXT,
    values: { 
      /*
      * TODO
      */
     },
    version: CURRENT_VERSION,
  };

  return copiedExtensionState;
}
