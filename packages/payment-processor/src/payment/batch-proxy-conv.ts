import { ContractTransaction, Signer, providers, constants, BigNumber, BigNumberish } from 'ethers';
import { batchPaymentsArtifact } from '@requestnetwork/smart-contracts';
import { BatchConversionPayments__factory, BatchPayments__factory } from '@requestnetwork/smart-contracts/types';
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
import { IConversionPaymentSettings } from './index';
import { prepAnyToErc20ProxyRequest } from './any-to-erc20-proxy';

// used by batch smart contract
export type ConversionDetail = {
  recipient: string;
  requestAmount: BigNumberish;
  path: string[];
  paymentReference: string;
  feeAmount: BigNumberish;
  maxToSpend: BigNumberish;
  maxRateTimespan: BigNumberish;
};

export type CryptoDetails = {
  tokenAddresses: Array<string>;
  recipients: Array<string>;
  amounts: Array<BigNumberish>;
  paymentReferences: Array<string>;
  feeAmounts: Array<BigNumberish>;
};

const emptyConversionDetail = {
  recipient: '',
  requestAmount: 0,
  path: [],
  paymentReference: '',
  feeAmount: 0,
  maxToSpend: 0,
  maxRateTimespan: 0,
};

const emptyCryptoDetails = {
  tokenAddresses: [],
  recipients: [],
  amounts: [],
  paymentReferences: [],
  feeAmounts: [],
};

export type MetaDetail = {
  paymentNetworkId: number;
  conversionDetails: ConversionDetail[];
  cryptoDetails: CryptoDetails;
};

// used only for batch payment processor
type EnrichedRequest = {
  paymentNetworkId: number; // ref in batchConversionPayment.sol
  requests: ClientTypes.IRequestData[];
  paymentSettings?: IConversionPaymentSettings[];
  amount?: BigNumberish[];
  feeAmount?: BigNumberish[];
  version?: string;
  batchFee?: number;
};

/** TODO UPDATE
 * ERC20 Batch Proxy payment details:
 *   batch of request with the same payment network type: ERC20
 *   batch of request with the same payment network version
 *   2 modes available: single token or multi tokens
 * It requires batch proxy's approval
 *
 * Eth Batch Proxy payment details:
 *   batch of request with the same payment network type
 *   batch of request with the same payment network version
 * -> Eth batch proxy accepts requests with 2 id: ethProxy and ethFeeProxy
 *    but only call ethFeeProxy. It can impact payment detection
 */

/**
 * Processes a transaction to pay a batch of requests with an ERC20 or ETH currency that is different from the request currency (eg. fiat).
 * The payment is made by the ERC20, or ETH fee proxy contract.
 * @param enrichedRequests List of EnrichedRequest
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function payBatchConvProxyRequest(
  enrichedRequests: EnrichedRequest[],
  signerOrProvider: providers.Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const { data, to, value } = prepareBatchConvPaymentTransaction(enrichedRequests);
  const signer = getSigner(signerOrProvider);
  return signer.sendTransaction({ data, to, value, ...overrides });
}

/**
 * Prepate the transaction to pay a batch of requests through the batch proxy contract, can be used with a Multisig contract.
 * Requests paymentType must be "ETH" or "ERC20"
 */
export function prepareBatchConvPaymentTransaction(
  enrichedRequests: EnrichedRequest[],
): IPreparedTransaction {
  // we only implement batchRouter and the ERC20 normal and conversion functions
  // batchERC20ConversionPaymentsMultiTokens, and batchERC20PaymentsMultiTokensWithReference
  // => paymentNetworkId take only theses values: 0 or 2
  // later, to do gas optimizaton, we will implement the others batch functions,

  // revoir cette partie, il faut créer deux obj dict, un avec paymentNetworkId 0 (puis 2) ayant toutes les requests, feeAddress
  let clusteredEnrichedRequest = []
  for (let i = 0; i < enrichedRequests.length; i++) {
    if (enrichedRequests[i].paymentNetworkId === 0) {
      clusteredEnrichedRequest.push({paymentNetworkId: 0, request: enrichedRequests[i], feeAddress: enrichedRequests[i].})
    } else if (enrichedRequests[i].paymentNetworkId === 2) {
      clusteredEnrichedRequest.push({paymentNetworkId: 0, request: enrichedRequests[i]})
    }
  }
  // create MetaDetails input
  const metaDetails = [];
  let ERC20ConversionInput: ConversionDetail[];
  let ERC20Input: CryptoDetails;
  for (let i = 0; i < enrichedRequests.length; i++) {
    const enrichedRequest = enrichedRequests[i];
    if (enrichedRequest.paymentNetworkId === 0) {
      ERC20ConversionInput = batchERC20ConversionPaymentsMultiTokensInput(enrichedRequest);
      metaDetails.push({
        paymentNetworkId: 0,
        conversionDetails: ERC20ConversionInput,
        cryptoDetails: emptyCryptoDetails,
      });
    } else if (enrichedRequests[i].paymentNetworkId === 2) {
      ERC20Input = batchERC20PaymentsMultiTokensWithReferenceInput(enrichedRequest);
      metaDetails.push({
        paymentNetworkId: 2,
        conversionDetails: [emptyConversionDetail],
        cryptoDetails: ERC20Input,
      });
    } else {
      throw new Error('paymentNetworkId must be equal to 0 or 2');
    }
  }
  console.log('metaDetails', metaDetails);
  metaDetails;

  const encodedTx = encodePayBatchRequest(requests);
  const proxyAddress = getBatchProxyAddress(requests[0], version);
  // let totalAmount = 0;

  // if (requests[0].currencyInfo.type === 'ETH') {
  //   const { amountsToPay, feesToPay } = getBatchArgs(requests);

  //   const amountToPay = amountsToPay.reduce((sum, current) => sum.add(current), BigNumber.from(0));
  //   const batchFeeToPay = BigNumber.from(amountToPay).mul(batchFee).div(1000);
  //   const feeToPay = feesToPay.reduce(
  //     (sum, current) => sum.add(current),
  //     BigNumber.from(batchFeeToPay),
  //   );
  //   totalAmount = amountToPay.add(feeToPay).toNumber();
  }

  return {
    data: encodedTx,
    to: proxyAddress,
    value: totalAmount,
  };
}

function batchERC20ConversionPaymentsMultiTokensInput(
  enrichedRequest: EnrichedRequest,
): ConversionDetail[] {
  // encodePayAnyToErc20ProxyRequest look what they check
  for (let i = 0; i < enrichedRequest.requests.length; i++) {
    const {
      path,
      paymentReference,
      paymentAddress,
      feeAddress,
      maxRateTimespan,
      amountToPay,
      feeToPay,
    } = prepAnyToErc20ProxyRequest(request, enrichedRequest.paymentSettings, enrichedRequest.amount, enrichedRequest.feeAmountOverride);

  }
  
  return [];
}

function batchERC20PaymentsMultiTokensWithReferenceInput(enrichedRequest: EnrichedRequest): CryptoDetails {
  return {
    tokenAddresses: [],
    recipients: [],
    amounts: [],
    paymentReferences: [],
    feeAmounts: [],
  };
}

function samePaymentNetwork(requests: ClientTypes.IRequestData[]): void {
  const pn = getPaymentNetworkExtension(requests[0]);
  for (let i = 0; i < requests.length; i++) {
    validateErc20FeeProxyRequest(requests[i]);
    if (!comparePnTypeAndVersion(pn, requests[i])) {
      throw new Error(`Every payment network type and version must be identical`);
    }
  }
}

/**
 * Encodes the call to pay a batch of requests through the ERC20Bacth or ETHBatch proxy contract,
 * can be used with a Multisig contract.
 * @param requests list of ECR20 requests to pay
 * @dev pn version of the requests is checked to avoid paying with two differents proxies (e.g: erc20proxy v1 and v2)
 */
 export function encodePayBatchConversion(metaDetails: MetaDetail[]): string {

  const proxyContract = BatchConversionPayments__factory.createInterface();


    

    if (isMultiTokens) {
      return proxyContract.encodeFunctionData('batchERC20PaymentsMultiTokensWithReference', [
        tokenAddresses,
        paymentAddresses,
        amountsToPay,
        paymentReferences,
        feesToPay,
        feeAddressUsed,
      ]);
    } else {
      return proxyContract.encodeFunctionData('batchERC20PaymentsWithReference', [
        tokenAddresses[0],
        paymentAddresses,
        amountsToPay,
        paymentReferences,
        feesToPay,
        feeAddressUsed,
      ]);
    }
  } else {
    tokenAddresses;
    return proxyContract.encodeFunctionData('batchEthPaymentsWithReference', [
      paymentAddresses,
      amountsToPay,
      paymentReferences,
      feesToPay,
      feeAddressUsed,
    ]);
  }
}

/**
 * Encodes the call to pay a batch of requests through the ERC20Bacth or ETHBatch proxy contract,
 * can be used with a Multisig contract.
 * @param requests list of ECR20 requests to pay
 * @dev pn version of the requests is checked to avoid paying with two differents proxies (e.g: erc20proxy v1 and v2)
 */
export function encodePayBatchRequest(requests: ClientTypes.IRequestData[]): string {
  const {
    tokenAddresses,
    paymentAddresses,
    amountsToPay,
    paymentReferences,
    feesToPay,
    feeAddressUsed,
  } = getBatchArgs(requests);

  const proxyContract = BatchPayments__factory.createInterface();

  if (requests[0].currencyInfo.type === 'ERC20') {
    let isMultiTokens = false;
    for (let i = 0; tokenAddresses.length; i++) {
      if (tokenAddresses[0] !== tokenAddresses[i]) {
        isMultiTokens = true;
        break;
      }
    }

    const pn = getPaymentNetworkExtension(requests[0]);
    for (let i = 0; i < requests.length; i++) {
      validateErc20FeeProxyRequest(requests[i]);
      if (!comparePnTypeAndVersion(pn, requests[i])) {
        throw new Error(`Every payment network type and version must be identical`);
      }
    }

    if (isMultiTokens) {
      return proxyContract.encodeFunctionData('batchERC20PaymentsMultiTokensWithReference', [
        tokenAddresses,
        paymentAddresses,
        amountsToPay,
        paymentReferences,
        feesToPay,
        feeAddressUsed,
      ]);
    } else {
      return proxyContract.encodeFunctionData('batchERC20PaymentsWithReference', [
        tokenAddresses[0],
        paymentAddresses,
        amountsToPay,
        paymentReferences,
        feesToPay,
        feeAddressUsed,
      ]);
    }
  } else {
    tokenAddresses;
    return proxyContract.encodeFunctionData('batchEthPaymentsWithReference', [
      paymentAddresses,
      amountsToPay,
      paymentReferences,
      feesToPay,
      feeAddressUsed,
    ]);
  }
}

/**
 * Get batch arguments
 * @param requests List of requests
 * @returns List with the args required by batch Eth and Erc20 functions,
 * @dev tokenAddresses returned is for batch Erc20 functions
 */
function getBatchArgs(
  requests: ClientTypes.IRequestData[],
): {
  tokenAddresses: Array<string>;
  paymentAddresses: Array<string>;
  amountsToPay: Array<BigNumber>;
  paymentReferences: Array<string>;
  feesToPay: Array<BigNumber>;
  feeAddressUsed: string;
} {
  const tokenAddresses: Array<string> = [];
  const paymentAddresses: Array<string> = [];
  const amountsToPay: Array<BigNumber> = [];
  const paymentReferences: Array<string> = [];
  const feesToPay: Array<BigNumber> = [];
  let feeAddressUsed = constants.AddressZero;

  const paymentType = requests[0].currencyInfo.type;
  for (let i = 0; i < requests.length; i++) {
    if (paymentType === 'ETH') {
      validateEthFeeProxyRequest(requests[i]);
    } else if (paymentType === 'ERC20') {
      validateErc20FeeProxyRequest(requests[i]);
    } else {
      throw new Error(`paymentType ${paymentType} is not supported for batch payment`);
    }

    const tokenAddress = requests[i].currencyInfo.value;
    const { paymentReference, paymentAddress, feeAddress, feeAmount } = getRequestPaymentValues(
      requests[i],
    );

    tokenAddresses.push(tokenAddress);
    paymentAddresses.push(paymentAddress);
    amountsToPay.push(getAmountToPay(requests[i]));
    paymentReferences.push(`0x${paymentReference}`);
    feesToPay.push(BigNumber.from(feeAmount || 0));
    feeAddressUsed = feeAddress || constants.AddressZero;
  }

  return {
    tokenAddresses,
    paymentAddresses,
    amountsToPay,
    paymentReferences,
    feesToPay,
    feeAddressUsed,
  };
}

/**
 * Get Batch contract Address
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
