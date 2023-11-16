import { ContractTransaction, Signer, BigNumber, BigNumberish, providers } from 'ethers';

import { ClientTypes, CurrencyTypes, ExtensionTypes, TypesUtils } from '@requestnetwork/types';

import { getBtcPaymentUrl } from './btc-address-based';
import { _getErc20PaymentUrl, getAnyErc20Balance } from './erc20';
import { payErc20Request } from './erc20';
import { payErc777StreamRequest } from './erc777-stream';
import { _getEthPaymentUrl, payEthInputDataRequest } from './eth-input-data';
import { payEthFeeProxyRequest } from './eth-fee-proxy';
import { ITransactionOverrides } from './transaction-overrides';
import { getNetworkProvider, getProvider, getSigner } from './utils';
import { ISwapSettings } from './swap-erc20-fee-proxy';
import { RequestLogicTypes } from '@requestnetwork/types';
import { payAnyToErc20ProxyRequest } from './any-to-erc20-proxy';
import { payAnyToEthProxyRequest } from './any-to-eth-proxy';
import { WalletConnection } from 'near-api-js';
import { isNearAccountSolvent } from './utils-near';
import { NearChains } from '@requestnetwork/currency';
import { encodeRequestErc20Approval } from './encoder-approval';
import { encodeRequestPayment } from './encoder-payment';
import { IPreparedTransaction } from './prepared-transaction';
import { IRequestPaymentOptions } from '../types';
export { INearTransactionCallback } from './utils-near';

export const noConversionNetworks = [
  ExtensionTypes.PAYMENT_NETWORK_ID.ERC777_STREAM,
  ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT,
  ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
  ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_TRANSFERABLE_RECEIVABLE,
  ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA,
  ExtensionTypes.PAYMENT_NETWORK_ID.NATIVE_TOKEN,
  ExtensionTypes.PAYMENT_NETWORK_ID.ETH_FEE_PROXY_CONTRACT,
];

export interface IConversionPaymentSettings {
  currency?: RequestLogicTypes.ICurrency;
  maxToSpend: BigNumberish;
  currencyManager?: CurrencyTypes.ICurrencyManager;
}

const getPaymentNetwork = (
  request: ClientTypes.IRequestData,
): ExtensionTypes.PAYMENT_NETWORK_ID | undefined => {
  // eslint-disable-next-line
  const id = Object.values(request.extensions).find((x) => x.type === 'payment-network')?.id;
  if (TypesUtils.isPaymentNetworkId(id)) {
    return id;
  }
};

/**
 * Error thrown when the network is not supported.
 */
export class UnsupportedNetworkError extends Error {
  constructor(public networkName?: string) {
    super(`Payment network ${networkName} is not supported`);
  }
}

/**
 * Error thrown when the payment currency network is not supported.
 */
export class UnsupportedPaymentChain extends Error {
  constructor(public currencyNetworkName?: string) {
    super(`Payment currency network ${currencyNetworkName} is not supported`);
  }
}

/**
 * Processes a transaction to pay a Request.
 * Supported networks:
 * - ERC20_PROXY_CONTRACT
 * - ETH_INPUT_DATA
 * - ERC20_FEE_PROXY_CONTRACT
 * - ANY_TO_ERC20_PROXY
 * - ERC777_STREAM
 * - ERC20_TRANSFERABLE_RECEIVABLE
 *
 * @throws UnsupportedNetworkError if network isn't supported for swap or payment.
 * @throws UnsupportedPaymentChain if the currency network is not supported (eg Near)
 * @param request the request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function payRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  amount?: BigNumberish,
  overrides?: ITransactionOverrides,
  paymentSettings?: IConversionPaymentSettings,
): Promise<ContractTransaction> {
  throwIfNotWeb3(request);
  const signer = getSigner(signerOrProvider);
  const paymentNetwork = getPaymentNetwork(request);
  switch (paymentNetwork) {
    case ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT:
    case ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT:
    case ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_TRANSFERABLE_RECEIVABLE:
      return payErc20Request(request, signer, amount, undefined, overrides);
    case ExtensionTypes.PAYMENT_NETWORK_ID.ERC777_STREAM:
      return payErc777StreamRequest(request, signer);
    case ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY: {
      if (!paymentSettings) {
        throw new Error('Missing payment settings for a payment with conversion');
      }
      return payAnyToErc20ProxyRequest(
        request,
        signer,
        paymentSettings,
        amount,
        undefined,
        overrides,
      );
    }
    case ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ETH_PROXY: {
      if (!paymentSettings) {
        throw new Error('Missing payment settings for a payment with conversion');
      }
      return payAnyToEthProxyRequest(
        request,
        signer,
        paymentSettings,
        amount,
        undefined,
        overrides,
      );
    }
    case ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA:
      return payEthInputDataRequest(request, signer, amount, overrides);
    case ExtensionTypes.PAYMENT_NETWORK_ID.ETH_FEE_PROXY_CONTRACT:
      return payEthFeeProxyRequest(request, signer, amount, undefined, overrides);
    default:
      throw new UnsupportedNetworkError(paymentNetwork);
  }
}

/**
 * Encode the transactions associated to a request
 * @param request the request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param options encoding options
 * @returns
 */
export async function encodeRequestApprovalAndPayment(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Provider,
  options?: IRequestPaymentOptions,
): Promise<IPreparedTransaction[]> {
  const preparedTransactions: IPreparedTransaction[] = [];
  const approvalTx = await encodeRequestErc20Approval(request, signerOrProvider, options);
  if (approvalTx) {
    preparedTransactions.push(approvalTx);
  }
  preparedTransactions.push(encodeRequestPayment(request, signerOrProvider, options));
  return preparedTransactions;
}

/**
 * Processes a transaction to pay a Request with a swap
 * Supported payment networks: ERC20_PROXY_CONTRACT, ETH_INPUT_DATA, ERC20_FEE_PROXY_CONTRACT
 *
 * @throws UnsupportedNetworkError if network isn't supported for swap or payment.
 * @throws UnsupportedPaymentChain if the currency network is not supported (eg Near)
 * @param request the request to pay.
 * @param swapSettings the information of how to swap from another payment token.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay in request currency. Defaults to remaining amount of the request.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function swapToPayRequest(
  request: ClientTypes.IRequestData,
  swapSettings: ISwapSettings,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  amount?: BigNumberish,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  throwIfNotWeb3(request);
  const signer = getSigner(signerOrProvider);
  const paymentNetwork = getPaymentNetwork(request);
  if (!canSwapToPay(request)) {
    throw new UnsupportedNetworkError(paymentNetwork);
  }
  return payErc20Request(request, signer, amount, undefined, overrides, swapSettings);
}

/**
 * Verifies the address has enough funds to pay the request in its currency.
 * Only supports networks with no (on-chain) conversion.
 *
 * @throws UnsupportedNetworkError if network isn't supported
 * @param request the request to verify.
 * @param address the address holding the funds
 * @param providerOptions.provider the Web3 provider. Defaults to getDefaultProvider.
 * @param providerOptions.nearWalletConnection the Near WalletConnection
 */
export async function hasSufficientFunds(
  request: ClientTypes.IRequestData,
  address: string,
  providerOptions?: {
    provider?: providers.Provider;
    nearWalletConnection?: WalletConnection;
  },
): Promise<boolean> {
  const paymentNetwork = getPaymentNetwork(request);
  if (!paymentNetwork || !noConversionNetworks.includes(paymentNetwork)) {
    throw new UnsupportedNetworkError(paymentNetwork);
  }

  if (!providerOptions?.nearWalletConnection && !providerOptions?.provider) {
    providerOptions = { provider: getNetworkProvider(request) };
  }

  let feeAmount = 0;
  if (
    paymentNetwork === ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT ||
    paymentNetwork === ExtensionTypes.PAYMENT_NETWORK_ID.ETH_FEE_PROXY_CONTRACT
  ) {
    feeAmount = request.extensions[paymentNetwork].values.feeAmount || 0;
  }
  return isSolvent(
    address,
    request.currencyInfo,
    BigNumber.from(request.expectedAmount).add(feeAmount),
    providerOptions,
  );
}

/**
 * Verifies the address has enough funds to pay an amount in a given currency.
 * Supported chains: EVMs and Near.
 *
 * @param fromAddress the address willing to pay
 * @param providerOptions.provider the Web3 provider. Defaults to getDefaultProvider.
 * @param providerOptions.nearWalletConnection the Near WalletConnection
 * @throws UnsupportedNetworkError if network isn't supported
 */
export async function isSolvent(
  fromAddress: string,
  currency: RequestLogicTypes.ICurrency,
  amount: BigNumberish,
  providerOptions?: {
    provider?: providers.Provider;
    nearWalletConnection?: WalletConnection;
  },
): Promise<boolean> {
  // Near case
  if (NearChains.isChainSupported(currency.network) && providerOptions?.nearWalletConnection) {
    return isNearAccountSolvent(amount, providerOptions.nearWalletConnection, currency);
  }
  // Main case (EVM)
  if (!providerOptions?.provider) {
    throw new Error('provider missing');
  }
  const provider = providerOptions.provider;
  const ethBalance = await provider.getBalance(fromAddress);
  const needsGas =
    !(provider as any)?.provider?.safe?.safeAddress &&
    !['Safe Multisig WalletConnect', 'Gnosis Safe Multisig'].includes(
      (provider as any)?.provider?.wc?._peerMeta?.name,
    );

  if (currency.type === 'ETH') {
    return ethBalance.gt(amount);
  } else {
    const balance = await getCurrencyBalance(fromAddress, currency, provider);
    return (ethBalance.gt(0) || !needsGas) && BigNumber.from(balance).gte(amount);
  }
}

/**
 * Returns the balance of a given address in a given currency.
 * @param address the address holding the funds
 * @param paymentCurrency if different from the requested currency
 * @param provider the Web3 provider. Defaults to Etherscan.
 * @throws UnsupportedNetworkError if the currency is not implemented.
 */
async function getCurrencyBalance(
  address: string,
  paymentCurrency: RequestLogicTypes.ICurrency,
  provider: providers.Provider,
): Promise<BigNumberish> {
  switch (paymentCurrency.type) {
    case 'ETH': {
      return provider.getBalance(address);
    }
    case 'ERC777':
    case 'ERC20': {
      return getAnyErc20Balance(paymentCurrency.value, address, provider);
    }
    default:
      throw new UnsupportedNetworkError(paymentCurrency.network);
  }
}

/**
 * Given a request, the function gives whether swap is supported for its payment network.
 * @param request the request that accepts or not swap to payment
 */
export function canSwapToPay(request: ClientTypes.IRequestData): boolean {
  const paymentNetwork = getPaymentNetwork(request);
  return (
    paymentNetwork !== undefined &&
    paymentNetwork === ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT
  );
}

/**
 * Get a payment URL, if applicable to the payment network, for a request.
 * BTC: BIP21.
 * ERC20: EIP-681. (Warning, not widely used. Some wallets may not be able to pay.)
 * ETH: EIP-681. (Warning, not widely used. Some wallets may not be able to pay.)
 * @throws UnsupportedNetworkError if the network is not supported.
 * @param request the request to pay
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 */
export function _getPaymentUrl(request: ClientTypes.IRequestData, amount?: BigNumberish): string {
  const paymentNetwork = getPaymentNetwork(request);
  switch (paymentNetwork) {
    case ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT:
    case ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT:
      return _getErc20PaymentUrl(request, amount);
    case ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA:
      return _getEthPaymentUrl(request, amount);
    case ExtensionTypes.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED:
    case ExtensionTypes.PAYMENT_NETWORK_ID.TESTNET_BITCOIN_ADDRESS_BASED:
      return getBtcPaymentUrl(request, amount);
    default:
      throw new UnsupportedNetworkError(paymentNetwork);
  }
}

// FIXME: should also compare the signer.chainId with the request.currencyInfo.network...
const throwIfNotWeb3 = (request: ClientTypes.IRequestData) => {
  // FIXME: there is a near web3Provider equivalent: https://github.com/aurora-is-near/near-web3-provider
  if (request.currencyInfo?.network && NearChains.isChainSupported(request.currencyInfo.network)) {
    throw new UnsupportedPaymentChain(request.currencyInfo.network);
  }
};
