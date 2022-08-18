import { ContractTransaction, Signer, providers, BigNumber, BigNumberish } from 'ethers';
import { batchConversionPaymentsArtifact } from '@requestnetwork/smart-contracts';
import { BatchConversionPayments__factory } from '../../../smart-contracts/types';
import { ClientTypes } from '@requestnetwork/types';
import { ITransactionOverrides } from './transaction-overrides';
import {
  comparePnTypeAndVersion,
  getPaymentNetworkExtension,
  getProvider,
  getRequestPaymentValues,
  getSigner,
} from './utils';
import { IPreparedTransaction } from './prepared-transaction';
import { IConversionPaymentSettings } from './index';
import { checkRequestAndGetPathAndCurrency } from './any-to-erc20-proxy';
import { getBatchArgs } from './batch-proxy';
import { checkErc20Allowance, encodeApproveAnyErc20 } from './erc20';

// Types used by batch conversion smart contract
type ConversionDetail = {
  recipient: string;
  requestAmount: BigNumberish;
  path: string[];
  paymentReference: string;
  feeAmount: BigNumberish;
  maxToSpend: BigNumberish;
  maxRateTimespan: BigNumberish;
};

type CryptoDetails = {
  tokenAddresses: Array<string>;
  recipients: Array<string>;
  amounts: Array<BigNumberish>;
  paymentReferences: Array<string>;
  feeAmounts: Array<BigNumberish>;
};

type MetaDetail = {
  paymentNetworkId: number;
  conversionDetails: ConversionDetail[];
  cryptoDetails: CryptoDetails;
};

/**
 * Type used by batch conversion payment processor
 * It contains requests, paymentSettings, amount and feeAmount,
 * having the same PN, version, and batchFee
 */
export type EnrichedRequest = {
  paymentNetworkId: 0 | 2; // ref in batchConversionPayment.sol
  request: ClientTypes.IRequestData;
  paymentSettings?: IConversionPaymentSettings;
  amount?: BigNumberish;
  feeAmount?: BigNumberish;
};

/**
 * Processes a transaction to pay a batch of requests with an ERC20 or ETH currency that is different from the request currency (eg. fiat).
 * The payment is made through ERC20 or ERC20Conversion proxies
 * It can be used with a Multisig contract
 * @param enrichedRequests List of EnrichedRequest
 * @param version of the batch conversion proxy
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 * @dev we only implement batchRouter using the ERC20 normal and conversion functions:
 * batchERC20ConversionPaymentsMultiTokens, and batchERC20PaymentsMultiTokensWithReference.
 * It implies that paymentNetworkId take only theses values: 0 or 2
 * Next steps:
 * - Enable ETH payment: normal and conversion
 * - Enable gas optimizaton: implement the others batch functions
 */
export async function payBatchConversionProxyRequest(
  enrichedRequests: EnrichedRequest[],
  version: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const { data, to, value } = prepareBatchConversionPaymentTransaction(enrichedRequests, version);
  const signer = getSigner(signerOrProvider);
  return signer.sendTransaction({ data, to, value, ...overrides });
}

/**
 * Prepate the transaction to pay a batch of requests through the batch conversion proxy contract,
 * it can be used with a Multisig contract.
 */
export function prepareBatchConversionPaymentTransaction(
  enrichedRequests: EnrichedRequest[],
  version: string,
): IPreparedTransaction {
  const encodedTx = encodePayBatchConversionRequest(enrichedRequests);
  const proxyAddress = getBatchConversionProxyAddress(enrichedRequests[0].request, version);
  return {
    data: encodedTx,
    to: proxyAddress,
    value: 0,
  };
}

/**
 * Encodes the call to pay a batch conversion of requests through ERC20 or ERC20Conversion proxies
 * It can be used with a Multisig contract.
 * @param enrichedRequests list of ECR20 requests to pay
 */
export function encodePayBatchConversionRequest(enrichedRequests: EnrichedRequest[]): string {
  const extension = getPaymentNetworkExtension(enrichedRequests[0].request);
  if (!extension) {
    throw new Error('no payment network found');
  }

  const { feeAddress } = extension.values;

  const metaDetails: MetaDetail[] = [];

  // variable and constant to get info about each payment network (pn)
  let pn0FirstRequest: ClientTypes.IRequestData | undefined;
  const pn2requests = [];

  const conversionDetails: ConversionDetail[] = [];

  for (let i = 0; i < enrichedRequests.length; i++) {
    const iExtension = getPaymentNetworkExtension(enrichedRequests[i].request);
    if (!iExtension) {
      throw new Error('no payment network found');
    }
    if (enrichedRequests[i].paymentNetworkId === 0) {
      // set pn0FirstRequest only if it is undefined
      pn0FirstRequest = pn0FirstRequest ?? enrichedRequests[i].request;
      if (
        !comparePnTypeAndVersion(
          getPaymentNetworkExtension(pn0FirstRequest),
          enrichedRequests[i].request,
        )
      ) {
        throw new Error(`Every payment network type and version must be identical`);
      }
      conversionDetails.push(getInputConversionDetail(enrichedRequests[i]));
    } else if (enrichedRequests[i].paymentNetworkId === 2) {
      pn2requests.push(enrichedRequests[i].request);

      if (
        !comparePnTypeAndVersion(
          getPaymentNetworkExtension(pn2requests[0]),
          enrichedRequests[i].request,
        )
      ) {
        throw new Error(`Every payment network type and version must be identical`);
      }
    }
  }
  // get cryptoDetails values
  const {
    tokenAddresses,
    paymentAddresses,
    amountsToPay,
    paymentReferences,
    feesToPay,
  } = getBatchArgs(pn2requests);

  // add conversionDetails to metaDetails
  metaDetails.push({
    paymentNetworkId: 0,
    conversionDetails: conversionDetails,
    cryptoDetails: {
      tokenAddresses: [],
      recipients: [],
      amounts: [],
      paymentReferences: [],
      feeAmounts: [],
    }, // cryptoDetails is not used with paymentNetworkId 0
  });

  // add cryptpoDetails to metaDetails
  metaDetails.push({
    paymentNetworkId: 2,
    conversionDetails: [],
    cryptoDetails: {
      tokenAddresses: tokenAddresses,
      recipients: paymentAddresses,
      amounts: amountsToPay,
      paymentReferences: paymentReferences,
      feeAmounts: feesToPay,
    },
  });

  const proxyContract = BatchConversionPayments__factory.createInterface();
  return proxyContract.encodeFunctionData('batchRouter', [metaDetails, feeAddress]);
}

/**
 * It get the conversion detail values from one enriched request
 * @param enrichedRequest
 * @returns
 */
function getInputConversionDetail(enrichedRequest: EnrichedRequest): ConversionDetail {
  const paymentSettings = enrichedRequest.paymentSettings;
  if (!paymentSettings) throw Error('the first enrichedRequest has no version');
  const { path } = checkRequestAndGetPathAndCurrency(enrichedRequest.request, paymentSettings);

  const { paymentReference, paymentAddress, feeAmount, maxRateTimespan } = getRequestPaymentValues(
    enrichedRequest.request,
  );

  const requestAmount = BigNumber.from(enrichedRequest.request.expectedAmount).sub(
    enrichedRequest.request.balance?.balance || 0,
  );
  const maxToSpend = BigNumber.from(paymentSettings.maxToSpend);

  return {
    recipient: paymentAddress,
    requestAmount: requestAmount,
    path: path,
    paymentReference: paymentReference,
    feeAmount: BigNumber.from(feeAmount),
    maxToSpend: maxToSpend,
    maxRateTimespan: BigNumber.from(maxRateTimespan),
  };
}

/**
 * Get Batch conversion contract Address
 * @param request
 * @param version version of the batch conversion proxy
 */
export function getBatchConversionProxyAddress(
  request: ClientTypes.IRequestData,
  version: string,
): string {
  const network = request.currencyInfo.network;
  if (!network) throw new Error('the request has no network within currencyInfo');
  const proxyAddress = batchConversionPaymentsArtifact.getAddress(network, version);

  if (!proxyAddress) {
    throw new Error(
      `No deployment found on the network ${network}, associated with the version ${version}`,
    );
  }
  return proxyAddress;
}

/**
 * ERC20 Batch conversion proxy approvals methods
 */

/**
 * Processes the approval transaction of the targeted ERC20 with batch conversion proxy.
 * @param request request to pay
 * @param account account that will be used to pay the request
 * @param version version of the batch conversion proxy, which can be different from request pn version
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function approveErc20BatchConversionIfNeeded(
  request: ClientTypes.IRequestData,
  account: string,
  version: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction | void> {
  if (!(await hasErc20BatchConversionApproval(request, account, version, signerOrProvider))) {
    return approveErc20BatchConversion(request, version, getSigner(signerOrProvider), overrides);
  }
}

/**
 * Checks if the batch conversion proxy has the necessary allowance from a given account
 * to pay a given request with ERC20 batch
 * @param request request to pay
 * @param account account that will be used to pay the request
 * @param version version of the batch conversion proxy, which can be different from request pn version
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 */
export async function hasErc20BatchConversionApproval(
  request: ClientTypes.IRequestData,
  account: string,
  version: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
): Promise<boolean> {
  return checkErc20Allowance(
    account,
    getBatchConversionProxyAddress(request, version),
    signerOrProvider,
    request.currencyInfo.value,
    request.expectedAmount,
  );
}

/**
 * Processes the transaction to approve the batch conversion proxy to spend signer's tokens to pay
 * the request in its payment currency. Can be used with a Multisig contract.
 * @param request request to pay
 * @param version version of the batch conversion proxy, which can be different from request pn version
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function approveErc20BatchConversion(
  request: ClientTypes.IRequestData,
  version: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const preparedTx = prepareApproveErc20BatchConversion(
    request,
    version,
    signerOrProvider,
    overrides,
  );
  const signer = getSigner(signerOrProvider);
  const tx = await signer.sendTransaction(preparedTx);
  return tx;
}

/**
 * Prepare the transaction to approve the proxy to spend signer's tokens to pay
 * the request in its payment currency. Can be used with a Multisig contract.
 * @param request request to pay
 * @param version version of the batch conversion proxy, which can be different from request pn version
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
export function prepareApproveErc20BatchConversion(
  request: ClientTypes.IRequestData,
  version: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): IPreparedTransaction {
  const encodedTx = encodeApproveErc20BatchConversion(request, version, signerOrProvider);
  const tokenAddress = request.currencyInfo.value;
  return {
    data: encodedTx,
    to: tokenAddress,
    value: 0,
    ...overrides,
  };
}

/**
 * Encodes the transaction to approve the batch conversion proxy to spend signer's tokens to pay
 * the request in its payment currency. Can be used with a Multisig contract.
 * @param request request to pay
 * @param version version of the batch conversion proxy, which can be different from request pn version
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 */
export function encodeApproveErc20BatchConversion(
  request: ClientTypes.IRequestData,
  version: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
): string {
  const proxyAddress = getBatchConversionProxyAddress(request, version);

  return encodeApproveAnyErc20(
    request.currencyInfo.value,
    proxyAddress,
    getSigner(signerOrProvider),
  );
}
