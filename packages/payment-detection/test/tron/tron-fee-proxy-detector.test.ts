import {
  CurrencyTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { TronERC20FeeProxyPaymentDetector } from '../../src/tron/tron-fee-proxy-detector';

// Mock the hasura-client module so we can control getHasuraClient's return value
jest.mock('../../src/tron/retrievers/hasura-client', () => {
  const actual = jest.requireActual('../../src/tron/retrievers/hasura-client');
  return {
    ...actual,
    getHasuraClient: jest.fn(actual.getHasuraClient),
  };
});

import { getHasuraClient } from '../../src/tron/retrievers/hasura-client';
const mockedGetHasuraClient = getHasuraClient as jest.MockedFunction<typeof getHasuraClient>;

describe('TronERC20FeeProxyPaymentDetector', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    mockedGetHasuraClient.mockReset();
  });

  describe('getDeploymentInformation', () => {
    it('should return correct address for TRON mainnet', () => {
      const info = TronERC20FeeProxyPaymentDetector.getDeploymentInformation('tron');
      expect(info.address).toBe('TCUDPYnS9dH3WvFEaE7wN7vnDa51J4R4fd');
      expect(info.creationBlockNumber).toBe(79216121);
    });

    it('should return correct address for Nile testnet', () => {
      const info = TronERC20FeeProxyPaymentDetector.getDeploymentInformation('nile');
      expect(info.address).toBe('THK5rNmrvCujhmrXa5DB1dASepwXTr9cJs');
      expect(info.creationBlockNumber).toBe(63208782);
    });
  });

  describe('constructor', () => {
    const mockAdvancedLogic = {
      getFeeProxyContractErc20ForNetwork: jest.fn().mockReturnValue(undefined),
      extensions: {
        feeProxyContractErc20: {
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          version: '0.1.0',
        },
      },
    };

    const mockCurrencyManager = {
      from: jest.fn(),
      fromStorageCurrency: jest.fn(),
    };

    it('should create detector for TRON network', () => {
      const detector = new TronERC20FeeProxyPaymentDetector({
        advancedLogic: mockAdvancedLogic as any,
        currencyManager: mockCurrencyManager as any,
        network: 'tron',
      });

      expect(detector).toBeInstanceOf(TronERC20FeeProxyPaymentDetector);
    });

    it('should create detector for Nile network', () => {
      const detector = new TronERC20FeeProxyPaymentDetector({
        advancedLogic: mockAdvancedLogic as any,
        currencyManager: mockCurrencyManager as any,
        network: 'nile',
      });

      expect(detector).toBeInstanceOf(TronERC20FeeProxyPaymentDetector);
    });
  });

  describe('extractEvents', () => {
    const mockAdvancedLogic = {
      getFeeProxyContractErc20ForNetwork: jest.fn().mockReturnValue(undefined),
      extensions: {
        feeProxyContractErc20: {
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          version: '0.1.0',
        },
      },
    };

    const mockCurrencyManager = {
      from: jest.fn(),
      fromStorageCurrency: jest.fn().mockReturnValue({
        symbol: 'USDT',
        decimals: 6,
        network: 'tron',
        address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      }),
    };

    it('should throw error when Hasura client is not available', async () => {
      // Mock getHasuraClient to return undefined (simulating misconfiguration)
      mockedGetHasuraClient.mockReturnValue(undefined);

      const detector = new TronERC20FeeProxyPaymentDetector({
        advancedLogic: mockAdvancedLogic as any,
        currencyManager: mockCurrencyManager as any,
        network: 'tron',
      });

      // Access protected method through casting
      const extractEvents = (detector as any).extractEvents.bind(detector);

      await expect(
        extractEvents(
          PaymentTypes.EVENTS_NAMES.PAYMENT,
          'TToAddress12345678901234567890123',
          'paymentref123',
          {
            value: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
            network: 'tron',
          } as RequestLogicTypes.ICurrency,
          'tron' as CurrencyTypes.TronChainName,
          { version: '0.1.0' } as ExtensionTypes.IState,
        ),
      ).rejects.toThrow('Could not get a Hasura client for TRON chain tron');
    });

    it('should return empty events when toAddress is undefined', async () => {
      const detector = new TronERC20FeeProxyPaymentDetector({
        advancedLogic: mockAdvancedLogic as any,
        currencyManager: mockCurrencyManager as any,
        network: 'tron',
      });

      // Access protected method through casting
      const extractEvents = (detector as any).extractEvents.bind(detector);

      const result = await extractEvents(
        PaymentTypes.EVENTS_NAMES.PAYMENT,
        undefined,
        'paymentref123',
        {
          value: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
          network: 'tron',
        } as RequestLogicTypes.ICurrency,
        'tron' as CurrencyTypes.TronChainName,
        { version: '0.1.0' } as ExtensionTypes.IState,
      );

      expect(result.paymentEvents).toHaveLength(0);
    });

    it('should throw NetworkNotSupported for unsupported chains', async () => {
      const detector = new TronERC20FeeProxyPaymentDetector({
        advancedLogic: mockAdvancedLogic as any,
        currencyManager: mockCurrencyManager as any,
        network: 'tron',
      });

      // Access protected method through casting
      const extractEvents = (detector as any).extractEvents.bind(detector);

      await expect(
        extractEvents(
          PaymentTypes.EVENTS_NAMES.PAYMENT,
          'TToAddress12345678901234567890123',
          'paymentref123',
          {
            value: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
            network: 'nile',
          } as RequestLogicTypes.ICurrency,
          'nile' as CurrencyTypes.TronChainName, // Different from instantiated network
          { version: '0.1.0' } as ExtensionTypes.IState,
        ),
      ).rejects.toThrow("Unsupported network 'nile' for payment detector instantiated with 'tron'");
    });
  });
});
