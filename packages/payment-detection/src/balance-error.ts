import { PaymentTypes } from '@requestnetwork/types';

export class BalanceError extends Error {
  constructor(message: string, public readonly code: PaymentTypes.BALANCE_ERROR_CODE) {
    super(message);
  }
}

/* eslint-disable max-classes-per-file */
/** Exception when network not supported */
export class NetworkNotSupported extends BalanceError {
  constructor(msg: string) {
    super(msg, PaymentTypes.BALANCE_ERROR_CODE.NETWORK_NOT_SUPPORTED);
  }
}
/** Exception when version not supported */
export class VersionNotSupported extends BalanceError {
  constructor(msg: string) {
    super(msg, PaymentTypes.BALANCE_ERROR_CODE.VERSION_NOT_SUPPORTED);
  }
}

export class ExtensionMissingRequiredValue extends BalanceError {
  constructor(extension: PaymentTypes.PAYMENT_NETWORK_ID, name: string) {
    super(`${extension} misses required value ${name}`, PaymentTypes.BALANCE_ERROR_CODE.UNKNOWN);
  }
}

/**
 * Creates the object IBalanceWithEvents from the error code and error message
 *
 * @param message error message
 * @param code error code
 * @returns The object IBalanceWithEvents to return
 */
export function getBalanceErrorObject(error: Error): PaymentTypes.IBalanceWithEvents {
  const code = error && error instanceof BalanceError ? error.code : undefined;
  return {
    balance: null,
    error: {
      code: code || PaymentTypes.BALANCE_ERROR_CODE.UNKNOWN,
      message: error?.message,
    },
    events: [],
  };
}
