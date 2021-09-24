import { constants, ContractTransaction, Signer, providers, BigNumberish } from 'ethers';

import { CurrencyManager, getConversionPath, ICurrencyManager } from '@requestnetwork/currency';
import { ethConversionArtifact } from '@requestnetwork/smart-contracts';
import { EthConversionProxy__factory } from '@requestnetwork/smart-contracts/types';
import { ClientTypes, RequestLogicTypes } from '@requestnetwork/types';

import { ITransactionOverrides } from './transaction-overrides';
import {
  getAmountToPay,
  getPaymentNetworkExtension,
  getProvider,
  getRequestPaymentValues,
  getSigner,
  //  TODO:    validateConversionFeeProxyRequest,
} from './utils';
import { padAmountForChainlink } from '@requestnetwork/payment-detection';
import { IPreparedTransaction } from './prepared-transaction';

/**
 * Details required to pay a request with on-chain conversion:
 * - currency: should be a valid currency type and accepted token value
 * - maxToSpend: maximum number of tokens to be spent when the conversion is made
 */
export interface IPaymentSettings {
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
export async function payAnyToEthProxyRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  paymentSettings: IPaymentSettings,
  amount?: BigNumberish,
  feeAmount?: BigNumberish,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const { data, to, value } = prepareAnyToEthProxyPaymentTransaction(
    request,
    paymentSettings,
    amount,
    feeAmount,
  );
  const signer = getSigner(signerOrProvider);
  return signer.sendTransaction({ data, to, value, ...overrides });
}

/**
 * Encodes the call to pay a request with an ERC20 currency that is different from the request currency (eg. fiat). The payment is made by the ERC20 fee proxy contract.
 * @param request request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param paymentSettings payment settings
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmountOverride optionally, the fee amount to pay. Defaults to the fee amount of the request.
 */
export function encodePayAnyToEthProxyRequest(
  request: ClientTypes.IRequestData,
  paymentSettings: IPaymentSettings,
  amount?: BigNumberish,
  feeAmountOverride?: BigNumberish,
): string {
  const currencyManager = paymentSettings.currencyManager || CurrencyManager.getDefault();

  const requestCurrency = currencyManager.fromStorageCurrency(request.currencyInfo);
  if (!requestCurrency) {
    throw new Error(
      `Could not find request currency ${request.currencyInfo.value}. Did you forget to specify the currencyManager?`,
    );
  }

  const {
    paymentReference,
    paymentAddress,
    feeAddress,
    feeAmount,
    maxRateTimespan,
    network,
  } = getRequestPaymentValues(request);

  const paymentCurrency = currencyManager.fromStorageCurrency({
    type: RequestLogicTypes.CURRENCY.ETH,
    value: RequestLogicTypes.CURRENCY.ETH,
    network,
  });
  if (!paymentCurrency) {
    throw new Error(
      `Could not find currency for network: ${network}. Did you forget to specify the currencyManager?`,
    );
  }

  // Compute the path automatically
  const path = getConversionPath(requestCurrency, paymentCurrency, network);
  if (!path) {
    throw new Error(
      `Impossible to find a conversion path between from ${requestCurrency.symbol} (${requestCurrency.hash}) to ${paymentCurrency.symbol} (${paymentCurrency.hash})`,
    );
  }

  // Check request
  // TODO: validateConversionFeeProxyRequest(request, path, amount, feeAmountOverride);

  const amountToPay = padAmountForChainlink(getAmountToPay(request, amount), requestCurrency);
  const feeToPay = padAmountForChainlink(feeAmountOverride || feeAmount || 0, requestCurrency);

  const proxyContract = EthConversionProxy__factory.createInterface();
  return proxyContract.encodeFunctionData('transferWithReferenceAndFee', [
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

export function prepareAnyToEthProxyPaymentTransaction(
  request: ClientTypes.IRequestData,
  paymentSettings: IPaymentSettings,
  amount?: BigNumberish,
  feeAmount?: BigNumberish,
): IPreparedTransaction {
  if (!paymentSettings.currency.network) {
    throw new Error('Cannot pay with a currency missing a network');
  }
  const encodedTx = encodePayAnyToEthProxyRequest(request, paymentSettings, amount, feeAmount);
  const pn = getPaymentNetworkExtension(request);

  const proxyAddress = ethConversionArtifact.getAddress(
    paymentSettings.currency.network,
    pn?.version,
  );
  return {
    data: encodedTx,
    to: proxyAddress,
    value: 0,
  };
}
