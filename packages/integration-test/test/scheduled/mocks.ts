import { AdvancedLogicTypes } from '@requestnetwork/types';
import { IExtension } from 'types/src/extension-types';

export const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions: jest.fn(),
  extensions: {
    addressBasedErc20: {
      createAddPaymentAddressAction: jest.fn(),
      createAddRefundAddressAction: jest.fn(),
      createCreationAction: jest.fn(),
      applyActionToExtension: jest.fn(),
    } as IExtension,
  },
};
