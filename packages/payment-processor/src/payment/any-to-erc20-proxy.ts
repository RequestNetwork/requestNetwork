import { constants, ContractTransaction, Signer, providers, BigNumberish, BigNumber } from 'ethers';

import { CurrencyManager, UnsupportedCurrencyError } from '@requestnetwork/currency';
import { AnyToERC20PaymentDetector } from '@requestnetwork/payment-detection';
import { Erc20ConversionProxy__factory } from '@requestnetwork/smart-contracts/types';
import { ClientTypes, CurrencyTypes, RequestLogicTypes } from '@requestnetwork/types';

import { ITransactionOverrides } from './transaction-overrides';
import {
  getAmountToPay,
  getProxyAddress,
  getProvider,
  getRequestPaymentValues,
  getSigner,
  validateConversionFeeProxyRequest,
} from './utils';
import { padAmountForChainlink } from '@requestnetwork/payment-detection';
import { IPreparedTransaction } from './prepared-transaction';
import { IConversionPaymentSettings } from './index';

/**
 * Processes a transaction to pay a request with an ERC20 currency that is different from the request currency (eg. fiat).
 * The payment is made by the ERC20 Conversion fee proxy contract.
 * @param request The request to pay
 * @param signerOrProvider The Web3 provider, or signer. Defaults to window.ethereum.
 * @param paymentSettings The payment settings
 * @param amount Optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmount Optionally, the fee amount to pay. Defaults to the fee amount.
 * @param overrides Optionally, override default transaction values, like gas.
 */
export async function payAnyToErc20ProxyRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  paymentSettings: IConversionPaymentSettings,
  amount?: BigNumberish,
  feeAmount?: BigNumberish,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const { data, to, value } = prepareAnyToErc20ProxyPaymentTransaction(
    request,
    paymentSettings,
    amount,
    feeAmount,
  );
  const signer = getSigner(signerOrProvider);
  return signer.sendTransaction({ data, to, value, ...overrides });
}

/**
 * Encodes the call to pay a request with an ERC20 currency that is different from the request currency (eg. fiat).
 * The payment is made by the ERC20 Conversion fee proxy contract.
 * @param request The request to pay
 * @param paymentSettings The payment settings
 * @param amount Optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmountOverride Optionally, the fee amount to pay. Defaults to the fee amount of the request.
 */
export function encodePayAnyToErc20ProxyRequest(
  request: ClientTypes.IRequestData,
  paymentSettings: IConversionPaymentSettings,
  amount?: BigNumberish,
  feeAmountOverride?: BigNumberish,
): string {
  const {
    path,
    paymentReference,
    paymentAddress,
    feeAddress,
    maxRateTimespan,
    amountToPay,
    feeToPay,
  } = prepareAnyToErc20Arguments(request, paymentSettings, amount, feeAmountOverride);
  const proxyContract = Erc20ConversionProxy__factory.createInterface();
  return proxyContract.encodeFunctionData('transferFromWithReferenceAndFee', [
    paymentAddress,
    amountToPay,
    path,
    `0x${paymentReference}`,
    feeToPay,
    feeAddress || constants.AddressZero,
    BigNumber.from(paymentSettings.maxToSpend),
    maxRateTimespan || 0,
  ]);
}

/**
 * It checks paymentSettings values, it get request's path and requestCurrency
 * @param request The request to pay
 * @param paymentSettings The payment settings
 * @param amount Optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmountOverride Optionally, the fee amount to pay. Defaults to the fee amount of the request.
 */
export function getConversionPathForErc20Request(
  request: ClientTypes.IRequestData,
  paymentSettings: IConversionPaymentSettings,
): { path: string[]; requestCurrency: CurrencyTypes.CurrencyDefinition<unknown> } {
  if (!paymentSettings.currency) {
    throw new Error('currency must be provided in the paymentSettings');
  }
  if (!paymentSettings.currency.network) {
    throw new Error('Cannot pay with a currency missing a network');
  }
  const currencyManager = paymentSettings.currencyManager || CurrencyManager.getDefault();

  const requestCurrency = currencyManager.fromStorageCurrency(request.currencyInfo);
  if (!requestCurrency) {
    throw new UnsupportedCurrencyError(request.currencyInfo);
  }
  const paymentCurrency = currencyManager.fromStorageCurrency(paymentSettings.currency);
  if (!paymentCurrency) {
    throw new UnsupportedCurrencyError(paymentSettings.currency);
  }
  if (paymentCurrency.type !== RequestLogicTypes.CURRENCY.ERC20) {
    throw new Error(`Payment currency must be an ERC20`);
  }

  // Compute the path automatically
  const path = currencyManager.getConversionPath(
    requestCurrency,
    paymentCurrency,
    paymentCurrency.network,
  );
  if (!path) {
    throw new Error(
      `Impossible to find a conversion path between from ${requestCurrency.symbol} (${requestCurrency.hash}) to ${paymentCurrency.symbol} (${paymentCurrency.hash})`,
    );
  }
  return { path, requestCurrency };
}

/**
 * Prepares all necessaries arguments required to encode an any-to-erc20 request
 * @param request The request to pay
 * @param paymentSettings The payment settings
 * @param amount Optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmountOverride Optionally, the fee amount to pay. Defaults to the fee amount of the request.
 */
function prepareAnyToErc20Arguments(
  request: ClientTypes.IRequestData,
  paymentSettings: IConversionPaymentSettings,
  amount?: BigNumberish,
  feeAmountOverride?: BigNumberish,
): {
  path: string[];
  paymentReference: string;
  paymentAddress: string;
  feeAddress: string | undefined;
  maxRateTimespan: string | undefined;
  amountToPay: BigNumber;
  feeToPay: BigNumber;
} {
  const { path, requestCurrency } = getConversionPathForErc20Request(request, paymentSettings);
  validateConversionFeeProxyRequest(request, path, amount, feeAmountOverride);

  const { paymentReference, paymentAddress, feeAddress, feeAmount, maxRateTimespan } =
    getRequestPaymentValues(request);
  if (!paymentReference) {
    throw new Error('paymentReference is missing');
  }
  const amountToPay = padAmountForChainlink(getAmountToPay(request, amount), requestCurrency);
  const feeToPay = padAmountForChainlink(feeAmountOverride || feeAmount || 0, requestCurrency);
  return {
    path,
    paymentReference,
    paymentAddress,
    feeAddress,
    maxRateTimespan,
    amountToPay,
    feeToPay,
  };
}

export function prepareAnyToErc20ProxyPaymentTransaction(
  request: ClientTypes.IRequestData,
  paymentSettings: IConversionPaymentSettings,
  amount?: BigNumberish,
  feeAmount?: BigNumberish,
): IPreparedTransaction {
  if (!paymentSettings.currency) {
    throw new Error('currency must be provided in the paymentSettings');
  }
  if (!paymentSettings.currency.network) {
    throw new Error('Cannot pay with a currency missing a network');
  }
  const encodedTx = encodePayAnyToErc20ProxyRequest(request, paymentSettings, amount, feeAmount);

  const proxyAddress = getProxyAddress(request, AnyToERC20PaymentDetector.getDeploymentInformation);
  return {
    data: encodedTx,
    to: proxyAddress,
    value: 0,
  };
}
