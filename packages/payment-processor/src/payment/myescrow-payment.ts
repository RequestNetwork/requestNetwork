import { BigNumberish, ContractTransaction, providers, Signer } from 'ethers';

import { myEscrowArtifact } from '@requestnetwork/smart-contracts';
import { MyEscrow__factory } from '@requestnetwork/smart-contracts/types/types';
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
 * Functions in MyEscrow Smart-Contract
 *
 * initAndDeposit(tokenAddress,amountToPay,paymentAddress,`0x${paymentReference}`,feeAmount,feeAddress,)
 * withdrawFunds(paymentRef)
 * initLockPeriod(paymentRef)
 * withdrawLockedFunds(paymentRef)
 *
 */

/**
 * Processes a transaction to initAndDeposit an ERC20 Request.
 * @param request
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function initAndDepositRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const encodedTx = encodeInitAndDepositRequest(request, signerOrProvider);
  const contractAddress = myEscrowArtifact.getAddress(request.currencyInfo.network!);
  const signer = getSigner(signerOrProvider);

  const tx = await signer.sendTransaction({
    data: encodedTx,
    to: contractAddress,
    value: 0,
    ...overrides,
  });
  //console.log(tx);
  return tx;
}

/**
 * Processes a transaction to initLockPeriod if there is an dispute
 * @param request
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function initLockPeriodRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const encodedTx = encodeInitLockPeriodRequest(request, signerOrProvider);
  const contractAddress = myEscrowArtifact.getAddress(request.currencyInfo.network!);

  const signer = getSigner(signerOrProvider);
  const tx = await signer.sendTransaction({
    data: encodedTx,
    to: contractAddress,
    value: 0,
    ...overrides,
  });
  // console.log(tx);
  return tx;
}

/**
 * Processes a transaction to withdraw funds from the escrow.
 * @param request
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function withdrawFundsRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const encodedTx = encodeWithdrawFundsRequest(request, signerOrProvider);
  const contractAddress = myEscrowArtifact.getAddress(request.currencyInfo.network!);

  const signer = getSigner(signerOrProvider);
  const tx = await signer.sendTransaction({
    data: encodedTx,
    to: contractAddress,
    value: 0,
    ...overrides,
  });
  // console.log(tx);
  return tx;
}

/**
 * Processes a transaction to withdrawLockedfunds from the escrow's timelockcontract.
 * @param request
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function withdrawLockedFundsRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const encodedTx = encodeWithdrawLockedFundsRequest(request, signerOrProvider);
  const contractAddress = myEscrowArtifact.getAddress(request.currencyInfo.network!);

  const signer = getSigner(signerOrProvider);
  const tx = await signer.sendTransaction({
    data: encodedTx,
    to: contractAddress,
    value: 0,
    ...overrides,
  });
  // console.log(tx);
  return tx;
}

/**
 * Processes a transaction to withdrawLockedfunds from the escrow's timelockcontract.
 * @param request
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function disputeMappingRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const encodedTx = encodeDisputeMappingRequest(request, signerOrProvider);
  const contractAddress = myEscrowArtifact.getAddress(request.currencyInfo.network!);

  const signer = getSigner(signerOrProvider);
  const tx = await signer.sendTransaction({
    data: encodedTx,
    to: contractAddress,
    value: 0,
    ...overrides,
  });
  // console.log(tx);
  return tx;
}

/**
 * Encodes the call to pay the MyEscrow request through the ERC20 proxy contract, can be used with a Multisig contract.
 * @param request request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 */
export function encodeInitAndDepositRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  amount?: BigNumberish,
): string {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_TIME_LOCKED_ESCROW);
  const signer = getSigner(signerOrProvider);

  // ERC20 token to be used
  const tokenAddress = request.currencyInfo.value;
  const contractAddress = myEscrowArtifact.getAddress(request.currencyInfo.network!);

  // collects the parameters to be used, from the request
  const { paymentReference, paymentAddress, feeAmount, feeAddress } = getRequestPaymentValues(
    request,
  );
  const amountToPay = getAmountToPay(request, amount);

  // connects to the
  const myEscrowContract = MyEscrow__factory.connect(contractAddress, signer);

  return myEscrowContract.interface.encodeFunctionData('initAndDeposit', [
    tokenAddress,
    amountToPay,
    paymentAddress,
    `0x${paymentReference}`,
    feeAmount,
    feeAddress,
  ]);
}

/**
 * Returns the encoded data to withdraw funds from MyEscrow
 * @param request request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 */
export function encodeWithdrawFundsRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
): string {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_TIME_LOCKED_ESCROW);
  const signer = getSigner(signerOrProvider);

  // collects the parameters to be used from the request
  const { paymentReference } = getRequestPaymentValues(request);

  // connections to the escrow contract
  const contractAddress = myEscrowArtifact.getAddress(request.currencyInfo.network!);
  const myEscrowContract = MyEscrow__factory.connect(contractAddress, signer);

  // encodes the function data and returns them
  return myEscrowContract.interface.encodeFunctionData('withdrawFunds', [`0x${paymentReference}`]);
}

/**
 * Returns the encoded data to excecute a InitLockPeriod call
 * @param request request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 */
export function encodeInitLockPeriodRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
): string {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_TIME_LOCKED_ESCROW);
  const signer = getSigner(signerOrProvider);

  // collects the parameters to be used from the request
  const { paymentReference } = getRequestPaymentValues(request);

  // connections to the escrow contract
  const contractAddress = myEscrowArtifact.getAddress(request.currencyInfo.network!);
  const myEscrowContract = MyEscrow__factory.connect(contractAddress, signer);

  // encodes the function data and returns them
  return myEscrowContract.interface.encodeFunctionData('initLockPeriod', [`0x${paymentReference}`]);
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
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_TIME_LOCKED_ESCROW);
  const signer = getSigner(signerOrProvider);

  // collects the parameters to be used from the request
  const { paymentReference } = getRequestPaymentValues(request);

  // connections to the escrow contract
  const contractAddress = myEscrowArtifact.getAddress(request.currencyInfo.network!);
  const myEscrowContract = MyEscrow__factory.connect(contractAddress, signer);

  // encodes the function data and returns them
  return myEscrowContract.interface.encodeFunctionData('disputeMapping', [`0x${paymentReference}`]);
}

/**
 * Returns the encoded data to withdrawLockedfunds from MyEscrow's TimeLockContract
 * @param request request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 */
export function encodeWithdrawLockedFundsRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
): string {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_TIME_LOCKED_ESCROW);
  const signer = getSigner(signerOrProvider);

  // collects the parameters to be used from the request
  const { paymentReference } = getRequestPaymentValues(request);

  // connections to the escrow contract
  const contractAddress = myEscrowArtifact.getAddress(request.currencyInfo.network!);
  const myEscrowContract = MyEscrow__factory.connect(contractAddress, signer);

  // encodes the function data and returns them
  return myEscrowContract.interface.encodeFunctionData('withdrawLockedFunds', [
    `0x${paymentReference}`,
  ]);
}
