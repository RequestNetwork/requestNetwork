import * as Extension from '../extension-types';
import * as PnAnyFees from './pn-any-fee-reference-based-types';

/** Any to ETH reference-based payment network extension interface */
export type IAnyToETH<
  TCreationParameters = ICreationParameters
> = PnAnyFees.IFeeReferenceBased<TCreationParameters>;

/** Parameters for the creation action */
export interface ICreationParameters extends Extension.PnFeeReferenceBased.ICreationParameters {
  network?: string;
  maxRateTimespan?: number;
}
