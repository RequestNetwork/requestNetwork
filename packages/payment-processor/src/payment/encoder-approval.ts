import { IRequestPaymentOptions } from './settings';
import { IPreparedTransaction } from './prepared-transaction';
import { providers } from 'ethers';
import { hasErc20Approval, prepareApproveErc20 } from './erc20';
import { ClientTypes, ExtensionTypes } from '@requestnetwork/types';
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
export async function encodeRequestErc20Approval(
  request: ClientTypes.IRequestData,
  provider: providers.Provider,
  options?: IRequestPaymentOptions,
): Promise<void | IPreparedTransaction> {
    return await encodeRequestErc20ApprovalWithoutSwap(request, provider, options);
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
  _request: ClientTypes.IRequestData,
  _provider: providers.Provider,
  _from: string,
  options?: IRequestPaymentOptions,
): Promise<IPreparedTransaction | void> {
  if (!options || !options.swap) {
    throw new Error('No swap options');
  }
}

/**
 * For a given request, encode an approval transaction when swap is not used.
 * @param request the request
 * @param provider generic provider
 * @param options specific to the request payment (conversion, ...)
 */
export async function encodeRequestErc20ApprovalWithoutSwap(
  request: ClientTypes.IRequestData,
  provider: providers.Provider,
  options?: IRequestPaymentOptions,
): Promise<void | IPreparedTransaction> {
  const paymentNetwork = getPaymentNetworkExtension(request)?.id;
  const overrides = options?.overrides;

  switch (paymentNetwork) {
    case ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT:
      return prepareApproveErc20(request, provider, overrides, options?.approval?.amount);
    case ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT:
      return prepareApproveErc20(request, provider, overrides, options?.approval?.amount);
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
  _provider: providers.Provider,
  from: string,
  _options?: IRequestPaymentOptions,
): Promise<boolean> {
  const paymentNetwork = getPaymentNetworkExtension(request)?.id;

  switch (paymentNetwork) {
    case ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT:
      if (!(await hasErc20Approval(request, from))) {
        return true;
      }
      break;
    case ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT:
      if (!(await hasErc20Approval(request, from))) {
        return true;
      }
      break;
  }
  return false;
}
