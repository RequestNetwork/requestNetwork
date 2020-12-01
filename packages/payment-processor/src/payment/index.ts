import { ContractTransaction, Signer } from 'ethers';
import { Provider, Web3Provider } from 'ethers/providers';
import { BigNumberish, bigNumberify } from 'ethers/utils';

import { ClientTypes, ExtensionTypes } from '@requestnetwork/types';

import { getBtcPaymentUrl } from './btc-address-based';
import { _getErc20PaymentUrl, getAnyErc20Balance } from './erc20';
import { payErc20Request } from './erc20';
import { payConversionErc20FeeProxyRequest } from './erc20-conversion-fee-proxy';
import { _getEthPaymentUrl, payEthInputDataRequest } from './eth-input-data';
import { ITransactionOverrides } from './transaction-overrides';
import { getNetworkProvider, getProvider, getSigner } from './utils';
import { ICurrency } from '@requestnetwork/types/dist/request-logic-types';
import { ISwapSettings } from './swap-erc20-fee-proxy';

export const supportedNetworks = [
  ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT,
  ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT,
  ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA
];

const getPaymentNetwork = (request: ClientTypes.IRequestData): ExtensionTypes.ID | undefined => {
  // tslint:disable-next-line: typedef
  return Object.values(request.extensions).find(x => x.type === 'payment-network')?.id;
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
 * Processes a transaction to pay a Request.
 * Supported networks: ERC20_PROXY_CONTRACT, ETH_INPUT_DATA, ERC20_FEE_PROXY_CONTRACT
 *
 * @throws UnsupportedNetworkError if network isn't supported for swap or payment.
 * @param request the request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function payRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: Web3Provider | Signer = getProvider(),
  amount?: BigNumberish,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const signer = getSigner(signerOrProvider);
  const paymentNetwork = getPaymentNetwork(request);
  switch (paymentNetwork) {
    case ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT:
    case ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT:
      return payErc20Request(request, signer, amount, undefined, overrides);
    case ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA:
      return payEthInputDataRequest(request, signer, amount, overrides);
    default:
      throw new UnsupportedNetworkError(paymentNetwork);
  }
}

/**
 * Processes a transaction to pay a Request with a swap
 * Supported payment networks: ERC20_PROXY_CONTRACT, ETH_INPUT_DATA, ERC20_FEE_PROXY_CONTRACT
 *
 * @throws UnsupportedNetworkError if network isn't supported for swap or payment.
 * @param request the request to pay.
 * @param swapSettings the information of how to swap from another payment token.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay in request currency. Defaults to remaining amount of the request.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function conversionToPayRequest(
  request: ClientTypes.IRequestData,
  tokenAddress: string,
  signerOrProvider: Web3Provider | Signer = getProvider(),
  amount?: BigNumberish,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const signer = getSigner(signerOrProvider);
  const paymentNetwork = getPaymentNetwork(request);

  if (!paymentNetwork || (paymentNetwork !== ExtensionTypes.ID.PAYMENT_NETWORK_ANY_CONVERSION_FEE_PROXY_CONTRACT)) {
    throw new UnsupportedNetworkError(paymentNetwork);
  }

  return payConversionErc20FeeProxyRequest(request, tokenAddress, signer, amount, undefined, request.extensions[paymentNetwork].values.network, overrides);
}

/**
 * Processes a transaction to pay a Request with a swap
 * Supported payment networks: ERC20_PROXY_CONTRACT, ETH_INPUT_DATA, ERC20_FEE_PROXY_CONTRACT
 *
 * @throws UnsupportedNetworkError if network isn't supported for swap or payment.
 * @param request the request to pay.
 * @param swapSettings the information of how to swap from another payment token.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay in request currency. Defaults to remaining amount of the request.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function swapToPayRequest(
  request: ClientTypes.IRequestData,
  swapSettings: ISwapSettings,
  signerOrProvider: Web3Provider | Signer = getProvider(),
  amount?: BigNumberish,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const signer = getSigner(signerOrProvider);
  const paymentNetwork = getPaymentNetwork(request);
  if (!canSwapToPay(request)) {
    throw new UnsupportedNetworkError(paymentNetwork);
  }
  return payErc20Request(request, signer, amount, undefined, overrides, swapSettings);
}

/**
 * Verifies the address has enough funds to pay the request in its currency.
 * Supported networks: ERC20_PROXY_CONTRACT, ETH_INPUT_DATA
 *
 * @throws UnsupportedNetworkError if network isn't supported
 * @param request the request to verify.
 * @param address the address holding the funds
 * @param provider the Web3 provider. Defaults to Etherscan.
 */
export async function hasSufficientFunds(
  request: ClientTypes.IRequestData,
  address: string,
  provider?: Provider,
): Promise<boolean> {
  const paymentNetwork = getPaymentNetwork(request);
  if (!paymentNetwork || !supportedNetworks.includes(paymentNetwork)) {
    throw new UnsupportedNetworkError(paymentNetwork);
  }

  if (!provider) {
    provider = getNetworkProvider(request);
  }

  let feeAmount = 0;
  if (paymentNetwork === ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT) {
    feeAmount = request.extensions[paymentNetwork].values.feeAmount || 0;
  }
  return isSolvent(
    address,
    request.currencyInfo,
    bigNumberify(request.expectedAmount).add(feeAmount),
    provider
  );
}

/**
 * Verifies the address has enough funds to pay an amount in a given currency.
 *
 * @param fromAddress the address willing to pay
 * @param amount
 * @param currency
 * @param provider the Web3 provider. Defaults to Etherscan.
 * @throws UnsupportedNetworkError if network isn't supported
 */
export async function isSolvent(
  fromAddress: string,
  currency: ICurrency,
  amount: BigNumberish,
  provider: Provider,
): Promise<boolean> {
  const ethBalance = await provider.getBalance(fromAddress);
  const needsGas  =  (provider as any)?.provider?.wc?._peerMeta?.name !== 'Safe Multisig WalletConnect';

  if (currency.type === 'ETH') {
    return ethBalance.gt(amount);
  } else {
    const balance = await getCurrencyBalance(fromAddress, currency, provider);
    return (ethBalance.gt(0) || !needsGas) && bigNumberify(balance).gte(amount);
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
  paymentCurrency: ICurrency,
  provider: Provider,
): Promise<BigNumberish> {
  switch (paymentCurrency.type) {
    case 'ETH': {
      return provider.getBalance(address);
    }
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
  return (paymentNetwork !== undefined
    && (paymentNetwork === ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT));
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
    case ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT:
    case ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT:
      return _getErc20PaymentUrl(request, amount);
    case ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA:
      return _getEthPaymentUrl(request, amount);
    case ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED:
    case ExtensionTypes.ID.PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED:
      return getBtcPaymentUrl(request, amount);
    default:
      throw new UnsupportedNetworkError(paymentNetwork);
  }
}
