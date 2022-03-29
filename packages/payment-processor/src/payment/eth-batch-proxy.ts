import { constants, ContractTransaction, Signer, providers, BigNumber } from 'ethers';

import { ClientTypes } from '@requestnetwork/types';
// import { EthFeeProxyPaymentDetector } from '@requestnetwork/payment-detection';
// import { EthereumFeeProxy__factory } from '@requestnetwork/smart-contracts/types';
import { batchPaymentsArtifact } from '@requestnetwork/smart-contracts';
import { BatchPayments__factory } from '@requestnetwork/smart-contracts/types';
import { validateEthFeeProxyRequest } from './eth-fee-proxy';
import { ITransactionOverrides } from './transaction-overrides';
import {
  getAmountToPay,
  // getProxyAddress,
  getProvider,
  getRequestPaymentValues,
  getSigner,
} from './utils';
import { IPreparedTransaction } from './prepared-transaction';

// TODO: define archi to get this info
const BATCH_FEE = 0.01; // 0% <= BATCH_FEE < 100%

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
 * Get eth batch arguments
 * @param requests
 * @returns
 */
function GetEthBatchArgs(
  requests: ClientTypes.IRequestData[],
): [Array<string>, Array<BigNumber>, Array<string>, Array<BigNumber>, string] {
  const paymentReferences: Array<string> = [];
  const paymentAddresses: Array<string> = [];
  let feeAddressUsed = constants.AddressZero;
  // TODO: define a proper strategy to choose a feeAddress

  const feesToPay: Array<BigNumber> = [];
  const amountsToPay: Array<BigNumber> = [];
  const batchFeesToPay: Array<BigNumber> = [];

  const network = requests[0].currencyInfo.network;

  for (let i = 0; i < requests.length; i++) {
    validateEthFeeProxyRequest(requests[i]);
    if (network !== requests[i].currencyInfo.network) {
      throw new Error(`Every payment network currency must be identical`);
    }

    const { paymentReference, paymentAddress, feeAddress, feeAmount } = getRequestPaymentValues(
      requests[i],
    );

    paymentReferences.push(`0x${paymentReference}`);
    paymentAddresses.push(paymentAddress);
    feesToPay.push(BigNumber.from(feeAmount || 0));
    const amountToPay = getAmountToPay(requests[i]);
    amountsToPay.push(amountToPay);
    batchFeesToPay.push(
      BigNumber.from(amountToPay)
        .mul(BATCH_FEE * 100)
        .div(100),
    );

    feeAddressUsed = feeAddress || constants.AddressZero;
  }

  const feesAndBatchFeesToPay = feesToPay.concat(batchFeesToPay);

  return [paymentAddresses, amountsToPay, paymentReferences, feesAndBatchFeesToPay, feeAddressUsed];
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
    feesAndBatchFeesToPay,
    feeAddressUsed,
  ] = GetEthBatchArgs(requests);

  const proxyContract = BatchPayments__factory.createInterface();

  return proxyContract.encodeFunctionData('batchEthPaymentsWithReference', [
    paymentAddresses,
    amountsToPay,
    paymentReferences,
    feesAndBatchFeesToPay,
    feeAddressUsed,
  ]);
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
    feesAndBatchFeesToPay,
    _feeAddressUsed,
  ] = GetEthBatchArgs(requests);

  _paymentReferences;
  _paymentAddresses;
  _feeAddressUsed; // unused

  const encodedTx = encodePayEthBatchRequest(requests);

  const network = requests[0].currencyInfo.network;
  if (!network) {
    throw new Error(`payment network must be set`);
  }
  const proxyAddress = batchPaymentsArtifact.getAddress(network);

  const amountToPay = amountsToPay.reduce((sum, current) => sum.add(current), BigNumber.from(0));
  const feeToPay = feesAndBatchFeesToPay.reduce(
    (sum, current) => sum.add(current),
    BigNumber.from(0),
  );

  return {
    data: encodedTx,
    to: proxyAddress,
    value: amountToPay.add(feeToPay),
  };
}
