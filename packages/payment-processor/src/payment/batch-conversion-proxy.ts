import { ContractTransaction, Signer, providers, BigNumber, constants } from 'ethers';
import { batchConversionPaymentsArtifact } from '@requestnetwork/smart-contracts';
import { BatchConversionPayments__factory } from '@requestnetwork/smart-contracts/types';
import { ClientTypes, RequestLogicTypes, PaymentTypes } from '@requestnetwork/types';
import { ITransactionOverrides } from './transaction-overrides';
import { comparePnTypeAndVersion, getProvider, getRequestPaymentValues, getSigner } from './utils';
import {
  padAmountForChainlink,
  getPaymentNetworkExtension,
} from '@requestnetwork/payment-detection';
import { IPreparedTransaction } from './prepared-transaction';
import { EnrichedRequest, IConversionPaymentSettings } from './index';
import { checkRequestAndGetPathAndCurrency } from './any-to-erc20-proxy';
import { getBatchArgs } from './batch-proxy';
import { checkErc20Allowance, encodeApproveAnyErc20 } from './erc20';

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
 * Prepare the transaction to pay a batch of ERC20 requests through the batch conversion proxy contract,
 * it can be used with a Multisig contract.
 * @param enrichedRequests List of EnrichedRequest to pay
 * @param version Version of the batch conversion proxy
 */
export function prepareBatchConversionPaymentTransaction(
  enrichedRequests: EnrichedRequest[],
  version: string,
): IPreparedTransaction {
  const encodedTx = encodePayBatchConversionRequest(enrichedRequests);
  const proxyAddress = getBatchConversionProxyAddress(
    enrichedRequests[0].request,
    version,
    enrichedRequests[0].paymentSettings,
  );
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
  const { feeAddress } = getRequestPaymentValues(enrichedRequests[0].request);

  //**** Create and fill batchRouter function argument: metaDetails ****//

  const metaDetails: PaymentTypes.MetaDetail[] = [];

  // Variable and constants to get info about each payment network (pn)
  let firstPn0Request: ClientTypes.IRequestData | undefined;
  const pn2requests: ClientTypes.IRequestData[] = [];
  // Constant storing conversion info
  const conversionDetails: PaymentTypes.ConversionDetail[] = [];

  // Iterate throught each enrichedRequests to do checking and retrieve info
  for (let i = 0; i < enrichedRequests.length; i++) {
    const iExtension = getPaymentNetworkExtension(enrichedRequests[i].request);
    if (!iExtension) {
      throw new Error('no payment network found');
    }
    if (enrichedRequests[i].paymentNetworkId === 0) {
      // set firstPn0Request only if it is undefined
      firstPn0Request = firstPn0Request ?? enrichedRequests[i].request;

      if (
        !comparePnTypeAndVersion(
          getPaymentNetworkExtension(firstPn0Request),
          enrichedRequests[i].request,
        )
      )
        throw new Error(`Every payment network type and version must be identical`);
      if (
        ![RequestLogicTypes.CURRENCY.ISO4217, RequestLogicTypes.CURRENCY.ERC20].includes(
          enrichedRequests[i].request.currencyInfo.type,
        )
      )
        throw new Error(`wrong request currencyInfo type`);
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

  // Add ERC20 conversion payments
  if (conversionDetails.length > 0) {
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
  }

  // Get values and add cryptpoDetails to metaDetails
  if (pn2requests.length > 0) {
    const { tokenAddresses, paymentAddresses, amountsToPay, paymentReferences, feesToPay } =
      getBatchArgs(pn2requests, 'ERC20');

    // add ERC20 no-conversion payments
    metaDetails.push({
      paymentNetworkId: 2,
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

/**
 * Gets batch conversion contract Address
 * @param request request for an ERC20 payment with/out conversion
 * @param version of the batch conversion proxy
 * @param paymentSettings paymentSettings is necessary for conversion payment
 */
export function getBatchConversionProxyAddress(
  request: ClientTypes.IRequestData,
  version: string,
  paymentSettings?: IConversionPaymentSettings,
): string {
  // Get the network
  let network = request.currencyInfo.network;
  if (paymentSettings?.currency?.network) {
    network = paymentSettings.currency.network;
  }
  if (!network) throw new Error('Cannot pay with a currency missing a network');

  // Get the proxy address
  const proxyAddress = batchConversionPaymentsArtifact.getAddress(network, version);
  if (!proxyAddress)
    throw new Error(
      `No deployment found on the network ${network}, associated with the version ${version}`,
    );
  return proxyAddress;
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
    getBatchConversionProxyAddress(request, version, paymentSettings),
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
  const proxyAddress = getBatchConversionProxyAddress(request, version, paymentSettings);
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
