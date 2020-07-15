import * as Extension from '../extension-types';
import { ICurrency } from '../request-logic-types';

/** Manager of the extension */
export interface IExchangeRate extends Extension.IExtension {
  createCreationAction: (creationParameters: ICreationParameters) => Extension.IAction;
}

/** Extension values of content data */
export interface IValues {
  oracle: string;
  timeframe: number;
  currency: ICurrency;
}

/** Parameters of creation action */
export interface ICreationParameters {
    oracle: string;
    timeframe: number;
    currency: ICurrency;
}

/** Actions possible */
export enum ACTION {
  CREATE = 'create',
}
