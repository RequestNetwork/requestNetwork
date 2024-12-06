import { Contract, ContractTransaction, Signer, BigNumberish, providers, BigNumber } from 'ethers';
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

/**
 * This is a globally accessible state variable exported for use in other parts of the application or tests.
 */
export const hinkalStore: Record<string, IHinkal> = {};

/**
 * Adds an IHinkal instance to the Hinkal store for a given signer.
 *
 * This function checks if an IHinkal instance already exists for the provided signer’s address in the `hinkalStore`.
 * If it does not exist, it initializes the instance using `prepareEthersHinkal` and stores it. The existing or newly
 * created instance is then returned.
 *
 * @param signer - The signer for which the IHinkal instance should be added or retrieved.
 */
export async function addToHinkalStore(signer: Signer): Promise<IHinkal> {
  const address = await signer.getAddress();
  if (!hinkalStore[address]) {
    hinkalStore[address] = await prepareEthersHinkal(signer);
  }
  return hinkalStore[address];
}

/**
 * Sends ERC20 tokens into a Hinkal shielded address.
 *
 * @param signerOrProvider the Web3 provider, or signer.
 * @param tokenAddress - The address of the ERC20 token being sent.
 * @param amount - The amount of tokens to send.
 * @param recipientInfo - (Optional) The shielded address of the recipient. If provided, the tokens will be deposited into the recipient's shielded balance. If not provided, the deposit will increase the sender's shielded balance.
 *
 * @returns A promise that resolves to a `ContractTransaction`.
 */
export async function sendToHinkalShieldedAddressFromPublic(
  signerOrProvider: providers.Provider | Signer = getProvider(),
  tokenAddress: string,
  amount: BigNumberish,
  recipientInfo?: string,
): Promise<ContractTransaction> {
  const signer = getSigner(signerOrProvider);
  const hinkalObject = await addToHinkalStore(signer);

  const amountToPay = BigNumber.from(amount).toBigInt();
  if (recipientInfo) {
    return hinkalObject.depositForOther([tokenAddress], [amountToPay], recipientInfo);
  } else {
    return hinkalObject.deposit([tokenAddress], [amountToPay]);
  }
}

/**
 * Processes a transaction to pay privately a request through the ERC20 fee proxy contract.
 * @param request request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 */
export async function payErc20ProxyRequestFromHinkalShieldedAddress(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  amount?: BigNumberish,
): Promise<RelayerTransaction> {
  const signer = getSigner(signerOrProvider);
  const hinkalObject = await addToHinkalStore(signer);

  const { amountToPay, tokenAddress, ops } = prepareErc20ProxyPaymentFromHinkalShieldedAddress(
    request,
    amount,
  );

  return hinkalObject.actionPrivateWallet(
    [tokenAddress],
    [-amountToPay],
    [false],
    ops,
  ) as Promise<RelayerTransaction>;
}

/**
 * Processes a transaction to pay privately a request through the ERC20 fee proxy.
 * @param request request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmount optionally, the fee amount to pay. Defaults to the fee amount of the request.
 */
export async function payErc20FeeProxyRequestFromHinkalShieldedAddress(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  amount?: BigNumberish,
  feeAmount?: BigNumberish,
): Promise<RelayerTransaction> {
  const signer = getSigner(signerOrProvider);
  const hinkalObject = await addToHinkalStore(signer);

  const { amountToPay, tokenAddress, ops } = prepareErc20FeeProxyPaymentFromHinkalShieldedAddress(
    request,
    amount,
    feeAmount,
  );

  return hinkalObject.actionPrivateWallet(
    [tokenAddress],
    [-amountToPay],
    [false],
    ops,
  ) as Promise<RelayerTransaction>;
}

/**
 * Prepare the transaction to privately pay a request through the ERC20 proxy contract, can be used with a Multisig contract.
 * @param request request to pay
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 */
export function prepareErc20ProxyPaymentFromHinkalShieldedAddress(
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
export function prepareErc20FeeProxyPaymentFromHinkalShieldedAddress(
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
