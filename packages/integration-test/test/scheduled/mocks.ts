import { AdvancedLogicTypes } from '@requestnetwork/types';

const createAddPaymentAddressAction = jest.fn();
const createAddRefundAddressAction = jest.fn();
const createCreationAction = jest.fn();
const createAddFeeAction = jest.fn();
const createAddPaymentInstructionAction = jest.fn();
const createAddRefundInstructionAction = jest.fn();

export const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions(): any {
    return;
  },
  extensions: {
    declarative: {},
    addressBasedErc20: {
      createAddPaymentAddressAction,
      createAddRefundAddressAction,
      createCreationAction,
    },
    feeProxyContractErc20: {
      createAddPaymentAddressAction,
      createAddRefundAddressAction,
      createCreationAction,
      createAddFeeAction,
      // inherited from declarative
      createAddPaymentInstructionAction,
      createAddRefundInstructionAction,
    },
    proxyContractErc20: {
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
    },
    ethereumInputData: {
      createAddPaymentAddressAction,
      createAddRefundAddressAction,
      createCreationAction,
      createAddPaymentInstructionAction,
      createAddRefundInstructionAction,
    },
    erc777Stream: {
      createAddPaymentAddressAction,
      createAddRefundAddressAction,
      createCreationAction,
      // inheritance from declarative
      createAddPaymentInstructionAction,
      createAddRefundInstructionAction,
    },
  },
};
