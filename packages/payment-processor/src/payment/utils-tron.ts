import { BigNumber, BigNumberish } from 'ethers';
import { CurrencyTypes } from '@requestnetwork/types';
import { erc20FeeProxyArtifact } from '@requestnetwork/smart-contracts';

/** Default fee limit for TRC20 approval (100 TRX in SUN) */
export const DEFAULT_TRON_APPROVAL_FEE_LIMIT = 100_000_000;

/**
 * Default fee limit for TRC20 fee proxy payment (300 TRX in SUN).
 * Uses a higher safety margin because `transferFromWithReferenceAndFee`
 * involves multiple internal transfers (token transfer, fee transfer,
 * reference event emission) which can consume more energy than a
 * simple approve call.
 */
export const DEFAULT_TRON_PAYMENT_FEE_LIMIT = 300_000_000;

// TronWeb types for v6+
// Using interface that matches TronWeb's actual API
export interface TronWeb {
  address: {
    fromPrivateKey: (privateKey: string) => string;
    toHex: (address: string) => string;
    fromHex: (address: string) => string;
  };
  trx: {
    getBalance: (address: string) => Promise<number>;
    sign: (transaction: unknown, privateKey?: string) => Promise<unknown>;
    sendRawTransaction: (signedTransaction: unknown) => Promise<TronTransactionResult>;
  };
  contract: <T extends readonly unknown[]>(
    abi: T,
    address: string,
  ) => Promise<TronContractInstance<T>>;
  transactionBuilder: {
    triggerSmartContract: (
      contractAddress: string,
      functionSelector: string,
      options: TronTriggerOptions,
      parameters: unknown[],
      issuerAddress: string,
    ) => Promise<{ transaction: unknown; result: { result: boolean } }>;
  };
  defaultAddress: {
    base58: string;
    hex: string;
  };
  toSun: (amount: number) => number;
  fromSun: (amount: number) => number;
}

// Generic contract instance type that provides method typing based on ABI
export type TronContractInstance<T> = {
  [K in ExtractFunctionNames<T>]: (...args: unknown[]) => TronContractMethod;
};

// Helper type to extract function names from ABI
type ExtractFunctionNames<T> = T extends readonly (infer U)[]
  ? U extends { name: string; type: 'function' }
    ? U['name']
    : never
  : never;

export interface TronContractMethod {
  call: () => Promise<unknown>;
  send: (options?: TronSendOptions) => Promise<TronTransactionResult>;
}

export interface TronTriggerOptions {
  feeLimit?: number;
  callValue?: number;
}

export interface TronSendOptions {
  feeLimit?: number;
  callValue?: number;
  shouldPollResponse?: boolean;
}

export interface TronTransactionResult {
  result?: boolean;
  txid?: string;
  transaction?: {
    txID: string;
  };
}

/**
 * Callback arguments for Tron transactions
 */
export interface ITronTransactionCallback {
  onHash?: (txHash: string) => void;
  onConfirmation?: (receipt: unknown) => void;
  onError?: (error: Error) => void;
}

/**
 * Validates a Tron address (Base58 format starting with T)
 */
export const isValidTronAddress = (address: string): boolean => {
  if (!address) return false;
  // Tron addresses start with 'T' and are 34 characters in Base58Check encoding
  // Base58 alphabet: 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
  // (excludes 0, O, I, l to avoid confusion)
  const tronAddressRegex = /^T[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{33}$/;
  return tronAddressRegex.test(address);
};

/**
 * Gets the ERC20FeeProxy contract address for a Tron network
 */
export const getERC20FeeProxyAddress = (network: CurrencyTypes.TronChainName): string => {
  return erc20FeeProxyArtifact.getAddress(network, 'tron');
};

/**
 * Checks if a Tron account has sufficient TRC20 token balance
 */
export const isTronAccountSolvent = async (
  tronWeb: TronWeb,
  tokenAddress: string,
  amount: BigNumberish,
): Promise<boolean> => {
  try {
    const contract = await tronWeb.contract(TRC20_ABI, tokenAddress);
    const balance = await contract.balanceOf(tronWeb.defaultAddress.base58).call();
    return BigNumber.from(String(balance)).gte(amount);
  } catch (error) {
    console.error('Error checking Tron account solvency:', error);
    return false;
  }
};

/**
 * Checks the TRC20 token allowance for the ERC20FeeProxy contract
 */
export const getTronAllowance = async (
  tronWeb: TronWeb,
  tokenAddress: string,
  network: CurrencyTypes.TronChainName,
): Promise<BigNumber> => {
  try {
    const proxyAddress = getERC20FeeProxyAddress(network);
    const contract = await tronWeb.contract(TRC20_ABI, tokenAddress);
    const allowance = await contract.allowance(tronWeb.defaultAddress.base58, proxyAddress).call();
    return BigNumber.from(String(allowance));
  } catch (error) {
    console.error('Error getting Tron allowance:', error);
    return BigNumber.from(0);
  }
};

/**
 * Approves the ERC20FeeProxy contract to spend TRC20 tokens
 * @param feeLimit - Optional fee limit in SUN (1 TRX = 1,000,000 SUN). Defaults to 100 TRX.
 */
export const approveTrc20 = async (
  tronWeb: TronWeb,
  tokenAddress: string,
  network: CurrencyTypes.TronChainName,
  amount: BigNumberish,
  callback?: ITronTransactionCallback,
  feeLimit: number = DEFAULT_TRON_APPROVAL_FEE_LIMIT,
): Promise<string> => {
  const proxyAddress = getERC20FeeProxyAddress(network);
  const contract = await tronWeb.contract(TRC20_ABI, tokenAddress);

  try {
    const result = await contract.approve(proxyAddress, amount.toString()).send({
      feeLimit,
      shouldPollResponse: true,
    });

    const txHash = result.txid || result.transaction?.txID || '';
    callback?.onHash?.(txHash);

    return txHash;
  } catch (error) {
    callback?.onError?.(error as Error);
    throw new Error(`TRC20 approval failed: ${(error as Error).message}`);
  }
};

/**
 * Processes a TRC20 fee proxy payment on Tron
 * @param feeLimit - Optional fee limit in SUN (1 TRX = 1,000,000 SUN). Defaults to 150 TRX.
 */
export const processTronFeeProxyPayment = async (
  tronWeb: TronWeb,
  network: CurrencyTypes.TronChainName,
  tokenAddress: string,
  to: string,
  amount: BigNumberish,
  paymentReference: string,
  feeAmount: BigNumberish,
  feeAddress: string,
  callback?: ITronTransactionCallback,
  feeLimit: number = DEFAULT_TRON_PAYMENT_FEE_LIMIT,
): Promise<string> => {
  // Validate addresses
  if (!isValidTronAddress(to)) {
    throw new Error(`Invalid Tron payment address: ${to}`);
  }
  if (feeAmount.toString() !== '0' && !isValidTronAddress(feeAddress)) {
    throw new Error(`Invalid Tron fee address: ${feeAddress}`);
  }
  if (!isValidTronAddress(tokenAddress)) {
    throw new Error(`Invalid TRC20 token address: ${tokenAddress}`);
  }

  const proxyAddress = getERC20FeeProxyAddress(network);

  // Get the proxy contract
  const proxyContract = await tronWeb.contract(ERC20_FEE_PROXY_ABI, proxyAddress);

  // Format payment reference - ensure it's bytes format
  const formattedReference = paymentReference.startsWith('0x')
    ? paymentReference
    : `0x${paymentReference}`;

  try {
    // Call transferFromWithReferenceAndFee
    const result = await proxyContract
      .transferFromWithReferenceAndFee(
        tokenAddress,
        to,
        amount.toString(),
        formattedReference,
        feeAmount.toString(),
        feeAddress,
      )
      .send({
        feeLimit,
        shouldPollResponse: true,
      });

    const txHash = result.txid || result.transaction?.txID || '';
    callback?.onHash?.(txHash);

    return txHash;
  } catch (error) {
    callback?.onError?.(error as Error);
    throw new Error(`Tron fee proxy payment failed: ${(error as Error).message}`);
  }
};

/**
 * Encodes a TRC20 fee proxy payment for use with multi-sig or batching
 */
export const encodeTronFeeProxyPayment = (
  tokenAddress: string,
  to: string,
  amount: BigNumberish,
  paymentReference: string,
  feeAmount: BigNumberish,
  feeAddress: string,
): {
  functionSelector: string;
  parameters: unknown[];
} => {
  const formattedReference = paymentReference.startsWith('0x')
    ? paymentReference
    : `0x${paymentReference}`;

  return {
    functionSelector:
      'transferFromWithReferenceAndFee(address,address,uint256,bytes,uint256,address)',
    parameters: [
      { type: 'address', value: tokenAddress },
      { type: 'address', value: to },
      { type: 'uint256', value: amount.toString() },
      { type: 'bytes', value: formattedReference },
      { type: 'uint256', value: feeAmount.toString() },
      { type: 'address', value: feeAddress },
    ],
  };
};

// Minimal TRC20 ABI for balance, allowance, and approve
// Using `as const` for proper type inference in TronWeb v6+
const TRC20_ABI = [
  {
    constant: true,
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
] as const;

// ERC20FeeProxy ABI (minimal, only what we need)
// Using `as const` for proper type inference in TronWeb v6+
const ERC20_FEE_PROXY_ABI = [
  {
    inputs: [
      { name: '_tokenAddress', type: 'address' },
      { name: '_to', type: 'address' },
      { name: '_amount', type: 'uint256' },
      { name: '_paymentReference', type: 'bytes' },
      { name: '_feeAmount', type: 'uint256' },
      { name: '_feeAddress', type: 'address' },
    ],
    name: 'transferFromWithReferenceAndFee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;
