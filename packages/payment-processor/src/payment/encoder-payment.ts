import { IRequestPaymentOptions } from './settings';
import { IPreparedTransaction } from './prepared-transaction';
import { providers } from 'ethers';
import { ClientTypes, ExtensionTypes } from '@requestnetwork/types';
import { getPaymentNetworkExtension } from '@requestnetwork/payment-detection';
import { prepareErc20ProxyPaymentTransaction } from './erc20-proxy';
import { prepareErc20FeeProxyPaymentTransaction } from './erc20-fee-proxy';

/**
 * Encodes a transaction to pay a Request in generic way. ERC777 stream excepted.
 * @param request the request data to pay
 * @param provider the Web3 provider. Defaults to window.ethereum.
 * @param options optionally, the request payment options.
 */
export async function encodeRequestPayment(
  request: ClientTypes.IRequestData,
  _provider: providers.Provider,
  options?: IRequestPaymentOptions,
): Promise<IPreparedTransaction> {
  return await encodeRequestPaymentWithoutSwap(request, options);
}

/**
 * Encodes a transaction to pay a Request in generic way without swap.
 * @param request the request data to pay
 * @param options optionally, the request payment options.
 */
export async function encodeRequestPaymentWithoutSwap(
  request: ClientTypes.IRequestData,
  options?: IRequestPaymentOptions,
): Promise<IPreparedTransaction> {
  const paymentNetwork = getPaymentNetworkExtension(request)?.id;
  const amount = options?.amount ? options.amount : undefined;
  const feeAmount = options?.feeAmount ? options.feeAmount : undefined;
  const overrides = options?.overrides ? options.overrides : {};

  switch (paymentNetwork) {
    case ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT:
      return {
        ...await prepareErc20ProxyPaymentTransaction(request, amount),
        ...overrides,
      };
    case ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT:
      return {
        ...await prepareErc20FeeProxyPaymentTransaction(request, amount, feeAmount),
        ...overrides,
      };
    default:
      throw new Error('Payment network not found');
  }
}
