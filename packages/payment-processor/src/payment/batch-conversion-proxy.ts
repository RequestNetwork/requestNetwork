import { ContractTransaction, Signer, providers, BigNumber, constants } from 'ethers';
import { batchConversionPaymentsArtifact } from '@requestnetwork/smart-contracts';
import { BatchConversionPayments__factory } from '@requestnetwork/smart-contracts/types';
import { ClientTypes, PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';
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
import { IState } from 'types/dist/extension-types';
import { CurrencyDefinition, CurrencyManager, ICurrencyManager } from '@requestnetwork/currency';

const CURRENCY = RequestLogicTypes.CURRENCY;

/**
 * Processes a transaction to pay a batch of requests with an ERC20 currency
 * that can be different from the request currency (eg. fiat)
 * The payment is made through ERC20 or ERC20Conversion proxies
 * It can be used with a Multisig contract
 * @param enrichedRequests List of EnrichedRequests to pay.
 * @param signerOrProvider The Web3 provider, or signer. Defaults to window.ethereum.
 * @param skipFeeUSDLimit Setting the value to true skips the USD fee limit, and reduce gas consumption.
 *                        It can be useful to set it to false if the total amount of the batch is important.
 *                        Check the value of batchFeeAmountUSDLimit of the batch proxy deployed.
 * @param version The version of the batch conversion proxy.
 * @param overrides Optionally, override default transaction values, like gas.
 * @dev We only implement batchPayments using two ERC20 functions:
 *      batchMultiERC20ConversionPayments, and batchMultiERC20Payments.
 */
export async function payBatchConversionProxyRequest(
  enrichedRequests: EnrichedRequest[],
  signerOrProvider: providers.Provider | Signer = getProvider(),
  skipFeeUSDLimit = false,
  version?: string,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const { data, to, value } = prepareBatchConversionPaymentTransaction(
    enrichedRequests,
    skipFeeUSDLimit,
    version,
  );
  const signer = getSigner(signerOrProvider);
  return signer.sendTransaction({ data, to, value, ...overrides });
}

/**
 * Prepares a transaction to pay a batch of requests with an ERC20 currency
 * that can be different from the request currency (eg. fiat).
 * It can be used with a Multisig contract.
 * @param enrichedRequests List of EnrichedRequests to pay.
 * @param skipFeeUSDLimit Setting the value to true skips the USD fee limit, and reduce gas consumption.
 *                        It can be useful to set it to false if the total amount of the batch is important.
 *                        Check the value of batchFeeAmountUSDLimit of the batch proxy deployed.
 * @param version The version of the batch conversion proxy.
 */
export function prepareBatchConversionPaymentTransaction(
  enrichedRequests: EnrichedRequest[],
  skipFeeUSDLimit = false,
  version?: string,
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
 * @param enrichedRequests List of EnrichedRequests to pay.
 * @param skipFeeUSDLimit Setting the value to true skips the USD fee limit, and reduce gas consumption.
 *                        It can be useful to set it to false if the total amount of the batch is important.
 *                        Check the value of batchFeeAmountUSDLimit of the batch proxy deployed.
 */
function encodePayBatchConversionRequest(
  enrichedRequests: EnrichedRequest[],
  skipFeeUSDLimit = false,
): string {
  const { feeAddress } = getRequestPaymentValues(enrichedRequests[0].request);

  const { network } = getPnAndNetwork(enrichedRequests[0].request);
  let firstConversionRequestExtension: IState<any> | undefined;
  let firstNoConversionRequestExtension: IState<any> | undefined;

  const ERC20NoConversionRequestDetails: PaymentTypes.RequestDetail[] = [];
  const ERC20ConversionRequestDetails: PaymentTypes.RequestDetail[] = [];

  // fill ERC20ConversionRequestDetails and ERC20NoConversionRequestDetails lists
  for (const enrichedRequest of enrichedRequests) {
    const request = enrichedRequest.request;
    if (
      enrichedRequest.paymentNetworkId ===
      PaymentTypes.BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_CONVERSION_PAYMENTS
    ) {
      firstConversionRequestExtension =
        firstConversionRequestExtension ?? getPaymentNetworkExtension(request);

      comparePnTypeAndVersion(firstConversionRequestExtension, request);
      if (![CURRENCY.ERC20, CURRENCY.ISO4217].includes(request.currencyInfo.type)) {
        throw new Error(`wrong request currencyInfo type`);
      }
      ERC20ConversionRequestDetails.push(getInputERC20ConversionRequestDetail(enrichedRequest));
    } else if (
      enrichedRequest.paymentNetworkId ===
      PaymentTypes.BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_PAYMENTS
    ) {
      firstNoConversionRequestExtension =
        firstNoConversionRequestExtension ?? getPaymentNetworkExtension(request);

      // isERC20Currency is checked within getBatchArgs function
      comparePnTypeAndVersion(firstNoConversionRequestExtension, request);
      if (!(request.currencyInfo.type === CURRENCY.ERC20)) {
        throw new Error(`wrong request currencyInfo type`);
      }
      ERC20NoConversionRequestDetails.push(getInputERC20NoConversionRequestDetail(request));
    }
    if (network !== getPnAndNetwork(request).network)
      throw new Error('All the requests must have the same network');
  }

  const metaDetails: PaymentTypes.MetaDetail[] = [];
  if (ERC20ConversionRequestDetails.length > 0) {
    // Add ERC20 conversion payments
    metaDetails.push({
      paymentNetworkId: PaymentTypes.BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_CONVERSION_PAYMENTS,
      requestDetails: ERC20ConversionRequestDetails,
    });
  }

  if (ERC20NoConversionRequestDetails.length > 0) {
    // Add multi ERC20 no-conversion payments
    metaDetails.push({
      paymentNetworkId: PaymentTypes.BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_PAYMENTS,
      requestDetails: ERC20NoConversionRequestDetails,
    });
  }

  const currencyManager =
    enrichedRequests[0].paymentSettings.currencyManager ?? CurrencyManager.getDefault();
  const pathsToUSD = getUSDPathsForFeeLimit(
    [...ERC20ConversionRequestDetails, ...ERC20NoConversionRequestDetails],
    network,
    skipFeeUSDLimit,
    currencyManager,
  );

  const proxyContract = BatchConversionPayments__factory.createInterface();
  return proxyContract.encodeFunctionData('batchPayments', [
    metaDetails,
    pathsToUSD,
    feeAddress || constants.AddressZero,
  ]);
}

/**
 * Get the ERC20 no conversion input requestDetail from a request, that can be used by the batch contract.
 * @param request The request to pay.
 */
function getInputERC20NoConversionRequestDetail(
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
function getInputERC20ConversionRequestDetail(
  enrichedRequest: EnrichedRequest,
): PaymentTypes.RequestDetail {
  const { path, requestCurrency } = checkRequestAndGetPathAndCurrency(
    enrichedRequest.request,
    enrichedRequest.paymentSettings,
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
    maxToSpend: enrichedRequest.paymentSettings.maxToSpend.toString(),
    maxRateTimespan: maxRateTimespan || '0',
  };
}

/**
 * Get the list of conversion paths from tokens to the USD address through currencyManager.
 * If there is no path to USD for a token, it goes to the next token.
 * @param requestDetails List of ERC20 requests to pay.
 * @param network The network targeted.
 * @param skipFeeUSDLimit Setting the value to true skips the USD fee limit, it skips the path calculation.
 * @param currencyManager The currencyManager used to get token conversion paths to USD.
 */
function getUSDPathsForFeeLimit(
  requestDetails: PaymentTypes.RequestDetail[],
  network: string,
  skipFeeUSDLimit: boolean,
  currencyManager: ICurrencyManager<unknown>,
): string[][] {
  if (skipFeeUSDLimit) return [];

  const USDCurrency = currencyManager.fromSymbol('USD');
  if (!USDCurrency) throw 'Cannot find the USD currency information';

  // get a list of unique token addresses
  const tokenAddresses = requestDetails
    .map((rd) => rd.path[rd.path.length - 1])
    .filter((value, index, self) => self.indexOf(value) === index);

  // get the token currencies and keep the one that are defined
  const tokenCurrencies: Array<CurrencyDefinition<unknown>> = tokenAddresses
    .map((token) => currencyManager.fromAddress(token, network))
    .filter((value): value is CurrencyDefinition => !!value);

  // get all the conversion paths to USD when it exists and return it
  return tokenCurrencies
    .map((t) => currencyManager.getConversionPath(t, USDCurrency, network))
    .filter((value): value is string[] => !!value);
}

/**
 * @param network The network targeted.
 * @param version The version of the batch conversion proxy., the last one by default.
 * @returns
 */
function getBatchDeploymentInformation(
  network: string,
  version?: string,
): { address: string } | null {
  return { address: batchConversionPaymentsArtifact.getAddress(network, version) };
}

/**
 * Gets batch conversion contract Address.
 * @param request The request for an ERC20 payment with/out conversion..
 * @param version The version of the batch conversion proxy.
 */
export function getBatchConversionProxyAddress(
  request: ClientTypes.IRequestData,
  version?: string,
): string {
  return getProxyAddress(request, getBatchDeploymentInformation, version);
}

/**
 * ERC20 Batch conversion proxy approvals methods
 */

/**
 * Processes the approval transaction of the targeted ERC20 with batch conversion proxy.
 * @param request The request for an ERC20 payment with/out conversion.
 * @param account The account that will be used to pay the request
 * @param signerOrProvider The Web3 provider, or signer. Defaults to window.ethereum.
 * @param paymentSettings The payment settings are necessary for conversion payment approval.
 * @param version The version of the batch conversion proxy., which can be different from request pn version.
 * @param overrides Optionally, override default transaction values, like gas.
 */
export async function approveErc20BatchConversionIfNeeded(
  request: ClientTypes.IRequestData,
  account: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  paymentSettings?: IConversionPaymentSettings,
  version?: string,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction | void> {
  if (
    !(await hasErc20BatchConversionApproval(
      request,
      account,
      signerOrProvider,
      paymentSettings,
      version,
    ))
  ) {
    return approveErc20BatchConversion(
      request,
      getSigner(signerOrProvider),
      paymentSettings,
      version,
      overrides,
    );
  }
}

/**
 * Checks if the batch conversion proxy has the necessary allowance from a given account
 * to pay a given request with ERC20 batch conversion proxy
 * @param request The request for an ERC20 payment with/out conversion.
 * @param account The account that will be used to pay the request
 * @param signerOrProvider The Web3 provider, or signer. Defaults to window.ethereum.
 * @param paymentSettings The payment settings are necessary for conversion payment approval.
 * @param version The version of the batch conversion proxy.
 */
export async function hasErc20BatchConversionApproval(
  request: ClientTypes.IRequestData,
  account: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  paymentSettings?: IConversionPaymentSettings,
  version?: string,
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
 * @param request The request for an ERC20 payment with/out conversion.
 * @param signerOrProvider The Web3 provider, or signer. Defaults to window.ethereum.
 * @param paymentSettings The payment settings are necessary for conversion payment approval.
 * @param version The version of the batch conversion proxy., which can be different from request pn version.
 * @param overrides Optionally, override default transaction values, like gas.
 */
export async function approveErc20BatchConversion(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  paymentSettings?: IConversionPaymentSettings,
  version?: string,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const preparedTx = prepareApproveErc20BatchConversion(
    request,
    signerOrProvider,
    paymentSettings,
    version,
    overrides,
  );
  const signer = getSigner(signerOrProvider);
  const tx = await signer.sendTransaction(preparedTx);
  return tx;
}

/**
 * Prepare the transaction to approve the proxy to spend signer's tokens to pay
 * the request in its payment currency. Can be used with a Multisig contract.
 * @param request The request for an ERC20 payment with/out conversion.
 * @param signerOrProvider The Web3 provider, or signer. Defaults to window.ethereum.
 * @param paymentSettings The payment settings are necessary for conversion payment approval.
 * @param version The version of the batch conversion proxy.
 * @param overrides Optionally, override default transaction values, like gas.
 */
export function prepareApproveErc20BatchConversion(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  paymentSettings?: IConversionPaymentSettings,
  version?: string,
  overrides?: ITransactionOverrides,
): IPreparedTransaction {
  const encodedTx = encodeApproveErc20BatchConversion(
    request,
    signerOrProvider,
    paymentSettings,
    version,
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
 * @param request The request for an ERC20 payment with/out conversion.
 * @param signerOrProvider The Web3 provider, or signer. Defaults to window.ethereum.
 * @param paymentSettings The payment settings are necessary for conversion payment approval.
 * @param version The version of the batch conversion proxy.
 */
export function encodeApproveErc20BatchConversion(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  paymentSettings?: IConversionPaymentSettings,
  version?: string,
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
 * @param request The request for an ERC20 payment with/out conversion.
 * @param paymentSettings The payment settings are necessary for conversion payment
 * */
function getTokenAddress(
  request: ClientTypes.IRequestData,
  paymentSettings?: IConversionPaymentSettings,
): string {
  if (paymentSettings) {
    if (!paymentSettings.currency) throw 'paymentSetting must have a currency';
    return paymentSettings.currency.value;
  }

  return request.currencyInfo.value;
}
