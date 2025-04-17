import { PnAddressBased } from '../extension-types';
import { ChainName } from '../currency-types';

export type {
  ACTION,
  IAddPaymentAddressParameters,
  IAddRefundAddressParameters,
} from './pn-any-address-based-types';

/** Manager of the extension */
export type IReferenceBased<TCreationParameters = ICreationParameters> =
  PnAddressBased.IAddressBased<TCreationParameters>;

/** Extension values of the extension */
export interface IValues extends PnAddressBased.IValues {
  salt: string;
}

/** Parameters of creation action */
export interface ICreationParameters extends PnAddressBased.ICreationParameters {
  salt?: string;
  paymentNetworkName?: ChainName;
}
