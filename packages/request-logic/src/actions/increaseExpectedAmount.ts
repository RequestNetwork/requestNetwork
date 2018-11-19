import { RequestLogic as Types } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import Amount from '../amount';
import Request from '../request';
import Signature from '../signature';
import Transaction from '../transaction';
import Version from '../version';

/**
 * Implementation of the action increaseExpectedAmount from request logic specification
 */
export default {
  applyTransactionToRequest,
  format,
};

/**
 * Function to format a transaction to increase expected amount of a Request
 *
 * @param IRequestLogicIncreaseExpectedAmountParameters increaseAmountParameters parameters to increase expected amount of a request
 * @param ISignatureParameters signatureParams Signature parameters
 *
 * @returns ISignedTransaction  the transaction with the signature
 */
function format(
  increaseAmountParameters: Types.IRequestLogicIncreaseExpectedAmountParameters,
  signatureParams: Types.IRequestLogicSignatureParameters,
): Types.IRequestLogicSignedTransaction {
  if (!Amount.isValid(increaseAmountParameters.deltaAmount)) {
    throw new Error('deltaAmount must be a string representing a positive integer');
  }

  const transaction: Types.IRequestLogicTransaction = {
    action: Types.REQUEST_LOGIC_ACTION.INCREASE_EXPECTED_AMOUNT,
    parameters: increaseAmountParameters,
    version: Version.currentVersion,
  };

  return Transaction.createSignedTransaction(transaction, signatureParams);
}

/**
 * Function to apply an increaseExpectedAmount transaction on a request
 *
 * @param Types.IRequestLogicSignedTransaction signedTransaction the signed transaction to apply
 *
 * @returns Types.IRequestLogicRequest the new request
 */
function applyTransactionToRequest(
  signedTransaction: Types.IRequestLogicSignedTransaction,
  request: Types.IRequestLogicRequest,
): Types.IRequestLogicRequest {
  const transaction = signedTransaction.transaction;

  if (!transaction.parameters.requestId) {
    throw new Error('requestId must be given');
  }
  if (!request.payer) {
    throw new Error('the request must have a payer');
  }
  if (!transaction.parameters.deltaAmount) {
    throw new Error('deltaAmount must be given');
  }
  if (!Amount.isValid(transaction.parameters.deltaAmount)) {
    throw new Error('deltaAmount must be a string representing a positive integer');
  }

  const signer: Types.IRequestLogicIdentity = Transaction.getSignerIdentityFromSignedTransaction(
    signedTransaction,
  );
  const signerRole = Request.getRoleInRequest(signer, request);

  request = Request.pushExtensions(request, transaction.parameters.extensions);
  request.events.push(generateEvent(transaction, signer));

  if (signerRole === Types.REQUEST_LOGIC_ROLE.PAYER) {
    if (request.state === Types.REQUEST_LOGIC_STATE.CANCELLED) {
      throw new Error('the request must not be cancelled');
    }
    // increase the expected amount and store it as string
    request.expectedAmount = Amount.add(request.expectedAmount, transaction.parameters.deltaAmount);

    return request;
  }

  throw new Error('signer must be the payer');
}

/**
 * Private function to generate the event 'IncreaseExpectedAmount' from a transaction
 *
 * @param Types.IRequestLogicTransaction transaction the transaction that create the event
 * @param Types.IRequestLogicIdentity transactionSigner the signer of the transaction
 *
 * @returns Types.IRequestLogicEvent the event generated
 */
function generateEvent(
  transaction: Types.IRequestLogicTransaction,
  transactionSigner: Types.IRequestLogicIdentity,
): Types.IRequestLogicEvent {
  const params = transaction.parameters;

  const event: Types.IRequestLogicEvent = {
    name: Types.REQUEST_LOGIC_ACTION.INCREASE_EXPECTED_AMOUNT,
    parameters: {
      deltaAmount: transaction.parameters.deltaAmount,
      extensionsLength: params.extensions ? params.extensions.length : 0,
    },
    transactionSigner,
  };
  return event;
}
