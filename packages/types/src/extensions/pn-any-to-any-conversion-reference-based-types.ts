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
  maxRateTimespan?: string;
  network?: string;
}

/** Actions specific to the fee payment networks */
export enum ACTION {
  // Standard referenceBased
  CREATE = 'create',
  ADD_PAYMENT_ADDRESS = 'addPaymentAddress',
  ADD_REFUND_ADDRESS = 'addRefundAddress',
  // Specific to FeeReferenceBased
  ADD_FEE = 'addFee',
}
