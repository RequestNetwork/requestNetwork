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
 * Encodes the call to pay a batch of requests through the ETH bacth proxy contract, can be used with a Multisig contract.
 * @param requests request to pay
 */
export function encodePayEthBatchRequest(requests: ClientTypes.IRequestData[]): string {
  const paymentReferences: Array<string> = [];
  const paymentAddresses: Array<string> = [];
  const feesToPay: Array<BigNumber> = [];
  const amountsToPay: Array<BigNumber> = [];

  // const feeAddresses: Array<string> = [];
  let feeAddressUsed = constants.AddressZero;
  // TODO: define a proper strategy to choose a feeAddress

  for (let i = 0; i < requests.length; i++) {
    validateEthFeeProxyRequest(requests[i]);
    const { paymentReference, paymentAddress, feeAddress, feeAmount } = getRequestPaymentValues(
      requests[i],
    );

    paymentReferences.push(`0x${paymentReference}`);
    paymentAddresses.push(paymentAddress);
    feeAddressUsed = feeAddress || constants.AddressZero;
    feesToPay.push(BigNumber.from(feeAmount || 0));
    amountsToPay.push(getAmountToPay(requests[i]));
  }

  const proxyContract = BatchPayments__factory.createInterface();

  return proxyContract.encodeFunctionData('batchEthPaymentsWithReference', [
    paymentAddresses,
    amountsToPay,
    paymentReferences,
    feesToPay,
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
  const feesToPay: Array<BigNumber> = [];
  const amountsToPay: Array<BigNumber> = [];

  const network = requests[0].currencyInfo.network;

  for (let i = 0; i < requests.length; i++) {
    validateEthFeeProxyRequest(requests[i]);
    if (network !== requests[i].currencyInfo.network) {
      throw new Error(`Every payment network currency must be identical`);
    }
    const { feeAmount } = getRequestPaymentValues(requests[i]);
    feesToPay.push(BigNumber.from(feeAmount || 0));
    amountsToPay.push(getAmountToPay(requests[i]));
  }

  const encodedTx = encodePayEthBatchRequest(requests);

  if (!network) {
    throw new Error(`payment network must be set`);
  }
  const proxyAddress = batchPaymentsArtifact.getAddress(network);

  const amountToPay = amountsToPay.reduce((sum, current) => sum.add(current), BigNumber.from(0));
  const feeToPay = feesToPay.reduce((sum, current) => sum.add(current), BigNumber.from(0));

  return {
    data: encodedTx,
    to: proxyAddress,
    value: amountToPay.add(feeToPay),
  };
}
