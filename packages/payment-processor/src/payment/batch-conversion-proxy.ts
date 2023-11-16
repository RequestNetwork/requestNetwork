import { ContractTransaction, Signer, providers, BigNumber, constants } from 'ethers';
import { batchConversionPaymentsArtifact } from '@requestnetwork/smart-contracts';
import { BatchConversionPayments__factory } from '@requestnetwork/smart-contracts/types';
import {
  ClientTypes,
  CurrencyTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { ITransactionOverrides } from './transaction-overrides';
import {
  comparePnTypeAndVersion,
  getAmountToPay,
  getPnAndNetwork,
  getProvider,
  getProxyAddress,
  getRequestPaymentValues,
  getSigner,
  MAX_ALLOWANCE,
  validateConversionFeeProxyRequest,
  validateErc20FeeProxyRequest,
} from './utils';
import {
  padAmountForChainlink,
  getPaymentNetworkExtension,
} from '@requestnetwork/payment-detection';
import { IPreparedTransaction } from './prepared-transaction';
import { IConversionPaymentSettings } from './index';
import { getConversionPathForErc20Request } from './any-to-erc20-proxy';
import { checkErc20Allowance, encodeApproveAnyErc20 } from './erc20';
import { IState } from 'types/dist/extension-types';
import { CurrencyManager } from '@requestnetwork/currency';
import {
  BatchPaymentNetworks,
  EnrichedRequest,
  IConversionSettings,
  IRequestPaymentOptions,
} from '../types';
import { validateEthFeeProxyRequest } from './eth-fee-proxy';
import { getConversionPathForEthRequest } from './any-to-eth-proxy';

const CURRENCY = RequestLogicTypes.CURRENCY;

/**
 * Processes a transaction to pay a batch of requests with an ERC20 currency
 * that can be different from the request currency (eg. fiat)
 * The payment is made through ERC20 or ERC20Conversion proxies
 * It can be used with a Multisig contract
 * @param enrichedRequests List of EnrichedRequests to pay.
 * @param signerOrProvider The Web3 provider, or signer. Defaults to window.ethereum.
 * @param options It contains 3 paramaters required to do a batch payments:
 *  - conversion: It must contains the currencyManager.
 *  - skipFeeUSDLimit: It checks the value of batchFeeAmountUSDLimit of the batch proxy deployed.
 * Setting the value to true skips the USD fee limit, and reduces gas consumption.
 *  - version: The version of the batch conversion proxy.
 * @param overrides Optionally, override default transaction values, like gas.
 * @dev We only implement batchPayments using two ERC20 functions:
 *      batchMultiERC20ConversionPayments, and batchMultiERC20Payments.
 */
export async function payBatchConversionProxyRequest(
  enrichedRequests: EnrichedRequest[],
  signerOrProvider: providers.Provider | Signer = getProvider(),
  options: IRequestPaymentOptions,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const { data, to, value } = prepareBatchConversionPaymentTransaction(enrichedRequests, options);
  const signer = getSigner(signerOrProvider);
  return signer.sendTransaction({ data, to, value, ...overrides });
}

/**
 * Prepares a transaction to pay a batch of requests with an ERC20 currency
 * that can be different from the request currency (eg. fiat).
 * It can be used with a Multisig contract.
 * @param enrichedRequests List of EnrichedRequests to pay.
 * @param options It contains 3 paramaters required to prepare a batch payments:
 *  - conversion: It must contains the currencyManager.
 *  - skipFeeUSDLimit: It checks the value of batchFeeAmountUSDLimit of the batch proxy deployed.
 * Setting the value to true skips the USD fee limit, and reduces gas consumption.
 *  - version: The version of the batch conversion proxy.
 */
export function prepareBatchConversionPaymentTransaction(
  enrichedRequests: EnrichedRequest[],
  options: IRequestPaymentOptions,
): IPreparedTransaction {
  const encodedTx = encodePayBatchConversionRequest(
    enrichedRequests,
    options.skipFeeUSDLimit,
    options.conversion,
  );
  const value = getBatchTxValue(enrichedRequests);
  const proxyAddress = getBatchConversionProxyAddress(enrichedRequests[0].request, options.version);
  return {
    data: encodedTx,
    to: proxyAddress,
    value,
  };
}

const mapPnToDetailsBuilder: Record<
  BatchPaymentNetworks,
  (req: EnrichedRequest, isNative: boolean) => PaymentTypes.RequestDetail
> = {
  'pn-any-to-erc20-proxy': getRequestDetailWithConversion,
  'pn-any-to-eth-proxy': getRequestDetailWithConversion,
  'pn-erc20-fee-proxy-contract': getRequestDetailWithoutConversion,
  'pn-eth-fee-proxy-contract': getRequestDetailWithoutConversion,
};

const mapPnToAllowedCurrencies: Record<BatchPaymentNetworks, RequestLogicTypes.CURRENCY[]> = {
  'pn-any-to-erc20-proxy': [CURRENCY.ERC20, CURRENCY.ISO4217, CURRENCY.ETH],
  'pn-any-to-eth-proxy': [CURRENCY.ERC20, CURRENCY.ISO4217],
  'pn-erc20-fee-proxy-contract': [CURRENCY.ERC20],
  'pn-eth-fee-proxy-contract': [CURRENCY.ETH],
};

const mapPnToBatchId: Record<BatchPaymentNetworks, PaymentTypes.BATCH_PAYMENT_NETWORK_ID> = {
  'pn-any-to-erc20-proxy':
    PaymentTypes.BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_CONVERSION_PAYMENTS,
  'pn-any-to-eth-proxy': PaymentTypes.BATCH_PAYMENT_NETWORK_ID.BATCH_ETH_CONVERSION_PAYMENTS,
  'pn-erc20-fee-proxy-contract': PaymentTypes.BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_PAYMENTS,
  'pn-eth-fee-proxy-contract': PaymentTypes.BATCH_PAYMENT_NETWORK_ID.BATCH_ETH_PAYMENTS,
};

const computeRequestDetails = ({
  enrichedRequest,
  extension,
}: {
  enrichedRequest: EnrichedRequest;
  extension: IState<any> | undefined;
}) => {
  const paymentNetworkId = enrichedRequest.paymentNetworkId;
  const allowedCurrencies = mapPnToAllowedCurrencies[paymentNetworkId];
  const detailsBuilder = mapPnToDetailsBuilder[paymentNetworkId];
  const isNative =
    paymentNetworkId === ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ETH_PROXY ||
    paymentNetworkId === ExtensionTypes.PAYMENT_NETWORK_ID.ETH_FEE_PROXY_CONTRACT;

  extension = extension ?? getPaymentNetworkExtension(enrichedRequest.request);

  comparePnTypeAndVersion(extension, enrichedRequest.request);
  if (!allowedCurrencies.includes(enrichedRequest.request.currencyInfo.type)) {
    throw new Error(`wrong request currencyInfo type`);
  }

  return {
    input: detailsBuilder(enrichedRequest, isNative),
    extension,
  };
};

/**
 * Encodes a transaction to pay a batch of requests with an ERC20 currency
 * that can be different from the request currency (eg. fiat).
 * It can be used with a Multisig contract.
 * @param enrichedRequests List of EnrichedRequests to pay.
 * @param skipFeeUSDLimit It checks the value of batchFeeAmountUSDLimit of the batch proxy deployed.
 * Setting the value to true skips the USD fee limit, and reduces gas consumption.
 */
function encodePayBatchConversionRequest(
  enrichedRequests: EnrichedRequest[],
  skipFeeUSDLimit = false,
  conversion: IConversionSettings | undefined,
): string {
  if (!(conversion && conversion.currencyManager)) {
    throw 'the conversion object or the currencyManager is undefined';
  }
  const { feeAddress } = getRequestPaymentValues(enrichedRequests[0].request);

  const { network } = getPnAndNetwork(enrichedRequests[0].request);

  const requestDetails: Record<BatchPaymentNetworks, PaymentTypes.RequestDetail[]> = {
    'pn-any-to-erc20-proxy': [],
    'pn-any-to-eth-proxy': [],
    'pn-erc20-fee-proxy-contract': [],
    'pn-eth-fee-proxy-contract': [],
  };

  const requestExtensions: Record<BatchPaymentNetworks, IState<any> | undefined> = {
    'pn-any-to-erc20-proxy': undefined,
    'pn-any-to-eth-proxy': undefined,
    'pn-erc20-fee-proxy-contract': undefined,
    'pn-eth-fee-proxy-contract': undefined,
  };

  for (const enrichedRequest of enrichedRequests) {
    const request = enrichedRequest.request;
    const { input, extension } = computeRequestDetails({
      enrichedRequest,
      extension: requestExtensions[enrichedRequest.paymentNetworkId],
    });
    requestDetails[enrichedRequest.paymentNetworkId].push(input);
    requestExtensions[enrichedRequest.paymentNetworkId] = extension;

    if (network !== getPnAndNetwork(request).network)
      throw new Error('All the requests must have the same network');
  }

  /**
   * The native with conversion payment inputs must be the last element.
   * See BatchConversionPayment batchPayments method in @requestnetwork/smart-contracts
   */
  const metaDetails = Object.entries(requestDetails)
    .map(([pn, details]) => ({
      paymentNetworkId: mapPnToBatchId[pn as BatchPaymentNetworks],
      requestDetails: details,
    }))
    .filter((details) => details.requestDetails.length > 0)
    .sort((a, b) => a.paymentNetworkId - b.paymentNetworkId);

  const hasNativePayment =
    requestDetails['pn-any-to-eth-proxy'].length > 0 ||
    requestDetails['pn-eth-fee-proxy-contract'].length > 0;

  const pathsToUSD = getUSDPathsForFeeLimit(
    [...metaDetails.map((details) => details.requestDetails).flat()],
    network,
    skipFeeUSDLimit,
    conversion.currencyManager,
    hasNativePayment,
  );

  const proxyContract = BatchConversionPayments__factory.createInterface();
  return proxyContract.encodeFunctionData('batchPayments', [
    metaDetails,
    pathsToUSD,
    feeAddress || constants.AddressZero,
  ]);
}

/**
 * Get the batch input associated to a request without conversion.
 * @param enrichedRequest The enrichedRequest to pay.
 */
function getRequestDetailWithoutConversion(
  enrichedRequest: EnrichedRequest,
  isNative: boolean,
): PaymentTypes.RequestDetail {
  const request = enrichedRequest.request;
  isNative ? validateEthFeeProxyRequest(request) : validateErc20FeeProxyRequest(request);

  const currencyManager =
    enrichedRequest.paymentSettings?.currencyManager || CurrencyManager.getDefault();
  const tokenAddress = isNative
    ? currencyManager.getNativeCurrency(
        RequestLogicTypes.CURRENCY.ETH,
        request.currencyInfo.network as string,
      )?.hash
    : request.currencyInfo.value;
  if (!tokenAddress) {
    throw new Error('Could not find the request currency');
  }
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
 * Get the batch input associated to a request with conversion.
 * @param enrichedRequest The enrichedRequest to pay.
 */
function getRequestDetailWithConversion(
  enrichedRequest: EnrichedRequest,
  isNative: boolean,
): PaymentTypes.RequestDetail {
  const { request, paymentSettings } = enrichedRequest;
  const { path, requestCurrency } = (
    isNative ? getConversionPathForEthRequest : getConversionPathForErc20Request
  )(request, paymentSettings);

  isNative
    ? validateEthFeeProxyRequest(
        request,
        undefined,
        undefined,
        ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ETH_PROXY,
      )
    : validateConversionFeeProxyRequest(request, path);

  const { paymentReference, paymentAddress, feeAmount, maxRateTimespan } =
    getRequestPaymentValues(request);

  const requestAmount = BigNumber.from(request.expectedAmount).sub(request.balance?.balance || 0);

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

const getBatchTxValue = (enrichedRequests: EnrichedRequest[]) => {
  return enrichedRequests.reduce((prev, curr) => {
    if (
      curr.paymentNetworkId !== ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ETH_PROXY &&
      curr.paymentNetworkId !== ExtensionTypes.PAYMENT_NETWORK_ID.ETH_FEE_PROXY_CONTRACT
    )
      return prev;
    return prev.add(
      curr.paymentNetworkId === ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ETH_PROXY
        ? curr.paymentSettings.maxToSpend
        : getAmountToPay(curr.request),
    );
  }, BigNumber.from(0));
};

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
  currencyManager: CurrencyTypes.ICurrencyManager<unknown>,
  hasNativePayment: boolean,
): string[][] {
  if (skipFeeUSDLimit) return [];

  const USDCurrency = currencyManager.fromSymbol('USD');
  if (!USDCurrency) throw 'Cannot find the USD currency information';

  // Native to USD conversion path
  let nativeConversionPath: string[] = [];
  if (hasNativePayment) {
    const nativeCurrencyHash = currencyManager.getNativeCurrency(
      RequestLogicTypes.CURRENCY.ETH,
      network,
    )?.hash;
    if (!nativeCurrencyHash) throw 'Cannot find the Native currency information';
    nativeConversionPath =
      currencyManager.getConversionPath({ hash: nativeCurrencyHash }, USDCurrency, network) || [];
  }

  // get a list of unique token addresses
  const tokenAddresses = requestDetails
    .map((rd) => rd.path[rd.path.length - 1])
    .filter((value, index, self) => self.indexOf(value) === index);

  // get the token currencies and keep the one that are defined
  const tokenCurrencies: Array<CurrencyTypes.CurrencyDefinition<unknown>> = tokenAddresses
    .map((token) => currencyManager.fromAddress(token, network))
    .filter((value): value is CurrencyTypes.CurrencyDefinition => !!value);

  // get all the conversion paths to USD when it exists and return it
  const path = tokenCurrencies
    .map((t) => currencyManager.getConversionPath(t, USDCurrency, network))
    .filter((value): value is string[] => !!value);
  return hasNativePayment ? path.concat([nativeConversionPath]) : path;
}

/**
 * @param network The network targeted.
 * @param version The version of the batch conversion proxy, the last one by default.
 * @returns
 */
function getBatchDeploymentInformation(
  network: CurrencyTypes.EvmChainName,
  version?: string,
): { address: string } | null {
  return { address: batchConversionPaymentsArtifact.getAddress(network, version) };
}

/**
 * Gets batch conversion contract Address.
 * @param request The request for an ERC20 payment with/out conversion.
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
 * @param version The version of the batch conversion proxy, which can be different from request pn version.
 * @param overrides Optionally, override default transaction values, like gas.
 */
export async function approveErc20BatchConversionIfNeeded(
  request: ClientTypes.IRequestData,
  account: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  amount: BigNumber = MAX_ALLOWANCE,
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
      amount,
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
 * @param version The version of the batch conversion proxy, which can be different from request pn version.
 * @param overrides Optionally, override default transaction values, like gas.
 */
export async function approveErc20BatchConversion(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  amount: BigNumber = MAX_ALLOWANCE,
  paymentSettings?: IConversionPaymentSettings,
  version?: string,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const preparedTx = prepareApproveErc20BatchConversion(
    request,
    signerOrProvider,
    amount,
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
  amount: BigNumber = MAX_ALLOWANCE,
  paymentSettings?: IConversionPaymentSettings,
  version?: string,
  overrides?: ITransactionOverrides,
): IPreparedTransaction {
  const encodedTx = encodeApproveErc20BatchConversion(
    request,
    signerOrProvider,
    amount,
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
  amount: BigNumber = MAX_ALLOWANCE,
  paymentSettings?: IConversionPaymentSettings,
  version?: string,
): string {
  const proxyAddress = getBatchConversionProxyAddress(request, version);
  return encodeApproveAnyErc20(
    getTokenAddress(request, paymentSettings),
    proxyAddress,
    getSigner(signerOrProvider),
    amount,
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
