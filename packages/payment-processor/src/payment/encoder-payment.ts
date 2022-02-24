import { IRequestPaymentOptions } from './settings';
import { IPreparedTransaction } from './prepared-transaction';
import { providers } from 'ethers';
import { ClientTypes, ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import { prepareErc20ProxyPaymentTransaction } from './erc20-proxy';
import { prepareErc20FeeProxyPaymentTransaction } from './erc20-fee-proxy';
import { prepareAnyToErc20ProxyPaymentTransaction } from './any-to-erc20-proxy';
import { prepareSwapToPayErc20FeeRequest } from './swap-erc20-fee-proxy';
import { prepareSwapToPayAnyToErc20Request } from './swap-any-to-erc20';
import { prepareEthProxyPaymentTransaction } from './eth-proxy';
import { prepareEthFeeProxyPaymentTransaction } from './eth-fee-proxy';
import { prepareAnyToEthProxyPaymentTransaction } from './any-to-eth-proxy';
import { IConversionPaymentSettings } from '.';
import { getPaymentNetworkExtension } from './utils';

export function encodeRequestPayment(
  request: ClientTypes.IRequestData,
  provider: providers.Provider,
  options?: IRequestPaymentOptions,
): Promise<IPreparedTransaction> {
  if (options && options.swap) {
    return encodeRequestPaymentWithSwap(request, provider, options);
  } else {
    return encodeRequestPaymentWithoutSwap(request, options);
  }
}

export async function encodeRequestPaymentWithoutSwap(
  request: ClientTypes.IRequestData,
  options?: IRequestPaymentOptions,
): Promise<IPreparedTransaction> {
  const paymentNetwork = getPaymentNetworkExtension(request)?.id;

  switch (paymentNetwork) {
    case ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT:
      return prepareErc20ProxyPaymentTransaction(request);
    case ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT:
      return prepareErc20FeeProxyPaymentTransaction(request);
    case ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY: {
      if (
        !options ||
        !options.conversion ||
        !options.conversion.currency ||
        options.conversion.currency.type !== RequestLogicTypes.CURRENCY.ERC20
      ) {
        throw new Error('Conversion settings missing');
      }
      return prepareAnyToErc20ProxyPaymentTransaction(
        request,
        options.conversion as IConversionPaymentSettings,
      );
    }
    case ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ETH_PROXY: {
      if (
        !options ||
        !options.conversion ||
        !options.conversion.currency ||
        options.conversion.currency.type !== RequestLogicTypes.CURRENCY.ETH
      ) {
        throw new Error('Encoding settings missing');
      }
      return prepareAnyToEthProxyPaymentTransaction(
        request,
        options.conversion as IConversionPaymentSettings,
      );
    }
    case ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA:
      return prepareEthProxyPaymentTransaction(request);
    case ExtensionTypes.ID.PAYMENT_NETWORK_ETH_FEE_PROXY_CONTRACT:
      return prepareEthFeeProxyPaymentTransaction(request);
    default:
      throw new Error('Payment network not found');
  }
}

export async function encodeRequestPaymentWithSwap(
  request: ClientTypes.IRequestData,
  provider: providers.Provider,
  options: IRequestPaymentOptions,
): Promise<IPreparedTransaction> {
  const paymentNetwork = getPaymentNetworkExtension(request)?.id;

  switch (paymentNetwork) {
    case ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT:
      if (options && options.swap) {
        return prepareSwapToPayErc20FeeRequest(request, provider, options.swap);
      } else {
        throw new Error('No swap options');
      }
    case ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY: {
      if (
        !options ||
        !options.conversion ||
        !options.conversion.currency ||
        options.conversion.currency.type !== RequestLogicTypes.CURRENCY.ERC20
      ) {
        throw new Error('Conversion settings missing');
      }

      if (options.swap) {
        return prepareSwapToPayAnyToErc20Request(request, provider, options);
      } else {
        throw new Error('Swap settings missing');
      }
    }
    default:
      throw new Error(`Payment network {paymentNetwork} does not support swap`);
  }
}
