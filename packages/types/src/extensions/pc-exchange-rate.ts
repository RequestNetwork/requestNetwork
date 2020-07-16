import * as Extension from '../extension-types';
import { ICurrency } from '../request-logic-types';

/** Manager of the extension */
export interface IExchangeRate extends Extension.IExtension {
  createCreationAction: (creationParameters: ICreationParameters) => Extension.IAction;
}

/** Payment context option */
export interface IPaymentContextOption {
  oracle: string;
  timeframe: number;
  currency: ICurrency;
}

/** Extension values of content data */
export interface IValues {
  pcOptions: IPaymentContextOption[];
}

/** Parameters of creation action */
export interface ICreationParameters {
  pcOptions: IPaymentContextOption[];
}

/** Actions possible */
export enum ACTION {
  CREATE = 'create',
}
