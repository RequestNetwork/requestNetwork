import * as Extension from '../extension-types';
import * as PnAnyFees from './pn-any-fee-reference-based-types';

/** Any to ERC20e reference-based payment network extension interface */
export interface IAnyToERC20 extends PnAnyFees.IFeeReferenceBased {
  createCreationAction: (creationParameters: ICreationParameters) => Extension.IAction;
}

/** Parameters for the creation action */
export interface ICreationParameters extends Extension.PnFeeReferenceBased.ICreationParameters {
  network?: string;
  maxRateTimespan?: number;
}
