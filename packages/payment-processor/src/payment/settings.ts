import { ICurrencyManager } from '@requestnetwork/currency';
import { RequestLogicTypes } from '@requestnetwork/types';
import { BigNumber, BigNumberish } from 'ethers';
import { ITransactionOverrides } from './transaction-overrides';

/**
 * Approval settings
 */
export interface IApprovalSettings {
  /** The specifiec amount to approve. Defaults to maximum when left empty */
  amount: BigNumber;
}

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
  /** a currency manager to access currencies property, like decimals */
  currencyManager?: ICurrencyManager;
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
  /** Optional, enable to approve only specific amount of token. Defaults to MAX_ALLOWANCE if not set */
  approval?: IApprovalSettings;
}
