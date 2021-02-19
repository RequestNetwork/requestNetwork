import * as Extension from '../extension-types';

/** Fee reference-based payment network extension interface */
export interface IFeeReferenceBased extends Extension.IExtension {
  createCreationAction: (creationParameters: ICreationParameters) => Extension.IAction;
  createAddPaymentAddressAction: (
    creationParameters: Extension.PnReferenceBased.IAddPaymentAddressParameters,
  ) => Extension.IAction;
  createAddRefundAddressAction: (
    creationParameters: Extension.PnReferenceBased.IAddRefundAddressParameters,
  ) => Extension.IAction;
  createAddFeeAction: (creationParameters: IAddFeeParameters) => Extension.IAction;
  isValidAddress: (address: string) => boolean;
}

/** Parameters for the creation action */
export interface ICreationParameters extends Extension.PnReferenceBased.ICreationParameters {
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
  CREATE = 'create',
  ADD_PAYMENT_ADDRESS = 'addPaymentAddress',
  ADD_REFUND_ADDRESS = 'addRefundAddress',
  ADD_FEE = 'addFee',
}
