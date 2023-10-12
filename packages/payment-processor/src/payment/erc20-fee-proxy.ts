import { constants, ContractTransaction, Signer, BigNumberish, providers, BigNumber } from 'ethers';

import { erc20FeeProxyArtifact } from '@requestnetwork/smart-contracts';
import { ERC20FeeProxy__factory } from '@requestnetwork/smart-contracts/types';
import { ClientTypes, ExtensionTypes } from '@requestnetwork/types';
import { getPaymentNetworkExtension } from '@requestnetwork/payment-detection';
import { EvmChains } from '@requestnetwork/currency';

import { ITransactionOverrides } from './transaction-overrides';
import {
  getAmountToPay,
  getProvider,
  getRequestPaymentValues,
  getSigner,
  validateErc20FeeProxyRequest,
  validateRequest,
} from './utils';
import { IPreparedTransaction } from './prepared-transaction';

/**
 * Processes a transaction to pay an ERC20 Request with fees.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmount optionally, the fee amount to pay. Defaults to the fee amount.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function payErc20FeeProxyRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  amount?: BigNumberish,
  feeAmount?: BigNumberish,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const { data, to, value } = await prepareErc20FeeProxyPaymentTransaction(request, amount, feeAmount);
  const signer = getSigner(signerOrProvider);
  return await signer.sendTransaction({ data, to, value, ...overrides });
}

/**
 * Encodes the call to pay a request through the ERC20 fee proxy contract, can be used with a Multisig contract.
 * @param request request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmountOverride optionally, the fee amount to pay. Defaults to the fee amount of the request.
 */
export async function encodePayErc20FeeRequest(
  request: ClientTypes.IRequestData,
  amount?: BigNumberish,
  feeAmountOverride?: BigNumberish,
): Promise<string> {
  validateErc20FeeProxyRequest(request, amount, feeAmountOverride);

  const tokenAddress = request.currencyInfo.value;
  const { paymentReference, paymentAddress, feeAddress, feeAmount } =
    await getRequestPaymentValues(request);
  const amountToPay = getAmountToPay(request, amount);
  const feeToPay = BigNumber.from(feeAmountOverride || feeAmount || 0);
  const proxyContract = ERC20FeeProxy__factory.createInterface();

  return proxyContract.encodeFunctionData('transferFromWithReferenceAndFee', [
    tokenAddress,
    paymentAddress,
    amountToPay,
    `0x${paymentReference?.slice(-16)}`,
    feeToPay,
    feeAddress || constants.AddressZero,
  ]);
}

/**
 * Return the EIP-681 format URL with the transaction to pay an ERC20
 * Warning: this EIP isn't widely used, be sure to test compatibility yourself.
 *
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmountOverride optionally, the fee amount to pay. Defaults to the fee amount of the request.
 */
export async function _getErc20FeeProxyPaymentUrl(
  request: ClientTypes.IRequestData,
  amount?: BigNumberish,
  feeAmountOverride?: BigNumberish,
): Promise<string> {
  validateRequest(request, ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT);
  const { paymentReference, paymentAddress, feeAddress, feeAmount, version, network } =
    await getRequestPaymentValues(request);
  EvmChains.assertChainSupported(network!);
  const contractAddress = erc20FeeProxyArtifact.getAddress(network, version);
  const amountToPay = getAmountToPay(request, amount);
  const feeToPay = feeAmountOverride || BigNumber.from(feeAmount || 0);
  const parameters = `transferFromWithReferenceAndFee?address=${request.currencyInfo.value}&address=${paymentAddress}&uint256=${amountToPay}&bytes=${paymentReference}&uint256=${feeToPay}&address=${feeAddress}`;
  return `ethereum:${contractAddress}/${parameters}`;
}

/**
 * Prepare the transaction to pay a request through the ERC20 fee proxy contract, can be used with a Multisig contract.
 * @param request request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmountOverride optionally, the fee amount to pay. Defaults to the fee amount of the request.
 */
export async function prepareErc20FeeProxyPaymentTransaction(
  request: ClientTypes.IRequestData,
  amount?: BigNumberish,
  feeAmountOverride?: BigNumberish,
): Promise<IPreparedTransaction> {
  validateErc20FeeProxyRequest(request, amount, feeAmountOverride);

  const { network } = request.currencyInfo;
  EvmChains.assertChainSupported(network!);
  const encodedTx = await encodePayErc20FeeRequest(request, amount, feeAmountOverride);
  const pn = getPaymentNetworkExtension(request);
  const proxyAddress = erc20FeeProxyArtifact.getAddress(network, pn?.version);

  return {
    data: encodedTx,
    to: proxyAddress,
    value: 0,
  };
}
