import { BigNumberish, ContractTransaction, providers, Signer } from 'ethers';
import { ClientTypes, PaymentTypes } from '@requestnetwork/types';
import { EthInputDataPaymentDetector } from '@requestnetwork/payment-detection';
import { EthereumProxy__factory } from '@requestnetwork/smart-contracts/types';
import { ITransactionOverrides } from './transaction-overrides';
import {
  getAmountToPay,
  getProxyAddress,
  getProvider,
  getRequestPaymentValues,
  getSigner,
  validateRequest,
} from './utils';
import { IPreparedTransaction } from './prepared-transaction';

/**
 * Processes a transaction to pay an ETH Request with the proxy contract.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function payEthProxyRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  amount?: BigNumberish,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const signer = getSigner(signerOrProvider);
  const { data, to, value } = prepareEthProxyPaymentTransaction(request, amount);
  return signer.sendTransaction({ data, to, value, ...overrides });
}

/**
 * Encodes the call to pay a request through the ETH proxy contract, can be used with a Multisig contract.
 * @param request request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 */
export function encodePayEthProxyRequest(request: ClientTypes.IRequestData): string {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA);

  const { paymentReference, paymentAddress } = getRequestPaymentValues(request);

  const proxyContract = EthereumProxy__factory.createInterface();
  return proxyContract.encodeFunctionData('transferWithReference', [
    paymentAddress,
    `0x${paymentReference}`,
  ]);
}

export function prepareEthProxyPaymentTransaction(
  request: ClientTypes.IRequestData,
  amount?: BigNumberish,
): IPreparedTransaction {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA);

  const encodedTx = encodePayEthProxyRequest(request);
  const proxyAddress = getProxyAddress(request, (network, version) =>
    EthInputDataPaymentDetector.getDeploymentInformation(network, version),
  );
  const amountToPay = getAmountToPay(request, amount);

  return {
    data: encodedTx,
    to: proxyAddress,
    value: amountToPay,
  };
}
