import * as Extension from './extension-types';
import * as Identity from './identity-types';
import * as RequestLogic from './request-logic-types';

/** Advanced Logic extensions */
export interface IAdvancedLogicExtensions {
  addressBasedBtc: Extension.PnAddressBased.IAddressBased<Extension.PnAddressBased.ICreationParameters>;
  addressBasedErc20: Extension.PnAddressBased.IAddressBased<Extension.PnAddressBased.ICreationParameters>;
  addressBasedTestnetBtc: Extension.PnAddressBased.IAddressBased<Extension.PnAddressBased.ICreationParameters>;
  contentData: Extension.ContentData.IContentData;
  anyToErc20Proxy: Extension.PnAnyToErc20.IAnyToERC20;
  declarative: Extension.PnAnyDeclarative.IAnyDeclarative<Extension.PnAnyDeclarative.ICreationParameters>;
  ethereumInputData: Extension.PnReferenceBased.IReferenceBased<Extension.PnReferenceBased.ICreationParameters>;
  nativeToken: Extension.PnReferenceBased.IReferenceBased<Extension.PnReferenceBased.ICreationParameters>[];
  feeProxyContractErc20: Extension.PnFeeReferenceBased.IFeeReferenceBased<Extension.PnFeeReferenceBased.ICreationParameters>;
  proxyContractErc20: Extension.PnReferenceBased.IReferenceBased<Extension.PnReferenceBased.ICreationParameters>;
  // FIXME: should be Extension.PnReferenceBased.IReferenceBased<Extension.PnStreamReferenceBased.ICreationParameters>
  erc777Stream: any;
  feeProxyContractEth: Extension.PnFeeReferenceBased.IFeeReferenceBased<Extension.PnFeeReferenceBased.ICreationParameters>;
  anyToEthProxy: Extension.PnFeeReferenceBased.IFeeReferenceBased<Extension.PnFeeReferenceBased.ICreationParameters>;
  anyToNativeToken: Extension.PnFeeReferenceBased.IFeeReferenceBased<Extension.PnFeeReferenceBased.ICreationParameters>[];
  erc20TransferableReceivable: Extension.PnFeeReferenceBased.IFeeReferenceBased<Extension.PnFeeReferenceBased.ICreationParameters>;
}

/** Advanced Logic layer */
export interface IAdvancedLogic {
  applyActionToExtensions: (
    extensionsState: RequestLogic.IExtensionStates,
    extensionAction: Extension.IAction,
    requestState: RequestLogic.IRequest,
    actionSigner: Identity.IIdentity,
    timestamp: number,
  ) => RequestLogic.IExtensionStates;
  getNativeTokenExtensionForNetwork: (
    network: string,
  ) => Extension.IExtension<Extension.PnReferenceBased.ICreationParameters> | undefined;
  getAnyToNativeTokenExtensionForNetwork: (
    network: string,
  ) => Extension.IExtension<Extension.PnAnyToEth.ICreationParameters> | undefined;
  extensions: IAdvancedLogicExtensions;
}

/** Creation extension parameters */
export interface IExtensionCreation {
  id: Extension.ID;
  parameters?: any;
}

/** Update extension parameters */
export interface IExtensionUpdate {
  id: Extension.ID;
  action: string;
  parameters?: any;
}
