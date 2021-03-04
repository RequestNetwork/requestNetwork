import * as Extension from '../extension-types';
import { EnumToType } from '../shared';

/** Manager of the extension */
export interface IAddressBased extends Extension.IExtension {
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
}

/** Parameters of creation action */
export interface ICreationParameters {
  paymentAddress?: string;
  refundAddress?: string;
}

/** Parameters of addPaymentAddress action */
export interface IAddPaymentAddressParameters {
  paymentAddress: string;
}

/** Parameters of addRefundAddress action */
export interface IAddRefundAddressParameters {
  refundAddress: string;
}

export const ACTION = {
  CREATE: 'create',
  ADD_PAYMENT_ADDRESS: 'addPaymentAddress',
  ADD_REFUND_ADDRESS: 'addRefundAddress',
} as const;

/** Actions possible */
export type ACTION = EnumToType<typeof ACTION>;
