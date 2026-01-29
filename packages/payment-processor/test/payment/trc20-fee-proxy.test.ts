import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import { deepCopy } from '@requestnetwork/utils';
import { PaymentReferenceCalculator } from '@requestnetwork/payment-detection';

import * as tronUtils from '../../src/payment/utils-tron';
import {
  payTronFeeProxyRequest,
  approveTronFeeProxyRequest,
  hasSufficientTronAllowance,
  hasSufficientTronBalance,
  getTronPaymentInfo,
} from '../../src/payment/trc20-fee-proxy';
import { BigNumber } from 'ethers';

/* eslint-disable @typescript-eslint/no-unused-expressions */

const usdt = {
  type: RequestLogicTypes.CURRENCY.ERC20,
  value: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', // USDT on Tron
  network: 'tron',
};

const salt = 'a6475e4c3d45feb6';
const paymentAddress = 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE';
const feeAddress = 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs';
const network = 'tron';
const feeAmount = '5';

const request: any = {
  requestId: '0x123',
  expectedAmount: '100',
  currencyInfo: usdt,
  extensions: {
    [ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT]: {
      events: [],
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        salt,
        paymentAddress,
        feeAddress,
        network,
        feeAmount,
      },
      version: '0.1.0',
    },
  },
};

// Mock TronWeb instance
const createMockTronWeb = (overrides: Partial<tronUtils.TronWeb> = {}): tronUtils.TronWeb => ({
  address: {
    fromPrivateKey: jest.fn().mockReturnValue('TTestAddress123'),
    toHex: jest.fn().mockReturnValue('41...'),
    fromHex: jest.fn().mockReturnValue('T...'),
  },
  trx: {
    getBalance: jest.fn().mockResolvedValue(1000000000),
    sign: jest.fn().mockResolvedValue({}),
    sendRawTransaction: jest.fn().mockResolvedValue({ result: true, txid: 'mock-tx-hash' }),
  },
  contract: jest.fn().mockResolvedValue({
    balanceOf: jest.fn().mockReturnValue({
      call: jest.fn().mockResolvedValue('1000000000000000000'),
    }),
    allowance: jest.fn().mockReturnValue({
      call: jest.fn().mockResolvedValue('1000000000000000000'),
    }),
    approve: jest.fn().mockReturnValue({
      send: jest.fn().mockResolvedValue({ txid: 'approve-tx-hash' }),
    }),
    transferFromWithReferenceAndFee: jest.fn().mockReturnValue({
      send: jest.fn().mockResolvedValue({ txid: 'payment-tx-hash' }),
    }),
  }),
  transactionBuilder: {
    triggerSmartContract: jest.fn().mockResolvedValue({
      transaction: {},
      result: { result: true },
    }),
  },
  defaultAddress: {
    base58: 'TDTFFJuVQCxEixEmhLQJhcqdYnRiKrNCDv',
    hex: '41...',
  },
  toSun: jest.fn((amount) => amount * 1000000),
  fromSun: jest.fn((amount) => amount / 1000000),
  ...overrides,
});

describe('Tron Fee Proxy Payment', () => {
  let mockTronWeb: tronUtils.TronWeb;

  beforeEach(() => {
    mockTronWeb = createMockTronWeb();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('payTronFeeProxyRequest', () => {
    it('should pay a TRC20 request successfully', async () => {
      const paymentSpy = jest
        .spyOn(tronUtils, 'processTronFeeProxyPayment')
        .mockResolvedValue('mock-payment-tx');

      jest.spyOn(tronUtils, 'getTronAllowance').mockResolvedValue(BigNumber.from('1000000'));
      jest.spyOn(tronUtils, 'isTronAccountSolvent').mockResolvedValue(true);

      const result = await payTronFeeProxyRequest(request, mockTronWeb);

      expect(result).toBe('mock-payment-tx');
      expect(paymentSpy).toHaveBeenCalledWith(
        mockTronWeb,
        'tron',
        usdt.value,
        paymentAddress,
        expect.anything(), // amount
        expect.any(String), // payment reference
        feeAmount,
        feeAddress,
        undefined, // callback
      );
    });

    it('should throw if allowance is insufficient', async () => {
      jest.spyOn(tronUtils, 'getTronAllowance').mockResolvedValue(BigNumber.from('0'));

      await expect(payTronFeeProxyRequest(request, mockTronWeb)).rejects.toThrow(
        /Insufficient TRC20 allowance/,
      );
    });

    it('should throw if balance is insufficient', async () => {
      jest.spyOn(tronUtils, 'getTronAllowance').mockResolvedValue(BigNumber.from('1000000'));
      jest.spyOn(tronUtils, 'isTronAccountSolvent').mockResolvedValue(false);

      await expect(payTronFeeProxyRequest(request, mockTronWeb)).rejects.toThrow(
        /Insufficient TRC20 token balance/,
      );
    });

    it('should throw if network is not Tron', async () => {
      const invalidRequest = deepCopy(request);
      invalidRequest.currencyInfo.network = 'mainnet'; // Ethereum network

      await expect(payTronFeeProxyRequest(invalidRequest, mockTronWeb)).rejects.toThrow(
        /not a supported Tron network/,
      );
    });

    it('should throw if payment address is invalid', async () => {
      jest.spyOn(tronUtils, 'getTronAllowance').mockResolvedValue(BigNumber.from('1000000'));
      jest.spyOn(tronUtils, 'isTronAccountSolvent').mockResolvedValue(true);
      jest.spyOn(tronUtils, 'isValidTronAddress').mockReturnValue(false);

      await expect(payTronFeeProxyRequest(request, mockTronWeb)).rejects.toThrow(
        /Invalid Tron payment address/,
      );
    });

    it('should throw for wrong payment network extension', async () => {
      const invalidRequest = deepCopy(request);
      invalidRequest.extensions = {
        [ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA]: {
          ...invalidRequest.extensions[ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT],
        },
      };

      await expect(payTronFeeProxyRequest(invalidRequest, mockTronWeb)).rejects.toThrow();
    });
  });

  describe('approveTronFeeProxyRequest', () => {
    it('should approve TRC20 tokens for the proxy', async () => {
      const approveSpy = jest.spyOn(tronUtils, 'approveTrc20').mockResolvedValue('approve-tx-hash');

      const result = await approveTronFeeProxyRequest(request, mockTronWeb);

      expect(result).toBe('approve-tx-hash');
      expect(approveSpy).toHaveBeenCalledWith(
        mockTronWeb,
        usdt.value,
        'tron',
        expect.anything(), // total amount (payment + fee)
        undefined, // callback
      );
    });

    it('should throw if network is not Tron', async () => {
      const invalidRequest = deepCopy(request);
      invalidRequest.currencyInfo.network = 'matic';

      await expect(approveTronFeeProxyRequest(invalidRequest, mockTronWeb)).rejects.toThrow(
        /not a supported Tron network/,
      );
    });
  });

  describe('hasSufficientTronAllowance', () => {
    it('should return true if allowance is sufficient', async () => {
      jest.spyOn(tronUtils, 'getTronAllowance').mockResolvedValue(BigNumber.from('1000'));

      const result = await hasSufficientTronAllowance(request, mockTronWeb);

      expect(result).toBe(true);
    });

    it('should return false if allowance is insufficient', async () => {
      jest.spyOn(tronUtils, 'getTronAllowance').mockResolvedValue(BigNumber.from('0'));

      const result = await hasSufficientTronAllowance(request, mockTronWeb);

      expect(result).toBe(false);
    });
  });

  describe('hasSufficientTronBalance', () => {
    it('should return true if balance is sufficient', async () => {
      jest.spyOn(tronUtils, 'isTronAccountSolvent').mockResolvedValue(true);

      const result = await hasSufficientTronBalance(request, mockTronWeb);

      expect(result).toBe(true);
    });

    it('should return false if balance is insufficient', async () => {
      jest.spyOn(tronUtils, 'isTronAccountSolvent').mockResolvedValue(false);

      const result = await hasSufficientTronBalance(request, mockTronWeb);

      expect(result).toBe(false);
    });
  });

  describe('getTronPaymentInfo', () => {
    it('should return correct payment information', () => {
      const paymentInfo = getTronPaymentInfo(request);

      expect(paymentInfo.tokenAddress).toBe(usdt.value);
      expect(paymentInfo.paymentAddress).toBe(paymentAddress);
      expect(paymentInfo.amount).toBe('100');
      expect(paymentInfo.feeAmount).toBe('5');
      expect(paymentInfo.feeAddress).toBe(feeAddress);
      expect(paymentInfo.proxyAddress).toBeDefined();
      expect(paymentInfo.paymentReference).toBeDefined();
    });

    it('should throw if network is not Tron', () => {
      const invalidRequest = deepCopy(request);
      invalidRequest.currencyInfo.network = 'mainnet';

      expect(() => getTronPaymentInfo(invalidRequest)).toThrow(/not a supported Tron network/);
    });
  });
});

describe('Tron Utils', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('isValidTronAddress', () => {
    it('should return true for valid Tron addresses', () => {
      expect(tronUtils.isValidTronAddress('TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE')).toBe(true);
      expect(tronUtils.isValidTronAddress('TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs')).toBe(true);
      expect(tronUtils.isValidTronAddress('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t')).toBe(true);
    });

    it('should return false for invalid addresses', () => {
      expect(tronUtils.isValidTronAddress('')).toBe(false);
      expect(tronUtils.isValidTronAddress('0x123')).toBe(false);
      expect(tronUtils.isValidTronAddress('invalid')).toBe(false);
      expect(tronUtils.isValidTronAddress('Aqn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE')).toBe(false); // Wrong prefix
    });
  });

  describe('getERC20FeeProxyAddress', () => {
    it('should return the proxy address for tron mainnet', () => {
      const address = tronUtils.getERC20FeeProxyAddress('tron');
      expect(address).toBe('TCUDPYnS9dH3WvFEaE7wN7vnDa51J4R4fd');
    });

    it('should return the proxy address for nile testnet', () => {
      const address = tronUtils.getERC20FeeProxyAddress('nile');
      expect(address).toBe('THK5rNmrvCujhmrXa5DB1dASepwXTr9cJs');
    });
  });

  describe('encodeTronFeeProxyPayment', () => {
    it('should encode payment parameters correctly', () => {
      const encoded = tronUtils.encodeTronFeeProxyPayment(
        'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
        '100',
        '0xaabb',
        '5',
        'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs',
      );

      expect(encoded.functionSelector).toBe(
        'transferFromWithReferenceAndFee(address,address,uint256,bytes,uint256,address)',
      );
      expect(encoded.parameters).toHaveLength(6);
    });

    it('should format payment reference with 0x prefix', () => {
      const encoded = tronUtils.encodeTronFeeProxyPayment(
        'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
        '100',
        'aabb', // Without 0x
        '5',
        'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs',
      );

      const refParam = encoded.parameters[3] as { type: string; value: string };
      expect(refParam.value).toBe('0xaabb');
    });
  });
});

describe('Tron Payment with Nile Testnet', () => {
  const nileRequest: any = {
    ...request,
    currencyInfo: {
      ...usdt,
      network: 'nile',
    },
    extensions: {
      [ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT]: {
        ...request.extensions[ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT],
        values: {
          ...request.extensions[ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT].values,
          network: 'nile',
        },
      },
    },
  };

  it('should get payment info for Nile testnet', () => {
    const paymentInfo = getTronPaymentInfo(nileRequest);

    expect(paymentInfo.proxyAddress).toBe('THK5rNmrvCujhmrXa5DB1dASepwXTr9cJs');
  });
});
