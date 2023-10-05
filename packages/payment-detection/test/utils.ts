import { AdvancedLogicTypes } from '@requestnetwork/types';

export const mockAdvancedLogicBase: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions: jest.fn(),
  getNativeTokenExtensionForNetwork: jest.fn(),
  getAnyToNativeTokenExtensionForNetwork: jest.fn(),
  getFeeProxyContractErc20ForNetwork: jest.fn(),
  extensions: {} as AdvancedLogicTypes.IAdvancedLogicExtensions,
};
