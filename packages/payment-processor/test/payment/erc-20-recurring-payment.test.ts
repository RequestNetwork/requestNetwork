import { Wallet, providers } from 'ethers';
import { erc20RecurringPaymentProxyArtifact } from '@requestnetwork/smart-contracts';
import { CurrencyTypes, PaymentTypes } from '@requestnetwork/types';
import {
  encodeRecurringPaymentApproval,
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
  gasFee: '5000000000000000', // 0.005 token
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
    it('should encode approval data correctly', () => {
      const amount = '1000000000000000000';
      const tokenAddress = erc20ContractAddress;

      const encodedData = encodeRecurringPaymentApproval({
        tokenAddress,
        amount,
        provider,
        network,
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
});
