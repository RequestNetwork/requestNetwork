import { ContractTransaction } from 'ethers';
import { Web3Provider } from 'ethers/providers';
import { bigNumberify } from 'ethers/utils';

import { ClientTypes, ExtensionTypes } from '@requestnetwork/types';

import { getBtcPaymentUrl } from './btc-address-based';
import { getErc20Balance, getErc20PaymentUrl, payErc20ProxyRequest } from './erc20-proxy';
import { getEthPaymentUrl, payEthInputDataRequest } from './eth-input-data';
import { getProvider } from './utils';

const getPaymentNetwork = (request: ClientTypes.IRequestData): ExtensionTypes.ID | undefined => {
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

export const payRequest = async (
  request: ClientTypes.IRequestData,
  address: string,
  provider: Web3Provider = getProvider(),
): Promise<ContractTransaction> => {
  const signer = provider.getSigner(address);
  const paymentNetwork = getPaymentNetwork(request);
  switch (paymentNetwork) {
    case ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT:
      return payErc20ProxyRequest(request, signer);
    case ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA:
      return payEthInputDataRequest(request, signer);
    default:
      throw new UnsupportedNetworkError(paymentNetwork);
  }
};

export const hasSufficientFunds = async (
  request: ClientTypes.IRequestData,
  address: string,
  provider: Web3Provider = getProvider(),
): Promise<boolean> => {
  const ethBalance = await provider.getBalance(address);

  const paymentNetwork = getPaymentNetwork(request);

  switch (paymentNetwork) {
    case ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT:
      const balance = await getErc20Balance(request.currencyInfo.value, address, provider);
      // check ETH for gas, and token for funds transfer
      return ethBalance.gt(0) && balance.gt(bigNumberify(request.expectedAmount || 0));
    case ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA:
      return ethBalance.gt(bigNumberify(request.expectedAmount || 0));
    default:
      throw new UnsupportedNetworkError(paymentNetwork);
  }
};

export const getPaymentUrl = (request: ClientTypes.IRequestData): string => {
  const paymentNetwork = getPaymentNetwork(request);
  switch (paymentNetwork) {
    case ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT:
      return getErc20PaymentUrl(request);
    case ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA:
      return getEthPaymentUrl(request);
    case ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED:
    case ExtensionTypes.ID.PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED:
      return getBtcPaymentUrl(request);
    default:
      throw new UnsupportedNetworkError(paymentNetwork);
  }
};
