import { ContractTransaction, Signer } from 'ethers';
import { Provider, Web3Provider } from 'ethers/providers';
import { bigNumberify, BigNumberish } from 'ethers/utils';

import { ClientTypes, ExtensionTypes } from '@requestnetwork/types';

import { getBtcPaymentUrl } from './btc-address-based';
import { _getErc20PaymentUrl, getErc20Balance } from './erc20';
import { payErc20Request } from './erc20';
import { _getEthPaymentUrl, payEthInputDataRequest } from './eth-input-data';
import { ITransactionOverrides } from './transaction-overrides';
import { getNetworkProvider, getProvider, getSigner } from './utils';

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
  provider?: Provider,
): Promise<boolean> {
  const paymentNetwork = getPaymentNetwork(request);

  let ethBalance;
  switch (paymentNetwork) {
    case ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT: {
      if (!provider) {
        provider = getNetworkProvider(request);
      }
      ethBalance = await provider.getBalance(address);
      const balance = await getErc20Balance(request, address, provider);
      // check ETH for gas, and token for funds transfer
      return ethBalance.gt(0) && balance.gt(bigNumberify(request.expectedAmount || 0));
    }
    case ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT: {
      if (!provider) {
        provider = getNetworkProvider(request);
      }
      ethBalance = await provider.getBalance(address);
      const balance = await getErc20Balance(request, address, provider);
      const feeAmount =
        request.extensions[ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT].values
          .feeAmount || 0;
      // check ETH for gas, and token for funds transfer
      return (
        ethBalance.gt(0) && balance.gt(bigNumberify(request.expectedAmount || 0).add(feeAmount))
      );
    }
    case ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA: {
      if (!provider) {
        provider = getNetworkProvider(request);
      }
      ethBalance = await provider.getBalance(address);
      return ethBalance.gt(bigNumberify(request.expectedAmount || 0));
    }
    default:
      throw new UnsupportedNetworkError(paymentNetwork);
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
