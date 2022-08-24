import { IRequestPaymentOptions } from './settings';
import { IPreparedTransaction } from './prepared-transaction';
import { providers } from 'ethers';
import { ClientTypes, ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import { getPaymentNetworkExtension } from '@requestnetwork/payment-detection';
import { prepareErc20ProxyPaymentTransaction } from './erc20-proxy';
import { prepareErc20FeeProxyPaymentTransaction } from './erc20-fee-proxy';
import { prepareAnyToErc20ProxyPaymentTransaction } from './any-to-erc20-proxy';
import { prepareSwapToPayErc20FeeRequest } from './swap-erc20-fee-proxy';
import { prepareSwapToPayAnyToErc20Request } from './swap-any-to-erc20';
import { prepareEthProxyPaymentTransaction } from './eth-proxy';
import { prepareEthFeeProxyPaymentTransaction } from './eth-fee-proxy';
import { prepareAnyToEthProxyPaymentTransaction } from './any-to-eth-proxy';
import { IConversionPaymentSettings } from '.';
import { prepareErc777StreamPaymentTransaction } from './erc777-stream';

/**
 * Encodes a transaction to pay a Request in generic way. ERC777 stream excepted.
 * @param request the request data to pay
 * @param provider the Web3 provider. Defaults to window.ethereum.
 * @param options optionally, the request payment options.
 */
export function encodeRequestPayment(
  request: ClientTypes.IRequestData,
  provider: providers.Provider,
  options?: IRequestPaymentOptions,
): IPreparedTransaction {
  if (options && options.swap) {
    return encodeRequestPaymentWithSwap(request, provider, options);
  } else {
    return encodeRequestPaymentWithoutSwap(request, options);
  }
}

/**
 * Encodes a transaction to pay a Request in generic way without swap.
 * @param request the request data to pay
 * @param options optionally, the request payment options.
 */
export function encodeRequestPaymentWithoutSwap(
  request: ClientTypes.IRequestData,
  options?: IRequestPaymentOptions,
): IPreparedTransaction {
  const paymentNetwork = getPaymentNetworkExtension(request)?.id;
  const amount = options?.amount ? options.amount : undefined;
  const feeAmount = options?.feeAmount ? options.feeAmount : undefined;
  const overrides = options?.overrides ? options.overrides : {};

  switch (paymentNetwork) {
    case ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT:
      return {
        ...prepareErc20ProxyPaymentTransaction(request, amount),
        ...overrides,
      };
    case ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT:
      return {
        ...prepareErc20FeeProxyPaymentTransaction(request, amount, feeAmount),
        ...overrides,
      };
    case ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY: {
      if (
        !options ||
        !options.conversion ||
        !options.conversion.currency ||
        options.conversion.currency.type !== RequestLogicTypes.CURRENCY.ERC20
      ) {
        throw new Error('Conversion settings missing');
      }
      return {
        ...prepareAnyToErc20ProxyPaymentTransaction(
          request,
          options.conversion as IConversionPaymentSettings,
          amount,
          feeAmount,
        ),
        ...overrides,
      };
    }
    case ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ETH_PROXY: {
      if (
        !options ||
        !options.conversion ||
        !options.conversion.currency ||
        options.conversion.currency.type !== RequestLogicTypes.CURRENCY.ETH
      ) {
        throw new Error('Conversion settings missing');
      }
      return {
        ...prepareAnyToEthProxyPaymentTransaction(
          request,
          options.conversion as IConversionPaymentSettings,
          amount,
          feeAmount,
        ),
        ...overrides,
      };
    }
    case ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA:
      return {
        ...prepareEthProxyPaymentTransaction(request, amount),
        ...overrides,
      };
    case ExtensionTypes.ID.PAYMENT_NETWORK_ETH_FEE_PROXY_CONTRACT:
      return {
        ...prepareEthFeeProxyPaymentTransaction(request, amount, feeAmount),
        ...overrides,
      };
    default:
      throw new Error('Payment network not found');
  }
}

/**
 * Encodes a transaction to pay a Request with ERC777 stream.
 * @param request the request data to pay
 * @param provider the Web3 provider. Defaults to window.ethereum.
 * @param options optionally, the request payment options.
 */
export async function encodeRequestPaymentWithStream(
  request: ClientTypes.IRequestData,
  provider: providers.Provider,
  options?: IRequestPaymentOptions,
): Promise<IPreparedTransaction> {
  const paymentNetwork = getPaymentNetworkExtension(request)?.id;
  const overrides = options?.overrides ? options.overrides : {};

  switch (paymentNetwork) {
    case ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM:
      return {
        ...(await prepareErc777StreamPaymentTransaction(request, provider)),
        ...overrides,
      };
    default:
      throw new Error(`Payment network {paymentNetwork} does not support stream`);
  }
}

/**
 * Encodes a transaction to pay a Request in generic way with swap.
 * @param request the request data to pay
 * @param provider the Web3 provider. Defaults to window.ethereum.
 * @param options optionally, the request payment options.
 */
export function encodeRequestPaymentWithSwap(
  request: ClientTypes.IRequestData,
  provider: providers.Provider,
  options: IRequestPaymentOptions,
): IPreparedTransaction {
  const paymentNetwork = getPaymentNetworkExtension(request)?.id;
  const amount = options?.amount ? options.amount : undefined;
  const feeAmount = options?.feeAmount ? options.feeAmount : undefined;
  const overrides = options?.overrides ? options.overrides : undefined;

  switch (paymentNetwork) {
    case ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT:
      if (options && options.swap) {
        return prepareSwapToPayErc20FeeRequest(request, provider, options.swap, {
          amount,
          feeAmount,
          overrides,
        });
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
