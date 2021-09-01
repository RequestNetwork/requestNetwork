import { ethers, Signer, providers, BigNumber, BigNumberish } from 'ethers';

import { PaymentReferenceCalculator, getDefaultProvider } from '@requestnetwork/payment-detection';
import {
  ClientTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { Currency } from '@requestnetwork/currency';

/**
 * Thrown when the library does not support a payment blockchain network.
 */
export class UnsupportedCurrencyNetwork extends Error {
  constructor(public networkName?: string) {
    super(`Currency network ${networkName} is not supported`);
  }
}

/**
 * Utility to get the default window.ethereum provider, or throws an error.
 */
export function getProvider(): providers.Web3Provider {
  if (typeof window !== 'undefined' && 'ethereum' in window) {
    return new ethers.providers.Web3Provider((window as any).ethereum);
  }
  throw new Error('ethereum not found, you must pass your own web3 provider');
}

/**
 * Utility to get a network provider, depending on the request's currency network.
 * Will throw an error if the network isn't mainnet or rinkeby
 *
 * @param request
 */
export function getNetworkProvider(request: ClientTypes.IRequestData): providers.Provider {
  return getDefaultProvider(request.currencyInfo.network);
}

/**
 * Utility to return a signer from a provider.
 * @param signerOrProvider the provider, or signer. If Signer, it will simply be returned directly
 * @param address optionally, the address to retrieve the signer for.
 */
export function getSigner(
  signerOrProvider?: providers.Provider | Signer,
  address?: string,
): Signer {
  if (!signerOrProvider) {
    signerOrProvider = getProvider();
  }
  if (Signer.isSigner(signerOrProvider)) {
    return signerOrProvider;
  }
  if (
    providers.Web3Provider.isProvider(signerOrProvider) &&
    (signerOrProvider as providers.Web3Provider).getSigner
  ) {
    return (signerOrProvider as providers.Web3Provider).getSigner(address);
  }
  throw new Error('cannot get signer');
}

/**
 * Utility to return the payment network extension of a Request.
 * @param request
 */
export function getPaymentNetworkExtension(
  request: ClientTypes.IRequestData,
): ExtensionTypes.IState | undefined {
  // eslint-disable-next-line
  return Object.values(request.extensions).find(
    (x) => x.type === ExtensionTypes.TYPE.PAYMENT_NETWORK,
  );
}

/**
 * Utility to access the payment address, reference, and optional feeAmount and feeAddress of a Request.
 * @param request
 */
export function getRequestPaymentValues(
  request: ClientTypes.IRequestData,
): {
  paymentAddress: string;
  paymentReference: any;
  feeAmount?: any;
  feeAddress?: any;
  tokensAccepted?: string[];
  maxRateTimespan?: string;
  network?: string;
} {
  const extension = getPaymentNetworkExtension(request);
  if (!extension) {
    throw new Error('no payment network found');
  }
  const {
    paymentAddress,
    salt,
    feeAmount,
    feeAddress,
    tokensAccepted,
    maxRateTimespan,
    network,
  } = extension.values;
  const paymentReference = PaymentReferenceCalculator.calculate(
    request.requestId,
    salt,
    paymentAddress,
  );
  return {
    paymentAddress,
    paymentReference,
    feeAmount,
    feeAddress,
    tokensAccepted,
    maxRateTimespan,
    network,
  };
}

const {
  ERC20_PROXY_CONTRACT,
  ETH_INPUT_DATA,
  ERC20_FEE_PROXY_CONTRACT,
  ANY_TO_ERC20_PROXY,
  ERC20_TIME_LOCKED_ESCROW,
} = PaymentTypes.PAYMENT_NETWORK_ID;
const currenciesMap: any = {
  [ERC20_PROXY_CONTRACT]: RequestLogicTypes.CURRENCY.ERC20,
  [ERC20_FEE_PROXY_CONTRACT]: RequestLogicTypes.CURRENCY.ERC20,
  [ERC20_TIME_LOCKED_ESCROW]: RequestLogicTypes.CURRENCY.ERC20,
  [ETH_INPUT_DATA]: RequestLogicTypes.CURRENCY.ETH,
};

/**
 * Utility to validate a request currency and payment details against a paymentNetwork.
 * @param request
 * @param paymentNetworkId
 */
export function validateRequest(
  request: ClientTypes.IRequestData,
  paymentNetworkId: PaymentTypes.PAYMENT_NETWORK_ID,
): void {
  const { feeAmount, feeAddress } = getRequestPaymentValues(request);
  const extension = request.extensions[paymentNetworkId];

  // Compatibility of the request currency type with the payment network
  const expectedCurrencyType = currenciesMap[paymentNetworkId];
  const validCurrencyType =
    paymentNetworkId === PaymentTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY
      ? // Any currency type is valid with Any to ERC20 conversion
        true
      : expectedCurrencyType &&
        request.currencyInfo.type === expectedCurrencyType &&
        request.currencyInfo.network;

  // ERC20 based payment networks are only valid if the request currency has a value
  const validCurrencyValue =
    (paymentNetworkId !== ERC20_PROXY_CONTRACT &&
      paymentNetworkId !== ERC20_FEE_PROXY_CONTRACT &&
      paymentNetworkId !== ERC20_TIME_LOCKED_ESCROW) ||
    request.currencyInfo.value;

  // Payment network with fees should have both or none of fee address and fee amount
  const validFeeParams =
    (paymentNetworkId !== ANY_TO_ERC20_PROXY &&
      paymentNetworkId !== ERC20_FEE_PROXY_CONTRACT &&
      paymentNetworkId !== ERC20_TIME_LOCKED_ESCROW) ||
    !!feeAddress === !!feeAmount;

  if (!validFeeParams) {
    throw new Error('Both fee address and fee amount have to be declared, or both left empty');
  }

  if (
    !validCurrencyType ||
    !validCurrencyValue ||
    !extension?.values?.salt ||
    !extension?.values?.paymentAddress
  ) {
    throw new Error(`request cannot be processed, or is not an ${paymentNetworkId} request`);
  }
}

/**
 * Validates the amount and fee parameters for an ERC20 Fee Proxy based request.
 * @param request to validate
 * @param amount optionally, the custom amount to pay
 * @param feeAmountOverride optionally, the custom fee amount
 * @param paymentNetwork defaults to ERC20 Fee Proxy contract
 */
export function validateErc20FeeProxyRequest(
  request: ClientTypes.IRequestData,
  amount?: BigNumberish,
  feeAmountOverride?: BigNumberish,
  paymentNetwork: PaymentTypes.PAYMENT_NETWORK_ID = PaymentTypes.PAYMENT_NETWORK_ID
    .ERC20_FEE_PROXY_CONTRACT,
): void {
  validateRequest(request, paymentNetwork);

  const { feeAmount } = getRequestPaymentValues(request);
  const amountToPay = getAmountToPay(request, amount);
  const feeToPay = BigNumber.from(feeAmountOverride || feeAmount || 0);

  if (amountToPay.isZero() && feeToPay.isZero()) {
    throw new Error('Request payment amount and fee are 0');
  }
}

/**
 * Validates the parameters for an ERC20 Fee Proxy payment.
 * @param request to validate
 * @param tokenAddress token address to pay with
 * @param amount optionally, the custom amount to pay
 * @param feeAmountOverride optionally, the custom fee amount
 */
export function validateConversionFeeProxyRequest(
  request: ClientTypes.IRequestData,
  path: string[],
  amount?: BigNumberish,
  feeAmountOverride?: BigNumberish,
): void {
  validateErc20FeeProxyRequest(
    request,
    amount,
    feeAmountOverride,
    PaymentTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY,
  );
  const { tokensAccepted } = getRequestPaymentValues(request);

  const requestCurrencyHash = path[0];
  if (
    requestCurrencyHash.toLowerCase() !== new Currency(request.currencyInfo).getHash().toLowerCase()
  ) {
    throw new Error(`The first entry of the path does not match the request currency`);
  }

  const tokenAddress = path[path.length - 1];
  if (
    tokensAccepted &&
    !tokensAccepted?.map((t) => t.toLowerCase()).includes(tokenAddress.toLowerCase())
  ) {
    throw new Error(`The token ${tokenAddress} is not accepted to pay this request`);
  }
}

/**
 * Computes the amount to pay.
 * If `amount` is specified, it will return it.
 * Otherwise, it will return the amount left to pay in the request.
 *
 * @param request the request to pay
 * @param amount the optional amount to pay.
 */
export function getAmountToPay(
  request: ClientTypes.IRequestData,
  amount?: BigNumberish,
): BigNumber {
  const amountToPay =
    amount === undefined
      ? BigNumber.from(request.expectedAmount).sub(request.balance?.balance || 0)
      : BigNumber.from(amount);

  if (amountToPay.lt(0)) {
    throw new Error('cannot pay a negative amount');
  }
  if (amountToPay.isZero()) {
    throw new Error('cannot pay a null amount');
  }
  return amountToPay;
}
