import { constants, ContractTransaction, Signer, providers, BigNumber } from 'ethers';

import { ClientTypes } from '@requestnetwork/types';
import { batchPaymentsArtifact } from '@requestnetwork/smart-contracts';
import { BatchPayments__factory } from '@requestnetwork/smart-contracts/types';
import { validateEthFeeProxyRequest } from './eth-fee-proxy';
import { ITransactionOverrides } from './transaction-overrides';
import { getAmountToPay, getProvider, getRequestPaymentValues, getSigner } from './utils';
import { IPreparedTransaction } from './prepared-transaction';

// TODO: define archi to get this info
const BATCH_FEE = 10; // 0% <= BATCH_FEE < 100%, value=10 is eq to 1%

/**
 * Processes a batch transaction to pay many ETH Requests with fees.
 * @param requests List of request
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function payEthBatchProxyRequest(
  requests: ClientTypes.IRequestData[],
  signerOrProvider: providers.Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const { data, to, value } = prepareEthBatchPaymentTransaction(requests);
  const signer = getSigner(signerOrProvider);
  return signer.sendTransaction({ data, to, value, ...overrides });
}

/**
 * Prepate the transaction to pay a batch of requests through the ETH fee proxy contract, can be used with a Multisig contract.
 * @param requests request to pay
 */
export function prepareEthBatchPaymentTransaction(
  requests: ClientTypes.IRequestData[],
): IPreparedTransaction {
  const [
    _paymentAddresses,
    amountsToPay,
    _paymentReferences,
    feesToPay,
    _feeAddress,
  ] = GetEthBatchArgs(requests);

  _paymentReferences;
  _paymentAddresses;
  _feeAddress;

  const encodedTx = encodePayEthBatchRequest(requests);

  const network = requests[0].currencyInfo.network;
  if (!network) {
    throw new Error(`payment network must be set`);
  }
  const proxyAddress = batchPaymentsArtifact.getAddress(network);

  const amountToPay = amountsToPay.reduce((sum, current) => sum.add(current), BigNumber.from(0));
  const batchFeeToPay = BigNumber.from(amountToPay).mul(BATCH_FEE).div(1000);
  const feeToPay = feesToPay.reduce(
    (sum, current) => sum.add(current),
    BigNumber.from(batchFeeToPay),
  );

  return {
    data: encodedTx,
    to: proxyAddress,
    value: amountToPay.add(feeToPay),
  };
}

/**
 * Encodes the call to pay a batch of requests through the ETH batch proxy contract, can be used with a Multisig contract.
 * @param requests request to pay
 */
export function encodePayEthBatchRequest(requests: ClientTypes.IRequestData[]): string {
  const [
    paymentAddresses,
    amountsToPay,
    paymentReferences,
    feesToPay,
    feeAddress,
  ] = GetEthBatchArgs(requests);

  const proxyContract = BatchPayments__factory.createInterface();

  return proxyContract.encodeFunctionData('batchEthPaymentsWithReference', [
    paymentAddresses,
    amountsToPay,
    paymentReferences,
    feesToPay,
    feeAddress,
  ]);
}

/**
 * Get eth batch arguments
 * @param requests List of request
 * @returns List with the args required by batchEthPaymentsWithReference
 */
function GetEthBatchArgs(
  requests: ClientTypes.IRequestData[],
): [Array<string>, Array<BigNumber>, Array<string>, Array<BigNumber>, string] {
  const paymentAddresses: Array<string> = [];
  const amountsToPay: Array<BigNumber> = [];
  const paymentReferences: Array<string> = [];
  const feesToPay: Array<BigNumber> = [];
  let feeAddressUsed = constants.AddressZero;

  const network = requests[0].currencyInfo.network;

  for (let i = 0; i < requests.length; i++) {
    validateEthFeeProxyRequest(requests[i]);
    if (network !== requests[i].currencyInfo.network) {
      throw new Error(`Every payment network currency must be identical`);
    }

    const { paymentReference, paymentAddress, feeAddress, feeAmount } = getRequestPaymentValues(
      requests[i],
    );

    paymentAddresses.push(paymentAddress);
    const amountToPay = getAmountToPay(requests[i]);
    amountsToPay.push(amountToPay);
    paymentReferences.push(`0x${paymentReference}`);
    feesToPay.push(BigNumber.from(feeAmount || 0));
    feeAddressUsed = feeAddress || constants.AddressZero;
  }

  return [paymentAddresses, amountsToPay, paymentReferences, feesToPay, feeAddressUsed];
}
