import {
  constants,
  Contract,
  ContractTransaction,
  Signer,
  BigNumberish,
  providers,
  BigNumber,
} from 'ethers';

import { erc20FeeProxyArtifact } from '@requestnetwork/smart-contracts';
import { ERC20FeeProxy__factory, ERC20__factory } from '@requestnetwork/smart-contracts/types';
import { ClientTypes, ExtensionTypes } from '@requestnetwork/types';
import { getPaymentNetworkExtension } from '@requestnetwork/payment-detection';
import { EvmChains } from '@requestnetwork/currency';

import { emporiumOp, RelayerTransaction } from '@hinkal/common';

import { ITransactionOverrides } from './transaction-overrides';
import {
  getAmountToPay,
  getProvider,
  getRequestPaymentValues,
  getSigner,
  validateErc20FeeProxyRequest,
  validateRequest,
} from './utils';
import { IPreparedPrivateTransaction, IPreparedTransaction } from './prepared-transaction';
import { prepareHinkal } from './prepare-hinkal';

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
  const { data, to, value } = prepareErc20FeeProxyPaymentTransaction(request, amount, feeAmount);
  const signer = getSigner(signerOrProvider);
  return signer.sendTransaction({ data, to, value, ...overrides });
}

/**
 * Processes a transaction to pay an ERC20 Request privately with fees.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmount optionally, the fee amount to pay. Defaults to the fee amount.
 */
export async function payPrivateErc20FeeProxyRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  amount?: BigNumberish,
  feeAmount?: BigNumberish,
): Promise<RelayerTransaction> {
  const hinkal = await prepareHinkal(getSigner(signerOrProvider));

  const { amountToPay, tokenAddress, ops } = preparePrivateErc20FeeProxyPaymentTransaction(
    request,
    amount,
    feeAmount,
  );

  return hinkal.actionPrivateWallet(
    [tokenAddress],
    [-amountToPay],
    [false],
    ops,
  ) as Promise<RelayerTransaction>;
}

/**
 * Encodes the call to pay a request through the ERC20 fee proxy contract, can be used with a Multisig contract.
 * @param request request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmountOverride optionally, the fee amount to pay. Defaults to the fee amount of the request.
 */
export function encodePayErc20FeeRequest(
  request: ClientTypes.IRequestData,
  amount?: BigNumberish,
  feeAmountOverride?: BigNumberish,
): string {
  validateErc20FeeProxyRequest(request, amount, feeAmountOverride);

  const tokenAddress = request.currencyInfo.value;
  const { paymentReference, paymentAddress, feeAddress, feeAmount } =
    getRequestPaymentValues(request);
  const amountToPay = getAmountToPay(request, amount);
  const feeToPay = BigNumber.from(feeAmountOverride || feeAmount || 0);
  const proxyContract = ERC20FeeProxy__factory.createInterface();

  return proxyContract.encodeFunctionData('transferFromWithReferenceAndFee', [
    tokenAddress,
    paymentAddress,
    amountToPay,
    `0x${paymentReference}`,
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
export function _getErc20FeeProxyPaymentUrl(
  request: ClientTypes.IRequestData,
  amount?: BigNumberish,
  feeAmountOverride?: BigNumberish,
): string {
  validateRequest(request, ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT);
  const { paymentReference, paymentAddress, feeAddress, feeAmount, version, network } =
    getRequestPaymentValues(request);
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
export function prepareErc20FeeProxyPaymentTransaction(
  request: ClientTypes.IRequestData,
  amount?: BigNumberish,
  feeAmountOverride?: BigNumberish,
): IPreparedTransaction {
  validateErc20FeeProxyRequest(request, amount, feeAmountOverride);

  const { network } = request.currencyInfo;
  EvmChains.assertChainSupported(network!);
  const encodedTx = encodePayErc20FeeRequest(request, amount, feeAmountOverride);
  const pn = getPaymentNetworkExtension(request);
  const proxyAddress = erc20FeeProxyArtifact.getAddress(network, pn?.version);

  return {
    data: encodedTx,
    to: proxyAddress,
    value: 0,
  };
}

/**
 * Prepare the transaction to privately pay a request through the ERC20 fee proxy contract, can be used with a Multisig contract.
 * @param request request to pay
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmountOverride optionally, the fee amount to pay. Defaults to the fee amount of the request.
 */
export function preparePrivateErc20FeeProxyPaymentTransaction(
  request: ClientTypes.IRequestData,
  amount?: BigNumberish,
  feeAmountOverride?: BigNumberish,
): IPreparedPrivateTransaction {
  validateErc20FeeProxyRequest(request, amount, feeAmountOverride);

  const { value: tokenAddress, network } = request.currencyInfo;
  EvmChains.assertChainSupported(network!);
  const pn = getPaymentNetworkExtension(request);
  const proxyAddress = erc20FeeProxyArtifact.getAddress(network, pn?.version);

  const tokenContract = new Contract(tokenAddress, ERC20__factory.createInterface());
  const proxyContract = new Contract(proxyAddress, ERC20FeeProxy__factory.createInterface());

  const { paymentReference, paymentAddress, feeAddress, feeAmount } =
    getRequestPaymentValues(request);
  const amountToPay = getAmountToPay(request, amount);
  const feeToPay = String(feeAmountOverride || feeAmount || 0);

  const ops = [
    emporiumOp(tokenContract, 'approve', [proxyContract.address, amountToPay]),
    emporiumOp(proxyContract, 'transferFromWithReferenceAndFee', [
      tokenAddress,
      paymentAddress,
      amountToPay,
      `0x${paymentReference}`,
      feeToPay,
      feeAddress,
    ]),
  ];

  return {
    amountToPay: amountToPay.toBigInt(),
    tokenAddress,
    ops,
  };
}
