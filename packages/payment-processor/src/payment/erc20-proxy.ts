import { ContractTransaction, Signer, BigNumberish, providers } from 'ethers';

import { Erc20PaymentNetwork } from '@requestnetwork/payment-detection';
import { ERC20Proxy__factory } from '@requestnetwork/smart-contracts/types';
import { ClientTypes, ExtensionTypes } from '@requestnetwork/types';

import { ITransactionOverrides } from './transaction-overrides';
import {
  getAmountToPay,
  getProxyAddress,
  getProvider,
  getRequestPaymentValues,
  getSigner,
  validateRequest,
} from './utils';
import { IPreparedTransaction } from './prepared-transaction';

/**
 * Processes a transaction to pay an ERC20 Request.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function payErc20ProxyRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  amount?: BigNumberish,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const { data, to, value } = await prepareErc20ProxyPaymentTransaction(request, amount);
  const signer = getSigner(signerOrProvider);
  return signer.sendTransaction({ data, to, value, ...overrides });
}

/**
 * Encodes the call to pay a request through the ERC20 proxy contract, can be used with a Multisig contract.
 * @param request request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 */
export async function encodePayErc20Request(
  request: ClientTypes.IRequestData,
  amount?: BigNumberish,
): Promise<string> {
  validateRequest(request, ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT);
  const tokenAddress = request.currencyInfo.value;

  const { paymentReference, paymentAddress } = await getRequestPaymentValues(request);
  const amountToPay = getAmountToPay(request, amount);

  const proxyContract = ERC20Proxy__factory.createInterface();
  return proxyContract.encodeFunctionData('transferFromWithReference', [
    tokenAddress,
    paymentAddress,
    amountToPay,
    `0x${paymentReference}`,
  ]);
}

/**
 * Return the EIP-681 format URL with the transaction to pay an ERC20
 * Warning: this EIP isn't widely used, be sure to test compatibility yourself.
 *
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 */
export async function _getErc20ProxyPaymentUrl(
  request: ClientTypes.IRequestData,
  amount?: BigNumberish,
): Promise<string> {
  validateRequest(request, ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT);
  const { paymentAddress, paymentReference } = await getRequestPaymentValues(request);
  const contractAddress = getProxyAddress(
    request,
    Erc20PaymentNetwork.ERC20ProxyPaymentDetector.getDeploymentInformation,
  );
  const amountToPay = getAmountToPay(request, amount);
  const parameters = `transferFromWithReference?address=${request.currencyInfo.value}&address=${paymentAddress}&uint256=${amountToPay}&bytes=${paymentReference}`;
  return `ethereum:${contractAddress}/${parameters}`;
}

/**
 * Encodes the call to pay a request through the ERC20 proxy contract, can be used with a Multisig contract.
 * @param request request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 */
export async function prepareErc20ProxyPaymentTransaction(
  request: ClientTypes.IRequestData,
  amount?: BigNumberish,
): Promise<IPreparedTransaction> {
  validateRequest(request, ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT);

  return {
    data: await encodePayErc20Request(request, amount),
    to: getProxyAddress(
      request,
      Erc20PaymentNetwork.ERC20ProxyPaymentDetector.getDeploymentInformation,
    ),
    value: 0,
  };
}
