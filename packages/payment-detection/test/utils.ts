import { AdvancedLogicTypes, CurrencyTypes } from '@requestnetwork/types';
import { DetectorOptions } from '../src/types';
import { mockAdvancedLogic } from '@requestnetwork/integration-test/test/scheduled/mocks';
import { CurrencyManager } from '@requestnetwork/currency';

export const defaultPaymentDetectorOptions: DetectorOptions<any> = {
  network: 'mainnet',
  advancedLogic: mockAdvancedLogic,
  currencyManager: CurrencyManager.getDefault(),
  explorerApiKeys: {},
  getSubgraphClient: jest.fn(),
  subgraphMinIndexedBlock: undefined,
  getRpcProvider: jest.fn(),
};

export const mockAdvancedLogicBase: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions: jest.fn(),
  getNativeTokenExtensionForNetwork: jest.fn(),
  getAnyToNativeTokenExtensionForNetwork: jest.fn(),
  getFeeProxyContractErc20ForNetwork: jest.fn(),
  extensions: {} as AdvancedLogicTypes.IAdvancedLogicExtensions,
};
