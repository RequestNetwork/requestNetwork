import { ContractTransaction, Signer, providers, BigNumber, constants } from 'ethers';
import { batchConversionPaymentsArtifact } from '@requestnetwork/smart-contracts';
import { BatchConversionPayments__factory } from '@requestnetwork/smart-contracts/types';
import { ClientTypes, PaymentTypes } from '@requestnetwork/types';
import { ITransactionOverrides } from './transaction-overrides';
import {
  comparePnTypeAndVersion,
  getAmountToPay,
  getPnAndNetwork,
  getProvider,
  getProxyAddress,
  getRequestPaymentValues,
  getSigner,
  validateErc20FeeProxyRequest,
} from './utils';
import {
  padAmountForChainlink,
  getPaymentNetworkExtension,
} from '@requestnetwork/payment-detection';
import { IPreparedTransaction } from './prepared-transaction';
import { EnrichedRequest, IConversionPaymentSettings } from './index';
import { checkRequestAndGetPathAndCurrency } from './any-to-erc20-proxy';
import { checkErc20Allowance, encodeApproveAnyErc20 } from './erc20';
import { BATCH_PAYMENT_NETWORK_ID, RequestDetail } from '@requestnetwork/types/dist/payment-types';
import { IState } from 'types/dist/extension-types';
import {
  CurrencyInput,
  isERC20Currency,
  isISO4217Currency,
  CurrencyManager,
} from '@requestnetwork/currency';

const currencyManager = CurrencyManager.getDefault();

/**
 * Processes a transaction to pay a batch of requests with an ERC20 currency
 * that is different from the request currency (eg. fiat)
 * The payment is made through ERC20 or ERC20Conversion proxies
 * It can be used with a Multisig contract
 * @param enrichedRequests List of EnrichedRequests to pay
 * @param version The version of the batch conversion proxy
 * @param signerOrProvider The Web3 provider, or signer. Defaults to window.ethereum.
 * @param skipFeeUSDLimit Setting the value to true skips the USD fee limit, and reduce gas consumption.
 *                        It can be useful to set it to false if the total amount of the batch is important.
 *                        Check the value of batchFeeAmountUSDLimit of the batch proxy deployed.
 * @param overrides Optionally, override default transaction values, like gas.
 * @dev We only implement batchPayments using two ERC20 functions:
 *      batchMultiERC20ConversionPayments, and batchMultiERC20Payments.
 */
export async function payBatchConversionProxyRequest(
  enrichedRequests: EnrichedRequest[],
  version: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  skipFeeUSDLimit = true,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const { data, to, value } = prepareBatchConversionPaymentTransaction(
    enrichedRequests,
    version,
    skipFeeUSDLimit,
  );
  const signer = getSigner(signerOrProvider);
  return signer.sendTransaction({ data, to, value, ...overrides });
}

/**
 * Prepares a transaction to pay a batch of requests with an ERC20 currency
 * that can be different from the request currency (eg. fiat).
 * It can be used with a Multisig contract.
 * @param enrichedRequests List of EnrichedRequests to pay
 * @param version The version of the batch conversion proxy
 * @param skipFeeUSDLimit Setting the value to true skips the USD fee limit, and reduce gas consumption.
 *                        It can be useful to set it to false if the total amount of the batch is important.
 *                        Check the value of batchFeeAmountUSDLimit of the batch proxy deployed.
 */
export function prepareBatchConversionPaymentTransaction(
  enrichedRequests: EnrichedRequest[],
  version: string,
  skipFeeUSDLimit = true,
): IPreparedTransaction {
  const encodedTx = encodePayBatchConversionRequest(enrichedRequests, skipFeeUSDLimit);
  const proxyAddress = getBatchConversionProxyAddress(enrichedRequests[0].request, version);
  return {
    data: encodedTx,
    to: proxyAddress,
    value: 0,
  };
}

/**
 * Encodes a transaction to pay a batch of requests with an ERC20 currency
 * that can be different from the request currency (eg. fiat).
 * It can be used with a Multisig contract.
 * @param enrichedRequests List of EnrichedRequests to pay
 * @param skipFeeUSDLimit Setting the value to true skips the USD fee limit, and reduce gas consumption.
 *                        It can be useful to set it to false if the total amount of the batch is important.
 *                        Check the value of batchFeeAmountUSDLimit of the batch proxy deployed.
 */
export function encodePayBatchConversionRequest(
  enrichedRequests: EnrichedRequest[],
  skipFeeUSDLimit = true,
): string {
  const { feeAddress } = getRequestPaymentValues(enrichedRequests[0].request);

  const firstNetwork = getPnAndNetwork(enrichedRequests[0].request)[1];
  let firstConversionRequestExtension: IState<any> | undefined;
  let firstNoConversionRequestExtension: IState<any> | undefined;
  const requestDetailsERC20NoConversion: PaymentTypes.RequestDetail[] = [];
  const requestDetailsERC20Conversion: PaymentTypes.RequestDetail[] = [];

  // fill requestDetailsERC20Conversion and requestDetailsERC20NoConversion lists
  for (const enrichedRequest of enrichedRequests) {
    if (
      enrichedRequest.paymentNetworkId ===
      BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_CONVERSION_PAYMENTS
    ) {
      firstConversionRequestExtension =
        firstConversionRequestExtension ?? getPaymentNetworkExtension(enrichedRequest.request);

      comparePnTypeAndVersion(firstConversionRequestExtension, enrichedRequest.request);
      if (
        !(
          isERC20Currency(enrichedRequest.request.currencyInfo as unknown as CurrencyInput) ||
          isISO4217Currency(enrichedRequest.request.currencyInfo as unknown as CurrencyInput)
        )
      ) {
        throw new Error(`wrong request currencyInfo type`);
      }
      requestDetailsERC20Conversion.push(getInputRequestDetailERC20Conversion(enrichedRequest));
    } else if (
      enrichedRequest.paymentNetworkId === BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_PAYMENTS
    ) {
      firstNoConversionRequestExtension =
        firstNoConversionRequestExtension ?? getPaymentNetworkExtension(enrichedRequest.request);

      // isERC20Currency is checked within getBatchArgs function
      comparePnTypeAndVersion(firstNoConversionRequestExtension, enrichedRequest.request);
      requestDetailsERC20NoConversion.push(
        getInputRequestDetailERC20NoConversion(enrichedRequest.request),
      );
    }
    if (firstNetwork !== getPnAndNetwork(enrichedRequest.request)[1])
      throw new Error('All the requests must have the same network');
  }

  const metaDetails: PaymentTypes.MetaDetail[] = [];
  // Add requestDetailsERC20Conversion to metaDetails
  if (requestDetailsERC20Conversion.length > 0) {
    metaDetails.push({
      paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_CONVERSION_PAYMENTS,
      requestDetails: requestDetailsERC20Conversion,
    });
  }

  // Add cryptoDetails to metaDetails
  if (requestDetailsERC20NoConversion.length > 0) {
    // add ERC20 no-conversion payments
    metaDetails.push({
      paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_PAYMENTS,
      requestDetails: requestDetailsERC20NoConversion,
    });
  }

  const pathsToUSD = getPathsToUSD(
    [...requestDetailsERC20Conversion, ...requestDetailsERC20NoConversion],
    firstNetwork,
    skipFeeUSDLimit,
  );

  const proxyContract = BatchConversionPayments__factory.createInterface();
  return proxyContract.encodeFunctionData('batchPayments', [
    metaDetails,
    skipFeeUSDLimit ? [] : pathsToUSD,
    feeAddress || constants.AddressZero,
  ]);
}

/**
 * Get the ERC20 no conversion input requestDetail from a request, that can be used by the batch contract.
 * @param request The request to pay.
 */
function getInputRequestDetailERC20NoConversion(
  request: ClientTypes.IRequestData,
): PaymentTypes.RequestDetail {
  validateErc20FeeProxyRequest(request);

  const tokenAddress = request.currencyInfo.value;
  const { paymentReference, paymentAddress, feeAmount } = getRequestPaymentValues(request);

  return {
    recipient: paymentAddress,
    requestAmount: getAmountToPay(request).toString(),
    path: [tokenAddress],
    paymentReference: `0x${paymentReference}`,
    feeAmount: feeAmount?.toString() || '0',
    maxToSpend: '0',
    maxRateTimespan: '0',
  };
}

/**
 * Get the ERC20 conversion input requestDetail from an enriched request, that can be used by the batch contract.
 * @param enrichedRequest The enrichedRequest to pay.
 */
function getInputRequestDetailERC20Conversion(
  enrichedRequest: EnrichedRequest,
): PaymentTypes.RequestDetail {
  const paymentSettings = enrichedRequest.paymentSettings;
  if (!paymentSettings) throw Error('the enrichedRequest has no paymentSettings');

  const { path, requestCurrency } = checkRequestAndGetPathAndCurrency(
    enrichedRequest.request,
    paymentSettings,
  );

  const { paymentReference, paymentAddress, feeAmount, maxRateTimespan } = getRequestPaymentValues(
    enrichedRequest.request,
  );

  const requestAmount = BigNumber.from(enrichedRequest.request.expectedAmount).sub(
    enrichedRequest.request.balance?.balance || 0,
  );

  const padRequestAmount = padAmountForChainlink(requestAmount, requestCurrency);
  const padFeeAmount = padAmountForChainlink(feeAmount || 0, requestCurrency);
  return {
    recipient: paymentAddress,
    requestAmount: padRequestAmount.toString(),
    path: path,
    paymentReference: `0x${paymentReference}`,
    feeAmount: padFeeAmount.toString(),
    maxToSpend: paymentSettings.maxToSpend.toString(),
    maxRateTimespan: maxRateTimespan || '0',
  };
}

/**
 * Get the list of conversion paths from tokens to the USD address through currencyManager.
 * @param requestDetails List of ERC20 requests to pay.
 * @param network The network targeted.
 * @param skipFeeUSDLimit Setting the value to true skips the USD fee limit, and reduce gas consumption.
 *                        It can be useful to set it to false if the total amount of the batch is important.
 *                        Check the value of batchFeeAmountUSDLimit of the batch proxy deployed.
 */
function getPathsToUSD(
  requestDetails: RequestDetail[],
  network: string,
  skipFeeUSDLimit: boolean,
): string[][] {
  const pathsToUSD: Array<string>[] = [];
  if (!skipFeeUSDLimit) {
    const USDCurrency = currencyManager.fromSymbol('USD');
    // token's addresses paid with the batch
    const tokenAddresses: Array<string> = [];
    for (const requestDetail of requestDetails) {
      const tokenAddress = requestDetail.path[requestDetail.path.length - 1];
      // Check token to only unique paths token to USD.
      if (!tokenAddresses.includes(tokenAddress)) {
        tokenAddresses.push(tokenAddress);
        const tokenCurrency = currencyManager.fromAddress(tokenAddress);
        const pathToUSD = currencyManager.getConversionPath(tokenCurrency!, USDCurrency!, network);
        if (pathToUSD) {
          pathsToUSD.push(pathToUSD);
        }
      }
    }
  }
  return pathsToUSD;
}

/**
 * @param network The network targeted
 * @param version The version of the batch conversion proxy
 * @returns
 */
function getBatchDeploymentInformation(
  network: string,
  version: string,
): { address: string } | null {
  return { address: batchConversionPaymentsArtifact.getAddress(network, version) };
}

/**
 * Gets batch conversion contract Address
 * @param request The request for an ERC20 payment with/out conversion
 * @param version The version of the batch conversion proxy
 */
export function getBatchConversionProxyAddress(
  request: ClientTypes.IRequestData,
  version: string,
): string {
  return getProxyAddress(request, getBatchDeploymentInformation, version);
}

/**
 * ERC20 Batch conversion proxy approvals methods
 */

/**
 * Processes the approval transaction of the targeted ERC20 with batch conversion proxy.
 * @param request The request for an ERC20 payment with/out conversion
 * @param account The account that will be used to pay the request
 * @param version The version of the batch conversion proxy, which can be different from request pn version
 * @param signerOrProvider The Web3 provider, or signer. Defaults to window.ethereum.
 * @param paymentSettings The payment settings are necessary for conversion payment approval
 * @param overrides Optionally, override default transaction values, like gas.
 */
export async function approveErc20BatchConversionIfNeeded(
  request: ClientTypes.IRequestData,
  account: string,
  version: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  paymentSettings?: IConversionPaymentSettings,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction | void> {
  if (
    !(await hasErc20BatchConversionApproval(
      request,
      account,
      version,
      signerOrProvider,
      paymentSettings,
    ))
  ) {
    return approveErc20BatchConversion(
      request,
      version,
      getSigner(signerOrProvider),
      paymentSettings,
      overrides,
    );
  }
}

/**
 * Checks if the batch conversion proxy has the necessary allowance from a given account
 * to pay a given request with ERC20 batch conversion proxy
 * @param request The request for an ERC20 payment with/out conversion
 * @param account The account that will be used to pay the request
 * @param version The version of the batch conversion proxy
 * @param signerOrProvider The Web3 provider, or signer. Defaults to window.ethereum.
 * @param paymentSettings The payment settings are necessary for conversion payment approval
 */
export async function hasErc20BatchConversionApproval(
  request: ClientTypes.IRequestData,
  account: string,
  version: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  paymentSettings?: IConversionPaymentSettings,
): Promise<boolean> {
  return checkErc20Allowance(
    account,
    getBatchConversionProxyAddress(request, version),
    signerOrProvider,
    getTokenAddress(request, paymentSettings),
    request.expectedAmount,
  );
}

/**
 * Processes the transaction to approve the batch conversion proxy to spend signer's tokens to pay
 * the request in its payment currency. Can be used with a Multisig contract.
 * @param request The request for an ERC20 payment with/out conversion
 * @param version The version of the batch conversion proxy, which can be different from request pn version
 * @param signerOrProvider The Web3 provider, or signer. Defaults to window.ethereum.
 * @param paymentSettings The payment settings are necessary for conversion payment approval
 * @param overrides Optionally, override default transaction values, like gas.
 */
export async function approveErc20BatchConversion(
  request: ClientTypes.IRequestData,
  version: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  paymentSettings?: IConversionPaymentSettings,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const preparedTx = prepareApproveErc20BatchConversion(
    request,
    version,
    signerOrProvider,
    paymentSettings,
    overrides,
  );
  const signer = getSigner(signerOrProvider);
  const tx = await signer.sendTransaction(preparedTx);
  return tx;
}

/**
 * Prepare the transaction to approve the proxy to spend signer's tokens to pay
 * the request in its payment currency. Can be used with a Multisig contract.
 * @param request The request for an ERC20 payment with/out conversion
 * @param version The version of the batch conversion proxy
 * @param signerOrProvider The Web3 provider, or signer. Defaults to window.ethereum.
 * @param paymentSettings The payment settings are necessary for conversion payment approval
 * @param overrides Optionally, override default transaction values, like gas.
 */
export function prepareApproveErc20BatchConversion(
  request: ClientTypes.IRequestData,
  version: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  paymentSettings?: IConversionPaymentSettings,
  overrides?: ITransactionOverrides,
): IPreparedTransaction {
  const encodedTx = encodeApproveErc20BatchConversion(
    request,
    version,
    signerOrProvider,
    paymentSettings,
  );
  return {
    data: encodedTx,
    to: getTokenAddress(request, paymentSettings),
    value: 0,
    ...overrides,
  };
}

/**
 * Encodes the transaction to approve the batch conversion proxy to spend signer's tokens to pay
 * the request in its payment currency. Can be used with a Multisig contract.
 * @param request The request for an ERC20 payment with/out conversion
 * @param version The version of the batch conversion proxy
 * @param signerOrProvider The Web3 provider, or signer. Defaults to window.ethereum.
 * @param paymentSettings The payment settings are necessary for conversion payment approval
 */
export function encodeApproveErc20BatchConversion(
  request: ClientTypes.IRequestData,
  version: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  paymentSettings?: IConversionPaymentSettings,
): string {
  const proxyAddress = getBatchConversionProxyAddress(request, version);
  return encodeApproveAnyErc20(
    getTokenAddress(request, paymentSettings),
    proxyAddress,
    getSigner(signerOrProvider),
  );
}

/**
 * Get the address of the token to interact with,
 * if it is a conversion payment, the info is inside paymentSettings
 * @param request The request for an ERC20 payment with/out conversion
 * @param paymentSettings The payment settings are necessary for conversion payment
 * */
function getTokenAddress(
  request: ClientTypes.IRequestData,
  paymentSettings?: IConversionPaymentSettings,
): string {
  return paymentSettings ? paymentSettings.currency!.value : request.currencyInfo.value;
}
