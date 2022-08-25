import { IRequestPaymentOptions } from './settings';
import { IPreparedTransaction } from './prepared-transaction';
import { providers, BigNumber } from 'ethers';
import { hasErc20Approval, prepareApproveErc20 } from './erc20';
import { ClientTypes, ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import {
  hasErc20ApprovalForProxyConversion,
  prepareApproveErc20ForProxyConversion,
} from './conversion-erc20';
import { hasApprovalErc20ForSwapToPay, prepareApprovalErc20ForSwapToPay } from './swap-erc20';
import {
  hasErc20ApprovalForSwapWithConversion,
  prepareApprovalErc20ForSwapWithConversionToPay,
} from './swap-conversion-erc20';
import { getPaymentNetworkExtension } from '@requestnetwork/payment-detection';

/**
 * For a given request and user, encode an approval transaction if it is needed.
 * @param request the request
 * @param provider generic provider
 * @param from the user who will pay the request
 * @param options specific to the request payment (conversion, swapping, ...)
 */
export async function encodeRequestErc20ApprovalIfNeeded(
  request: ClientTypes.IRequestData,
  provider: providers.Provider,
  from: string,
  options?: IRequestPaymentOptions,
): Promise<IPreparedTransaction | void> {
  if (options && options.swap) {
    return encodeRequestErc20ApprovalWithSwapIfNeeded(request, provider, from, options);
  } else {
    return encodeRequestErc20ApprovalWithoutSwapIfNeeded(request, provider, from, options);
  }
}

/**
 * For a given request, encode an approval transaction.
 * @param request the request
 * @param provider generic provider
 * @param options specific to the request payment (conversion, ...)
 */
export function encodeRequestErc20Approval(
  request: ClientTypes.IRequestData,
  provider: providers.Provider,
  options?: IRequestPaymentOptions,
): IPreparedTransaction | void {
  if (options && options.swap) {
    return encodeRequestErc20ApprovalWithSwap(request, provider, options);
  } else {
    return encodeRequestErc20ApprovalWithoutSwap(request, provider, options);
  }
}

/**
 * For a given request and user, encode an approval transaction if it is needed when swap is not used.
 * @param request the request
 * @param provider generic provider
 * @param from user who will pay the request
 * @param options specific to the request payment (conversion, swapping, ...)
 */
export async function encodeRequestErc20ApprovalWithoutSwapIfNeeded(
  request: ClientTypes.IRequestData,
  provider: providers.Provider,
  from: string,
  options?: IRequestPaymentOptions,
): Promise<IPreparedTransaction | void> {
  if (await isRequestErc20ApprovalWithoutSwapNeeded(request, provider, from, options)) {
    return encodeRequestErc20ApprovalWithoutSwap(request, provider, options);
  }
}

/**
 * For a given request and user, encode an approval transaction if it is needed when swap is used.
 * @param request the request
 * @param provider generic provider
 * @param from user who will pay the request
 * @param options specific to the request payment (conversion, swapping, ...)
 */
export async function encodeRequestErc20ApprovalWithSwapIfNeeded(
  request: ClientTypes.IRequestData,
  provider: providers.Provider,
  from: string,
  options?: IRequestPaymentOptions,
): Promise<IPreparedTransaction | void> {
  if (!options || !options.swap) {
    throw new Error('No swap options');
  }

  if (await isRequestErc20ApprovalWithSwapNeeded(request, provider, from, options)) {
    return encodeRequestErc20ApprovalWithSwap(request, provider, options);
  }
}

/**
 * For a given request, encode an approval transaction when swap is not used.
 * @param request the request
 * @param provider generic provider
 * @param options specific to the request payment (conversion, ...)
 */
export function encodeRequestErc20ApprovalWithoutSwap(
  request: ClientTypes.IRequestData,
  provider: providers.Provider,
  options?: IRequestPaymentOptions,
): IPreparedTransaction | void {
  const paymentNetwork = getPaymentNetworkExtension(request)?.id;
  const overrides = options?.overrides ? options.overrides : undefined;

  switch (paymentNetwork) {
    case ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT:
      return prepareApproveErc20(request, provider, overrides);
    case ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT:
      return prepareApproveErc20(request, provider, overrides);
    case ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY: {
      if (
        !options ||
        !options.conversion ||
        !options.conversion.currency ||
        options.conversion.currency.type !== RequestLogicTypes.CURRENCY.ERC20
      ) {
        throw new Error('Conversion settings missing');
      }
      return prepareApproveErc20ForProxyConversion(
        request,
        options.conversion.currency.value,
        provider,
        overrides,
      );
    }
  }
}

/**
 * For a given request, encode an approval transaction when swap is used.
 * @param request the request
 * @param provider generic provider
 * @param options specific to the request payment (conversion, swapping, ...)
 */
export function encodeRequestErc20ApprovalWithSwap(
  request: ClientTypes.IRequestData,
  provider: providers.Provider,
  options: IRequestPaymentOptions,
): IPreparedTransaction | void {
  const paymentNetwork = getPaymentNetworkExtension(request)?.id;
  const overrides = options?.overrides ? options.overrides : undefined;

  switch (paymentNetwork) {
    case ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT:
      if (options && options.swap) {
        return prepareApprovalErc20ForSwapToPay(request, options.swap.path[0], provider, overrides);
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
        return prepareApprovalErc20ForSwapWithConversionToPay(
          request,
          options.swap.path[0],
          provider,
          overrides,
        );
      } else {
        throw new Error('No swap options');
      }
    }
    default:
      return;
  }
}

/**
 * Check if for a given request and user, an approval transaction is needed.
 * @param request the request
 * @param provider generic provider
 * @param from user who will make the payment
 * @param options specific to the request payment (conversion, ...)
 */
export async function isRequestErc20ApprovalNeeded(
  request: ClientTypes.IRequestData,
  provider: providers.Provider,
  from: string,
  options?: IRequestPaymentOptions,
): Promise<boolean> {
  if (options && options.swap) {
    return isRequestErc20ApprovalWithSwapNeeded(request, provider, from, options);
  }
  return isRequestErc20ApprovalWithoutSwapNeeded(request, provider, from, options);
}

/**
 * Check if for a given request and user, an approval transaction is needed when swap is not used.
 * @param request the request
 * @param provider generic provider
 * @param from user who will make the payment
 * @param options specific to the request payment (conversion, ...)
 */
export async function isRequestErc20ApprovalWithoutSwapNeeded(
  request: ClientTypes.IRequestData,
  provider: providers.Provider,
  from: string,
  options?: IRequestPaymentOptions,
): Promise<boolean> {
  const paymentNetwork = getPaymentNetworkExtension(request)?.id;

  switch (paymentNetwork) {
    case ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT:
      if (!(await hasErc20Approval(request, from))) {
        return true;
      }
      break;
    case ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT:
      if (!(await hasErc20Approval(request, from))) {
        return true;
      }
      break;
    case ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY: {
      if (
        !options ||
        !options.conversion ||
        !options.conversion.currency ||
        options.conversion.currency.type !== RequestLogicTypes.CURRENCY.ERC20
      ) {
        throw new Error('Conversion settings missing');
      }
      const amount = options.conversion.maxToSpend
        ? options.conversion.maxToSpend
        : BigNumber.from(0);
      if (
        !(await hasErc20ApprovalForProxyConversion(
          request,
          from,
          options.conversion.currency.value,
          provider,
          amount,
        ))
      ) {
        return true;
      }
      break;
    }
  }
  return false;
}

/**
 * Check if for a given request and user, an approval transaction is needed when swap is used.
 * @param request the request
 * @param provider generic provider
 * @param from user who will make the payment
 * @param options specific to the request payment (conversion, swapping, ...)
 */
export async function isRequestErc20ApprovalWithSwapNeeded(
  request: ClientTypes.IRequestData,
  provider: providers.Provider,
  from: string,
  options: IRequestPaymentOptions,
): Promise<boolean> {
  const paymentNetwork = getPaymentNetworkExtension(request)?.id;

  switch (paymentNetwork) {
    case ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT:
      if (options && options.swap) {
        if (
          !(await hasApprovalErc20ForSwapToPay(
            request,
            from,
            options.swap.path[0],
            provider,
            options.swap.maxInputAmount,
          ))
        ) {
          return true;
        }
      } else {
        throw new Error('No swap options');
      }
      break;
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
        const amount = options.swap.maxInputAmount
          ? options.swap.maxInputAmount
          : BigNumber.from(0);
        if (
          !(await hasErc20ApprovalForSwapWithConversion(
            request,
            from,
            options.swap.path[0],
            provider,
            amount,
          ))
        ) {
          return true;
        }
      } else {
        throw new Error('No swap options');
      }
      break;
    }
  }
  return false;
}
