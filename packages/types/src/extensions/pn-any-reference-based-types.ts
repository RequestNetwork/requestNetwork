import * as Extension from '../extension-types';

/** Manager of the extension */
export interface IReferenceBased extends Extension.IExtension {
  createAddPaymentAddressAction: (
    creationParameters: IAddPaymentAddressParameters,
  ) => Extension.IAction;
  createAddRefundAddressAction: (
    creationParameters: IAddRefundAddressParameters,
  ) => Extension.IAction;
  createCreationAction: (creationParameters: ICreationParameters) => Extension.IAction;
  isValidAddress: (address: string) => boolean;
}

/** Extension values of the extension */
export interface IValues {
  paymentAddress?: string;
  refundAddress?: string;
  salt: string;
}

/** Parameters of creation action */
export interface ICreationParameters {
  paymentAddress?: string;
  refundAddress?: string;
  salt: string;
}

/** Parameters of addPaymentAddress action */
export interface IAddPaymentAddressParameters {
  paymentAddress: string;
}

/** Parameters of addRefundAddress action */
export interface IAddRefundAddressParameters {
  refundAddress: string;
}

/** Actions possible */
export enum ACTION {
  CREATE = 'create',
  ADD_PAYMENT_ADDRESS = 'addPaymentAddress',
  ADD_REFUND_ADDRESS = 'addRefundAddress',
}
