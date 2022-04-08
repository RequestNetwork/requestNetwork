import { ContractTransaction, Signer, providers, constants, BigNumber } from 'ethers';
import { batchPaymentsArtifact } from '@requestnetwork/smart-contracts';
import { BatchPayments__factory } from '@requestnetwork/smart-contracts/types';
import { ClientTypes, PaymentTypes } from '@requestnetwork/types';
import { ITransactionOverrides } from './transaction-overrides';
import {
  comparePnTypeAndVersion,
  getAmountToPay,
  getPaymentNetworkExtension,
  getProvider,
  getRequestPaymentValues,
  getSigner,
  validateErc20FeeProxyRequest,
} from './utils';
import { validateEthFeeProxyRequest } from './eth-fee-proxy';
import { IPreparedTransaction } from './prepared-transaction';
import { checkErc20Allowance, encodeApproveAnyErc20 } from './erc20';

/**
 * ERC20 Batch Proxy payment details:
 *   batch of request with the same payment network type: ERC20
 *   batch of request with the same payment network version
 *   2 modes available: single token or multi tokens
 * It requires batch proxy's approval
 *
 *  Eth Batch Proxy payment details:
 *   batch of request with the same payment network type
 *   batch of request with the same payment network version
 */

/**
 * Processes a transaction to pay of batch of ETH Requests with fees.
 * @param requests List of request
 * @param paymentType it can be "eth" or "erc20"
 * @param version version of the batch proxy, which can be different from request pn version
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param batchFee Only for batch ETH: additional fee applied to a batch, between 0 and 1000, default value = 10
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function payBatchProxyRequest(
  requests: ClientTypes.IRequestData[],
  paymentType: 'eth' | 'erc20',
  version: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  batchFee: number,
  isMultiTokens: boolean,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const { data, to, value } = prepareBatchPaymentTransaction(
    requests,
    paymentType,
    version,
    batchFee,
    isMultiTokens,
  );
  const signer = getSigner(signerOrProvider);
  return signer.sendTransaction({ data, to, value, ...overrides });
}

/**
 * Processes the approval transaction of the targeted ERC20 with batch proxy.
 * @param request request to pay
 * @param account account that will be used to pay the request
 * @param version version of the batch proxy, which can be different from request pn version
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function approveErc20BatchIfNeeded(
  request: ClientTypes.IRequestData,
  account: string,
  version: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction | void> {
  if (!(await hasErc20BatchApproval(request, account, version, signerOrProvider))) {
    return approveErc20Batch(request, version, getSigner(signerOrProvider), overrides);
  }
}

/**
 * Prepate the transaction to pay a batch of requests through the batch proxy contract, can be used with a Multisig contract.
 * @param requests list of ETH requests to pay
 * @param paymentType it can be "eth" or "erc20"
 * @param version version of the batch proxy, which can be different from request pn version
 * @param batchFee additional fee applied to a batch
 */
export function prepareBatchPaymentTransaction(
  requests: ClientTypes.IRequestData[],
  paymentType: 'eth' | 'erc20',
  version: string,
  batchFee: number,
  isMultiTokens: boolean,
): IPreparedTransaction {
  const encodedTx = encodePayBatchRequest(requests, paymentType, isMultiTokens);
  const proxyAddress = getBatchProxyAddress(requests[0], version);
  let totalAmount = 0;

  if (paymentType === 'eth') {
    const [
      _tokens,
      _paymentAddresses,
      amountsToPay,
      _paymentReferences,
      feesToPay,
      _feeAddress,
    ] = GetBatchArgs(requests, paymentType);

    _tokens;
    _paymentReferences;
    _paymentAddresses;
    _feeAddress;

    const amountToPay = amountsToPay.reduce((sum, current) => sum.add(current), BigNumber.from(0));
    const batchFeeToPay = BigNumber.from(amountToPay).mul(batchFee).div(1000);
    const feeToPay = feesToPay.reduce(
      (sum, current) => sum.add(current),
      BigNumber.from(batchFeeToPay),
    );
    totalAmount = amountToPay.add(feeToPay).toNumber();
  }

  return {
    data: encodedTx,
    to: proxyAddress,
    value: totalAmount,
  };
}

/**
 * Encodes the call to pay a batch of requests through the ERC20Bacth or ETHBatch proxy contract,
 * can be used with a Multisig contract.
 * @param requests list of ECR20 requests to pay
 * @param paymentType it can be "eth" or "erc20"
 * @param isMultiTokens pay multiple tokens in a batch, false by default
 * @dev pn version of the requests is checked to avoid paying with two differents proxies (e.g: erc20proxy v1 and v2)
 */
export function encodePayBatchRequest(
  requests: ClientTypes.IRequestData[],
  paymentType: 'eth' | 'erc20',
  isMultiTokens = false,
): string {
  const [
    tokenAddresses,
    paymentAddresses,
    amountsToPay,
    paymentReferences,
    feesToPay,
    feeAddress,
  ] = GetBatchArgs(requests, paymentType);

  const proxyContract = BatchPayments__factory.createInterface();

  if (paymentType === 'erc20') {
    const pn = getPaymentNetworkExtension(requests[0]);
    for (let i = 0; i < requests.length; i++) {
      validateErc20FeeProxyRequest(requests[i]);
      comparePnTypeAndVersion(pn, requests[i]);
    }

    if (isMultiTokens) {
      return proxyContract.encodeFunctionData('batchERC20PaymentsMultiTokensWithReference', [
        tokenAddresses,
        paymentAddresses,
        amountsToPay,
        paymentReferences,
        feesToPay,
        feeAddress,
      ]);
    } else {
      return proxyContract.encodeFunctionData('batchERC20PaymentsWithReference', [
        tokenAddresses[0],
        paymentAddresses,
        amountsToPay,
        paymentReferences,
        feesToPay,
        feeAddress,
      ]);
    }
  } else {
    tokenAddresses;
    return proxyContract.encodeFunctionData('batchEthPaymentsWithReference', [
      paymentAddresses,
      amountsToPay,
      paymentReferences,
      feesToPay,
      feeAddress,
    ]);
  }
}

/**
 * Get batch arguments
 * @param requests List of request
 * @param paymentType it can be "eth" or "erc20"
 * @returns List with the args required by batchEthPaymentsWithReference,
 * @dev tokenAddresses returned is for multi tokens function
 */
export function GetBatchArgs(
  requests: ClientTypes.IRequestData[],
  paymentType: 'eth' | 'erc20',
): [Array<string>, Array<string>, Array<BigNumber>, Array<string>, Array<BigNumber>, string] {
  const tokenAddresses: Array<string> = [];
  const paymentAddresses: Array<string> = [];
  const amountsToPay: Array<BigNumber> = [];
  const paymentReferences: Array<string> = [];
  const feesToPay: Array<BigNumber> = [];
  let feeAddressUsed = constants.AddressZero;

  for (let i = 0; i < requests.length; i++) {
    if (paymentType === 'eth') {
      validateEthFeeProxyRequest(requests[i]);
    } else {
      validateErc20FeeProxyRequest(requests[i]);
    }

    const tokenAddress = requests[i].currencyInfo.value;
    const { paymentReference, paymentAddress, feeAddress, feeAmount } = getRequestPaymentValues(
      requests[i],
    );

    tokenAddresses.push(tokenAddress);
    paymentAddresses.push(paymentAddress);
    const amountToPay = getAmountToPay(requests[i]);
    amountsToPay.push(amountToPay);
    paymentReferences.push(`0x${paymentReference}`);
    feesToPay.push(BigNumber.from(feeAmount || 0));
    feeAddressUsed = feeAddress || constants.AddressZero;
  }

  return [
    tokenAddresses,
    paymentAddresses,
    amountsToPay,
    paymentReferences,
    feesToPay,
    feeAddressUsed,
  ];
}

/**
 * Get getBatchProxyAddress
 * @param request
 * @param version version of the batch proxy, which can be different from request pn version
 */
export function getBatchProxyAddress(request: ClientTypes.IRequestData, version: string): string {
  const pn = getPaymentNetworkExtension(request);
  const pnId = (pn?.id as unknown) as PaymentTypes.PAYMENT_NETWORK_ID;
  if (!pnId) {
    throw new Error('No payment network Id');
  }

  const proxyAddress = batchPaymentsArtifact.getAddress(request.currencyInfo.network!, version);

  if (!proxyAddress) {
    throw new Error(`No deployment found for network ${pn}, version ${pn?.version}`);
  }
  return proxyAddress;
}

/**
 * ERC20 Batch proxy approvals methods
 */

/**
 * Checks if the batch proxy has the necessary allowance from a given account
 * to pay a given request with ERC20 batch
 * @param request request to pay
 * @param account account that will be used to pay the request
 * @param version version of the batch proxy, which can be different from request pn version
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 */
export async function hasErc20BatchApproval(
  request: ClientTypes.IRequestData,
  account: string,
  version: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
): Promise<boolean> {
  return checkErc20Allowance(
    account,
    getBatchProxyAddress(request, version),
    signerOrProvider,
    request.currencyInfo.value,
    request.expectedAmount,
  );
}

/**
 * Processes the transaction to approve the batch proxy to spend signer's tokens to pay
 * the request in its payment currency. Can be used with a Multisig contract.
 * @param request request to pay
 * @param version version of the batch proxy, which can be different from request pn version
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function approveErc20Batch(
  request: ClientTypes.IRequestData,
  version: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const preparedTx = prepareApproveErc20Batch(request, version, signerOrProvider, overrides);
  const signer = getSigner(signerOrProvider);
  const tx = await signer.sendTransaction(preparedTx);
  return tx;
}

/**
 * Prepare the transaction to approve the proxy to spend signer's tokens to pay
 * the request in its payment currency. Can be used with a Multisig contract.
 * @param request request to pay
 * @param version version of the batch proxy, which can be different from request pn version
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
export function prepareApproveErc20Batch(
  request: ClientTypes.IRequestData,
  version: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): IPreparedTransaction {
  const encodedTx = encodeApproveErc20Batch(request, version, signerOrProvider);
  const tokenAddress = request.currencyInfo.value;
  return {
    data: encodedTx,
    to: tokenAddress,
    value: 0,
    ...overrides,
  };
}

/**
 * Encodes the transaction to approve the batch proxy to spend signer's tokens to pay
 * the request in its payment currency. Can be used with a Multisig contract.
 * @param request request to pay
 * @param version version of the batch proxy, which can be different from request pn version
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 */
export function encodeApproveErc20Batch(
  request: ClientTypes.IRequestData,
  version: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
): string {
  const proxyAddress = getBatchProxyAddress(request, version);

  return encodeApproveAnyErc20(
    request.currencyInfo.value,
    proxyAddress,
    getSigner(signerOrProvider),
  );
}
