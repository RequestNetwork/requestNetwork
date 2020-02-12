import { ContractTransaction, Signer } from 'ethers';
import { Provider, Web3Provider } from 'ethers/providers';
import { bigNumberify, BigNumberish } from 'ethers/utils';

import { ClientTypes, ExtensionTypes } from '@requestnetwork/types';

import { getBtcPaymentUrl } from './btc-address-based';
import { getErc20Balance, getErc20PaymentUrl, payErc20ProxyRequest } from './erc20-proxy';
import { getEthPaymentUrl, payEthInputDataRequest } from './eth-input-data';
import { getNetworkProvider, getProvider, getSigner } from './utils';

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

/**
 * Processes a transaction to pay a Request.
 * Supported networks: ERC20_PROXY_CONTRACT, ETH_INPUT_DATA
 *
 * @throws UnsupportedNetworkError if network isn't supported
 * @param request the request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 */
export async function payRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: Web3Provider | Signer = getProvider(),
  amount?: BigNumberish,
): Promise<ContractTransaction> {
  const signer = getSigner(signerOrProvider);
  const paymentNetwork = getPaymentNetwork(request);
  switch (paymentNetwork) {
    case ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT:
      return payErc20ProxyRequest(request, signer, amount);
    case ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA:
      return payEthInputDataRequest(request, signer, amount);
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
 * @param provider the Web3 provider. Defaults to Etherscan.
 */
export async function hasSufficientFunds(
  request: ClientTypes.IRequestData,
  address: string,
  provider: Provider = getNetworkProvider(request),
): Promise<boolean> {
  const ethBalance = await provider.getBalance(address);

  const paymentNetwork = getPaymentNetwork(request);

  switch (paymentNetwork) {
    case ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT:
      const balance = await getErc20Balance(request, address, provider);
      // check ETH for gas, and token for funds transfer
      return ethBalance.gt(0) && balance.gt(bigNumberify(request.expectedAmount || 0));
    case ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA:
      return ethBalance.gt(bigNumberify(request.expectedAmount || 0));
    default:
      throw new UnsupportedNetworkError(paymentNetwork);
  }
}

/**
 * Get a payment URL, if applicable to the payment network, for a request.
 * BTC: BIP21.
 * ERC20: EIP-681. (Warning, not widely used. Some wallets may not be able to pay.)
 * ETH: not implemented.
 * @throws UnsupportedNetworkError if the network is not supported.
 * @param request the request to pay
 */
export function getPaymentUrl(request: ClientTypes.IRequestData): string {
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
}
