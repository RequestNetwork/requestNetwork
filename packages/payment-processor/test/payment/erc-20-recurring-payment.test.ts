import { Wallet, providers } from 'ethers';
import { erc20RecurringPaymentProxyArtifact } from '@requestnetwork/smart-contracts';
import { CurrencyTypes, PaymentTypes } from '@requestnetwork/types';
import {
  encodeRecurringPaymentApproval,
  encodeRecurringPaymentAllowanceDecrease,
  encodeUSDTRecurringPaymentApproval,
  encodeUSDTRecurringPaymentAllowanceDecrease,
  encodeRecurringPaymentExecution,
  executeRecurringPayment,
} from '../../src/payment/erc20-recurring-payment-proxy';

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
const provider = new providers.JsonRpcProvider('http://localhost:8545');
const wallet = Wallet.fromMnemonic(mnemonic).connect(provider);
const network: CurrencyTypes.EvmChainName = 'private';
const erc20ContractAddress = '0x9FBDa871d559710256a2502A2517b794B482Db40';

const schedulePermit: PaymentTypes.SchedulePermit = {
  subscriber: wallet.address,
  token: erc20ContractAddress,
  recipient: '0x3234567890123456789012345678901234567890',
  feeAddress: '0x4234567890123456789012345678901234567890',
  amount: '1000000000000000000', // 1 token
  feeAmount: '10000000000000000', // 0.01 token
  executorFee: '5000000000000000', // 0.005 token
  periodSeconds: 86400, // 1 day
  firstExec: Math.floor(Date.now() / 1000),
  totalExecutions: 12,
  nonce: '1',
  deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
};

const permitSignature = '0x1234567890abcdef';
const paymentReference = '0x0000000000000000000000000000000000000000000000000000000000000001';

describe('erc20-recurring-payment-proxy', () => {
  describe('encodeRecurringPaymentApproval', () => {
    it('should return array of transaction objects', () => {
      const amount = '1000000000000000000';
      const tokenAddress = erc20ContractAddress;

      const transactions = encodeRecurringPaymentApproval({
        tokenAddress,
        amount,
        provider,
        network,
      });

      expect(Array.isArray(transactions)).toBe(true);
      expect(transactions).toHaveLength(1);

      const tx = transactions[0];
      expect(tx).toHaveProperty('to');
      expect(tx).toHaveProperty('data');
      expect(tx).toHaveProperty('value');

      expect(tx.to).toBe(tokenAddress);
      expect(tx.data.startsWith('0x')).toBe(true);
      expect(tx.value).toBe(0);

      // Verify it contains the method signature for either approve or increaseAllowance
      expect(
        tx.data.includes('095ea7b3') || // approve
          tx.data.includes('39509351'), // increaseAllowance
      ).toBe(true);
    });
  });

  describe('encodeRecurringPaymentAllowanceDecrease', () => {
    it('should return array of transaction objects for decrease', () => {
      const amount = '500000000000000000'; // 0.5 token
      const currentAllowance = '1000000000000000000'; // 1 token
      const tokenAddress = erc20ContractAddress;

      const transactions = encodeRecurringPaymentAllowanceDecrease({
        tokenAddress,
        amount,
        currentAllowance,
        provider,
        network,
      });

      expect(Array.isArray(transactions)).toBe(true);
      expect(transactions.length).toBeGreaterThanOrEqual(1);

      transactions.forEach((tx) => {
        expect(tx).toHaveProperty('to');
        expect(tx).toHaveProperty('data');
        expect(tx).toHaveProperty('value');

        expect(tx.to).toBe(tokenAddress);
        expect(tx.data.startsWith('0x')).toBe(true);
        expect(tx.value).toBe(0);
      });
    });
  });

  describe('encodeUSDTRecurringPaymentApproval', () => {
    it('should return two transactions for USDT approval', () => {
      const amount = '1000000000000000000';
      const tokenAddress = erc20ContractAddress;

      const transactions = encodeUSDTRecurringPaymentApproval({
        tokenAddress,
        amount,
        provider,
        network,
      });

      expect(Array.isArray(transactions)).toBe(true);
      expect(transactions).toHaveLength(2);

      // First transaction should be approve(0)
      const resetTx = transactions[0];
      expect(resetTx.to).toBe(tokenAddress);
      expect(resetTx.data.startsWith('0x')).toBe(true);
      expect(resetTx.value).toBe(0);
      expect(resetTx.data.includes('095ea7b3')).toBe(true); // approve method signature

      // Second transaction should be approve(amount)
      const approveTx = transactions[1];
      expect(approveTx.to).toBe(tokenAddress);
      expect(approveTx.data.startsWith('0x')).toBe(true);
      expect(approveTx.value).toBe(0);
      expect(approveTx.data.includes('095ea7b3')).toBe(true); // approve method signature
    });
  });

  describe('encodeUSDTRecurringPaymentAllowanceDecrease', () => {
    it('should return two transactions for USDT decrease', () => {
      const amount = '500000000000000000'; // 0.5 token
      const currentAllowance = '1000000000000000000'; // 1 token
      const tokenAddress = erc20ContractAddress;

      const transactions = encodeUSDTRecurringPaymentAllowanceDecrease({
        tokenAddress,
        amount,
        currentAllowance,
        provider,
        network,
      });

      expect(Array.isArray(transactions)).toBe(true);
      expect(transactions).toHaveLength(2);

      // First transaction should be approve(0)
      const resetTx = transactions[0];
      expect(resetTx.to).toBe(tokenAddress);
      expect(resetTx.data.startsWith('0x')).toBe(true);
      expect(resetTx.value).toBe(0);
      expect(resetTx.data.includes('095ea7b3')).toBe(true); // approve method signature

      // Second transaction should be approve(newAmount)
      const approveTx = transactions[1];
      expect(approveTx.to).toBe(tokenAddress);
      expect(approveTx.data.startsWith('0x')).toBe(true);
      expect(approveTx.value).toBe(0);
      expect(approveTx.data.includes('095ea7b3')).toBe(true); // approve method signature
    });
  });

  describe('encodeRecurringPaymentExecution', () => {
    it('should encode execution data correctly', () => {
      const encodedData = encodeRecurringPaymentExecution({
        permitTuple: schedulePermit,
        permitSignature,
        paymentIndex: 1,
        paymentReference,
        network,
        provider,
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
          permitTuple: schedulePermit,
          permitSignature,
          paymentIndex: 1,
          paymentReference,
          signer: wallet,
          network,
        }),
      ).rejects.toThrow('ERC20RecurringPaymentProxy not found on private');
    });
  });

  describe('error handling', () => {
    it('should throw when proxy not found for approval', () => {
      jest.spyOn(erc20RecurringPaymentProxyArtifact, 'connect').mockReturnValue({
        address: '',
      } as any);

      expect(() => {
        encodeRecurringPaymentApproval({
          tokenAddress: erc20ContractAddress,
          amount: '1000000000000000000',
          provider,
          network,
        });
      }).toThrow('ERC20RecurringPaymentProxy not found on private');
    });

    it('should throw when proxy not found for USDT approval', () => {
      jest.spyOn(erc20RecurringPaymentProxyArtifact, 'connect').mockReturnValue({
        address: '',
      } as any);

      expect(() => {
        encodeUSDTRecurringPaymentApproval({
          tokenAddress: erc20ContractAddress,
          amount: '1000000000000000000',
          provider,
          network,
        });
      }).toThrow('ERC20RecurringPaymentProxy not found on private');
    });

    it('should throw when proxy not found for allowance decrease', () => {
      jest.spyOn(erc20RecurringPaymentProxyArtifact, 'connect').mockReturnValue({
        address: '',
      } as any);

      expect(() => {
        encodeRecurringPaymentAllowanceDecrease({
          tokenAddress: erc20ContractAddress,
          amount: '500000000000000000',
          currentAllowance: '1000000000000000000',
          provider,
          network,
        });
      }).toThrow('ERC20RecurringPaymentProxy not found on private');
    });

    it('should throw when proxy not found for USDT decrease', () => {
      jest.spyOn(erc20RecurringPaymentProxyArtifact, 'connect').mockReturnValue({
        address: '',
      } as any);

      expect(() => {
        encodeUSDTRecurringPaymentAllowanceDecrease({
          tokenAddress: erc20ContractAddress,
          amount: '500000000000000000',
          currentAllowance: '1000000000000000000',
          provider,
          network,
        });
      }).toThrow('ERC20RecurringPaymentProxy not found on private');
    });
  });
});
