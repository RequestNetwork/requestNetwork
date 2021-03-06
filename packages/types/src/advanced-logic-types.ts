import * as Extension from './extension-types';
import * as Identity from './identity-types';
import * as RequestLogic from './request-logic-types';

export type ExtensionTypes =
  | 'addressBasedBtc'
  | 'addressBasedErc20'
  | 'addressBasedTestnetBtc'
  | 'contentData'
  | 'anyToErc20Proxy'
  | 'declarative'
  | 'ethereumInputData'
  | 'feeProxyContractErc20'
  | 'proxyContractErc20';

export type ExtensionTypesMap = {
  addressBasedBtc: Extension.PnAddressBased.IAddressBased;
  addressBasedErc20: Extension.PnAddressBased.IAddressBased;
  addressBasedTestnetBtc: Extension.PnAddressBased.IAddressBased;
  contentData: Extension.ContentData.IContentData;
  anyToErc20Proxy: Extension.PnAnyToErc20.IAnyToERC20;
  declarative: Extension.PnAnyDeclarative.IAnyDeclarative;
  ethereumInputData: Extension.PnReferenceBased.IReferenceBased;
  feeProxyContractErc20: Extension.PnFeeReferenceBased.IFeeReferenceBased;
  proxyContractErc20: Extension.PnReferenceBased.IReferenceBased;
};

/** Advanced Logic layer */
export interface IAdvancedLogic {
  applyActionToExtensions: (
    extensionsState: RequestLogic.IExtensionStates,
    extensionAction: Extension.IAction,
    requestState: RequestLogic.IRequest,
    actionSigner: Identity.IIdentity,
    timestamp: number,
  ) => RequestLogic.IExtensionStates;
  extensions: {
    [T in ExtensionTypes]: ExtensionTypesMap[T];
  };
}

/** Update extension parameters */
export interface IExtensionUpdate {
  id: Extension.ID;
  action: string;
  parameters?: any;
}
