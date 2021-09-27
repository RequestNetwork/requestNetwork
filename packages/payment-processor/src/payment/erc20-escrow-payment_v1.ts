/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { BigNumberish, ContractTransaction, providers, Signer } from 'ethers';
import { ERC20EscrowToPayV1 } from '@requestnetwork/smart-contracts';
import { ERC20EscrowToPayV1__factory } from '@requestnetwork/smart-contracts/types';
import { ClientTypes, PaymentTypes } from '@requestnetwork/types';
import {
  getAmountToPay,
  getProvider,
  getRequestPaymentValues,
  getSigner,
  validateRequest,
} from './utils';
import { ITransactionOverrides } from './transaction-overrides';

/**
 * Functions in ERC20EscrowToPayV1 Smart-Contract:
 *
 * openEscrow(`0x${paymentReference}`, tokenAddress,amountToPay,paymentAddress,feeAmount,feeAddress,)
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
export async function openEscrowRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const encodedTx = encodeOpenEscrowRequest(request, signerOrProvider);
  const contractAddress = ERC20EscrowToPayV1.getAddress(request.currencyInfo.network!);
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
export async function openDisputeRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const encodedTx = encodeOpenDisputeRequest(request, signerOrProvider);
  const contractAddress = ERC20EscrowToPayV1.getAddress(request.currencyInfo.network!);

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
export async function closeEscrowRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const encodedTx = encodeCloseEscrowRequest(request, signerOrProvider);
  const contractAddress = ERC20EscrowToPayV1.getAddress(request.currencyInfo.network!);

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
 * Processes a transaction to resolveDisputedfunds from the escrow's timelockcontract.
 * @param request request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function resolveDisputeRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const encodedTx = encodeResolveDisputeRequest(request, signerOrProvider);
  const contractAddress = ERC20EscrowToPayV1.getAddress(request.currencyInfo.network!);

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
 * Processes a transaction to lockDisputedFunds(), pay fees and create a new timelockcontract.
 * @param request request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function lockDisputedFundsRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const encodedTx = encodeLockDisputedFundsRequest(request, signerOrProvider);
  const contractAddress = ERC20EscrowToPayV1.getAddress(request.currencyInfo.network!);

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
  const contractAddress = ERC20EscrowToPayV1.getAddress(request.currencyInfo.network!);

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
export async function disputeMappingRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const encodedTx = encodeDisputeMappingRequest(request, signerOrProvider);
  const contractAddress = ERC20EscrowToPayV1.getAddress(request.currencyInfo.network!);

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
export function encodeOpenEscrowRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  amount?: BigNumberish,
): string {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT);
  const signer = getSigner(signerOrProvider);

  // ERC20 token to be used
  const tokenAddress = request.currencyInfo.value;
  const contractAddress = ERC20EscrowToPayV1.getAddress(request.currencyInfo.network!);

  // collects the parameters to be used, from the request
  const { paymentReference, paymentAddress, feeAmount, feeAddress } = getRequestPaymentValues(
    request,
  );
  const amountToPay = getAmountToPay(request, amount);

  // connects to ERC20EscrowToPayV1
  const erc20EscrowToPayV1Contract = ERC20EscrowToPayV1__factory.connect(contractAddress, signer);

  return erc20EscrowToPayV1Contract.interface.encodeFunctionData('openEscrow', [
    `0x${paymentReference}`,
    tokenAddress,
    amountToPay,
    paymentAddress,
    feeAmount,
    feeAddress,
  ]);
}


/**
 * Returns the encoded data to withdraw funds from MyEscrow.
 * @param request request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 */
export function encodeCloseEscrowRequest(
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
  return erc20EscrowToPayV1Contract.interface.encodeFunctionData('closeEscrow', [`0x${paymentReference}`]);
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