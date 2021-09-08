import { PnReferenceBased, IAction } from '../extension-types';
export {
  IAddPaymentAddressParameters,
  IAddRefundAddressParameters,
} from './pn-any-reference-based-types';

/** Fee reference-based payment network extension interface */
export interface IFeeReferenceBased extends PnReferenceBased.IReferenceBased<ICreationParameters> {
  createAddFeeAction: (creationParameters: IAddFeeParameters) => IAction<IAddFeeParameters>;
}

/** Parameters for the creation action */
export interface ICreationParameters extends PnReferenceBased.ICreationParameters {
  feeAddress?: string;
  feeAmount?: string;
}

/** Parameters for the addFee action */
export interface IAddFeeParameters {
  feeAddress: string;
  feeAmount: string;
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
