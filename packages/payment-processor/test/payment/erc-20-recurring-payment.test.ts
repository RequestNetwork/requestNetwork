import { erc20RecurringPaymentProxyArtifact } from '@requestnetwork/smart-contracts';
import { CurrencyTypes, PaymentTypes } from '@requestnetwork/types';
import { Wallet, providers } from 'ethers';
import {
  encodeRecurringPaymentTrigger,
  encodeSetRecurringAllowance,
  triggerRecurringPayment,
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
  relayerFee: '5000000000000000', // 0.005 token
  periodSeconds: 86400, // 1 day
  firstExec: Math.floor(Date.now() / 1000),
  totalPayments: 12,
  nonce: '1',
  deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  strictOrder: true,
};

const permitSignature = '0x1234567890abcdef';
const paymentReference = '0x0000000000000000000000000000000000000000000000000000000000000001';

describe('erc20-recurring-payment-proxy', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('encodeSetRecurringAllowance', () => {
    it('should return a single transaction for a non-USDT token', () => {
      const amount = '1000000000000000000';
      const transactions = encodeSetRecurringAllowance({
        tokenAddress: erc20ContractAddress,
        amount,
        provider,
        network,
        isUSDT: false,
      });

      expect(transactions).toHaveLength(1);
      const [tx] = transactions;
      expect(tx.to).toBe(erc20ContractAddress);
      expect(tx.data).toContain('095ea7b3'); // approve
      expect(tx.value).toBe(0);
    });

    it('should return two transactions for a USDT token', () => {
      const amount = '1000000000000000000';
      const transactions = encodeSetRecurringAllowance({
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
      expect(tx1.data).toContain('095ea7b3'); // approve
      // check that amount is 0
      expect(tx1.data).toContain(
        '0000000000000000000000000000000000000000000000000000000000000000',
      );
      expect(tx1.value).toBe(0);

      // tx2 is approve(amount)
      expect(tx2.to).toBe(erc20ContractAddress);
      expect(tx2.data).toContain('095ea7b3'); // approve
      expect(tx2.data).not.toContain(
        '0000000000000000000000000000000000000000000000000000000000000000',
      );
      expect(tx2.value).toBe(0);
    });

    it('should default to non-USDT behavior if isUSDT is not provided', () => {
      const amount = '1000000000000000000';
      const transactions = encodeSetRecurringAllowance({
        tokenAddress: erc20ContractAddress,
        amount,
        provider,
        network,
      });

      expect(transactions).toHaveLength(1);
      const [tx] = transactions;
      expect(tx.to).toBe(erc20ContractAddress);
      expect(tx.data).toContain('095ea7b3'); // approve
      expect(tx.value).toBe(0);
    });

    it('should throw when proxy not found', () => {
      jest.spyOn(erc20RecurringPaymentProxyArtifact, 'connect').mockReturnValue({
        address: '',
      } as any);

      expect(() => {
        encodeSetRecurringAllowance({
          tokenAddress: erc20ContractAddress,
          amount: '1000000000000000000',
          provider,
          network,
        });
      }).toThrow('ERC20RecurringPaymentProxy not found on private');
    });
  });

  describe('encodeRecurringPaymentTrigger', () => {
    it('should encode trigger data correctly', () => {
      const encodedData = encodeRecurringPaymentTrigger({
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

  describe('triggerRecurringPayment', () => {
    it('should throw if proxy not deployed on network', async () => {
      jest.spyOn(erc20RecurringPaymentProxyArtifact, 'getAddress').mockReturnValue('');

      await expect(
        triggerRecurringPayment({
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
});

describe('ERC20 Recurring Payment', () => {
  const permit: PaymentTypes.SchedulePermit = {
    subscriber: '0x1234567890123456789012345678901234567890',
    token: '0x1234567890123456789012345678901234567890',
    recipient: '0x1234567890123456789012345678901234567890',
    feeAddress: '0x1234567890123456789012345678901234567890',
    amount: '1000000000000000000', // 1 token
    feeAmount: '10000000000000000', // 0.01 token
    relayerFee: '5000000000000000', // 0.005 token
    periodSeconds: 86400, // 1 day
    firstExec: Math.floor(Date.now() / 1000),
    totalPayments: 12,
    nonce: 0,
    deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    strictOrder: false,
  };

  it('should encode recurring payment execution', () => {
    const encoded = encodeRecurringPaymentTrigger({
      permitTuple: permit,
      permitSignature,
      paymentIndex: 1,
      paymentReference,
      network,
      provider,
    });
    expect(encoded).toBeDefined();
  });

  it('should execute recurring payment', async () => {
    const result = await triggerRecurringPayment({
      permitTuple: permit,
      permitSignature,
      paymentIndex: 1,
      paymentReference,
      signer: wallet,
      network,
    });
    expect(result).toBeDefined();
  });
});
