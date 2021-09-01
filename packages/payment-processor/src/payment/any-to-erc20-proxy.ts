import { constants, ContractTransaction, Signer, providers, BigNumberish } from 'ethers';

import { CurrencyManager, getConversionPath, ICurrencyManager } from '@requestnetwork/currency';
import { erc20ConversionProxy } from '@requestnetwork/smart-contracts';
import { Erc20ConversionProxy__factory } from '@requestnetwork/smart-contracts/types';
import { ClientTypes, RequestLogicTypes } from '@requestnetwork/types';

import { ITransactionOverrides } from './transaction-overrides';
import {
  getAmountToPay,
  getProvider,
  getRequestPaymentValues,
  getSigner,
  validateConversionFeeProxyRequest,
} from './utils';
import { padAmountForChainlink } from '@requestnetwork/payment-detection';

/**
 * Details required to pay a request with on-chain conversion:
 * - currency: should be a valid currency type and accepted token value
 * - maxToSpend: maximum number of tokens to be spent when the conversion is made
 */
export interface IPaymentSettings {
  currency: RequestLogicTypes.ICurrency;
  maxToSpend: BigNumberish;
  currencyManager?: ICurrencyManager;
}

/**
 * Processes a transaction to pay a request with an ERC20 currency that is different from the request currency (eg. fiat).
 * The payment is made by the ERC20 fee proxy contract.
 * @param request the request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param paymentSettings payment settings
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmount optionally, the fee amount to pay. Defaults to the fee amount.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function payAnyToErc20ProxyRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  paymentSettings: IPaymentSettings,
  amount?: BigNumberish,
  feeAmount?: BigNumberish,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  if (!paymentSettings.currency.network) {
    throw new Error('Cannot pay with a currency missing a network');
  }
  const encodedTx = encodePayAnyToErc20ProxyRequest(
    request,
    signerOrProvider,
    paymentSettings,
    amount,
    feeAmount,
  );
  const proxyAddress = erc20ConversionProxy.getAddress(paymentSettings.currency.network);
  const signer = getSigner(signerOrProvider);

  const tx = await signer.sendTransaction({
    data: encodedTx,
    to: proxyAddress,
    value: 0,
    ...overrides,
  });

  return tx;
}

/**
 * Encodes the call to pay a request with an ERC20 currency that is different from the request currency (eg. fiat). The payment is made by the ERC20 fee proxy contract.
 * @param request request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param paymentSettings payment settings
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmountOverride optionally, the fee amount to pay. Defaults to the fee amount of the request.
 */
export function encodePayAnyToErc20ProxyRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  paymentSettings: IPaymentSettings,
  amount?: BigNumberish,
  feeAmountOverride?: BigNumberish,
): string {
  if (!paymentSettings.currency.network) {
    throw new Error('Cannot pay with a currency missing a network');
  }
  const currencyManager = paymentSettings.currencyManager || CurrencyManager.getDefault();

  const requestCurrency = currencyManager.fromStorageCurrency(request.currencyInfo);
  if (!requestCurrency) {
    throw new Error(
      `Could not find request currency ${request.currencyInfo.value}. Did you forget to specify the currencyManager?`,
    );
  }
  const paymentCurrency = currencyManager.fromStorageCurrency(paymentSettings.currency);
  if (!paymentCurrency) {
    throw new Error(
      `Could not find payment currency ${paymentSettings.currency.value}. Did you forget to specify the currencyManager?`,
    );
  }
  if (paymentCurrency.type !== RequestLogicTypes.CURRENCY.ERC20) {
    throw new Error(`Payment currency must be an ERC20`);
  }

  // Compute the path automatically
  const path = getConversionPath(requestCurrency, paymentCurrency, paymentCurrency.network);
  if (!path) {
    throw new Error(
      `Impossible to find a conversion path between from ${request.currencyInfo} to ${paymentSettings.currency}`,
    );
  }

  // Check request
  validateConversionFeeProxyRequest(request, path, amount, feeAmountOverride);

  const signer = getSigner(signerOrProvider);
  const {
    paymentReference,
    paymentAddress,
    feeAddress,
    feeAmount,
    maxRateTimespan,
  } = getRequestPaymentValues(request);

  const amountToPay = padAmountForChainlink(getAmountToPay(request, amount), requestCurrency);
  const feeToPay = padAmountForChainlink(feeAmountOverride || feeAmount || 0, requestCurrency);

  const proxyAddress = erc20ConversionProxy.getAddress(paymentSettings.currency.network);
  const proxyContract = Erc20ConversionProxy__factory.connect(proxyAddress, signer);

  return proxyContract.interface.encodeFunctionData('transferFromWithReferenceAndFee', [
    paymentAddress,
    amountToPay,
    path,
    `0x${paymentReference}`,
    feeToPay,
    feeAddress || constants.AddressZero,
    paymentSettings.maxToSpend,
    maxRateTimespan || 0,
  ]);
}
