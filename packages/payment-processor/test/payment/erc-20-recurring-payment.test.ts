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
  firstPayment: Math.floor(Date.now() / 1000),
  totalPayments: 12,
  nonce: '1',
  deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  strictOrder: true,
};

const paymentReference = '0x0000000000000000000000000000000000000000000000000000000000000001';

// Helper function to create EIP-712 signature for SchedulePermit
async function createSchedulePermitSignature(
  permit: PaymentTypes.SchedulePermit,
  signer: Wallet,
  proxyAddress: string,
): Promise<string> {
  const domain = {
    name: 'ERC20RecurringPaymentProxy',
    version: '1',
    chainId: await signer.getChainId(),
    verifyingContract: proxyAddress,
  };

  const types = {
    SchedulePermit: [
      { name: 'subscriber', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'recipient', type: 'address' },
      { name: 'feeAddress', type: 'address' },
      { name: 'amount', type: 'uint128' },
      { name: 'feeAmount', type: 'uint128' },
      { name: 'relayerFee', type: 'uint128' },
      { name: 'periodSeconds', type: 'uint32' },
      { name: 'firstPayment', type: 'uint32' },
      { name: 'totalPayments', type: 'uint8' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'strictOrder', type: 'bool' },
    ],
  };

  // Convert string values to numbers where needed
  const message = {
    subscriber: permit.subscriber,
    token: permit.token,
    recipient: permit.recipient,
    feeAddress: permit.feeAddress,
    amount: permit.amount,
    feeAmount: permit.feeAmount,
    relayerFee: permit.relayerFee,
    periodSeconds: permit.periodSeconds,
    firstPayment: permit.firstPayment,
    totalPayments: permit.totalPayments,
    nonce: typeof permit.nonce === 'string' ? permit.nonce : permit.nonce.toString(),
    deadline: permit.deadline,
    strictOrder: permit.strictOrder,
  };

  try {
    return await (signer.provider as any).send('eth_signTypedData', [
      await signer.getAddress(),
      {
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          ...types,
        },
        primaryType: 'SchedulePermit',
        domain,
        message,
      },
    ]);
  } catch (_) {
    // Fallback to ethers helper (works in most in-process Hardhat environments)
    return await (signer as any)._signTypedData(domain, types, message);
  }
}

describe('erc20-recurring-payment-proxy', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('encodeSetRecurringAllowance', () => {
    it('should return a single transaction for token approval', () => {
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
    it('should encode trigger data correctly', async () => {
      const proxyAddress = erc20RecurringPaymentProxyArtifact.getAddress(network);
      const permitSignature = await createSchedulePermitSignature(
        schedulePermit,
        wallet,
        proxyAddress!,
      );

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
          permitSignature: '0x1234567890abcdef', // This won't be used due to the mock
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
    firstPayment: Math.floor(Date.now() / 1000),
    totalPayments: 12,
    nonce: 0,
    deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    strictOrder: false,
  };

  it('should encode recurring payment trigger', async () => {
    const proxyAddress = erc20RecurringPaymentProxyArtifact.getAddress(network);
    const permitSignature = await createSchedulePermitSignature(permit, wallet, proxyAddress!);

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

  it('should trigger recurring payment with proper setup', async () => {
    // Mock the proxy address to ensure it exists
    const mockProxyAddress = '0xd8672a4A1bf37D36beF74E36edb4f17845E76F4e';
    jest.spyOn(erc20RecurringPaymentProxyArtifact, 'getAddress').mockReturnValue(mockProxyAddress);

    // Create a valid permit with the wallet as subscriber
    const validPermit: PaymentTypes.SchedulePermit = {
      subscriber: wallet.address,
      token: erc20ContractAddress,
      recipient: '0x3234567890123456789012345678901234567890',
      feeAddress: '0x4234567890123456789012345678901234567890',
      amount: '1000000000000000000', // 1 token
      feeAmount: '10000000000000000', // 0.01 token
      relayerFee: '5000000000000000', // 0.005 token
      periodSeconds: 86400, // 1 day
      firstPayment: Math.floor(Date.now() / 1000),
      totalPayments: 12,
      nonce: 0,
      deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      strictOrder: false,
    };

    // Create a valid signature for the permit
    const permitSignature = await createSchedulePermitSignature(
      validPermit,
      wallet,
      mockProxyAddress,
    );

    // Mock the provider to simulate a successful transaction
    const mockProvider = {
      sendTransaction: jest.fn().mockResolvedValue({
        hash: '0x1234567890abcdef',
        wait: jest.fn().mockResolvedValue({
          status: 1,
          transactionHash: '0x1234567890abcdef',
        }),
      }),
    };

    // Mock the wallet to use our mock provider
    const mockWallet = {
      ...wallet,
      provider: mockProvider,
      sendTransaction: mockProvider.sendTransaction,
    };

    // Test the trigger function
    const result = await triggerRecurringPayment({
      permitTuple: validPermit,
      permitSignature,
      paymentIndex: 1,
      paymentReference,
      signer: mockWallet as any,
      network,
    });

    expect(result).toBeDefined();
    expect(mockProvider.sendTransaction).toHaveBeenCalledWith({
      to: mockProxyAddress,
      data: expect.any(String),
      value: 0,
    });
  });

  it('should handle triggerRecurringPayment errors properly', async () => {
    // Mock the proxy address to ensure it exists
    const mockProxyAddress = '0xd8672a4A1bf37D36beF74E36edb4f17845E76F4e';
    jest.spyOn(erc20RecurringPaymentProxyArtifact, 'getAddress').mockReturnValue(mockProxyAddress);

    // Create a valid permit
    const validPermit: PaymentTypes.SchedulePermit = {
      subscriber: wallet.address,
      token: erc20ContractAddress,
      recipient: '0x3234567890123456789012345678901234567890',
      feeAddress: '0x4234567890123456789012345678901234567890',
      amount: '1000000000000000000',
      feeAmount: '10000000000000000',
      relayerFee: '5000000000000000',
      periodSeconds: 86400,
      firstPayment: Math.floor(Date.now() / 1000),
      totalPayments: 12,
      nonce: 0,
      deadline: Math.floor(Date.now() / 1000) + 3600,
      strictOrder: false,
    };

    const permitSignature = await createSchedulePermitSignature(
      validPermit,
      wallet,
      mockProxyAddress,
    );

    // Mock provider that throws an error
    const mockProvider = {
      sendTransaction: jest.fn().mockRejectedValue(new Error('Transaction failed')),
    };

    const mockWallet = {
      ...wallet,
      provider: mockProvider,
      sendTransaction: mockProvider.sendTransaction,
    };

    // Test that the function properly handles errors
    await expect(
      triggerRecurringPayment({
        permitTuple: validPermit,
        permitSignature,
        paymentIndex: 1,
        paymentReference,
        signer: mockWallet as any,
        network,
      }),
    ).rejects.toThrow('Transaction failed');
  });
});
