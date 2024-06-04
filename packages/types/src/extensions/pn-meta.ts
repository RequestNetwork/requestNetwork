// import * as Extension from '../extension-types';
import { ExtensionTypes } from '..';
import {
  PnAnyDeclarative,
  PnAnyToAnyConversion,
  PnAnyToErc20,
  PnAnyToEth,
  PnFeeReferenceBased,
} from '../extension-types';

/** Manager of the extension */
export interface IMeta<TCreationParameters = ICreationParameters>
  extends PnAnyDeclarative.IAnyDeclarative<TCreationParameters> {
  createCreationAction: (
    parameters: TCreationParameters,
  ) => ExtensionTypes.IAction<TCreationParameters>;
  createApplyActionToPn: (
    parameters: IApplyActionToPn,
  ) => ExtensionTypes.IAction<TCreationParameters>;
}

/** Parameters of creation action */
export interface ICreationParameters extends PnAnyDeclarative.ICreationParameters {
  [ExtensionTypes.PAYMENT_NETWORK_ID
    .ERC20_FEE_PROXY_CONTRACT]?: PnFeeReferenceBased.ICreationParameters[];
  [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY]?: PnAnyToErc20.ICreationParameters[];
  [ExtensionTypes.PAYMENT_NETWORK_ID
    .ETH_FEE_PROXY_CONTRACT]?: PnFeeReferenceBased.ICreationParameters[];
  [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ETH_PROXY]?: PnAnyToEth.ICreationParameters[];
  [ExtensionTypes.PAYMENT_NETWORK_ID
    .ANY_TO_NATIVE_TOKEN]?: PnAnyToAnyConversion.ICreationParameters[];
}

/** Parameters of declareSentPayment and declareSentRefund action */
export interface IApplyActionToPn {
  pnIdentifier: string;
  action: string;
  parameters: any;
}

/** Actions possible */
export enum ACTION {
  CREATE = 'create',
  APPLY_ACTION_TO_PN = 'apply-action-to-pn',
}
