import { AdvancedLogicTypes } from '@requestnetwork/types';

export const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions: jest.fn(),
  extensions: {
    addressBasedErc20: {
      createAddPaymentAddressAction: jest.fn(),
      createAddRefundAddressAction: jest.fn(),
      createCreationAction: jest.fn(),
    },
    streamErc777: {
      createAddPaymentAddressAction: jest.fn(),
      createAddRefundAddressAction: jest.fn(),
      createCreationAction: jest.fn(),
    },
  },
};
