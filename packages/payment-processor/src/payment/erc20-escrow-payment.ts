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
import { IPreparedTransaction } from './prepared-transaction';

/**
 * Prepare the approval transaction of the payment ERC20 to be spent by the escrow contract
 * @param request request to pay
 * @param paymentTokenAddress currency to approve
 * @param signerOrProvider the web3 provider
 * @param overrides optionally overrides default transaction values, like gas
 * @returns the prepared transaction
 */
export function prepareErc20EscrowApproval(
  request: ClientTypes.IRequestData,
  paymentTokenAddress: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  amount?: BigNumber,
  overrides?: ITransactionOverrides,
): IPreparedTransaction {
  const contractAddress = erc20EscrowToPayArtifact.getAddress(request.currencyInfo.network!);
  const encodedTx = encodeApproveAnyErc20(
    paymentTokenAddress,
    contractAddress,
    signerOrProvider,
    amount,
  );
  return {
    data: encodedTx,
    to: paymentTokenAddress,
    value: 0,
    ...overrides,
  };
}

/**
 * Processes the approval transaction of the payment ERC20 to be spent by the erc20EscrowToPay
 * contract during the fee proxy delegate call.
 * @param request request to pay, used to know the network
 * @param paymentTokenAddress picked currency to pay
 * @param signerOrProvider the web3 provider. Defaults to Etherscan.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function approveErc20ForEscrow(
  request: ClientTypes.IRequestData,
  paymentTokenAddress: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  amount?: BigNumber,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const preparedTx = prepareErc20EscrowApproval(
    request,
    paymentTokenAddress,
    signerOrProvider,
    amount,
    overrides,
  );
  const signer = getSigner(signerOrProvider);
  return await signer.sendTransaction(preparedTx);
}

/**
 * Processes a transaction to payEscrow().
 * @param request request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optional, if you want to override the amount in the request.
 * @param feeAmount optional, if you want to override the feeAmount in the request.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function payEscrow(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  amount?: BigNumberish,
  feeAmount?: BigNumberish,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const preparedTx = preparePayEscrow(request, amount, feeAmount, overrides);
  const signer = getSigner(signerOrProvider);
  return await signer.sendTransaction(preparedTx);
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
  const encodedTx = encodeFreezeRequest(request);
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
  const encodedTx = encodePayRequestFromEscrow(request);
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
  const encodedTx = encodeInitiateEmergencyClaim(request);
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
  const encodedTx = encodeCompleteEmergencyClaim(request);
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
  const encodedTx = encodeRevertEmergencyClaim(request);
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
  const encodedTx = encodeRefundFrozenFunds(request);
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
  amount?: BigNumberish,
  feeAmountOverride?: BigNumberish,
): string {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT);
  const tokenAddress = request.currencyInfo.value;

  // collects the parameters to be used, from the request
  const { paymentReference, paymentAddress, feeAmount, feeAddress } =
    getRequestPaymentValues(request);

  const amountToPay = getAmountToPay(request, amount);
  const feeToPay = BigNumber.from(feeAmountOverride || feeAmount || 0);

  const erc20EscrowContract = ERC20EscrowToPay__factory.createInterface();

  return erc20EscrowContract.encodeFunctionData('payEscrow', [
    tokenAddress,
    paymentAddress,
    amountToPay,
    `0x${paymentReference}`,
    feeToPay,
    feeAddress || constants.AddressZero,
  ]);
}

/**
 * Prepare a transaction pay the escrow contract.
 * @param request request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optional, if you want to override the amount in the request.
 * @param feeAmount optional, if you want to override the feeAmount in the request.
 * @param overrides optionally, override default transaction values, like gas.
 */
export function preparePayEscrow(
  request: ClientTypes.IRequestData,
  amount?: BigNumberish,
  feeAmount?: BigNumberish,
  overrides?: ITransactionOverrides,
): IPreparedTransaction {
  const encodedTx = encodePayEscrow(request, amount, feeAmount);
  const contractAddress = erc20EscrowToPayArtifact.getAddress(request.currencyInfo.network!);
  return {
    data: encodedTx,
    to: contractAddress,
    value: 0,
    ...overrides,
  };
}

/**
 * Encapsulates the validation, paymentReference calculation and escrow contract interface creation.
 * These steps are used in all subsequent functions encoding escrow interaction transactions
 * @param request Request data
 * @returns {erc20EscrowToPayContract, paymentReference}
 */
function prepareForEncoding(request: ClientTypes.IRequestData) {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT);

  // collects the parameters to be used from the request
  const { paymentReference } = getRequestPaymentValues(request);

  // connections to the escrow contract
  const erc20EscrowToPayContract = ERC20EscrowToPay__factory.createInterface();
  return {
    erc20EscrowToPayContract,
    paymentReference,
  };
}

/**
 * Returns the encoded data to freezeRequest().
 * @param request request to pay.
 */
export function encodeFreezeRequest(request: ClientTypes.IRequestData): string {
  const { erc20EscrowToPayContract, paymentReference } = prepareForEncoding(request);
  return erc20EscrowToPayContract.encodeFunctionData('freezeRequest', [`0x${paymentReference}`]);
}

/**
 * Returns the encoded data to payRequestFromEscrow().
 * @param request request for pay
 */
export function encodePayRequestFromEscrow(request: ClientTypes.IRequestData): string {
  const { erc20EscrowToPayContract, paymentReference } = prepareForEncoding(request);
  return erc20EscrowToPayContract.encodeFunctionData('payRequestFromEscrow', [
    `0x${paymentReference}`,
  ]);
}

/**
 * Returns the encoded data to initiateEmergencyClaim().
 * @param request request to pay.
 */
export function encodeInitiateEmergencyClaim(request: ClientTypes.IRequestData): string {
  const { erc20EscrowToPayContract, paymentReference } = prepareForEncoding(request);
  return erc20EscrowToPayContract.encodeFunctionData('initiateEmergencyClaim', [
    `0x${paymentReference}`,
  ]);
}

/**
 * Returns the encoded data to completeEmergencyClaim().
 * @param request request to pay.
 */
export function encodeCompleteEmergencyClaim(request: ClientTypes.IRequestData): string {
  const { erc20EscrowToPayContract, paymentReference } = prepareForEncoding(request);
  return erc20EscrowToPayContract.encodeFunctionData('completeEmergencyClaim', [
    `0x${paymentReference}`,
  ]);
}

/**
 * Returns the encoded data to revertEmergencyClaim().
 * @param request request to pay.
 */
export function encodeRevertEmergencyClaim(request: ClientTypes.IRequestData): string {
  const { erc20EscrowToPayContract, paymentReference } = prepareForEncoding(request);
  return erc20EscrowToPayContract.encodeFunctionData('revertEmergencyClaim', [
    `0x${paymentReference}`,
  ]);
}

/**
 * Returns the encoded data to refundFrozenFunds().
 * @param request request to pay.
 */
export function encodeRefundFrozenFunds(request: ClientTypes.IRequestData): string {
  const { erc20EscrowToPayContract, paymentReference } = prepareForEncoding(request);
  return erc20EscrowToPayContract.encodeFunctionData('refundFrozenFunds', [
    `0x${paymentReference}`,
  ]);
}
