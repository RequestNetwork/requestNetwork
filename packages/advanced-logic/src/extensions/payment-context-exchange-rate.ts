import { ExtensionTypes, RequestLogicTypes, IdentityTypes, PaymentTypes } from '@requestnetwork/types';

import Utils from '@requestnetwork/utils';
import { IPaymentContextOption } from '@requestnetwork/types/dist/extensions/pc-exchange-rate';

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
 * @param extensions ICreationParameters extensions parameters to create
 *
 * @returns IAction the extensionsData to be store in the request
 */
function createCreationAction(
  creationParameters: ExtensionTypes.PcExchangeRate.ICreationParameters,
): ExtensionTypes.IAction {

  return {
    action: ExtensionTypes.PcExchangeRate.ACTION.CREATE,
    id: ExtensionTypes.ID.PAYMENT_CONTEXT_EXCHANGE_RATE,
    parameters: creationParameters,
    version: CURRENT_VERSION,
  };
}

/**
 * Interprets a an extensionAction, based on a the state of all other extensions,
 * extensionsState, and on the requestState, in order to return a new state of
 * all extensions.
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
  requestState: RequestLogicTypes.IRequest,
  actionSigner: IdentityTypes.IIdentity,
  timestamp: number,
): RequestLogicTypes.IExtensionStates {
  // Only allowed actions are valid
  if (extensionAction.action !== ExtensionTypes.PcExchangeRate.ACTION.CREATE) {
    throw Error(`Unknown action: ${extensionAction.action}`);
  }
  
  if (requestState.state != RequestLogicTypes.STATE.CREATED) {
    throw Error(`The request must not be accepted or declined`);
  }
  if (!requestState.payee) {
    throw Error(`The request must have a payee`);
  }
  if (!Utils.identity.areEqual(actionSigner, requestState.payee)) {
    throw Error(`The signer must be the payee`);
  }

  extensionAction.parameters.paymentContextOptions.forEach((exchangeOption: IPaymentContextOption) => {
    // The extension does not work with an exchange rate for the same currency
    if (exchangeOption.currency == requestState.currency) {
      throw Error('Extension payment-context-exchange-rate can only be used to exchange currencies that are different');

    // The extension should be created with 3 parameters: oracle, timeframe and currency 
    if (!exchangeOption.oracle || !exchangeOption.timeframe || !exchangeOption.currency) {
      throw Error('Extension payment-context-exchange-rate expects 3 parameters: oracle, timeframe, currency');
  }
  }
    
  });


  // The extension is invalid if another pc-exchange-rate extension exists for the same oracle and currency
  /* TODO
  if (extensionsState[ExtensionTypes.ID.PAYMENT_CONTEXT_EXCHANGE_RATE]) {
    throw Error('Extension payment-context-exchange-rate can only be used to exchange currencies that are different');
  }
  */

  // Deep copy to not mutate the input parameter
  const copiedExtensionState: RequestLogicTypes.IExtensionStates = Utils.deepCopy(extensionsState);

  copiedExtensionState[ExtensionTypes.ID.PAYMENT_CONTEXT_EXCHANGE_RATE] = {
    events: [
      {
        name: 'create',
        parameters: extensionAction.parameters,
        timestamp,
      },
    ],
    id: ExtensionTypes.ID.PAYMENT_CONTEXT_EXCHANGE_RATE,
    type: ExtensionTypes.TYPE.PAYMENT_CONTEXT,
    values: { 
      /* TODO: build an array of triplets instead
      oracle: extensionAction.parameters.oracle,
      timeframe: extensionAction.parameters.timeframe,
      currency: extensionAction.parameters.currency,
      */
     },
    version: CURRENT_VERSION,
  };

  return copiedExtensionState;
}
