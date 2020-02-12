import { ethers, Signer } from 'ethers';
import { EtherscanProvider, Provider, Web3Provider } from 'ethers/providers';
import { BigNumber, bigNumberify, BigNumberish } from 'ethers/utils';

import { PaymentReferenceCalculator } from '@requestnetwork/payment-detection';
import {
  ClientTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';

/**
 * Utility to get the default window.ethereum provider, or throws an error.
 */
export function getProvider(): Web3Provider {
  const win = window as any;
  if (!win.ethereum) {
    throw new Error('ethereum not found, you must pass your own web3 provider');
  }
  return new ethers.providers.Web3Provider(win.ethereum);
}

/**
 * Utility to get a network provider, depending on the request's currency network.
 * Will throw an error if the network isn't mainnet or rinkeby
 *
 * @param request
 */
export function getNetworkProvider(request: ClientTypes.IRequestData): Provider {
  if (request.currencyInfo.network === 'mainnet') {
    return new EtherscanProvider();
  }
  if (request.currencyInfo.network === 'rinkeby') {
    return new EtherscanProvider('rinkeby');
  }
  throw new Error('unsupported network');
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
  if (signerOrProvider instanceof Signer) {
    return signerOrProvider;
  }
  if (signerOrProvider instanceof Web3Provider) {
    return signerOrProvider.getSigner(address);
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
  return Object.values(request.extensions).find(
    x => x.type === ExtensionTypes.TYPE.PAYMENT_NETWORK,
  );
}

/**
 * Utility to access the payment address and reference of a Request.
 * @param request
 */
export function getRequestPaymentValues(
  request: ClientTypes.IRequestData,
): { paymentAddress: string; paymentReference: string } {
  const extension = getPaymentNetworkExtension(request);
  if (!extension) {
    throw new Error('no payment network found');
  }
  const { paymentAddress, salt } = extension.values;
  const paymentReference = PaymentReferenceCalculator.calculate(
    request.requestId,
    salt,
    paymentAddress,
  );
  return { paymentAddress, paymentReference };
}

const { ERC20_PROXY_CONTRACT, ETH_INPUT_DATA } = PaymentTypes.PAYMENT_NETWORK_ID;
const currenciesMap: any = {
  [ERC20_PROXY_CONTRACT]: RequestLogicTypes.CURRENCY.ERC20,
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
    (paymentNetworkId === ERC20_PROXY_CONTRACT && !request.currencyInfo.value)
  ) {
    throw new Error(`request cannot be processed, or is not an ${paymentNetworkId} request`);
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
  return amountToPay;
}
