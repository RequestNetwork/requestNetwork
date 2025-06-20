import { Wallet, providers } from 'ethers';
import { erc20RecurringPaymentProxyArtifact } from '@requestnetwork/smart-contracts';
import { CurrencyTypes, PaymentTypes } from '@requestnetwork/types';
import {
  encodeRecurringPaymentApproval,
  encodeRecurringPaymentExecution,
  executeRecurringPayment,
} from '../../src/payment/erc20-recurring-payment-proxy';

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

  describe('encodeRecurringPaymentApproval', () => {
    it('should encode approval data correctly', () => {
      const amount = '1000000000000000000';
      const tokenAddress = '0x2234567890123456789012345678901234567890';

      const encodedData = encodeRecurringPaymentApproval({
        tokenAddress,
        amount,
        provider: mockProvider,
        network: mockNetwork,
      });

      // Verify it's a valid hex string
      expect(encodedData.startsWith('0x')).toBe(true);
      // Verify it contains the method signature for either approve or increaseAllowance
      expect(
        encodedData.includes('095ea7b3') || // approve
          encodedData.includes('39509351'), // increaseAllowance
      ).toBe(true);
    });
  });

  describe('encodeRecurringPaymentExecution', () => {
    it('should encode execution data correctly', () => {
      const encodedData = encodeRecurringPaymentExecution({
        permitTuple: mockSchedulePermit,
        permitSignature: mockPermitSignature,
        paymentIndex: 1,
        paymentReference: mockPaymentReference,
        network: mockNetwork,
        provider: mockProvider,
      });

      // Verify it's a valid hex string
      expect(encodedData.startsWith('0x')).toBe(true);
    });
  });

  describe('executeRecurringPayment', () => {
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
