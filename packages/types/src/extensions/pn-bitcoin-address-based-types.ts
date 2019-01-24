import * as Extension from '../extension-types';

/** Manager of the extension */
export interface IBitcoinAddressBasedManager extends Extension.IExtension {
  createAddPaymentAddressAction: (
    creationParameters: IPnBtcAddressBasedAddPaymentAddressParameters,
  ) => Extension.IExtensionAction;
  createAddRefundAddressAction: (
    creationParameters: IPnBtcAddressBasedAddRefundAddressParameters,
  ) => Extension.IExtensionAction;
  createCreationAction: (
    creationParameters: IPnBtcAddressBasedCreationParameters,
  ) => Extension.IExtensionAction;
}

/** Extension values of the extension */
export interface IExtensionPnBtcAddressBasedValues {
  paymentAddress?: string;
  refundAddress?: string;
}

/** Parameters of creation action */
export interface IPnBtcAddressBasedCreationParameters {
  paymentAddress?: string;
  refundAddress?: string;
}

/** Parameters of addPaymentAddress action */
export interface IPnBtcAddressBasedAddPaymentAddressParameters {
  paymentAddress: string;
}

/** Parameters of addRefundAddress action */
export interface IPnBtcAddressBasedAddRefundAddressParameters {
  refundAddress: string;
}

/** Actions possible */
export enum PN_BTC_ADDRESS_BASED_ACTION {
  CREATE = 'create',
  ADD_PAYMENT_ADDRESS = 'addPaymentAddress',
  ADD_REFUND_ADDRESS = 'addRefundAddress',
}
