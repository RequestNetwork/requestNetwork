/** Validates the presence of the payment reference for payment. */
export function validatePaymentReference(
  paymentReference?: string,
): asserts paymentReference is string {
  if (!paymentReference) {
    throw new Error('Cannot pay without a paymentReference');
  }
}
