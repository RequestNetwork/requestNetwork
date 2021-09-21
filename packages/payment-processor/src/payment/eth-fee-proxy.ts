import { constants, BigNumber, BigNumberish, ContractTransaction, providers, Signer } from 'ethers';
import { ClientTypes, PaymentTypes } from '@requestnetwork/types';
import { ethereumFeeProxyArtifact } from '@requestnetwork/smart-contracts';
import { EthereumFeeProxy__factory } from '@requestnetwork/smart-contracts/types';
import { ITransactionOverrides } from './transaction-overrides';
import {
  getAmountToPay,
  getProvider,
  getRequestPaymentValues,
  getSigner,
  validateRequest,
} from './utils';

/**
 * Processes a transaction to pay an ETH Request and fees with the proxy contract.
 * @param request
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmountOverride optionally, the fee amount to pay. Defaults to the fee amount of the request.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function payEthFeeProxyRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  amount?: BigNumberish,
  feeAmountOverride?: BigNumberish,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const encodedTx = encodePayEthFeeProxyRequest(request, signerOrProvider, feeAmountOverride);
  const proxyAddress = ethereumFeeProxyArtifact.getAddress(request.currencyInfo.network!);
  const signer = getSigner(signerOrProvider);
  const amountToPay = getAmountToPay(request, amount);

  const { feeAmount } = getRequestPaymentValues(request);
  const feeToPay = BigNumber.from(feeAmountOverride || feeAmount || 0);

  const tx = await signer.sendTransaction({
    data: encodedTx,
    to: proxyAddress,
    value: amountToPay.add(feeToPay),
    ...overrides,
  });
  return tx;
}

/**
 * Encodes the call to pay a request through the ETH proxy contract, can be used with a Multisig contract.
 * @param request request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param feeAmountOverride optionally, the fee amount to pay. Defaults to the fee amount of the request.
 */
export function encodePayEthFeeProxyRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  feeAmountOverride?: BigNumberish,
): string {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ETH_FEE_PROXY_CONTRACT);
  const signer = getSigner(signerOrProvider);

  const proxyAddress = ethereumFeeProxyArtifact.getAddress(request.currencyInfo.network!);

  const { paymentReference, paymentAddress, feeAddress, feeAmount } = getRequestPaymentValues(
    request,
  );

  const feeToPay = BigNumber.from(feeAmountOverride || feeAmount || 0);

  const proxyContract = EthereumFeeProxy__factory.connect(proxyAddress, signer);
  return proxyContract.interface.encodeFunctionData('transferWithReferenceAndFee', [
    paymentAddress,
    `0x${paymentReference}`,
    feeToPay,
    feeAddress || constants.AddressZero,
  ]);
}
