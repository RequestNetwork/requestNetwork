import {
  ClientTypes,
  CurrencyTypes,
  ExtensionTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { BigNumber, BigNumberish } from 'ethers';
import { IConversionPaymentSettings } from './payment';
import { ITransactionOverrides } from './payment/transaction-overrides';

/**
 * Approval settings
 */
export interface IApprovalSettings {
  /** The specific amount to approve. Defaults to maximum when left empty */
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
  currencyManager?: CurrencyTypes.ICurrencyManager;
  /** maximum time in seconds of how old chainlink rate can be used, default is zero for infinitely old */
  maxRateAge?: number;
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

  /** Optional, specifies if escrow is being used */
  isEscrow?: boolean;

  /** Used, and required, only for batch payment.
   * Check the value of batchFeeAmountUSDLimit of the batch proxy deployed.
   * Setting the value to true skips the USD fee limit, and reduces gas consumption.
   */
  skipFeeUSDLimit?: boolean;
  /** Optional, only for batch payment to define the proxy to use. */
  version?: string;
}

export type BatchPaymentNetworks =
  | ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY
  | ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ETH_PROXY
  | ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT
  | ExtensionTypes.PAYMENT_NETWORK_ID.ETH_FEE_PROXY_CONTRACT;

/**
 * Input of batch conversion payment processor
 * It contains requests, paymentSettings, amount and feeAmount.
 * Currently, these requests must have the same PN, version, and batchFee
 * @dev next step: paymentNetworkId could get more values options to pay Native tokens.
 */
export interface EnrichedRequest {
  paymentNetworkId: BatchPaymentNetworks;
  request: ClientTypes.IRequestData;
  paymentSettings: IConversionPaymentSettings;
  amount?: BigNumberish;
  feeAmount?: BigNumberish;
}
