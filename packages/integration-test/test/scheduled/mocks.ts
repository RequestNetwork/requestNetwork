import { AdvancedLogicTypes } from '@requestnetwork/types';

const createAddPaymentAddressAction = jest.fn();
const createAddRefundAddressAction = jest.fn();
const createCreationAction = jest.fn();
const createAddFeeAction = jest.fn();
const createAddPaymentInstructionAction = jest.fn();
const createAddRefundInstructionAction = jest.fn();

export const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions: jest.fn(),
  extensions: {
    addressBasedErc20: {
      createAddPaymentAddressAction,
      createAddRefundAddressAction,
      createCreationAction,
    },
    feeProxyContractErc20: {
      supportedNetworks: ['mainnet', 'rinkeby', 'private', 'matic'],
      createAddPaymentAddressAction,
      createAddRefundAddressAction,
      createCreationAction,
      createAddFeeAction,
      // inherited from declarative
      createAddPaymentInstructionAction,
      createAddRefundInstructionAction,
    },
    proxyContractErc20: {
      supportedNetworks: ['rinkeby', 'private'],
      createAddPaymentAddressAction,
      createAddRefundAddressAction,
      createCreationAction,
      // inheritance from declarative
      createAddPaymentInstructionAction,
      createAddRefundInstructionAction,
    },
  },
};
