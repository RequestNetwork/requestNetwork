import { ethers, getDefaultProvider, Signer } from 'ethers';
import { Provider, Web3Provider } from 'ethers/providers';
import { BigNumber, bigNumberify, BigNumberish } from 'ethers/utils';

import { PaymentReferenceCalculator } from '@requestnetwork/payment-detection';
import {
  ClientTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';

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
export function getProvider(): Web3Provider {
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
export function getNetworkProvider(request: ClientTypes.IRequestData): Provider {
  if (request.currencyInfo.network === 'mainnet') {
    return getDefaultProvider();
  }
  if (request.currencyInfo.network === 'rinkeby') {
    return getDefaultProvider('rinkeby');
  }
  throw new UnsupportedCurrencyNetwork(request.currencyInfo.network);
}

/**
 * Utility to return a signer from a provider.
 * @param signerOrProvider the provider, or signer. If Signer, it will simply be returned directly
 * @param address optionally, the address to retrieve the signer for.
 */
export function getSigner(signerOrProvider?: Provider | Signer, address?: string): Signer {
  if (!signerOrProvider) {
    signerOrProvider = getProvider();
  }
  if (Signer.isSigner(signerOrProvider)) {
    return signerOrProvider;
  }
  if (Web3Provider.isProvider(signerOrProvider) && (signerOrProvider as Web3Provider).getSigner) {
    return (signerOrProvider as Web3Provider).getSigner(address);
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
  // tslint:disable-next-line: typedef
  return Object.values(request.extensions).find(
    x => x.type === ExtensionTypes.TYPE.PAYMENT_NETWORK,
  );
}

/**
 * Utility to access the payment address, reference, and optional feeAmount and feeAddress of a Request.
 * @param request
 */
export function getRequestPaymentValues(
  request: ClientTypes.IRequestData,
): { paymentAddress: string; paymentReference: string; feeAmount?: string; feeAddress?: string } {
  const extension = getPaymentNetworkExtension(request);
  if (!extension) {
    throw new Error('no payment network found');
  }
  const { paymentAddress, salt, feeAmount, feeAddress } = extension.values;
  const paymentReference = PaymentReferenceCalculator.calculate(
    request.requestId,
    salt,
    paymentAddress,
  );
  return { paymentAddress, paymentReference, feeAmount, feeAddress };
}

const {
  ERC20_PROXY_CONTRACT,
  ETH_INPUT_DATA,
  ERC20_FEE_PROXY_CONTRACT,
} = PaymentTypes.PAYMENT_NETWORK_ID;
const currenciesMap: any = {
  [ERC20_PROXY_CONTRACT]: RequestLogicTypes.CURRENCY.ERC20,
  [ERC20_FEE_PROXY_CONTRACT]: RequestLogicTypes.CURRENCY.ERC20,
  [ETH_INPUT_DATA]: RequestLogicTypes.CURRENCY.ETH,
};

/**
 * Utility to validate a request depending on the expected paymentNetwork.
 * @param request
 * @param paymentNetworkId
 */
export function validateRequest(
  request: ClientTypes.IRequestData,
  paymentNetworkId: PaymentTypes.PAYMENT_NETWORK_ID,
): void {
  const extension = request.extensions[paymentNetworkId];
  const expectedCurrencyType = currenciesMap[paymentNetworkId];
  if (
    !expectedCurrencyType ||
    request.currencyInfo.type !== expectedCurrencyType ||
    !request.currencyInfo.network ||
    !extension ||
    !extension.values.salt ||
    !extension.values.paymentAddress ||
    (paymentNetworkId === ERC20_PROXY_CONTRACT && !request.currencyInfo.value) ||
    (paymentNetworkId === ERC20_FEE_PROXY_CONTRACT && !request.currencyInfo.value) ||
    (paymentNetworkId === ERC20_FEE_PROXY_CONTRACT &&
      !!extension.values.feeAddress !== !!extension.values.feeAmount)
  ) {
    throw new Error(`request cannot be processed, or is not an ${paymentNetworkId} request`);
  }
}

/**
 * Validates the parameters for an ERC20 Fee Proxy payment.
 * @param request to validate
 * @param amount optionally, the custom amount to pay
 * @param feeAmountOverride optionally, the custom fee amount
 */
export function validateErc20FeeProxyRequest(
  request: ClientTypes.IRequestData,
  amount?: BigNumberish,
  feeAmountOverride?: BigNumberish,
): void {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT);

  const { feeAddress, feeAmount } = getRequestPaymentValues(
    request,
  );
  const amountToPay = getAmountToPay(request, amount);
  const feeToPay = bigNumberify(feeAmountOverride || feeAmount || 0);

  if (!!feeAmount !== !!feeAddress) {
    throw new Error('Both fee address and fee amount have to be declared, or both left empty');
  }
  if (amountToPay.isZero() && feeToPay.isZero()) {
    throw new Error('Request payment amount and fee are 0');
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
      ? bigNumberify(request.expectedAmount).sub(request.balance?.balance || 0)
      : bigNumberify(amount);

  if (amountToPay.lt(0)) {
    throw new Error('cannot pay a negative amount');
  }
  if (amountToPay.isZero()) {
    throw new Error('cannot pay a null amount');
  }
  return amountToPay;
}
