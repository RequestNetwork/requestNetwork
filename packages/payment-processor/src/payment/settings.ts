import { RequestLogicTypes } from '@requestnetwork/types';
import { BigNumberish } from 'ethers';
import { ITransactionOverrides } from './transaction-overrides';

/**
 * Details required for a token swap
 */
export interface ISwapSettings {
  /** time in milliseconds since UNIX epoch, after which the swap should not be executed. */
  deadline: number;
  /** maximum number of ERC20 allowed for the swap before payment, considering both amount and fees */
  maxInputAmount: BigNumberish;
  /**
   * array of token addresses to be used for the "swap path".
   * ['0xPaymentCurrency', '0xIntermediate1', ..., '0xRequestCurrency']
   */
  path: string[];
}

export interface IConversionSettings {
  /** should be a valid currency type and accepted token value */
  currency: RequestLogicTypes.ICurrency;
  /** maximum number of tokens to be spent when the conversion is made */
  maxToSpend?: BigNumberish;
}

/**
 * Options to pay a request
 */
export interface IRequestPaymentOptions {
  /** custom request amount to pay */
  amount?: BigNumberish;
  /** custom fee amount to pay for the proxy */
  feeAmount?: BigNumberish;
  /** custom transaction parameters */
  overrides?: ITransactionOverrides;

  /** Used, and required, only for a swap payment. */
  swap?: ISwapSettings;
  /** Used, and required, only for on chain conversion */
  conversion?: IConversionSettings;
}
