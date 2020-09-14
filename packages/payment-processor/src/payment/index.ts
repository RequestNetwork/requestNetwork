import { ContractTransaction, Signer } from 'ethers';
import { Provider, Web3Provider } from 'ethers/providers';
import { BigNumberish, BigNumber } from 'ethers/utils';

import { ClientTypes, ExtensionTypes } from '@requestnetwork/types';

import { getBtcPaymentUrl } from './btc-address-based';
import { _getErc20PaymentUrl, getAnyErc20Balance } from './erc20';
import { payErc20Request } from './erc20';
import { _getEthPaymentUrl, payEthInputDataRequest } from './eth-input-data';
import { ITransactionOverrides } from './transaction-overrides';
import { getNetworkProvider, getProvider, getSigner } from './utils';
import { ICurrency, CURRENCY } from '@requestnetwork/types/dist/request-logic-types';
import { ISwapSettings } from '@requestnetwork/types/dist/payment-types';

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
 * @throws UnsupportedNetworkError if network isn't supported
 * @param request the request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function payRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: Web3Provider | Signer = getProvider(),
  amount?: BigNumberish,
  swapSettings?: ISwapSettings,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const signer = getSigner(signerOrProvider);
  const paymentNetwork = getPaymentNetwork(request);
  if (swapSettings && paymentNetwork !== ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT) {
    throw new Error(`Payment network: ${paymentNetwork} is not supported by swapToPay contract`);
  }
  switch (paymentNetwork) {
    case ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT:
    case ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT:
      return payErc20Request(request, signer, amount, undefined, swapSettings, overrides);
    case ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA:
      return payEthInputDataRequest(request, signer, amount, overrides);
    default:
      throw new UnsupportedNetworkError(paymentNetwork);
  }
}

/**
 * Verifies the address has enough funds to pay the request. For ERC20
 * Supported networks: ERC20_PROXY_CONTRACT, ETH_INPUT_DATA
 *
 * @throws UnsupportedNetworkError if network isn't supported
 * @param request the request to verify.
 * @param address the address holding the funds
 * @param paymentCurrency if different from the requested currency
 * @param provider the Web3 provider. Defaults to Etherscan.
 */
export async function hasSufficientFunds(
  request: ClientTypes.IRequestData,
  address: string,
  provider?: Provider,
  paymentCurrency?: ICurrency,
): Promise<boolean> {

  const paymentNetwork = getPaymentNetwork(request);
  if (!paymentNetwork || supportedNetworks.indexOf(paymentNetwork) === -1) {
    throw new UnsupportedNetworkError(paymentNetwork);
  }

  let totalInPaymentCcy: BigNumberish;
  let feeAmount = new BigNumber(0);

  if (paymentNetwork == ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT) {
    feeAmount = request.extensions[paymentNetwork].values.feeAmount || 0;
  }

  if (!paymentCurrency || paymentCurrency === request.currencyInfo) {
    paymentCurrency = request.currencyInfo;
    totalInPaymentCcy = new BigNumber(request.expectedAmount).add(feeAmount);
  } else {
    if (paymentNetwork !== ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT) {
      throw new Error("Cannot swap to pay this request. Only works with ERC20_FEE_PROXY_CONTRACT");
    }
    totalInPaymentCcy = await getQuote(
      new BigNumber(request.expectedAmount).add(feeAmount), 
      paymentCurrency, 
      request.currencyInfo
    );
  }

  if (!provider) {
    provider = getNetworkProvider(request);
  }

  const balance = await getBalanceInAnyCurrency(address, paymentCurrency, provider);
  const ethBalance = (paymentCurrency.type === CURRENCY.ETH) ? 
    balance
    : await getBalanceInAnyCurrency(
    address, 
    {type: CURRENCY.ETH, value: 'ETH', network: paymentCurrency.network}, 
    provider
  );
  console.log(`YMA: ${ethBalance}`);

  return ethBalance.gt(0) && balance.gt(totalInPaymentCcy);
}

export async function getBalanceInAnyCurrency(
  address: string,
  paymentCurrency: ICurrency,
  provider: Provider,
): Promise<BigNumber> {
  switch (paymentCurrency.type) {
    case "ETH": {
      return await provider.getBalance(address);
    }
    case "ERC20": {
      return await await getAnyErc20Balance(paymentCurrency.value, address, provider);
    }
    default:
      throw new Error("Unsupported payment currency type");
  }
}

// TODO
export async function getQuote(
  amountOut: BigNumberish, 
  currencyIn: ICurrency, 
  currencyOut: ICurrency
): Promise<BigNumberish> {
  if (currencyIn !== currencyOut) {
    return amountOut;
  } else {
    return new BigNumber(amountOut).mul(2);
  }
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
