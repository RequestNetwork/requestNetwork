/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { BigNumberish, ContractTransaction, providers, Signer } from 'ethers';
import { erc20EscrowToPayV2Artifact } from '@requestnetwork/smart-contracts';
import { ERC20EscrowToPayV2__factory } from '@requestnetwork/smart-contracts/types';
import { ClientTypes, PaymentTypes } from '@requestnetwork/types';
import {
  getAmountToPay,
  getProvider,
  getRequestPaymentValues,
  getSigner,
  validateRequest,
} from './utils';
import { ITransactionOverrides } from './transaction-overrides';
import { tokenAddress, feeAmount } from '../../../advanced-logic/test/utils/payment-network/erc20/any-to-erc20-proxy-add-data-generator';


/**
 * Functions in ERC20EscrowToPayV2 Smart-Contract:
 *
 * payRequestToEscrow(`0x${paymentReference}`, tokenAddress, amountToPay, paymentAddress, feeAmount,feeAddress,)
 * openDispute(`0x${paymentReference}`)
 * closeEscrow(`0x${paymentReference}`)
 * resolveDispute(`0x${paymentReference}`)
 * lockDisputedFunds(`0x${paymentReference}`)
 * withdrawLockedFunds(`0x${paymentReference}`)
 *
 */

/**
 * Processes a transaction to openEscrow() with an ERC20 Request.
 * @param request request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function payRequestToEscrow(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const encodedTx = encodePayRequestToEscrow(request, signerOrProvider);
  const contractAddress = erc20EscrowToPayV2Artifact.getAddress(request.currencyInfo.network!);
  const signer = getSigner(signerOrProvider);

  const tx = await signer.sendTransaction({
    data: encodedTx,
    to: contractAddress,
    value: 0,
    ...overrides,
  });
  console.log(tx);
  return tx;
}


/**
 * Processes a transaction to openDispute() if there is an dispute
 * @param request request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function payRequestFromEscrow(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const encodedTx = encodePayFromEscrowRequest(request, signerOrProvider);
  const contractAddress = erc20EscrowToPayV2Artifact.getAddress(request.currencyInfo.network!);

  const signer = getSigner(signerOrProvider);
  const tx = await signer.sendTransaction({
    data: encodedTx,
    to: contractAddress,
    value: 0,
    ...overrides,
  });
  console.log(tx);
  return tx;
}


/**
 * Processes a transaction to closeEscrow, and pay fees.
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
  const contractAddress = erc20EscrowToPayV2Artifact.getAddress(request.currencyInfo.network!);

  const signer = getSigner(signerOrProvider);
  const tx = await signer.sendTransaction({
    data: encodedTx,
    to: contractAddress,
    value: 0,
    ...overrides,
  });
  console.log(tx);
  return tx;
}

/**
 * Processes a transaction to withdrawLockedFunds() from tokentimelock contract.
 * @param request request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
 export async function withdrawLockedFundsRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const encodedTx = encodeWithdrawLockedFundsRequest(request, signerOrProvider);
  const contractAddress = erc20EscrowToPayV2Artifact.getAddress(request.currencyInfo.network!);

  const signer = getSigner(signerOrProvider);
  const tx = await signer.sendTransaction({
    data: encodedTx,
    to: contractAddress,
    value: 0,
    ...overrides,
  });
  console.log(tx);
  return tx;
}


/**
 * Processes a transaction to get data from the disputeMapping.
 * @param request request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function requestMappingRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const encodedTx = encodeRequestMappingRequest(request, signerOrProvider);
  const contractAddress = erc20EscrowToPayV2Artifact.getAddress(request.currencyInfo.network!);

  const signer = getSigner(signerOrProvider);
  const tx = await signer.sendTransaction({
    data: encodedTx,
    to: contractAddress,
    value: 0,
    ...overrides,
  });
  console.log(tx);
  return tx;
}


/**
 * Encodes the call to openEscrow().
 * @param request request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 */
export function encodePayRequestToEscrow(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  amount?: BigNumberish,
): string {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT);
  const signer = getSigner(signerOrProvider);

  // ERC20 token to be used
  const tokenAddress = request.currencyInfo.value;
  const contractAddress = erc20EscrowToPayV2Artifact.getAddress(request.currencyInfo.network!);

  // collects the parameters to be used, from the request
  const { paymentReference, feeAmount } = getRequestPaymentValues(
    request,
  );
  const amountToPay = getAmountToPay(request, amount);

  // connects to ERC20EscrowToPayV1
  const erc20EscrowToPayV1Contract = ERC20EscrowToPayV2__factory.connect(contractAddress, signer);

  return erc20EscrowToPayV1Contract.interface.encodeFunctionData('payRequestToEscrow', [
    tokenAddress,
    amountToPay,
    `0x${paymentReference}`,
    feeAmount
  ]);
}


/**
 * Returns the encoded data to withdraw funds from MyEscrow.
 * @param request request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 */
export function encodePayRequestFromEscrow(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
): string {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT);
  const signer = getSigner(signerOrProvider);

  // collects the parameters to be used from the request
  const { paymentReference, paymentAddress, feeAmount} = getRequestPaymentValues(request);

  // connections to the escrow contract
  const contractAddress = erc20EscrowToPayV2Artifact.getAddress(request.currencyInfo.network!);
  const erc20EscrowToPayV1Contract = ERC20EscrowToPayV2__factory.connect(contractAddress, signer);

  // encodes the function data and returns them
  return erc20EscrowToPayV1Contract.interface.encodeFunctionData('payRequestFromEscrow', [
    `0x${paymentReference}`,
    paymentAddress,
    feeAmount,
  ]);
}


/**
 * Returns the encoded data to excecute a InitLockPeriod call.
 * @param request request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 */
export function encodeOpenDisputeRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
): string {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT);
  const signer = getSigner(signerOrProvider);

  // collects the parameters to be used from the request
  const { paymentReference } = getRequestPaymentValues(request);

  // connections to the escrow contract
  const contractAddress = ERC20EscrowToPayV1.getAddress(request.currencyInfo.network!);
  const erc20EscrowToPayV1Contract = ERC20EscrowToPayV1__factory.connect(contractAddress, signer);

  // encodes the function data and returns them
  return erc20EscrowToPayV1Contract.interface.encodeFunctionData('openDispute', [`0x${paymentReference}`]);
}

/**
 * Returns the encoded data to resolve a dispute.
 * @param request request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 */
export function encodeResolveDisputeRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
): string {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT);
  const signer = getSigner(signerOrProvider);

  // collects the parameters to be used from the request
  const { paymentReference } = getRequestPaymentValues(request);

  // connections to the escrow contract
  const contractAddress = ERC20EscrowToPayV1.getAddress(request.currencyInfo.network!);
  const erc20EscrowToPayV1Contract = ERC20EscrowToPayV1__factory.connect(contractAddress, signer);

  // encodes the function data and returns them
  return erc20EscrowToPayV1Contract.interface.encodeFunctionData('resolveDispute', [`0x${paymentReference}`]);
}


/**
 * Returns the encoded data to lockDipsutedFunds().
 * @param request request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 */
export function encodeLockDisputedFundsRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
): string {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT);
  const signer = getSigner(signerOrProvider);

  // collects the parameters to be used from the request
  const { paymentReference } = getRequestPaymentValues(request);

  // connections to the escrow contract
  const contractAddress = ERC20EscrowToPayV1.getAddress(request.currencyInfo.network!);
  const erc20EscrowToPayV1Contract = ERC20EscrowToPayV1__factory.connect(contractAddress, signer);

  // encodes the function data and returns them
  return erc20EscrowToPayV1Contract.interface.encodeFunctionData('lockDisputedFunds', [
    `0x${paymentReference}`,
  ]);
}


/**
 * Returns the encoded data to withdrawLockedfunds from TimeLockContract
 * @param request request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 */
export function encodeWithdrawLockedFundsRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
): string {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT);
  const signer = getSigner(signerOrProvider);

  // collects the parameters to be used from the request
  const { paymentReference } = getRequestPaymentValues(request);

  // connections to the escrow contract
  const contractAddress = ERC20EscrowToPayV1.getAddress(request.currencyInfo.network!);
  const erc20EscrowToPayV1Contract = ERC20EscrowToPayV1__factory.connect(contractAddress, signer);

  // encodes the function data and returns them
  return erc20EscrowToPayV1Contract.interface.encodeFunctionData('withdrawLockedFunds', [
    `0x${paymentReference}`,
  ]);
}


/**
 * Returns the encoded data to get disputes from MyEscrow's disputeMapping
 * @param request request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 */
 export function encodeDisputeMappingRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
): string {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT);

  const signer = getSigner(signerOrProvider);

  // collects the parameters to be used from the request
  const { paymentReference } = getRequestPaymentValues(request);

  // connections to the escrow contract
  const contractAddress = ERC20EscrowToPayV1.getAddress(request.currencyInfo.network!);
  const erc20EscrowToPayV1Contract = ERC20EscrowToPayV1__factory.connect(contractAddress, signer);

  // encodes the function data and returns them
  return erc20EscrowToPayV1Contract.interface.encodeFunctionData('disputeMapping', [`0x${paymentReference}`]);
}