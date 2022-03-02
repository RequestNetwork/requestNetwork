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
    addressBasedErc20: {
      createAddPaymentAddressAction,
      createAddRefundAddressAction,
      createCreationAction,
    },
    feeProxyContractErc20: {
      supportedNetworks: ['mainnet', 'rinkeby'],
      createAddPaymentAddressAction,
      createAddRefundAddressAction,
      createCreationAction,
      createAddFeeAction,
      // inherited from declarative
      createAddPaymentInstructionAction,
      createAddRefundInstructionAction,
    },
    proxyContractErc20: {
      supportedNetworks: ['rinkeby'],
      createAddPaymentAddressAction,
      createAddRefundAddressAction,
      createCreationAction,
      // inheritance from declarative
      createAddPaymentInstructionAction,
      createAddRefundInstructionAction,
    },
    feeProxyContractErc20: {
      supportedNetworks: ['mainnet', 'private', 'matic', 'rinkeby'],
      version: '0.1.0',
      createAddPaymentAddressAction: jest.fn(),
      createAddRefundAddressAction: jest.fn(),
      createCreationAction: jest.fn(),
      createAddFeeAction: jest.fn(),
      // inherited from declarative
      createAddPaymentInstructionAction: jest.fn(),
      createAddRefundInstructionAction: jest.fn(),
    },
  },
};
