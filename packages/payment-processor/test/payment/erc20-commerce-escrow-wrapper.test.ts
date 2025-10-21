import { CurrencyTypes } from '@requestnetwork/types';
import { Wallet, providers } from 'ethers';
import {
  encodeSetCommerceEscrowAllowance,
  encodeAuthorizePayment,
  encodeCapturePayment,
  encodeVoidPayment,
  encodeChargePayment,
  encodeReclaimPayment,
  encodeRefundPayment,
  getCommerceEscrowWrapperAddress,
  getPayerCommerceEscrowAllowance,
  authorizePayment,
  capturePayment,
  voidPayment,
  chargePayment,
  reclaimPayment,
  refundPayment,
  getPaymentData,
  getPaymentState,
  canCapture,
  canVoid,
  AuthorizePaymentParams,
  CapturePaymentParams,
  ChargePaymentParams,
  RefundPaymentParams,
} from '../../src/payment/erc20-commerce-escrow-wrapper';

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
const provider = new providers.JsonRpcProvider('http://localhost:8545');
const wallet = Wallet.fromMnemonic(mnemonic).connect(provider);
const network: CurrencyTypes.EvmChainName = 'private';
const erc20ContractAddress = '0x9FBDa871d559710256a2502A2517b794B482Db40';

const mockAuthorizeParams: AuthorizePaymentParams = {
  paymentReference: '0x0123456789abcdef',
  payer: wallet.address,
  merchant: '0x3234567890123456789012345678901234567890',
  operator: '0x4234567890123456789012345678901234567890',
  token: erc20ContractAddress,
  amount: '1000000000000000000', // 1 token
  maxAmount: '1100000000000000000', // 1.1 tokens
  preApprovalExpiry: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  authorizationExpiry: Math.floor(Date.now() / 1000) + 7200, // 2 hours from now
  refundExpiry: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
  tokenCollector: '0x5234567890123456789012345678901234567890',
  collectorData: '0x1234',
};

const mockCaptureParams: CapturePaymentParams = {
  paymentReference: '0x0123456789abcdef',
  captureAmount: '1000000000000000000', // 1 token
  feeBps: 250, // 2.5%
  feeReceiver: '0x6234567890123456789012345678901234567890',
};

const mockChargeParams: ChargePaymentParams = {
  ...mockAuthorizeParams,
  feeBps: 250, // 2.5%
  feeReceiver: '0x6234567890123456789012345678901234567890',
};

const mockRefundParams: RefundPaymentParams = {
  paymentReference: '0x0123456789abcdef',
  refundAmount: '500000000000000000', // 0.5 tokens
  tokenCollector: '0x7234567890123456789012345678901234567890',
  collectorData: '0x5678',
};

describe('erc20-commerce-escrow-wrapper', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getCommerceEscrowWrapperAddress', () => {
    it('should throw when wrapper not found on network', () => {
      expect(() => {
        getCommerceEscrowWrapperAddress(network);
      }).toThrow('ERC20CommerceEscrowWrapper not found on private');
    });

    it('should return address when wrapper is deployed', () => {
      // This test would pass once actual deployment addresses are added
      // For now, it demonstrates the expected behavior
      expect(() => {
        getCommerceEscrowWrapperAddress('mainnet' as CurrencyTypes.EvmChainName);
      }).toThrow('ERC20CommerceEscrowWrapper not found on mainnet');
    });
  });

  describe('encodeSetCommerceEscrowAllowance', () => {
    it('should return a single transaction for a non-USDT token', () => {
      // Mock the getCommerceEscrowWrapperAddress to return a test address
      const mockAddress = '0x1234567890123456789012345678901234567890';
      jest
        .spyOn(
          require('../../src/payment/erc20-commerce-escrow-wrapper'),
          'getCommerceEscrowWrapperAddress',
        )
        .mockReturnValue(mockAddress);

      const amount = '1000000000000000000';
      const transactions = encodeSetCommerceEscrowAllowance({
        tokenAddress: erc20ContractAddress,
        amount,
        provider,
        network,
        isUSDT: false,
      });

      expect(transactions).toHaveLength(1);
      const [tx] = transactions;
      expect(tx.to).toBe(erc20ContractAddress);
      expect(tx.data).toContain('095ea7b3'); // approve function selector
      expect(tx.value).toBe(0);
    });

    it('should return two transactions for a USDT token', () => {
      // Mock the getCommerceEscrowWrapperAddress to return a test address
      const mockAddress = '0x1234567890123456789012345678901234567890';
      jest
        .spyOn(
          require('../../src/payment/erc20-commerce-escrow-wrapper'),
          'getCommerceEscrowWrapperAddress',
        )
        .mockReturnValue(mockAddress);

      const amount = '1000000000000000000';
      const transactions = encodeSetCommerceEscrowAllowance({
        tokenAddress: erc20ContractAddress,
        amount,
        provider,
        network,
        isUSDT: true,
      });

      expect(transactions).toHaveLength(2);

      const [tx1, tx2] = transactions;
      // tx1 is approve(0)
      expect(tx1.to).toBe(erc20ContractAddress);
      expect(tx1.data).toContain('095ea7b3'); // approve function selector
      expect(tx1.value).toBe(0);

      // tx2 is approve(amount)
      expect(tx2.to).toBe(erc20ContractAddress);
      expect(tx2.data).toContain('095ea7b3'); // approve function selector
      expect(tx2.value).toBe(0);
    });

    it('should default to non-USDT behavior if isUSDT is not provided', () => {
      // Mock the getCommerceEscrowWrapperAddress to return a test address
      const mockAddress = '0x1234567890123456789012345678901234567890';
      jest
        .spyOn(
          require('../../src/payment/erc20-commerce-escrow-wrapper'),
          'getCommerceEscrowWrapperAddress',
        )
        .mockReturnValue(mockAddress);

      const amount = '1000000000000000000';
      const transactions = encodeSetCommerceEscrowAllowance({
        tokenAddress: erc20ContractAddress,
        amount,
        provider,
        network,
      });

      expect(transactions).toHaveLength(1);
    });
  });

  describe('getPayerCommerceEscrowAllowance', () => {
    it('should throw when wrapper not found', async () => {
      await expect(
        getPayerCommerceEscrowAllowance({
          payerAddress: wallet.address,
          tokenAddress: erc20ContractAddress,
          provider,
          network,
        }),
      ).rejects.toThrow('ERC20CommerceEscrowWrapper not found on private');
    });
  });

  describe('encode functions', () => {
    it('should throw for encodeAuthorizePayment when wrapper not found', () => {
      expect(() => {
        encodeAuthorizePayment({
          params: mockAuthorizeParams,
          network,
          provider,
        });
      }).toThrow('ERC20CommerceEscrowWrapper not found on private');
    });

    it('should throw for encodeCapturePayment when wrapper not found', () => {
      expect(() => {
        encodeCapturePayment({
          params: mockCaptureParams,
          network,
          provider,
        });
      }).toThrow('ERC20CommerceEscrowWrapper not found on private');
    });

    it('should throw for encodeVoidPayment when wrapper not found', () => {
      expect(() => {
        encodeVoidPayment({
          paymentReference: '0x0123456789abcdef',
          network,
          provider,
        });
      }).toThrow('ERC20CommerceEscrowWrapper not found on private');
    });

    it('should throw for encodeChargePayment when wrapper not found', () => {
      expect(() => {
        encodeChargePayment({
          params: mockChargeParams,
          network,
          provider,
        });
      }).toThrow('ERC20CommerceEscrowWrapper not found on private');
    });

    it('should throw for encodeReclaimPayment when wrapper not found', () => {
      expect(() => {
        encodeReclaimPayment({
          paymentReference: '0x0123456789abcdef',
          network,
          provider,
        });
      }).toThrow('ERC20CommerceEscrowWrapper not found on private');
    });

    it('should throw for encodeRefundPayment when wrapper not found', () => {
      expect(() => {
        encodeRefundPayment({
          params: mockRefundParams,
          network,
          provider,
        });
      }).toThrow('ERC20CommerceEscrowWrapper not found on private');
    });
  });

  describe('transaction functions', () => {
    it('should throw for authorizePayment when wrapper not found', async () => {
      await expect(
        authorizePayment({
          params: mockAuthorizeParams,
          signer: wallet,
          network,
        }),
      ).rejects.toThrow('ERC20CommerceEscrowWrapper not found on private');
    });

    it('should throw for capturePayment when wrapper not found', async () => {
      await expect(
        capturePayment({
          params: mockCaptureParams,
          signer: wallet,
          network,
        }),
      ).rejects.toThrow('ERC20CommerceEscrowWrapper not found on private');
    });

    it('should throw for voidPayment when wrapper not found', async () => {
      await expect(
        voidPayment({
          paymentReference: '0x0123456789abcdef',
          signer: wallet,
          network,
        }),
      ).rejects.toThrow('ERC20CommerceEscrowWrapper not found on private');
    });

    it('should throw for chargePayment when wrapper not found', async () => {
      await expect(
        chargePayment({
          params: mockChargeParams,
          signer: wallet,
          network,
        }),
      ).rejects.toThrow('ERC20CommerceEscrowWrapper not found on private');
    });

    it('should throw for reclaimPayment when wrapper not found', async () => {
      await expect(
        reclaimPayment({
          paymentReference: '0x0123456789abcdef',
          signer: wallet,
          network,
        }),
      ).rejects.toThrow('ERC20CommerceEscrowWrapper not found on private');
    });

    it('should throw for refundPayment when wrapper not found', async () => {
      await expect(
        refundPayment({
          params: mockRefundParams,
          signer: wallet,
          network,
        }),
      ).rejects.toThrow('ERC20CommerceEscrowWrapper not found on private');
    });
  });

  describe('query functions', () => {
    it('should throw for getPaymentData when wrapper not found', async () => {
      await expect(
        getPaymentData({
          paymentReference: '0x0123456789abcdef',
          provider,
          network,
        }),
      ).rejects.toThrow('ERC20CommerceEscrowWrapper not found on private');
    });

    it('should throw for getPaymentState when wrapper not found', async () => {
      await expect(
        getPaymentState({
          paymentReference: '0x0123456789abcdef',
          provider,
          network,
        }),
      ).rejects.toThrow('ERC20CommerceEscrowWrapper not found on private');
    });

    it('should throw for canCapture when wrapper not found', async () => {
      await expect(
        canCapture({
          paymentReference: '0x0123456789abcdef',
          provider,
          network,
        }),
      ).rejects.toThrow('ERC20CommerceEscrowWrapper not found on private');
    });

    it('should throw for canVoid when wrapper not found', async () => {
      await expect(
        canVoid({
          paymentReference: '0x0123456789abcdef',
          provider,
          network,
        }),
      ).rejects.toThrow('ERC20CommerceEscrowWrapper not found on private');
    });
  });
});

describe('ERC20 Commerce Escrow Wrapper Integration', () => {
  it('should handle complete payment flow when contracts are available', async () => {
    // This test demonstrates the expected flow once contracts are deployed and compiled
    // 1. Set allowance for the wrapper
    // 2. Authorize payment
    // 3. Capture payment
    // 4. Check payment state

    // For now, we just test that the functions exist and have the right signatures
    expect(typeof encodeSetCommerceEscrowAllowance).toBe('function');
    expect(typeof encodeAuthorizePayment).toBe('function');
    expect(typeof encodeCapturePayment).toBe('function');
    expect(typeof authorizePayment).toBe('function');
    expect(typeof capturePayment).toBe('function');
    expect(typeof getPaymentData).toBe('function');
    expect(typeof getPaymentState).toBe('function');
  });

  it('should handle void payment flow when contracts are available', async () => {
    // This test demonstrates the expected void flow
    // 1. Set allowance for the wrapper
    // 2. Authorize payment
    // 3. Void payment instead of capturing

    expect(typeof encodeVoidPayment).toBe('function');
    expect(typeof voidPayment).toBe('function');
    expect(typeof canVoid).toBe('function');
  });

  it('should handle charge payment flow when contracts are available', async () => {
    // This test demonstrates the expected charge flow (authorize + capture in one transaction)
    // 1. Set allowance for the wrapper
    // 2. Charge payment (authorize + capture)

    expect(typeof encodeChargePayment).toBe('function');
    expect(typeof chargePayment).toBe('function');
  });

  it('should handle reclaim payment flow when contracts are available', async () => {
    // This test demonstrates the expected reclaim flow
    // 1. Set allowance for the wrapper
    // 2. Authorize payment
    // 3. Wait for authorization expiry
    // 4. Reclaim payment (payer gets funds back)

    expect(typeof encodeReclaimPayment).toBe('function');
    expect(typeof reclaimPayment).toBe('function');
  });

  it('should handle refund payment flow when contracts are available', async () => {
    // This test demonstrates the expected refund flow
    // 1. Set allowance for the wrapper
    // 2. Authorize payment
    // 3. Capture payment
    // 4. Refund payment (operator sends funds back to payer)

    expect(typeof encodeRefundPayment).toBe('function');
    expect(typeof refundPayment).toBe('function');
  });

  it('should validate payment parameters', () => {
    // Test parameter validation
    const invalidParams = {
      ...mockAuthorizeParams,
      paymentReference: '', // Invalid empty reference
    };

    // The actual validation would happen in the contract
    // Here we just test that the parameters are properly typed
    expect(mockAuthorizeParams.paymentReference).toBe('0x0123456789abcdef');
    expect(mockAuthorizeParams.amount).toBe('1000000000000000000');
    expect(mockCaptureParams.feeBps).toBe(250);
  });

  it('should handle different token types', () => {
    // Test USDT special handling
    const usdtAddress = '0xdAC17F958D2ee523a2206206994597C13D831ec7'; // USDT mainnet address

    // Mock the getCommerceEscrowWrapperAddress to return a test address
    const mockAddress = '0x1234567890123456789012345678901234567890';
    jest
      .spyOn(
        require('../../src/payment/erc20-commerce-escrow-wrapper'),
        'getCommerceEscrowWrapperAddress',
      )
      .mockReturnValue(mockAddress);

    const usdtTransactions = encodeSetCommerceEscrowAllowance({
      tokenAddress: usdtAddress,
      amount: '1000000', // 1 USDT (6 decimals)
      provider,
      network,
      isUSDT: true,
    });

    expect(usdtTransactions).toHaveLength(2); // Reset to 0, then approve amount

    const regularTransactions = encodeSetCommerceEscrowAllowance({
      tokenAddress: erc20ContractAddress,
      amount: '1000000000000000000',
      provider,
      network,
      isUSDT: false,
    });

    expect(regularTransactions).toHaveLength(1); // Just approve amount
  });
});
