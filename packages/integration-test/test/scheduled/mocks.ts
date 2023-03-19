import { AdvancedLogicTypes } from '@requestnetwork/types';
import * as Extension from '@requestnetwork/types/src/extension-types';

const createAddPaymentAddressAction = jest.fn();
const createAddRefundAddressAction = jest.fn();
const createCreationAction = jest.fn();
const createAddFeeAction = jest.fn();
const createAddPaymentInstructionAction = jest.fn();
const createAddRefundInstructionAction = jest.fn();

export const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions: jest.fn(),
  getNativeTokenExtensionForNetwork: jest.fn(),
  getAnyToNativeTokenExtensionForNetwork: jest.fn(),
  extensions: {
    addressBasedBtc:
      {} as Extension.PnAddressBased.IAddressBased<Extension.PnAddressBased.ICreationParameters>,
    addressBasedErc20: {
      createAddPaymentAddressAction,
      createAddRefundAddressAction,
      createCreationAction,
    } as any as Extension.PnAddressBased.IAddressBased<Extension.PnAddressBased.ICreationParameters>,
    addressBasedTestnetBtc:
      {} as Extension.PnAddressBased.IAddressBased<Extension.PnAddressBased.ICreationParameters>,
    contentData: {} as Extension.ContentData.IContentData,
    anyToErc20Proxy: {} as Extension.PnAnyToErc20.IAnyToERC20,
    declarative:
      {} as Extension.PnAnyDeclarative.IAnyDeclarative<Extension.PnAnyDeclarative.ICreationParameters>,
    ethereumInputData: {
      createAddPaymentAddressAction,
      createAddRefundAddressAction,
      createCreationAction,
      createAddPaymentInstructionAction,
      createAddRefundInstructionAction,
    } as any as Extension.PnReferenceBased.IReferenceBased<Extension.PnReferenceBased.ICreationParameters>,
    nativeToken:
      {} as Extension.PnReferenceBased.IReferenceBased<Extension.PnReferenceBased.ICreationParameters>[],
    feeProxyContractErc20: {
      createAddPaymentAddressAction,
      createAddRefundAddressAction,
      createCreationAction,
      createAddFeeAction,
      // inherited from declarative
      createAddPaymentInstructionAction,
      createAddRefundInstructionAction,
    } as any as Extension.PnFeeReferenceBased.IFeeReferenceBased<Extension.PnFeeReferenceBased.ICreationParameters>,
    proxyContractErc20: {
      createAddPaymentAddressAction,
      createAddRefundAddressAction,
      createCreationAction,
      // inheritance from declarative
      createAddPaymentInstructionAction,
      createAddRefundInstructionAction,
    } as any as Extension.PnReferenceBased.IReferenceBased<Extension.PnReferenceBased.ICreationParameters>,
    erc777Stream: {
      createAddPaymentAddressAction,
      createAddRefundAddressAction,
      createCreationAction,
      // inheritance from declarative
      createAddPaymentInstructionAction,
      createAddRefundInstructionAction,
    },
    feeProxyContractEth: {
      createAddPaymentAddressAction,
      createAddRefundAddressAction,
      createCreationAction,
      createAddPaymentInstructionAction,
      createAddRefundInstructionAction,
    } as any as Extension.PnFeeReferenceBased.IFeeReferenceBased<Extension.PnFeeReferenceBased.ICreationParameters>,
    anyToEthProxy:
      {} as Extension.PnFeeReferenceBased.IFeeReferenceBased<Extension.PnFeeReferenceBased.ICreationParameters>,
    anyToNativeToken:
      {} as Extension.PnFeeReferenceBased.IFeeReferenceBased<Extension.PnFeeReferenceBased.ICreationParameters>[],
    erc20TransferableReceivable: {
      createAddPaymentAddressAction,
      createAddRefundAddressAction,
      createCreationAction,
      // inheritance from declarative
      createAddPaymentInstructionAction,
      createAddRefundInstructionAction,
    } as any as Extension.PnFeeReferenceBased.IFeeReferenceBased<Extension.PnFeeReferenceBased.ICreationParameters>,
  },
};
