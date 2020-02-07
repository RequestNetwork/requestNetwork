import { ethers } from 'ethers';
import { Web3Provider } from 'ethers/providers';

import { PaymentReferenceCalculator } from '@requestnetwork/payment-detection';
import {
  ClientTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';

export const getProvider = (): Web3Provider => {
  const win = window as any;
  if (!win.ethereum) {
    throw new Error('ethereum not found, you must pass your own web3 provider');
  }
  return new ethers.providers.Web3Provider(win.ethereum);
};

export const getPaymentNetworkExtension = (
  request: ClientTypes.IRequestData,
): ExtensionTypes.IState | undefined => {
  return Object.values(request.extensions).find(
    x => x.type === ExtensionTypes.TYPE.PAYMENT_NETWORK,
  );
};

export const getRequestPaymentValues = (
  request: ClientTypes.IRequestData,
): { paymentAddress: string; paymentReference: string } => {
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
};

const { ERC20_PROXY_CONTRACT, ETH_INPUT_DATA } = PaymentTypes.PAYMENT_NETWORK_ID;
const currenciesMap: any = {
  [ERC20_PROXY_CONTRACT]: RequestLogicTypes.CURRENCY.ERC20,
  [ETH_INPUT_DATA]: RequestLogicTypes.CURRENCY.ETH,
};
export const validateRequest = (
  request: ClientTypes.IRequestData,
  paymentNetworkId: PaymentTypes.PAYMENT_NETWORK_ID,
): void => {
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
};
