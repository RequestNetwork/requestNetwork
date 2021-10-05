import { PnFeeReferenceBased } from '../extension-types';
export {
  IAddPaymentAddressParameters,
  IAddRefundAddressParameters,
  IAddFeeParameters,
} from './pn-any-fee-reference-based-types';

/** Conversion reference-based payment network extension interface */
export type IConversionReferenceBased<
  TCreationParameters = ICreationParameters
> = PnFeeReferenceBased.IFeeReferenceBased<TCreationParameters>;

/** Parameters for the creation action */
export interface ICreationParameters extends PnFeeReferenceBased.ICreationParameters {
  maxRateTimespan?: number;
  network?: string;
  acceptedTokens?: string[];
}
