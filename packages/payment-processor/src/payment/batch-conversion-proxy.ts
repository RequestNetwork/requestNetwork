import { ContractTransaction, Signer, providers, BigNumber, constants } from 'ethers';
import { batchConversionPaymentsArtifact } from '@requestnetwork/smart-contracts';
import { BatchConversionPayments__factory } from '@requestnetwork/smart-contracts/types';
import { ClientTypes, PaymentTypes } from '@requestnetwork/types';
import { ITransactionOverrides } from './transaction-overrides';
import {
  comparePnTypeAndVersion,
  getProvider,
  getProxyAddress,
  getRequestPaymentValues,
  getSigner,
} from './utils';
import {
  padAmountForChainlink,
  getPaymentNetworkExtension,
} from '@requestnetwork/payment-detection';
import { IPreparedTransaction } from './prepared-transaction';
import { EnrichedRequest, IConversionPaymentSettings } from './index';
import { checkRequestAndGetPathAndCurrency } from './any-to-erc20-proxy';
import { getBatchArgs } from './batch-proxy';
import { checkErc20Allowance, encodeApproveAnyErc20 } from './erc20';
import { BATCH_PAYMENT_NETWORK_ID } from '@requestnetwork/types/dist/payment-types';
import { IState } from 'types/dist/extension-types';
import { CurrencyInput, isERC20Currency, isISO4217Currency } from '@requestnetwork/currency/dist';

/**
 * Processes a transaction to pay a batch of requests with an ERC20 currency
 * that is different from the request currency (eg. fiat)
 * The payment is made through ERC20 or ERC20Conversion proxies
 * It can be used with a Multisig contract
 * @param enrichedRequests List of EnrichedRequest to pay
 * @param version Version of the batch conversion proxy
 * @param signerOrProvider The Web3 provider, or signer. Defaults to window.ethereum.
 * @param overrides Optionally, override default transaction values, like gas.
 * @dev We only implement batchRouter using two ERC20 functions:
 *      batchMultiERC20ConversionPayments, and batchMultiERC20Payments.
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
 * Prepares a transaction to pay a batch of requests with an ERC20 currency
 * that is different from the request currency (eg. fiat)
 * it can be used with a Multisig contract.
 * @param enrichedRequests List of EnrichedRequest to pay
 * @param version Version of the batch conversion proxy
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
 * Encodes a transaction to pay a batch of requests with an ERC20 currency
 * that is different from the request currency (eg. fiat)
 * It can be used with a Multisig contract.
 * @param enrichedRequests list of ECR20 requests to pay
 */
export function encodePayBatchConversionRequest(enrichedRequests: EnrichedRequest[]): string {
  const { feeAddress } = getRequestPaymentValues(enrichedRequests[0].request);

  let firstConversionRequestExtension: IState<any> | undefined;
  const requestsWithoutConversion: ClientTypes.IRequestData[] = [];
  const conversionDetails: PaymentTypes.ConversionDetail[] = [];

  // fill conversionDetails and requestsWithoutConversion lists
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
      )
        throw new Error(`wrong request currencyInfo type`);
      conversionDetails.push(getInputConversionDetail(enrichedRequest));
    } else if (
      enrichedRequest.paymentNetworkId === BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_PAYMENTS
    ) {
      requestsWithoutConversion.push(enrichedRequest.request);
      comparePnTypeAndVersion(
        getPaymentNetworkExtension(requestsWithoutConversion[0]),
        enrichedRequest.request,
      );
    }
  }

  const metaDetails: PaymentTypes.MetaDetail[] = [];
  // Add conversionDetails to metaDetails
  if (conversionDetails.length > 0) {
    metaDetails.push({
      paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_CONVERSION_PAYMENTS,
      conversionDetails: conversionDetails,
      cryptoDetails: {
        tokenAddresses: [],
        recipients: [],
        amounts: [],
        paymentReferences: [],
        feeAmounts: [],
      }, // cryptoDetails is not used with paymentNetworkId 0
    });
  }

  // Get values and add cryptoDetails to metaDetails
  if (requestsWithoutConversion.length > 0) {
    const { tokenAddresses, paymentAddresses, amountsToPay, paymentReferences, feesToPay } =
      getBatchArgs(requestsWithoutConversion, 'ERC20');

    // add ERC20 no-conversion payments
    metaDetails.push({
      paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_PAYMENTS,
      conversionDetails: [],
      cryptoDetails: {
        tokenAddresses: tokenAddresses,
        recipients: paymentAddresses,
        amounts: amountsToPay.map((x) => x.toString()),
        paymentReferences: paymentReferences,
        feeAmounts: feesToPay.map((x) => x.toString()),
      },
    });
  }

  const proxyContract = BatchConversionPayments__factory.createInterface();
  return proxyContract.encodeFunctionData('batchRouter', [
    metaDetails,
    feeAddress || constants.AddressZero,
  ]);
}

/**
 * Get the conversion detail values from one enriched request
 * @param enrichedRequest enrichedRequest to pay
 */
function getInputConversionDetail(enrichedRequest: EnrichedRequest): PaymentTypes.ConversionDetail {
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

function getBatchDeploymentInformation(
  network: string,
  version: string,
): { address: string } | null {
  return { address: batchConversionPaymentsArtifact.getAddress(network, version) };
}

/**
 * Gets batch conversion contract Address
 * @param request request for an ERC20 payment with/out conversion
 * @param version of the batch conversion proxy
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
 * @param request request for an ERC20 payment with/out conversion
 * @param account account that will be used to pay the request
 * @param version version of the batch conversion proxy, which can be different from request pn version
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param paymentSettings paymentSettings is necessary for conversion payment approval
 * @param overrides optionally, override default transaction values, like gas.
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
 * @param request request for an ERC20 payment with/out conversion
 * @param account account that will be used to pay the request
 * @param version version of the batch conversion proxy
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param paymentSettings paymentSettings is necessary for conversion payment approval
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
 * @param request request for an ERC20 payment with/out conversion
 * @param version version of the batch conversion proxy, which can be different from request pn version
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param paymentSettings paymentSettings is necessary for conversion payment approval
 * @param overrides optionally, override default transaction values, like gas.
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
 * @param request request for an ERC20 payment with/out conversion
 * @param version version of the batch conversion proxy
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param paymentSettings paymentSettings is necessary for conversion payment approval
 * @param overrides optionally, override default transaction values, like gas.
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
 * @param request request for an ERC20 payment with/out conversion
 * @param version version of the batch conversion proxy
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param paymentSettings paymentSettings is necessary for conversion payment approval
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
 * @param request request for an ERC20 payment with/out conversion
 * @param paymentSettings paymentSettings is necessary for conversion payment
 * */
function getTokenAddress(
  request: ClientTypes.IRequestData,
  paymentSettings?: IConversionPaymentSettings,
): string {
  return paymentSettings ? paymentSettings.currency!.value : request.currencyInfo.value;
}
