import { Wallet, providers, BigNumber } from 'ethers';
import { erc20RecurringPaymentProxyArtifact } from '@requestnetwork/smart-contracts';
import { ERC20__factory } from '@requestnetwork/smart-contracts/types';
import { CurrencyTypes, PaymentTypes } from '@requestnetwork/types';
import {
  getPayerRecurringPaymentAllowance,
  encodeRecurringPaymentApproval,
  encodeRecurringPaymentExecution,
  executeRecurringPayment,
} from '../../src/payment/erc20-recurring-payment-proxy';

type ERC20Functions =
  | 'approve'
  | 'increaseAllowance'
  | 'decreaseAllowance'
  | 'transfer'
  | 'transferFrom';

describe('erc20-recurring-payment-proxy', () => {
  const mockProvider = new providers.JsonRpcProvider();
  const mockWallet = Wallet.createRandom().connect(mockProvider);
  const mockNetwork: CurrencyTypes.EvmChainName = 'mainnet';

  const mockSchedulePermit: PaymentTypes.SchedulePermit = {
    subscriber: '0x1234567890123456789012345678901234567890',
    token: '0x2234567890123456789012345678901234567890',
    recipient: '0x3234567890123456789012345678901234567890',
    feeAddress: '0x4234567890123456789012345678901234567890',
    amount: '1000000000000000000', // 1 token
    feeAmount: '10000000000000000', // 0.01 token
    gasFee: '5000000000000000', // 0.005 token
    periodSeconds: 86400, // 1 day
    firstExec: Math.floor(Date.now() / 1000),
    totalExecutions: 12,
    nonce: '1',
    deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  };

  const mockPermitSignature = '0x1234567890abcdef';
  const mockPaymentReference = '0x0000000000000000000000000000000000000000000000000000000000000001';

  describe('getPayerRecurringPaymentAllowance', () => {
    it('should throw if proxy not deployed on network', async () => {
      // Test setup
      const getAddressSpy = jest
        .spyOn(erc20RecurringPaymentProxyArtifact, 'getAddress')
        .mockReturnValue('');

      // Test execution & assertion
      await expect(
        getPayerRecurringPaymentAllowance({
          payerAddress: mockSchedulePermit.subscriber,
          tokenAddress: mockSchedulePermit.token,
          provider: mockProvider,
          network: mockNetwork,
        }),
      ).rejects.toThrow('ERC20RecurringPaymentProxy not found on mainnet');

      // Cleanup
      getAddressSpy.mockRestore();
    });

    it('should return allowance as string', async () => {
      // Test setup
      const mockProxyAddress = '0x5234567890123456789012345678901234567890';
      const mockAllowance = '2000000000000000000';

      const getAddressSpy = jest
        .spyOn(erc20RecurringPaymentProxyArtifact, 'getAddress')
        .mockReturnValue(mockProxyAddress);

      const tokenContract = ERC20__factory.connect(mockSchedulePermit.token, mockProvider);
      const allowanceSpy = jest
        .spyOn(tokenContract, 'allowance')
        .mockResolvedValue(BigNumber.from(mockAllowance));

      // Test execution
      const result = await getPayerRecurringPaymentAllowance({
        payerAddress: mockSchedulePermit.subscriber,
        tokenAddress: mockSchedulePermit.token,
        provider: mockProvider,
        network: mockNetwork,
      });

      // Assertions
      expect(result).toBe(mockAllowance);
      expect(getAddressSpy).toHaveBeenCalledWith(mockNetwork);
      expect(allowanceSpy).toHaveBeenCalledWith(mockSchedulePermit.subscriber, mockProxyAddress);

      // Cleanup
      getAddressSpy.mockRestore();
      allowanceSpy.mockRestore();
    });
  });

  describe('encodeRecurringPaymentApproval', () => {
    const mockAmount = '1000000000000000000';
    const mockProxyAddress = '0x5234567890123456789012345678901234567890';

    beforeEach(() => {
      jest
        .spyOn(erc20RecurringPaymentProxyArtifact, 'getAddress')
        .mockReturnValue(mockProxyAddress);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should encode increaseAllowance when available', () => {
      const tokenContract = ERC20__factory.connect(mockSchedulePermit.token, mockProvider);
      const encodedData = tokenContract.interface.encodeFunctionData('increaseAllowance', [
        mockProxyAddress,
        mockAmount,
      ]);

      const result = encodeRecurringPaymentApproval({
        tokenAddress: mockSchedulePermit.token,
        amount: mockAmount,
        provider: mockProvider,
        network: mockNetwork,
      });

      expect(result).toBe(encodedData);
    });
  });

  describe('encodeRecurringPaymentExecution', () => {
    it('should correctly encode execution data', () => {
      const mockProxyAddress = '0x5234567890123456789012345678901234567890';

      jest
        .spyOn(erc20RecurringPaymentProxyArtifact, 'getAddress')
        .mockReturnValue(mockProxyAddress);

      const proxyContract = erc20RecurringPaymentProxyArtifact.connect(mockNetwork, mockProvider);
      const expectedData = proxyContract.interface.encodeFunctionData('execute', [
        mockSchedulePermit,
        mockPermitSignature,
        1,
        mockPaymentReference,
      ]);

      const result = encodeRecurringPaymentExecution({
        permitTuple: mockSchedulePermit,
        permitSignature: mockPermitSignature,
        paymentIndex: 1,
        paymentReference: mockPaymentReference,
        network: mockNetwork,
        provider: mockProvider,
      });

      expect(result).toBe(expectedData);
    });
  });

  describe('executeRecurringPayment', () => {
    it('should send transaction and wait for confirmation', async () => {
      const mockProxyAddress = '0x5234567890123456789012345678901234567890';
      const mockTxHash = '0x1234567890abcdef';
      const mockReceipt = { transactionHash: mockTxHash };

      jest
        .spyOn(erc20RecurringPaymentProxyArtifact, 'getAddress')
        .mockReturnValue(mockProxyAddress);

      const sendTransactionSpy = jest.spyOn(mockWallet, 'sendTransaction').mockResolvedValue({
        wait: jest.fn().mockResolvedValue(mockReceipt),
      } as any);

      const result = await executeRecurringPayment({
        permitTuple: mockSchedulePermit,
        permitSignature: mockPermitSignature,
        paymentIndex: 1,
        paymentReference: mockPaymentReference,
        signer: mockWallet,
        network: mockNetwork,
      });

      expect(sendTransactionSpy).toHaveBeenCalledWith({
        to: mockProxyAddress,
        data: expect.any(String),
        value: 0,
      });
      expect(result).toBe(mockReceipt);
    });

    it('should throw if proxy not deployed on network', async () => {
      jest.spyOn(erc20RecurringPaymentProxyArtifact, 'getAddress').mockReturnValue('');

      await expect(
        executeRecurringPayment({
          permitTuple: mockSchedulePermit,
          permitSignature: mockPermitSignature,
          paymentIndex: 1,
          paymentReference: mockPaymentReference,
          signer: mockWallet,
          network: mockNetwork,
        }),
      ).rejects.toThrow('ERC20RecurringPaymentProxy not found on mainnet');
    });
  });
});
