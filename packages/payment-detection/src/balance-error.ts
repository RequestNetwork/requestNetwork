import { PaymentTypes } from '@requestnetwork/types';

/**
 * Creates the object IBalanceWithEvents from the error code and error message
 *
 * @param message error message
 * @param code error code
 * @returns The object IBalanceWithEvents to return
 */
export default function getBalanceErrorObject(
  message: string,
  code?: PaymentTypes.BALANCE_ERROR_CODE,
): PaymentTypes.IBalanceWithEvents {
  return {
    balance: null,
    error: {
      code: code || PaymentTypes.BALANCE_ERROR_CODE.UNKNOWN,
      message,
    },
    events: [],
  };
}
