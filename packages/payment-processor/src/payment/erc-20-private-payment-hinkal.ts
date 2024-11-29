import { Contract, Signer, BigNumberish, providers } from 'ethers';
import { erc20FeeProxyArtifact } from '@requestnetwork/smart-contracts';
import {
  ERC20FeeProxy__factory,
  ERC20Proxy__factory,
  ERC20__factory,
} from '@requestnetwork/smart-contracts/types';
import { ClientTypes, ExtensionTypes } from '@requestnetwork/types';
import { Erc20PaymentNetwork, getPaymentNetworkExtension } from '@requestnetwork/payment-detection';
import { EvmChains } from '@requestnetwork/currency';
import {
  getAmountToPay,
  getProvider,
  getRequestPaymentValues,
  getSigner,
  validateRequest,
  validateErc20FeeProxyRequest,
  getProxyAddress,
} from './utils';
import { IPreparedPrivateTransaction } from './prepared-transaction';

import { emporiumOp, IHinkal, RelayerTransaction } from '@hinkal/common';
import { prepareEthersHinkal } from '@hinkal/common/providers/prepareEthersHinkal';

// exposing state variable to be accessed: for intergration tests
export let hinkal: IHinkal;

/**
 * Processes a transaction to pay an ERC20 Request privately with fees.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmount optionally, the fee amount to pay. Defaults to the fee amount.
 */
export async function payPrivateErc20ProxyRequestFromHinkal(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  amount?: BigNumberish,
): Promise<RelayerTransaction> {
  if (!hinkal) hinkal = await prepareEthersHinkal(getSigner(signerOrProvider));

  const { amountToPay, tokenAddress, ops } = preparePrivateErc20ProxyPaymentTransactionFromHinkal(
    request,
    amount,
  );

  return hinkal.actionPrivateWallet(
    [tokenAddress],
    [-amountToPay],
    [false],
    ops,
    undefined,
    false,
  ) as Promise<RelayerTransaction>;
}
/**
 * Processes a transaction to pay an ERC20 Request privately with fees.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmount optionally, the fee amount to pay. Defaults to the fee amount.
 */
export async function payPrivateErc20FeeProxyRequestFromHinkal(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  amount?: BigNumberish,
  feeAmount?: BigNumberish,
): Promise<RelayerTransaction> {
  if (!hinkal) hinkal = await prepareEthersHinkal(getSigner(signerOrProvider));

  const { amountToPay, tokenAddress, ops } =
    preparePrivateErc20FeeProxyPaymentTransactionFromHinkal(request, amount, feeAmount);

  return hinkal.actionPrivateWallet(
    [tokenAddress],
    [-amountToPay],
    [false],
    ops,
    undefined,
    false,
  ) as Promise<RelayerTransaction>;
}

/**
 * Prepare the transaction to privately pay a request through the ERC20 proxy contract, can be used with a Multisig contract.
 * @param request request to pay
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 */
export function preparePrivateErc20ProxyPaymentTransactionFromHinkal(
  request: ClientTypes.IRequestData,
  amount?: BigNumberish,
): IPreparedPrivateTransaction {
  validateRequest(request, ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT);

  const { value: tokenAddress } = request.currencyInfo;
  const proxyAddress = getProxyAddress(
    request,
    Erc20PaymentNetwork.ERC20ProxyPaymentDetector.getDeploymentInformation,
  );

  const tokenContract = new Contract(tokenAddress, ERC20__factory.createInterface());
  const proxyContract = new Contract(proxyAddress, ERC20Proxy__factory.createInterface());

  const { paymentReference, paymentAddress } = getRequestPaymentValues(request);
  const amountToPay = getAmountToPay(request, amount);

  const ops = [
    emporiumOp(tokenContract, 'approve', [proxyContract.address, amountToPay]),
    emporiumOp(proxyContract, 'transferFromWithReference', [
      tokenAddress,
      paymentAddress,
      amountToPay,
      `0x${paymentReference}`,
    ]),
  ];

  return {
    amountToPay: amountToPay.toBigInt(),
    tokenAddress,
    ops,
  };
}

/**
 * Prepare the transaction to privately pay a request through the ERC20 fee proxy contract, can be used with a Multisig contract.
 * @param request request to pay
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmountOverride optionally, the fee amount to pay. Defaults to the fee amount of the request.
 */
export function preparePrivateErc20FeeProxyPaymentTransactionFromHinkal(
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
