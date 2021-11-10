/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { BigNumber, BigNumberish, constants, ContractTransaction, providers, Signer } from 'ethers';
import { erc20EscrowToPayArtifact } from '@requestnetwork/smart-contracts';
import { ERC20EscrowToPay__factory } from '@requestnetwork/smart-contracts/types/';
import { ClientTypes, PaymentTypes } from '@requestnetwork/types';
import {
  getAmountToPay,
  getProvider,
  getRequestPaymentValues,
  getSigner,
  validateRequest,
} from './utils';
import { ITransactionOverrides } from './transaction-overrides';
import { encodeApproveAnyErc20 } from './erc20';

/**
 * Processes a transaction to payEscrow().
 * @param request request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function payEscrow(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  amount?: BigNumberish,
  feeAmount?: BigNumberish,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const encodedTx = encodePayEscrow(request, signerOrProvider, amount, feeAmount);
  const contractAddress = erc20EscrowToPayArtifact.getAddress(request.currencyInfo.network!);
  const signer = getSigner(signerOrProvider);

  const tx = await signer.sendTransaction({
    data: encodedTx,
    to: contractAddress,
    value: 0,
    ...overrides,
  });
  return tx;
}

/**
 * Processes a transaction to freeze request.
 * @param request request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function freezeRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const encodedTx = encodeFreezeRequest(request, signerOrProvider);
  const contractAddress = erc20EscrowToPayArtifact.getAddress(request.currencyInfo.network!);

  const signer = getSigner(signerOrProvider);
  const tx = await signer.sendTransaction({
    data: encodedTx,
    to: contractAddress,
    value: 0,
    ...overrides,
  });
  return tx;
}

/**
 * Processes a transaction to payRequestFromEscrow().
 * @param request request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function payRequestFromEscrow(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const encodedTx = encodePayRequestFromEscrow(request, signerOrProvider);
  const contractAddress = erc20EscrowToPayArtifact.getAddress(request.currencyInfo.network!);

  const signer = getSigner(signerOrProvider);
  const tx = await signer.sendTransaction({
    data: encodedTx,
    to: contractAddress,
    value: 0,
    ...overrides,
  });
  return tx;
}

/**
 * Processes a transaction to initiateEmergencyClaim().
 * @param request request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function initiateEmergencyClaim(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const encodedTx = encodeInitiateEmergencyClaim(request, signerOrProvider);
  const contractAddress = erc20EscrowToPayArtifact.getAddress(request.currencyInfo.network!);

  const signer = getSigner(signerOrProvider);
  const tx = await signer.sendTransaction({
    data: encodedTx,
    to: contractAddress,
    value: 0,
    ...overrides,
  });
  return tx;
}

/**
 * Processes a transaction to completeEmergencyClaim().
 * @param request request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function completeEmergencyClaim(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const encodedTx = encodeCompleteEmergencyClaim(request, signerOrProvider);
  const contractAddress = erc20EscrowToPayArtifact.getAddress(request.currencyInfo.network!);

  const signer = getSigner(signerOrProvider);
  const tx = await signer.sendTransaction({
    data: encodedTx,
    to: contractAddress,
    value: 0,
    ...overrides,
  });
  return tx;
}

/**
 * Processes a transaction to revertEmergencyClaim().
 * @param request request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function revertEmergencyClaim(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const encodedTx = encodeRevertEmergencyClaim(request, signerOrProvider);
  const contractAddress = erc20EscrowToPayArtifact.getAddress(request.currencyInfo.network!);

  const signer = getSigner(signerOrProvider);
  const tx = await signer.sendTransaction({
    data: encodedTx,
    to: contractAddress,
    value: 0,
    ...overrides,
  });
  return tx;
}

/**
 * Processes a transaction to refundFrozenFunds().
 * @param request request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function refundFrozenFunds(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const encodedTx = encodeRefundFrozenFunds(request, signerOrProvider);
  const contractAddress = erc20EscrowToPayArtifact.getAddress(request.currencyInfo.network!);

  const signer = getSigner(signerOrProvider);
  const tx = await signer.sendTransaction({
    data: encodedTx,
    to: contractAddress,
    value: 0,
    ...overrides,
  });
  return tx;
}

/**
 * Processes a transaction to refundFrozenFunds().
 * @param request request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function requestMapping(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const encodedTx = encodeRequestMapping(request, signerOrProvider);
  const contractAddress = erc20EscrowToPayArtifact.getAddress(request.currencyInfo.network!);

  const signer = getSigner(signerOrProvider);
  const tx = await signer.sendTransaction({
    data: encodedTx,
    to: contractAddress,
    value: 0,
    ...overrides,
  });
  return tx;
}

/**
 * Encodes the call to payEscrow().
 * @param request request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 */
export function encodePayEscrow(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  amount?: BigNumberish,
  feeAmountOverride?: BigNumberish,
): string {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT);
  const signer = getSigner(signerOrProvider);

  const tokenAddress = request.currencyInfo.value;
  const contractAddress = erc20EscrowToPayArtifact.getAddress(request.currencyInfo.network!);

  // collects the parameters to be used, from the request
  const { paymentReference, paymentAddress, feeAmount, feeAddress } = getRequestPaymentValues(
    request,
  );

  const amountToPay = getAmountToPay(request, amount);
  const feeToPay = BigNumber.from(feeAmountOverride || feeAmount || 0);

  const erc20EscrowContract = ERC20EscrowToPay__factory.connect(contractAddress, signer);

  return erc20EscrowContract.interface.encodeFunctionData('payEscrow', [
    tokenAddress,
    paymentAddress,
    amountToPay,
    `0x${paymentReference}`,
    feeToPay,
    feeAddress || constants.AddressZero,
  ]);
}

/**
 * Returns the encoded data to freezeRequest().
 * @param request request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 */
export function encodeFreezeRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
): string {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT);
  const signer = getSigner(signerOrProvider);

  // collects the parameters to be used from the request
  const { paymentReference } = getRequestPaymentValues(request);

  // connections to the escrow contract
  const contractAddress = erc20EscrowToPayArtifact.getAddress(request.currencyInfo.network!);
  const erc20EscrowToPayContract = ERC20EscrowToPay__factory.connect(contractAddress, signer);

  // encodes the function data and returns them
  return erc20EscrowToPayContract.interface.encodeFunctionData('freezeRequest', [
    `0x${paymentReference}`,
  ]);
}

/**
 * Returns the encoded data to payRequestFromEscrow().
 * @param request request for pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 */
export function encodePayRequestFromEscrow(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
): string {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT);
  const signer = getSigner(signerOrProvider);

  // collects the parameters to be used from the request
  const { paymentReference } = getRequestPaymentValues(request);

  // connections to the escrow contract
  const contractAddress = erc20EscrowToPayArtifact.getAddress(request.currencyInfo.network!);
  const erc20EscrowToPayContract = ERC20EscrowToPay__factory.connect(contractAddress, signer);

  // encodes the function data and returns them
  return erc20EscrowToPayContract.interface.encodeFunctionData('payRequestFromEscrow', [
    `0x${paymentReference}`,
  ]);
}

/**
 * Returns the encoded data to initiateEmergencyClaim().
 * @param request request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 */
export function encodeInitiateEmergencyClaim(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
): string {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT);
  const signer = getSigner(signerOrProvider);

  // collects the parameters to be used from the request
  const { paymentReference } = getRequestPaymentValues(request);

  // connections to the escrow contract
  const contractAddress = erc20EscrowToPayArtifact.getAddress(request.currencyInfo.network!);
  const erc20EscrowToPayContract = ERC20EscrowToPay__factory.connect(contractAddress, signer);

  // encodes the function data and returns them
  return erc20EscrowToPayContract.interface.encodeFunctionData('initiateEmergencyClaim', [
    `0x${paymentReference}`,
  ]);
}

/**
 * Returns the encoded data to completeEmergencyClaim().
 * @param request request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 */
export function encodeCompleteEmergencyClaim(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
): string {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT);
  const signer = getSigner(signerOrProvider);

  // collects the parameters to be used from the request
  const { paymentReference } = getRequestPaymentValues(request);

  // connections to the escrow contract
  const contractAddress = erc20EscrowToPayArtifact.getAddress(request.currencyInfo.network!);
  const erc20EscrowToPayContract = ERC20EscrowToPay__factory.connect(contractAddress, signer);

  // encodes the function data and returns them
  return erc20EscrowToPayContract.interface.encodeFunctionData('completeEmergencyClaim', [
    `0x${paymentReference}`,
  ]);
}

/**
 * Returns the encoded data to revertEmergencyClaim().
 * @param request request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 */
export function encodeRevertEmergencyClaim(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
): string {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT);
  const signer = getSigner(signerOrProvider);

  // collects the parameters to be used from the request
  const { paymentReference } = getRequestPaymentValues(request);

  // connections to the escrow contract
  const contractAddress = erc20EscrowToPayArtifact.getAddress(request.currencyInfo.network!);
  const erc20EscrowToPayContract = ERC20EscrowToPay__factory.connect(contractAddress, signer);

  // encodes the function data and returns them
  return erc20EscrowToPayContract.interface.encodeFunctionData('revertEmergencyClaim', [
    `0x${paymentReference}`,
  ]);
}

/**
 * Returns the encoded data to refundFrozenFunds().
 * @param request request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 */
export function encodeRefundFrozenFunds(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
): string {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT);
  const signer = getSigner(signerOrProvider);

  // collects the parameters to be used from the request
  const { paymentReference } = getRequestPaymentValues(request);

  // connections to the escrow contract
  const contractAddress = erc20EscrowToPayArtifact.getAddress(request.currencyInfo.network!);
  const erc20EscrowToPayContract = ERC20EscrowToPay__factory.connect(contractAddress, signer);

  // encodes the function data and returns them
  return erc20EscrowToPayContract.interface.encodeFunctionData('refundFrozenFunds', [
    `0x${paymentReference}`,
  ]);
}

/**
 * Returns the encoded data to requestMapping().
 * @param request request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 */
export function encodeRequestMapping(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
): string {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT);
  const signer = getSigner(signerOrProvider);

  // collects the parameters to be used from the request
  const { paymentReference } = getRequestPaymentValues(request);
  const contractAddress = erc20EscrowToPayArtifact.getAddress(request.currencyInfo.network!);
  const erc20EscrowToPayContract = ERC20EscrowToPay__factory.connect(contractAddress, signer);

  // encodes the function data and returns them
  return erc20EscrowToPayContract.interface.encodeFunctionData('requestMapping', [
    `0x${paymentReference}`,
  ]);
}

/**
 * Processes the approval transaction of the payment ERC20 to be spent by the erc20EscrowToPay contract,
 * during the fee proxy delegate call.
 * @param request request to pay, used to know the network
 * @param paymentTokenAddress picked currency to pay
 * @param signerOrProvider the web3 provider. Defaults to Etherscan.
 * @param overrides optionally, override default transaction values, like gas.
 */
 export async function approveErc20ForEscrow(
  request: ClientTypes.IRequestData,
  paymentTokenAddress: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const contractAddress = erc20EscrowToPayArtifact.getAddress(request.currencyInfo.network!);
  const encodedTx = encodeApproveAnyErc20(paymentTokenAddress, contractAddress, signerOrProvider);
  const signer = getSigner(signerOrProvider);
  const tx = await signer.sendTransaction({
    data: encodedTx,
    to: paymentTokenAddress,
    value: 0,
    ...overrides,
  });
  return tx;
}

