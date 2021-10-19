// import * as Extension from '../extension-types';
import { PnAnyDeclarative, IAction, IExtension } from '../extension-types';

/** Manager of the extension */
export interface IAddressBased<TCreationParameters = ICreationParameters>
  extends IExtension<TCreationParameters> {
  createAddPaymentAddressAction: (creationParameters: IAddPaymentAddressParameters) => IAction;
  createAddRefundAddressAction: (creationParameters: IAddRefundAddressParameters) => IAction;
  supportedNetworks: string[];
}

/** Extension values of the extension */
export interface IValues extends PnAnyDeclarative.IValues {
  paymentAddress?: string;
  refundAddress?: string;
}

/** Parameters of creation action */
export interface ICreationParameters extends PnAnyDeclarative.ICreationParameters {
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

/** Actions possible */
export enum ACTION {
  CREATE = 'create',
  ADD_PAYMENT_ADDRESS = 'addPaymentAddress',
  ADD_REFUND_ADDRESS = 'addRefundAddress',
}
