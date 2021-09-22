import { constants, ContractTransaction, Signer, providers, BigNumberish, BigNumber } from 'ethers';

import { ClientTypes, PaymentTypes } from '@requestnetwork/types';
import { ethereumFeeProxyArtifact } from '@requestnetwork/smart-contracts';
import { EthereumFeeProxy__factory } from '@requestnetwork/smart-contracts/types';

import { ITransactionOverrides } from './transaction-overrides';
import {
  getAmountToPay,
  getPaymentNetworkExtension,
  getProvider,
  getRequestPaymentValues,
  getSigner,
  validateEthFeeProxyRequest,
  validateRequest,
} from './utils';
import { IPreparedTransaction } from './prepared-transaction';

/**
 * Processes a transaction to pay an ETH Request with fees.
 * @param request
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmount optionally, the fee amount to pay. Defaults to the fee amount.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function payEthFeeProxyRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  amount?: BigNumberish,
  feeAmount?: BigNumberish,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const { data, to, value } = prepareEthFeeProxyPaymentTransaction(request, amount, feeAmount);
  const signer = getSigner(signerOrProvider);
  return signer.sendTransaction({ data, to, value, ...overrides });
}

/**
 * Encodes the call to pay a request through the ETH fee proxy contract, can be used with a Multisig contract.
 * @param request request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmountOverride optionally, the fee amount to pay. Defaults to the fee amount of the request.
 */
export function encodePayEthFeeProxyRequest(
  request: ClientTypes.IRequestData,
  amount?: BigNumberish,
  feeAmountOverride?: BigNumberish,
): string {
  validateEthFeeProxyRequest(request, amount, feeAmountOverride);

  const { paymentReference, paymentAddress, feeAddress, feeAmount } = getRequestPaymentValues(
    request,
  );
  const feeToPay = BigNumber.from(feeAmountOverride || feeAmount || 0);
  const proxyContract = EthereumFeeProxy__factory.createInterface();

  return proxyContract.encodeFunctionData('transferWithReferenceAndFee', [
    paymentAddress,
    `0x${paymentReference}`,
    feeToPay,
    feeAddress || constants.AddressZero,
  ]);
}

/**
 * Return the EIP-681 format URL with the transaction to pay an ETH
 * Warning: this EIP isn't widely used, be sure to test compatibility yourself.
 *
 * @param request
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmountOverride optionally, the fee amount to pay. Defaults to the fee amount of the request.
 */
export function _getEthFeeProxyPaymentUrl(
  request: ClientTypes.IRequestData,
  amount?: BigNumberish,
  feeAmountOverride?: BigNumberish,
): string {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ETH_FEE_PROXY_CONTRACT);
  const {
    paymentReference,
    paymentAddress,
    feeAddress,
    feeAmount,
    version,
  } = getRequestPaymentValues(request);
  const contractAddress = ethereumFeeProxyArtifact.getAddress(
    request.currencyInfo.network!,
    version,
  );
  const feeToPay = feeAmountOverride || BigNumber.from(feeAmount || 0);
  const amountToPay = getAmountToPay(request, amount);
  const parameters = `transferWithReferenceAndFee?&address=${paymentAddress}&bytes=${paymentReference}&uint256=${feeToPay}&address=${feeAddress}&value=${amountToPay.add(
    feeToPay,
  )}`;
  return `ethereum:${contractAddress}/${parameters}`;
}

/**
 * Prepate the transaction to pay a request through the ETH fee proxy contract, can be used with a Multisig contract.
 * @param request request to pay
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmountOverride optionally, the fee amount to pay. Defaults to the fee amount of the request.
 */
export function prepareEthFeeProxyPaymentTransaction(
  request: ClientTypes.IRequestData,
  amount?: BigNumberish,
  feeAmountOverride?: BigNumberish,
): IPreparedTransaction {
  validateEthFeeProxyRequest(request, amount, feeAmountOverride);

  const { feeAmount } = getRequestPaymentValues(request);

  const amountToPay = getAmountToPay(request, amount);
  const feeToPay = feeAmountOverride || BigNumber.from(feeAmount || 0);
  const encodedTx = encodePayEthFeeProxyRequest(request, amount, feeAmountOverride);
  const pn = getPaymentNetworkExtension(request);
  const proxyAddress = ethereumFeeProxyArtifact.getAddress(
    request.currencyInfo.network!,
    pn?.version,
  );

  return {
    data: encodedTx,
    to: proxyAddress,
    value: amountToPay.add(feeToPay),
  };
}
