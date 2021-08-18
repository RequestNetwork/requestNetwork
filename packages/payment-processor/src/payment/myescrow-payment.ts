import { constants, ContractTransaction, Signer, BigNumberish, providers, BigNumber, BytesLike } from 'ethers';
import {
  MyEscrow
} from '@requestnetwork/smart-contracts/types';
import { ClientTypes} from '@requestnetwork/types';
import {
  getSigner,
} from './utils';




/**
 * Processes a transaction to initiate and deposit erc20 tokens into escrow.
 * @param tokenAddress contract address of erc20 token used as payment.
 * @param amount the amount to pay. Defaults to remaining amount of the request.
 * @param payee The beneficiary of the escrowed funds.
 * @param request The paymentRef to pay.
 * @param feeAmount The fee amount to pay. Defaults to the fee amount.
 * @param buidlerAddress The buidlerAddress recieves the fee amount.
 */

export async function initiateEscrowAndDeposit(
    tokenAddress: string,
    amount: BigNumberish,
    payee: string,
    request: ClientTypes.IRequestData,
    feeAmount: BigNumberish,
    buidlerAddress: string
    ): Promise<ContractTransaction> 
{
    const encodedTx = await MyEscrow.initAndDeposit(tokenAddress, amount, payee, request, feeAmount, buidlerAddress);
    return encodedTx;
}










/**
 import { erc20FeeProxyArtifact } from '@requestnetwork/smart-contracts';
 import { ERC20FeeProxy__factory } from '@requestnetwork/smart-contracts/types';
 import { ClientTypes, PaymentTypes } from '@requestnetwork/types';
 
 import { ITransactionOverrides } from './transaction-overrides';
 import {
   getAmountToPay,
   getProvider,
   getRequestPaymentValues,
   getSigner,
   validateErc20FeeProxyRequest,
   validateRequest,
 } from './utils';

/**
 * Processes a transaction to pay an ERC20 Request with fees.
 * @param request 
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmount optionally, the fee amount to pay. Defaults to the fee amount.
 * @param overrides optionally, override default transaction values, like gas.
 */
/*
export async function payErc20FeeProxyRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  amount?: BigNumberish,
  feeAmount?: BigNumberish,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const encodedTx = encodePayErc20FeeRequest(request, signerOrProvider, amount, feeAmount);
  const proxyAddress = erc20FeeProxyArtifact.getAddress(request.currencyInfo.network!);
  const signer = getSigner(signerOrProvider);

  const tx = await signer.sendTransaction({
    data: encodedTx,
    to: proxyAddress,
    value: 0,
    ...overrides,
  });
  return tx;
}
*/
/**
 * Encodes the call to pay a request through the ERC20 fee proxy contract, can be used with a Multisig contract.
 * @param request request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmountOverride optionally, the fee amount to pay. Defaults to the fee amount of the request.
 */

/*
export function encodePayErc20FeeRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  amount?: BigNumberish,
  feeAmountOverride?: BigNumberish,
): string {
  validateErc20FeeProxyRequest(request, amount, feeAmountOverride);

  const signer = getSigner(signerOrProvider);
  const tokenAddress = request.currencyInfo.value;
  const { paymentReference, paymentAddress, feeAddress, feeAmount } = getRequestPaymentValues(
    request,
  );
  const amountToPay = getAmountToPay(request, amount);
  const feeToPay = BigNumber.from(feeAmountOverride || feeAmount || 0);
  const proxyAddress = erc20FeeProxyArtifact.getAddress(request.currencyInfo.network!);
  const proxyContract = ERC20FeeProxy__factory.connect(proxyAddress, signer);

  return proxyContract.interface.encodeFunctionData('transferFromWithReferenceAndFee', [
    tokenAddress,
    paymentAddress,
    amountToPay,
    `0x${paymentReference}`,
    feeToPay,
    feeAddress || constants.AddressZero,
  ]);
}

/**
 * Return the EIP-681 format URL with the transaction to pay an ERC20
 * Warning: this EIP isn't widely used, be sure to test compatibility yourself.
 *
 * @param request
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmountOverride optionally, the fee amount to pay. Defaults to the fee amount of the request.
 */
/*
export function _getErc20FeeProxyPaymentUrl(
  request: ClientTypes.IRequestData,
  amount?: BigNumberish,
  feeAmountOverride?: BigNumberish,
): string {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT);
  const { paymentReference, paymentAddress, feeAddress, feeAmount } = getRequestPaymentValues(
    request,
  );
  const contractAddress = erc20FeeProxyArtifact.getAddress(request.currencyInfo.network!);
  const amountToPay = getAmountToPay(request, amount);
  const feeToPay = feeAmountOverride || BigNumber.from(feeAmount || 0);
  const parameters = `transferFromWithReferenceAndFee?address=${request.currencyInfo.value}&address=${paymentAddress}&uint256=${amountToPay}&bytes=${paymentReference}&uint256=${feeToPay}&address=${feeAddress}`;
  return `ethereum:${contractAddress}/${parameters}`;
}

*/