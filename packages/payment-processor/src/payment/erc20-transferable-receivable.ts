import {
  ContractTransaction,
  Signer,
  BigNumberish,
  providers,
  BigNumber,
  constants,
  ethers,
} from 'ethers';

import {
  Erc20PaymentNetwork,
  ERC20TransferableReceivablePaymentDetector,
} from '@requestnetwork/payment-detection';
import { ERC20TransferableReceivable__factory } from '@requestnetwork/smart-contracts/types';
import { ClientTypes } from '@requestnetwork/types';
import MultiFormat from '@requestnetwork/multi-format';

import { ITransactionOverrides } from './transaction-overrides';
import {
  getAmountToPay,
  getProxyAddress,
  getProvider,
  getSigner,
  getRequestPaymentValues,
  validateERC20TransferableReceivable,
  validatePayERC20TransferableReceivable,
} from './utils';
import { IPreparedTransaction } from './prepared-transaction';

// The ERC20 receivable smart contract ABI fragment
const erc20TransferableReceivableContractAbiFragment = [
  'function receivableTokenIdMapping(bytes32) public view returns (uint256)',
];

/**
 * Gets the receivableTokenId from a ERC20TransferableReceivable contract given
 * a paymentReference and paymentAddress of the request
 * @param request
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 */
export async function getReceivableTokenIdForRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Provider | Signer,
): Promise<BigNumber> {
  // Setup the ERC20 proxy contract interface
  const contract = new ethers.Contract(
    getProxyAddress(request, ERC20TransferableReceivablePaymentDetector.getDeploymentInformation),
    erc20TransferableReceivableContractAbiFragment,
    signerOrProvider,
  );

  const { paymentReference, paymentAddress } = getRequestPaymentValues(request);

  return await contract.receivableTokenIdMapping(
    ethers.utils.solidityKeccak256(['address', 'bytes'], [paymentAddress, `0x${paymentReference}`]),
  );
}

/**
 * Helper method to determine whether a request has a receivable minted yet
 *
 * @param request
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 */
export async function hasReceivableForRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Provider | Signer,
): Promise<boolean> {
  const receivableTokenId = await getReceivableTokenIdForRequest(request, signerOrProvider);
  return !receivableTokenId.isZero();
}

/**
 * Processes a transaction to mint an ERC20TransferableReceivable.
 * @param request
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function mintErc20TransferableReceivable(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const { data, to, value } = prepareMintErc20TransferableReceivableTransaction(request);
  const signer = getSigner(signerOrProvider);
  return signer.sendTransaction({ data, to, value, ...overrides });
}

/**
 * Encodes the call to mint a request through an ERC20TransferableReceivable contract, can be used with a Multisig contract.
 * @param request request to pay
 */
export function prepareMintErc20TransferableReceivableTransaction(
  request: ClientTypes.IRequestData,
): IPreparedTransaction {
  validateERC20TransferableReceivable(request);

  return {
    data: encodeMintErc20TransferableReceivableRequest(request),
    to: getProxyAddress(
      request,
      Erc20PaymentNetwork.ERC20TransferableReceivablePaymentDetector.getDeploymentInformation,
    ),
    value: 0,
  };
}

/**
 * Encodes call to mint a request through an ERC20TransferableReceivable contract, can be used with a Multisig contract.
 * @param request request to pay
 */
export function encodeMintErc20TransferableReceivableRequest(
  request: ClientTypes.IRequestData,
): string {
  validateERC20TransferableReceivable(request);

  const tokenAddress = request.currencyInfo.value;
  const requestIdDeserialized = MultiFormat.deserialize(request.requestId).value;

  const { paymentReference, paymentAddress } = getRequestPaymentValues(request);
  const amount = getAmountToPay(request);

  const receivableContract = ERC20TransferableReceivable__factory.createInterface();
  return receivableContract.encodeFunctionData('mint', [
    paymentAddress,
    `0x${paymentReference}`,
    amount,
    tokenAddress,
    requestIdDeserialized,
  ]);
}

/**
 * Processes a transaction to pay an ERC20 receivable Request.
 * @param request
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmount optionally, the fee amount to pay. Defaults to the fee amount of the request.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function payErc20TransferableReceivableRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  amount?: BigNumberish,
  feeAmount?: BigNumberish,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  await validatePayERC20TransferableReceivable(request, signerOrProvider, amount, feeAmount);

  const { data, to, value } = await prepareErc20TransferableReceivablePaymentTransaction(
    request,
    signerOrProvider,
    amount,
    feeAmount,
  );
  const signer = getSigner(signerOrProvider);
  return signer.sendTransaction({ data, to, value, ...overrides });
}

/**
 * Encodes the call to pay a request through the ERC20 receivable contract, can be used with a Multisig contract.
 * @param request request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmountOverride optionally, the fee amount to pay. Defaults to the fee amount of the request.
 */
export async function prepareErc20TransferableReceivablePaymentTransaction(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Provider | Signer,
  amount?: BigNumberish,
  feeAmountOverride?: BigNumberish,
): Promise<IPreparedTransaction> {
  return {
    data: await encodePayErc20TransferableReceivableRequest(
      request,
      signerOrProvider,
      amount,
      feeAmountOverride,
    ),
    to: getProxyAddress(
      request,
      Erc20PaymentNetwork.ERC20TransferableReceivablePaymentDetector.getDeploymentInformation,
    ),
    value: 0,
  };
}

/**
 * Encodes the call to pay a request through the ERC20 receivable contract, can be used with a Multisig contract.
 * @param request request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param feeAmountOverride optionally, the fee amount to pay. Defaults to the fee amount of the request.
 */
export async function encodePayErc20TransferableReceivableRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Provider | Signer,
  amount?: BigNumberish,
  feeAmountOverride?: BigNumberish,
): Promise<string> {
  const amountToPay = getAmountToPay(request, amount);
  const { paymentReference, feeAddress, feeAmount } = getRequestPaymentValues(request);
  const feeToPay = BigNumber.from(feeAmountOverride || feeAmount || 0);

  const receivableContract = ERC20TransferableReceivable__factory.createInterface();

  // get tokenId from requestId
  const receivableTokenId = await getReceivableTokenIdForRequest(request, signerOrProvider);

  return receivableContract.encodeFunctionData('payOwner', [
    receivableTokenId,
    amountToPay,
    `0x${paymentReference}`,
    feeToPay,
    feeAddress || constants.AddressZero,
  ]);
}
