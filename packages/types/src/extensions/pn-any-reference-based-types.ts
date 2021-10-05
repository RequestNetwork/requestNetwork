import * as Extension from '../extension-types';
import { PnAddressBased } from '../extension-types';
export {
  IAddPaymentAddressParameters,
  IAddRefundAddressParameters,
} from './pn-any-address-based-types';

/** Manager of the extension */
export interface IReferenceBased<TCreationParameters = ICreationParameters>
  extends PnAddressBased.IAddressBased<TCreationParameters> {
  createCreationAction: (
    creationParameters: TCreationParameters,
  ) => Extension.IAction<TCreationParameters>;
  createDeclarePaymentAction: (
    declarePaymentParameters: IDeclarePaymentParameters,
  ) => Extension.IAction;
}

/** Extension values of the extension */
export interface IValues extends PnAddressBased.IValues {
  salt: string;
}

/** Parameters of creation action */
export interface ICreationParameters extends PnAddressBased.ICreationParameters {
  salt: string;
  paymentNetworkName?: string;
}

/** Parameters of declarePayment action */
export interface IDeclarePaymentParameters {
  amount: string;
  txHash?: string;
}

export enum ACTION {
  CREATE = 'create',
  ADD_PAYMENT_ADDRESS = 'addPaymentAddress',
  ADD_REFUND_ADDRESS = 'addRefundAddress',
  // Specific to ReferenceBased
  DECLARE_PAYMENT = 'declarePayment',
}
