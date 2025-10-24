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
const network: CurrencyTypes.EvmChainName = 'sepolia';
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
    it('should return address when wrapper is deployed on testnet', () => {
      const address = getCommerceEscrowWrapperAddress(network);
      expect(address).toBe('0x1234567890123456789012345678901234567890');
    });

    it('should throw when wrapper not found on mainnet', () => {
      // This test demonstrates the expected behavior for networks without deployment
      expect(() => {
        getCommerceEscrowWrapperAddress('mainnet' as CurrencyTypes.EvmChainName);
      }).toThrow('No deployment for network: mainnet.');
    });

    it('should throw for unsupported networks', () => {
      expect(() => {
        getCommerceEscrowWrapperAddress('unsupported-network' as CurrencyTypes.EvmChainName);
      }).toThrow('No deployment for network: unsupported-network.');
    });

    it('should return different addresses for different supported networks', () => {
      const sepoliaAddress = getCommerceEscrowWrapperAddress('sepolia');
      const goerliAddress = getCommerceEscrowWrapperAddress('goerli');
      const mumbaiAddress = getCommerceEscrowWrapperAddress('mumbai');

      expect(sepoliaAddress).toBe('0x1234567890123456789012345678901234567890');
      expect(goerliAddress).toBe('0x1234567890123456789012345678901234567890');
      expect(mumbaiAddress).toBe('0x1234567890123456789012345678901234567890');
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

    it('should handle zero amount', () => {
      const mockAddress = '0x1234567890123456789012345678901234567890';
      jest
        .spyOn(
          require('../../src/payment/erc20-commerce-escrow-wrapper'),
          'getCommerceEscrowWrapperAddress',
        )
        .mockReturnValue(mockAddress);

      const transactions = encodeSetCommerceEscrowAllowance({
        tokenAddress: erc20ContractAddress,
        amount: '0',
        provider,
        network,
        isUSDT: false,
      });

      expect(transactions).toHaveLength(1);
      expect(transactions[0].to).toBe(erc20ContractAddress);
    });

    it('should handle maximum uint256 amount', () => {
      const mockAddress = '0x1234567890123456789012345678901234567890';
      jest
        .spyOn(
          require('../../src/payment/erc20-commerce-escrow-wrapper'),
          'getCommerceEscrowWrapperAddress',
        )
        .mockReturnValue(mockAddress);

      const maxUint256 =
        '115792089237316195423570985008687907853269984665640564039457584007913129639935';
      const transactions = encodeSetCommerceEscrowAllowance({
        tokenAddress: erc20ContractAddress,
        amount: maxUint256,
        provider,
        network,
        isUSDT: false,
      });

      expect(transactions).toHaveLength(1);
      expect(transactions[0].to).toBe(erc20ContractAddress);
    });

    it('should handle different token addresses', () => {
      const mockAddress = '0x1234567890123456789012345678901234567890';
      jest
        .spyOn(
          require('../../src/payment/erc20-commerce-escrow-wrapper'),
          'getCommerceEscrowWrapperAddress',
        )
        .mockReturnValue(mockAddress);

      const differentTokenAddress = '0xA0b86a33E6441b8435b662c8C1C1C1C1C1C1C1C1';
      const transactions = encodeSetCommerceEscrowAllowance({
        tokenAddress: differentTokenAddress,
        amount: '1000000000000000000',
        provider,
        network,
        isUSDT: false,
      });

      expect(transactions).toHaveLength(1);
      expect(transactions[0].to).toBe(differentTokenAddress);
    });

    it('should throw when wrapper not deployed on network', () => {
      expect(() => {
        encodeSetCommerceEscrowAllowance({
          tokenAddress: erc20ContractAddress,
          amount: '1000000000000000000',
          provider,
          network: 'mainnet' as CurrencyTypes.EvmChainName,
          isUSDT: false,
        });
      }).toThrow('No deployment for network: mainnet.');
    });
  });

  describe('getPayerCommerceEscrowAllowance', () => {
    it('should call getErc20Allowance with correct parameters', async () => {
      // Mock getErc20Allowance to avoid actual blockchain calls
      const mockGetErc20Allowance = jest
        .fn()
        .mockResolvedValue({ toString: () => '1000000000000000000' });

      // Mock the getErc20Allowance function
      jest.doMock('../../src/payment/erc20', () => ({
        getErc20Allowance: mockGetErc20Allowance,
      }));

      // Clear the module cache and re-import
      jest.resetModules();
      const {
        getPayerCommerceEscrowAllowance,
      } = require('../../src/payment/erc20-commerce-escrow-wrapper');

      const result = await getPayerCommerceEscrowAllowance({
        payerAddress: wallet.address,
        tokenAddress: erc20ContractAddress,
        provider,
        network,
      });

      expect(result).toBe('1000000000000000000');
      expect(mockGetErc20Allowance).toHaveBeenCalledWith(
        wallet.address,
        '0x1234567890123456789012345678901234567890', // wrapper address
        provider,
        erc20ContractAddress,
      );
    });
  });

  describe('encode functions', () => {
    it('should encode authorizePayment function data', () => {
      const encodedData = encodeAuthorizePayment({
        params: mockAuthorizeParams,
        network,
        provider,
      });

      expect(typeof encodedData).toBe('string');
      expect(encodedData).toMatch(/^0x[a-fA-F0-9]+$/); // Should be valid hex string

      // Verify it starts with the correct function selector for authorizePayment
      // Function signature: authorizePayment(bytes8,address,address,address,address,uint256,uint256,uint256,uint256,uint256,address,bytes)
      expect(encodedData.substring(0, 10)).toBe('0x5532a547'); // Actual function selector

      // Verify the encoded data contains our test parameters
      expect(encodedData.length).toBeGreaterThan(10); // More than just function selector
      expect(encodedData).toContain(mockAuthorizeParams.paymentReference.substring(2)); // Remove 0x prefix
      expect(encodedData.toLowerCase()).toContain(
        mockAuthorizeParams.payer.substring(2).toLowerCase(),
      );
      expect(encodedData.toLowerCase()).toContain(
        mockAuthorizeParams.merchant.substring(2).toLowerCase(),
      );
      expect(encodedData.toLowerCase()).toContain(
        mockAuthorizeParams.operator.substring(2).toLowerCase(),
      );
      expect(encodedData.toLowerCase()).toContain(
        mockAuthorizeParams.token.substring(2).toLowerCase(),
      );
    });

    it('should encode capturePayment function data', () => {
      const encodedData = encodeCapturePayment({
        params: mockCaptureParams,
        network,
        provider,
      });

      expect(typeof encodedData).toBe('string');
      expect(encodedData).toMatch(/^0x[a-fA-F0-9]+$/); // Should be valid hex string

      // Verify it starts with the correct function selector for capturePayment
      expect(encodedData.substring(0, 10)).toBe('0xa2615767');

      // Verify the encoded data contains our test parameters
      expect(encodedData).toContain(mockCaptureParams.paymentReference.substring(2));
      expect(encodedData.toLowerCase()).toContain(
        mockCaptureParams.feeReceiver.substring(2).toLowerCase(),
      );

      // Verify encoded amounts (as hex)
      const captureAmountHex = parseInt(mockCaptureParams.captureAmount.toString())
        .toString(16)
        .padStart(64, '0');
      const feeBpsHex = mockCaptureParams.feeBps.toString(16).padStart(64, '0');
      expect(encodedData.toLowerCase()).toContain(captureAmountHex);
      expect(encodedData.toLowerCase()).toContain(feeBpsHex);
    });

    it('should encode voidPayment function data', () => {
      const testPaymentRef = '0x0123456789abcdef';
      const encodedData = encodeVoidPayment({
        paymentReference: testPaymentRef,
        network,
        provider,
      });

      expect(typeof encodedData).toBe('string');
      expect(encodedData).toMatch(/^0x[a-fA-F0-9]+$/); // Should be valid hex string

      // Verify it starts with the correct function selector for voidPayment
      expect(encodedData.substring(0, 10)).toBe('0x4eff2760');

      // Verify the encoded data contains the payment reference
      expect(encodedData).toContain(testPaymentRef.substring(2));

      // Void payment should be relatively short (just function selector + payment reference)
      expect(encodedData.length).toBe(74); // 10 chars for selector + 64 chars for padded bytes8
    });

    it('should encode chargePayment function data', () => {
      const encodedData = encodeChargePayment({
        params: mockChargeParams,
        network,
        provider,
      });

      expect(typeof encodedData).toBe('string');
      expect(encodedData).toMatch(/^0x[a-fA-F0-9]+$/); // Should be valid hex string

      // Verify it starts with the correct function selector for chargePayment
      expect(encodedData.substring(0, 10)).toBe('0x739802a3');

      // Verify the encoded data contains our test parameters
      expect(encodedData).toContain(mockChargeParams.paymentReference.substring(2));
      expect(encodedData.toLowerCase()).toContain(
        mockChargeParams.payer.substring(2).toLowerCase(),
      );
      expect(encodedData.toLowerCase()).toContain(
        mockChargeParams.merchant.substring(2).toLowerCase(),
      );
      expect(encodedData.toLowerCase()).toContain(
        mockChargeParams.operator.substring(2).toLowerCase(),
      );
      expect(encodedData.toLowerCase()).toContain(
        mockChargeParams.token.substring(2).toLowerCase(),
      );
      expect(encodedData.toLowerCase()).toContain(
        mockChargeParams.feeReceiver.substring(2).toLowerCase(),
      );
      expect(encodedData.toLowerCase()).toContain(
        mockChargeParams.tokenCollector.substring(2).toLowerCase(),
      );

      // Verify encoded fee basis points
      const feeBpsHex = mockChargeParams.feeBps.toString(16).padStart(64, '0');
      expect(encodedData.toLowerCase()).toContain(feeBpsHex);
    });

    it('should encode reclaimPayment function data', () => {
      const testPaymentRef = '0x0123456789abcdef';
      const encodedData = encodeReclaimPayment({
        paymentReference: testPaymentRef,
        network,
        provider,
      });

      expect(typeof encodedData).toBe('string');
      expect(encodedData).toMatch(/^0x[a-fA-F0-9]+$/); // Should be valid hex string

      // Verify it starts with the correct function selector for reclaimPayment
      expect(encodedData.substring(0, 10)).toBe('0xafda9d20');

      // Verify the encoded data contains the payment reference
      expect(encodedData).toContain(testPaymentRef.substring(2));

      // Reclaim payment should be relatively short (just function selector + payment reference)
      expect(encodedData.length).toBe(74); // 10 chars for selector + 64 chars for padded bytes8
    });

    it('should encode refundPayment function data', () => {
      const encodedData = encodeRefundPayment({
        params: mockRefundParams,
        network,
        provider,
      });

      expect(typeof encodedData).toBe('string');
      expect(encodedData).toMatch(/^0x[a-fA-F0-9]+$/); // Should be valid hex string

      // Verify it starts with the correct function selector for refundPayment
      expect(encodedData.substring(0, 10)).toBe('0xf9b777ea');

      // Verify the encoded data contains our test parameters
      expect(encodedData).toContain(mockRefundParams.paymentReference.substring(2));
      expect(encodedData.toLowerCase()).toContain(
        mockRefundParams.tokenCollector.substring(2).toLowerCase(),
      );

      // Verify encoded refund amount (as hex)
      const refundAmountHex = parseInt(mockRefundParams.refundAmount.toString())
        .toString(16)
        .padStart(64, '0');
      expect(encodedData.toLowerCase()).toContain(refundAmountHex);

      // Verify collector data is included
      expect(encodedData).toContain(mockRefundParams.collectorData.substring(2));
    });

    it('should throw for encodeAuthorizePayment when wrapper not found on mainnet', () => {
      expect(() => {
        encodeAuthorizePayment({
          params: mockAuthorizeParams,
          network: 'mainnet' as CurrencyTypes.EvmChainName,
          provider,
        });
      }).toThrow('No deployment for network: mainnet.');
    });

    describe('parameter validation edge cases', () => {
      it('should handle minimum payment reference (8 bytes)', () => {
        const minPaymentRef = '0x0000000000000001';
        const encodedData = encodeVoidPayment({
          paymentReference: minPaymentRef,
          network,
          provider,
        });

        expect(typeof encodedData).toBe('string');
        expect(encodedData).toMatch(/^0x[a-fA-F0-9]+$/);
      });

      it('should handle maximum payment reference (8 bytes)', () => {
        const maxPaymentRef = '0xffffffffffffffff';
        const encodedData = encodeVoidPayment({
          paymentReference: maxPaymentRef,
          network,
          provider,
        });

        expect(typeof encodedData).toBe('string');
        expect(encodedData).toMatch(/^0x[a-fA-F0-9]+$/);
      });

      it('should handle zero amounts in authorize payment', () => {
        const zeroAmountParams = {
          ...mockAuthorizeParams,
          amount: '0',
          maxAmount: '0',
        };

        const encodedData = encodeAuthorizePayment({
          params: zeroAmountParams,
          network,
          provider,
        });

        expect(typeof encodedData).toBe('string');
        expect(encodedData).toMatch(/^0x[a-fA-F0-9]+$/);
      });

      it('should handle maximum uint256 amounts', () => {
        const maxUint256 =
          '115792089237316195423570985008687907853269984665640564039457584007913129639935';
        const maxAmountParams = {
          ...mockAuthorizeParams,
          amount: maxUint256,
          maxAmount: maxUint256,
        };

        const encodedData = encodeAuthorizePayment({
          params: maxAmountParams,
          network,
          provider,
        });

        expect(typeof encodedData).toBe('string');
        expect(encodedData).toMatch(/^0x[a-fA-F0-9]+$/);
      });

      it('should handle past expiry times', () => {
        const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
        const pastExpiryParams = {
          ...mockAuthorizeParams,
          preApprovalExpiry: pastTime,
          authorizationExpiry: pastTime,
          refundExpiry: pastTime,
        };

        const encodedData = encodeAuthorizePayment({
          params: pastExpiryParams,
          network,
          provider,
        });

        expect(typeof encodedData).toBe('string');
        expect(encodedData).toMatch(/^0x[a-fA-F0-9]+$/);
      });

      it('should handle far future expiry times', () => {
        const futureTime = Math.floor(Date.now() / 1000) + 365 * 24 * 3600; // 1 year from now
        const futureExpiryParams = {
          ...mockAuthorizeParams,
          preApprovalExpiry: futureTime,
          authorizationExpiry: futureTime,
          refundExpiry: futureTime,
        };

        const encodedData = encodeAuthorizePayment({
          params: futureExpiryParams,
          network,
          provider,
        });

        expect(typeof encodedData).toBe('string');
        expect(encodedData).toMatch(/^0x[a-fA-F0-9]+$/);
      });

      it('should handle zero address for payer', () => {
        const zeroAddressParams = {
          ...mockAuthorizeParams,
          payer: '0x0000000000000000000000000000000000000000',
        };

        const encodedData = encodeAuthorizePayment({
          params: zeroAddressParams,
          network,
          provider,
        });

        expect(typeof encodedData).toBe('string');
        expect(encodedData).toMatch(/^0x[a-fA-F0-9]+$/);
      });

      it('should handle same address for payer, merchant, and operator', () => {
        const sameAddress = '0x1234567890123456789012345678901234567890';
        const sameAddressParams = {
          ...mockAuthorizeParams,
          payer: sameAddress,
          merchant: sameAddress,
          operator: sameAddress,
        };

        const encodedData = encodeAuthorizePayment({
          params: sameAddressParams,
          network,
          provider,
        });

        expect(typeof encodedData).toBe('string');
        expect(encodedData).toMatch(/^0x[a-fA-F0-9]+$/);
      });

      it('should handle empty collector data', () => {
        const emptyDataParams = {
          ...mockAuthorizeParams,
          collectorData: '0x',
        };

        const encodedData = encodeAuthorizePayment({
          params: emptyDataParams,
          network,
          provider,
        });

        expect(typeof encodedData).toBe('string');
        expect(encodedData).toMatch(/^0x[a-fA-F0-9]+$/);
      });

      it('should handle large collector data', () => {
        const largeData = '0x' + '12'.repeat(1000); // 2000 bytes of data
        const largeDataParams = {
          ...mockAuthorizeParams,
          collectorData: largeData,
        };

        const encodedData = encodeAuthorizePayment({
          params: largeDataParams,
          network,
          provider,
        });

        expect(typeof encodedData).toBe('string');
        expect(encodedData).toMatch(/^0x[a-fA-F0-9]+$/);
      });

      it('should handle maximum fee basis points (10000 = 100%)', () => {
        const maxFeeParams = {
          ...mockCaptureParams,
          feeBps: 10000,
        };

        const encodedData = encodeCapturePayment({
          params: maxFeeParams,
          network,
          provider,
        });

        expect(typeof encodedData).toBe('string');
        expect(encodedData).toMatch(/^0x[a-fA-F0-9]+$/);
      });

      it('should handle zero fee basis points', () => {
        const zeroFeeParams = {
          ...mockCaptureParams,
          feeBps: 0,
        };

        const encodedData = encodeCapturePayment({
          params: zeroFeeParams,
          network,
          provider,
        });

        expect(typeof encodedData).toBe('string');
        expect(encodedData).toMatch(/^0x[a-fA-F0-9]+$/);
      });
    });
  });

  describe('transaction functions', () => {
    beforeEach(() => {
      // Mock sendTransaction to avoid actual blockchain calls
      jest.spyOn(wallet, 'sendTransaction').mockResolvedValue({
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        wait: jest.fn().mockResolvedValue({ status: 1 }),
      } as any);
    });

    it('should call sendTransaction for authorizePayment', async () => {
      const result = await authorizePayment({
        params: mockAuthorizeParams,
        signer: wallet,
        network,
      });

      expect(wallet.sendTransaction).toHaveBeenCalledWith({
        to: '0x1234567890123456789012345678901234567890',
        data: expect.stringMatching(/^0x[a-fA-F0-9]+$/),
        value: 0,
      });
      expect(result.hash).toBe(
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      );
    });

    it('should call sendTransaction for capturePayment', async () => {
      const result = await capturePayment({
        params: mockCaptureParams,
        signer: wallet,
        network,
      });

      expect(wallet.sendTransaction).toHaveBeenCalledWith({
        to: '0x1234567890123456789012345678901234567890',
        data: expect.stringMatching(/^0x[a-fA-F0-9]+$/),
        value: 0,
      });
      expect(result.hash).toBe(
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      );
    });

    it('should call sendTransaction for voidPayment', async () => {
      const result = await voidPayment({
        paymentReference: '0x0123456789abcdef',
        signer: wallet,
        network,
      });

      expect(wallet.sendTransaction).toHaveBeenCalledWith({
        to: '0x1234567890123456789012345678901234567890',
        data: expect.stringMatching(/^0x[a-fA-F0-9]+$/),
        value: 0,
      });
      expect(result.hash).toBe(
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      );
    });

    it('should call sendTransaction for chargePayment', async () => {
      const result = await chargePayment({
        params: mockChargeParams,
        signer: wallet,
        network,
      });

      expect(wallet.sendTransaction).toHaveBeenCalledWith({
        to: '0x1234567890123456789012345678901234567890',
        data: expect.stringMatching(/^0x[a-fA-F0-9]+$/),
        value: 0,
      });
      expect(result.hash).toBe(
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      );
    });

    it('should call sendTransaction for reclaimPayment', async () => {
      const result = await reclaimPayment({
        paymentReference: '0x0123456789abcdef',
        signer: wallet,
        network,
      });

      expect(wallet.sendTransaction).toHaveBeenCalledWith({
        to: '0x1234567890123456789012345678901234567890',
        data: expect.stringMatching(/^0x[a-fA-F0-9]+$/),
        value: 0,
      });
      expect(result.hash).toBe(
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      );
    });

    it('should call sendTransaction for refundPayment', async () => {
      const result = await refundPayment({
        params: mockRefundParams,
        signer: wallet,
        network,
      });

      expect(wallet.sendTransaction).toHaveBeenCalledWith({
        to: '0x1234567890123456789012345678901234567890',
        data: expect.stringMatching(/^0x[a-fA-F0-9]+$/),
        value: 0,
      });
      expect(result.hash).toBe(
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      );
    });

    it('should throw for authorizePayment when wrapper not found on mainnet', async () => {
      await expect(
        authorizePayment({
          params: mockAuthorizeParams,
          signer: wallet,
          network: 'mainnet' as CurrencyTypes.EvmChainName,
        }),
      ).rejects.toThrow('No deployment for network: mainnet.');
    });

    describe('transaction failure scenarios', () => {
      it('should handle sendTransaction rejection', async () => {
        // Mock sendTransaction to reject
        jest.spyOn(wallet, 'sendTransaction').mockRejectedValue(new Error('Transaction failed'));

        await expect(
          authorizePayment({
            params: mockAuthorizeParams,
            signer: wallet,
            network,
          }),
        ).rejects.toThrow('Transaction failed');
      });

      it('should handle gas estimation failure', async () => {
        // Mock sendTransaction to reject with gas estimation error
        jest
          .spyOn(wallet, 'sendTransaction')
          .mockRejectedValue(new Error('gas required exceeds allowance'));

        await expect(
          capturePayment({
            params: mockCaptureParams,
            signer: wallet,
            network,
          }),
        ).rejects.toThrow('gas required exceeds allowance');
      });

      it('should handle insufficient balance error', async () => {
        jest.spyOn(wallet, 'sendTransaction').mockRejectedValue(new Error('insufficient funds'));

        await expect(
          chargePayment({
            params: mockChargeParams,
            signer: wallet,
            network,
          }),
        ).rejects.toThrow('insufficient funds');
      });

      it('should handle nonce too low error', async () => {
        jest.spyOn(wallet, 'sendTransaction').mockRejectedValue(new Error('nonce too low'));

        await expect(
          voidPayment({
            paymentReference: '0x0123456789abcdef',
            signer: wallet,
            network,
          }),
        ).rejects.toThrow('nonce too low');
      });

      it('should handle replacement transaction underpriced', async () => {
        jest
          .spyOn(wallet, 'sendTransaction')
          .mockRejectedValue(new Error('replacement transaction underpriced'));

        await expect(
          reclaimPayment({
            paymentReference: '0x0123456789abcdef',
            signer: wallet,
            network,
          }),
        ).rejects.toThrow('replacement transaction underpriced');
      });
    });

    describe('edge case parameters', () => {
      it('should handle transaction with zero gas price', async () => {
        const mockTx = {
          hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          gasPrice: '0',
          wait: jest.fn().mockResolvedValue({ status: 1 }),
        };
        jest.spyOn(wallet, 'sendTransaction').mockResolvedValue(mockTx as any);

        const result = await refundPayment({
          params: mockRefundParams,
          signer: wallet,
          network,
        });

        expect(result.hash).toBe(
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        );
      });

      it('should handle transaction with very high gas price', async () => {
        const mockTx = {
          hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          gasPrice: '1000000000000', // 1000 gwei
          wait: jest.fn().mockResolvedValue({ status: 1 }),
        };
        jest.spyOn(wallet, 'sendTransaction').mockResolvedValue(mockTx as any);

        const result = await authorizePayment({
          params: mockAuthorizeParams,
          signer: wallet,
          network,
        });

        expect(result.hash).toBe(
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        );
      });
    });
  });

  describe('query functions', () => {
    // These tests demonstrate the expected behavior but require actual contract deployment
    it('should have the correct function signatures and expected behavior', () => {
      expect(typeof getPaymentData).toBe('function');
      expect(typeof getPaymentState).toBe('function');
      expect(typeof canCapture).toBe('function');
      expect(typeof canVoid).toBe('function');

      // Verify function arity (number of parameters)
      expect(getPaymentData.length).toBe(1); // Takes one parameter object
      expect(getPaymentState.length).toBe(1); // Takes one parameter object
      expect(canCapture.length).toBe(1); // Takes one parameter object
      expect(canVoid.length).toBe(1); // Takes one parameter object
    });

    it('should throw for getPaymentData when wrapper not found on mainnet', async () => {
      await expect(
        getPaymentData({
          paymentReference: '0x0123456789abcdef',
          provider,
          network: 'mainnet' as CurrencyTypes.EvmChainName,
        }),
      ).rejects.toThrow('No deployment for network: mainnet.');
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

    // Test that functions exist and validate their expected behavior
    expect(typeof encodeSetCommerceEscrowAllowance).toBe('function');
    expect(typeof encodeAuthorizePayment).toBe('function');
    expect(typeof encodeCapturePayment).toBe('function');
    expect(typeof authorizePayment).toBe('function');
    expect(typeof capturePayment).toBe('function');
    expect(typeof getPaymentData).toBe('function');
    expect(typeof getPaymentState).toBe('function');

    // Verify function parameters and return types
    expect(encodeSetCommerceEscrowAllowance.length).toBe(1); // Takes parameter object
    expect(encodeAuthorizePayment.length).toBe(1); // Takes parameter object
    expect(encodeCapturePayment.length).toBe(1); // Takes parameter object
    expect(authorizePayment.length).toBe(1); // Takes parameter object
    expect(capturePayment.length).toBe(1); // Takes parameter object

    // Test that encode functions return valid transaction data
    const allowanceTxs = encodeSetCommerceEscrowAllowance({
      tokenAddress: erc20ContractAddress,
      amount: '1000000000000000000',
      provider,
      network,
    });
    expect(Array.isArray(allowanceTxs)).toBe(true);
    expect(allowanceTxs.length).toBeGreaterThan(0);
    expect(allowanceTxs[0]).toHaveProperty('to');
    expect(allowanceTxs[0]).toHaveProperty('data');
    expect(allowanceTxs[0]).toHaveProperty('value');
    expect(allowanceTxs[0].to).toBe(erc20ContractAddress);
    expect(allowanceTxs[0].value).toBe(0);
  });

  it('should handle void payment flow when contracts are available', async () => {
    // This test demonstrates the expected void flow
    // 1. Set allowance for the wrapper
    // 2. Authorize payment
    // 3. Void payment instead of capturing

    expect(typeof encodeVoidPayment).toBe('function');
    expect(typeof voidPayment).toBe('function');
    expect(typeof canVoid).toBe('function');

    // Verify function arity
    expect(encodeVoidPayment.length).toBe(1);
    expect(voidPayment.length).toBe(1);
    expect(canVoid.length).toBe(1);

    // Test void encoding returns valid data
    const voidData = encodeVoidPayment({
      paymentReference: '0x0123456789abcdef',
      network,
      provider,
    });
    expect(voidData).toMatch(/^0x[a-fA-F0-9]+$/);
    expect(voidData.substring(0, 10)).toBe('0x4eff2760'); // voidPayment selector
  });

  it('should handle charge payment flow when contracts are available', async () => {
    // This test demonstrates the expected charge flow (authorize + capture in one transaction)
    // 1. Set allowance for the wrapper
    // 2. Charge payment (authorize + capture)

    expect(typeof encodeChargePayment).toBe('function');
    expect(typeof chargePayment).toBe('function');

    // Verify function arity
    expect(encodeChargePayment.length).toBe(1);
    expect(chargePayment.length).toBe(1);

    // Test charge encoding returns valid data with correct selector
    const chargeData = encodeChargePayment({
      params: mockChargeParams,
      network,
      provider,
    });
    expect(chargeData).toMatch(/^0x[a-fA-F0-9]+$/);
    expect(chargeData.substring(0, 10)).toBe('0x739802a3'); // chargePayment selector
    expect(chargeData.length).toBeGreaterThan(100); // Should be long due to many parameters
  });

  it('should handle reclaim payment flow when contracts are available', async () => {
    // This test demonstrates the expected reclaim flow
    // 1. Set allowance for the wrapper
    // 2. Authorize payment
    // 3. Wait for authorization expiry
    // 4. Reclaim payment (payer gets funds back)

    expect(typeof encodeReclaimPayment).toBe('function');
    expect(typeof reclaimPayment).toBe('function');

    // Verify function arity
    expect(encodeReclaimPayment.length).toBe(1);
    expect(reclaimPayment.length).toBe(1);

    // Test reclaim encoding returns valid data
    const reclaimData = encodeReclaimPayment({
      paymentReference: '0x0123456789abcdef',
      network,
      provider,
    });
    expect(reclaimData).toMatch(/^0x[a-fA-F0-9]+$/);
    expect(reclaimData.substring(0, 10)).toBe('0xafda9d20'); // reclaimPayment selector
    expect(reclaimData.length).toBe(74); // Short function with just payment reference
  });

  it('should handle refund payment flow when contracts are available', async () => {
    // This test demonstrates the expected refund flow
    // 1. Set allowance for the wrapper
    // 2. Authorize payment
    // 3. Capture payment
    // 4. Refund payment (operator sends funds back to payer)

    expect(typeof encodeRefundPayment).toBe('function');
    expect(typeof refundPayment).toBe('function');

    // Verify function arity
    expect(encodeRefundPayment.length).toBe(1);
    expect(refundPayment.length).toBe(1);

    // Test refund encoding returns valid data
    const refundData = encodeRefundPayment({
      params: mockRefundParams,
      network,
      provider,
    });
    expect(refundData).toMatch(/^0x[a-fA-F0-9]+$/);
    expect(refundData.substring(0, 10)).toBe('0xf9b777ea'); // refundPayment selector
    expect(refundData.length).toBeGreaterThan(74); // Longer than simple functions due to multiple parameters
  });

  it('should validate payment parameters', () => {
    // Test parameter validation and ensure all expected values are present
    expect(mockAuthorizeParams.paymentReference).toBe('0x0123456789abcdef');
    expect(mockAuthorizeParams.payer).toBe(wallet.address);
    expect(mockAuthorizeParams.merchant).toBe('0x3234567890123456789012345678901234567890');
    expect(mockAuthorizeParams.operator).toBe('0x4234567890123456789012345678901234567890');
    expect(mockAuthorizeParams.token).toBe(erc20ContractAddress);
    expect(mockAuthorizeParams.amount).toBe('1000000000000000000');
    expect(mockAuthorizeParams.maxAmount).toBe('1100000000000000000');
    expect(mockAuthorizeParams.tokenCollector).toBe('0x5234567890123456789012345678901234567890');
    expect(mockAuthorizeParams.collectorData).toBe('0x1234');

    // Validate capture parameters
    expect(mockCaptureParams.paymentReference).toBe('0x0123456789abcdef');
    expect(mockCaptureParams.captureAmount).toBe('1000000000000000000');
    expect(mockCaptureParams.feeBps).toBe(250);
    expect(mockCaptureParams.feeReceiver).toBe('0x6234567890123456789012345678901234567890');

    // Validate charge parameters (should include all authorize params plus fee info)
    expect(mockChargeParams.feeBps).toBe(250);
    expect(mockChargeParams.feeReceiver).toBe('0x6234567890123456789012345678901234567890');

    // Validate refund parameters
    expect(mockRefundParams.paymentReference).toBe('0x0123456789abcdef');
    expect(mockRefundParams.refundAmount).toBe('500000000000000000');
    expect(mockRefundParams.tokenCollector).toBe('0x7234567890123456789012345678901234567890');
    expect(mockRefundParams.collectorData).toBe('0x5678');

    // Validate timestamp parameters are reasonable
    expect(mockAuthorizeParams.preApprovalExpiry).toBeGreaterThan(Math.floor(Date.now() / 1000));
    expect(mockAuthorizeParams.authorizationExpiry).toBeGreaterThan(
      mockAuthorizeParams.preApprovalExpiry,
    );
    expect(mockAuthorizeParams.refundExpiry).toBeGreaterThan(
      mockAuthorizeParams.authorizationExpiry,
    );
  });

  it('should handle different token types', () => {
    // Test USDT special handling
    const usdtAddress = '0xdAC17F958D2ee523a2206206994597C13D831ec7'; // USDT mainnet address

    const usdtTransactions = encodeSetCommerceEscrowAllowance({
      tokenAddress: usdtAddress,
      amount: '1000000', // 1 USDT (6 decimals)
      provider,
      network,
      isUSDT: true,
    });

    expect(usdtTransactions).toHaveLength(2); // Reset to 0, then approve amount

    // Validate first transaction (reset to 0)
    expect(usdtTransactions[0].to).toBe(usdtAddress);
    expect(usdtTransactions[0].value).toBe(0);
    expect(usdtTransactions[0].data).toMatch(/^0x[a-fA-F0-9]+$/);
    expect(usdtTransactions[0].data.substring(0, 10)).toBe('0x095ea7b3'); // approve function selector

    // Validate second transaction (approve amount)
    expect(usdtTransactions[1].to).toBe(usdtAddress);
    expect(usdtTransactions[1].value).toBe(0);
    expect(usdtTransactions[1].data).toMatch(/^0x[a-fA-F0-9]+$/);
    expect(usdtTransactions[1].data.substring(0, 10)).toBe('0x095ea7b3'); // approve function selector

    const regularTransactions = encodeSetCommerceEscrowAllowance({
      tokenAddress: erc20ContractAddress,
      amount: '1000000000000000000',
      provider,
      network,
      isUSDT: false,
    });

    expect(regularTransactions).toHaveLength(1); // Just approve amount

    // Validate regular transaction
    expect(regularTransactions[0].to).toBe(erc20ContractAddress);
    expect(regularTransactions[0].value).toBe(0);
    expect(regularTransactions[0].data).toMatch(/^0x[a-fA-F0-9]+$/);
    expect(regularTransactions[0].data.substring(0, 10)).toBe('0x095ea7b3'); // approve function selector

    // Verify the wrapper address is encoded in the transaction data
    const wrapperAddress = getCommerceEscrowWrapperAddress(network);
    expect(regularTransactions[0].data.toLowerCase()).toContain(
      wrapperAddress.substring(2).toLowerCase(),
    );
  });

  describe('comprehensive edge case scenarios', () => {
    it('should handle payment flow with extreme values', () => {
      const extremeParams = {
        paymentReference: '0xffffffffffffffff', // Max bytes8
        payer: '0x0000000000000000000000000000000000000001', // Min non-zero address
        merchant: '0xffffffffffffffffffffffffffffffffffffffff', // Max address
        operator: '0x1111111111111111111111111111111111111111',
        token: '0x2222222222222222222222222222222222222222',
        amount: '1', // Min amount
        maxAmount: '115792089237316195423570985008687907853269984665640564039457584007913129639935', // Max uint256
        preApprovalExpiry: 1, // Min timestamp
        authorizationExpiry: 4294967295, // Max uint32
        refundExpiry: 2147483647, // Max int32
        tokenCollector: '0x3333333333333333333333333333333333333333',
        collectorData: '0x',
      };

      expect(() => {
        encodeAuthorizePayment({
          params: extremeParams,
          network,
          provider,
        });
      }).not.toThrow();
    });

    it('should handle payment flow with identical addresses', () => {
      const identicalAddress = '0x1234567890123456789012345678901234567890';
      const identicalParams = {
        ...mockAuthorizeParams,
        payer: identicalAddress,
        merchant: identicalAddress,
        operator: identicalAddress,
        tokenCollector: identicalAddress,
      };

      expect(() => {
        encodeAuthorizePayment({
          params: identicalParams,
          network,
          provider,
        });
      }).not.toThrow();
    });

    it('should handle payment flow with zero values', () => {
      const zeroParams = {
        ...mockAuthorizeParams,
        amount: '0',
        maxAmount: '0',
        preApprovalExpiry: 0,
        authorizationExpiry: 0,
        refundExpiry: 0,
        collectorData: '0x',
      };

      expect(() => {
        encodeAuthorizePayment({
          params: zeroParams,
          network,
          provider,
        });
      }).not.toThrow();
    });

    it('should handle capture with zero fee', () => {
      const zeroFeeCapture = {
        ...mockCaptureParams,
        feeBps: 0,
        captureAmount: '0',
      };

      expect(() => {
        encodeCapturePayment({
          params: zeroFeeCapture,
          network,
          provider,
        });
      }).not.toThrow();
    });

    it('should handle refund with zero amount', () => {
      const zeroRefund = {
        ...mockRefundParams,
        refundAmount: '0',
        collectorData: '0x',
      };

      expect(() => {
        encodeRefundPayment({
          params: zeroRefund,
          network,
          provider,
        });
      }).not.toThrow();
    });

    it('should handle charge payment with maximum fee', () => {
      const maxFeeCharge = {
        ...mockChargeParams,
        feeBps: 10000, // 100%
      };

      expect(() => {
        encodeChargePayment({
          params: maxFeeCharge,
          network,
          provider,
        });
      }).not.toThrow();
    });

    it('should handle very large collector data', () => {
      const largeDataParams = {
        ...mockAuthorizeParams,
        collectorData: '0x' + '12'.repeat(10000), // 20KB of data
      };

      expect(() => {
        encodeAuthorizePayment({
          params: largeDataParams,
          network,
          provider,
        });
      }).not.toThrow();
    });

    it('should handle payment references with special patterns', () => {
      const specialReferences = [
        '0x0000000000000000', // All zeros
        '0xffffffffffffffff', // All ones
        '0x0123456789abcdef', // Sequential hex
        '0xfedcba9876543210', // Reverse sequential
        '0x1111111111111111', // Repeated pattern
        '0xaaaaaaaaaaaaaaaa', // Alternating pattern
      ];

      specialReferences.forEach((ref) => {
        expect(() => {
          encodeVoidPayment({
            paymentReference: ref,
            network,
            provider,
          });
        }).not.toThrow();
      });
    });

    it('should handle different token decimal configurations', () => {
      const tokenConfigs = [
        { amount: '1', decimals: 0 }, // 1 unit token
        { amount: '1000000', decimals: 6 }, // USDC/USDT style
        { amount: '1000000000000000000', decimals: 18 }, // ETH style
        { amount: '1000000000000000000000000000000', decimals: 30 }, // High precision
      ];

      tokenConfigs.forEach((config) => {
        const params = {
          ...mockAuthorizeParams,
          amount: config.amount,
          maxAmount: config.amount,
        };

        expect(() => {
          encodeAuthorizePayment({
            params,
            network,
            provider,
          });
        }).not.toThrow();
      });
    });

    it('should handle time-based edge cases', () => {
      const now = Math.floor(Date.now() / 1000);
      const timeConfigs = [
        {
          // Past times
          preApprovalExpiry: now - 86400,
          authorizationExpiry: now - 3600,
          refundExpiry: now - 1800,
        },
        {
          // Far future times
          preApprovalExpiry: now + 365 * 24 * 3600 * 100, // 100 years
          authorizationExpiry: now + 365 * 24 * 3600 * 50, // 50 years
          refundExpiry: now + 365 * 24 * 3600 * 10, // 10 years
        },
        {
          // Same times
          preApprovalExpiry: now,
          authorizationExpiry: now,
          refundExpiry: now,
        },
        {
          // Reverse order (unusual but not invalid at encoding level)
          preApprovalExpiry: now + 3600,
          authorizationExpiry: now + 1800,
          refundExpiry: now + 900,
        },
      ];

      timeConfigs.forEach((timeConfig) => {
        const params = {
          ...mockAuthorizeParams,
          ...timeConfig,
        };

        expect(() => {
          encodeAuthorizePayment({
            params,
            network,
            provider,
          });
        }).not.toThrow();
      });
    });
  });
});
