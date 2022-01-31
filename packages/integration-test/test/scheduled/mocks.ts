import { AdvancedLogicTypes } from '@requestnetwork/types';

export const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions: jest.fn(),
  extensions: {
    addressBasedErc20: {
      createAddPaymentAddressAction: jest.fn(),
      createAddRefundAddressAction: jest.fn(),
      createCreationAction: jest.fn(),
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
