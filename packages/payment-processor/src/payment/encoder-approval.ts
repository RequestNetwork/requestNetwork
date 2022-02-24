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
import { getPaymentNetworkExtension } from './utils';

export function encodeRequestApprovalIfNeeded(
  request: ClientTypes.IRequestData,
  provider: providers.Provider,
  from: string,
  options?: IRequestPaymentOptions,
): Promise<IPreparedTransaction | void> {
  if (options && options.swap) {
    return encodeRequestApprovalWithSwapIfNeeded(request, provider, from, options);
  } else {
    return encodeRequestApprovalWithoutSwapIfNeeded(request, provider, from, options);
  }
}

export async function encodeRequestApprovalWithoutSwapIfNeeded(
  request: ClientTypes.IRequestData,
  provider: providers.Provider,
  from: string,
  options?: IRequestPaymentOptions,
): Promise<IPreparedTransaction | void> {
  const paymentNetwork = getPaymentNetworkExtension(request)?.id;

  switch (paymentNetwork) {
    case ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT:
      if (!(await hasErc20Approval(request, from))) {
        return prepareApproveErc20(request, provider);
      }
      break;
    case ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT:
      if (!(await hasErc20Approval(request, from))) {
        return prepareApproveErc20(request, provider);
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
        return prepareApproveErc20ForProxyConversion(
          request,
          options.conversion.currency.value,
          provider,
        );
      }
      break;
    }
  }
}

export async function encodeRequestApprovalWithSwapIfNeeded(
  request: ClientTypes.IRequestData,
  provider: providers.Provider,
  from: string,
  options: IRequestPaymentOptions,
): Promise<IPreparedTransaction | void> {
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
          return prepareApprovalErc20ForSwapToPay(request, options.swap.path[0], provider);
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
            options.swap.path[options.swap.path.length - 1],
            provider,
            amount,
          ))
        ) {
          return prepareApprovalErc20ForSwapWithConversionToPay(
            request,
            options.swap.path[options.swap.path.length - 1],
            provider,
          );
        }
      } else {
        throw new Error('No swap options');
      }
      break;
    }
    default:
      return;
  }
}
