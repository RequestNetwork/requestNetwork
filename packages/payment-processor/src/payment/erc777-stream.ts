import {
  ContractTransaction,
  Signer,
  Overrides,
  providers,
  BigNumberish,
  BigNumber,
  ethers,
} from 'ethers';

import { ClientTypes, ExtensionTypes, PaymentTypes } from '@requestnetwork/types';
import { getPaymentNetworkExtension } from '@requestnetwork/payment-detection';

import { getNetworkProvider, getProvider, getRequestPaymentValues, validateRequest } from './utils';
import { Framework } from '@superfluid-finance/sdk-core';
import { IPreparedTransaction } from './prepared-transaction';
import { ITransactionOverrides } from './transaction-overrides';
import * as erc777Artefact from '@openzeppelin/contracts/build/contracts/IERC777.json';

export const RESOLVER_ADDRESS = '0x913bbCFea2f347a24cfCA441d483E7CBAc8De3Db';
// Superfluid payments of requests use the generic field `userData` to index payments.
// Since it's a multi-purpose field, payments will use a fix-prefix heading the payment reference,
// in order to speed up the indexing and payment detection.
export const USERDATA_PREFIX = '0xbeefac';

/**
 * Processes a transaction to pay an ERC777 stream Request.
 * @param request the request to pay
 * @param signer the Web3 signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function payErc777StreamRequest(
  request: ClientTypes.IRequestData,
  signer: Signer,
  overrides?: Overrides,
): Promise<ContractTransaction> {
  const { data, to, value } = await prepareErc777StreamPaymentTransaction(
    request,
    signer.provider ?? getProvider(),
  );
  return signer.sendTransaction({ data, to, value, ...overrides });
}

/**
 * Processes a transaction to complete an ERC777 stream paying a Request.
 * @param request the request to pay
 * @param signer the Web3 signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function completeErc777StreamRequest(
  request: ClientTypes.IRequestData,
  signer: Signer,
  overrides?: Overrides,
): Promise<ContractTransaction> {
  const id = getPaymentNetworkExtension(request)?.id;
  if (id !== ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM) {
    throw new Error('Not a supported ERC777 payment network request');
  }
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC777_STREAM);
  const sf = await getSuperFluidFramework(request, signer.provider ?? getProvider());
  // FIXME: according to specs PR https://github.com/RequestNetwork/requestNetwork/pull/688
  // in file packages/advanced-logic/specs/payment-network-erc777-stream-0.1.0.md
  // Below are the SF actions to add in the BatchCall :
  // - use expectedEndDate to compute offset between stop of invoicing and stop of streaming
  // - stop fee streaming
  const streamPayOp = await getStopStreamOp(sf, signer, request, overrides);
  const batchCall = sf.batchCall([streamPayOp]);
  return batchCall.exec(signer);
}

/**
 * Encodes the call to pay a request through the ERC20 fee proxy contract, can be used with a Multisig contract.
 * @param request the request to pay
 * @param provider the Web3 provider. Defaults to window.ethereum.
 */
export async function getSuperFluidFramework(
  request: ClientTypes.IRequestData,
  provider: providers.Provider,
): Promise<Framework> {
  const isNetworkPrivate = request.currencyInfo.network === 'private';
  const networkName = isNetworkPrivate ? 'custom' : request.currencyInfo.network;
  return await Framework.create({
    networkName,
    provider: provider,
    dataMode: isNetworkPrivate ? 'WEB3_ONLY' : undefined,
    resolverAddress: isNetworkPrivate ? RESOLVER_ADDRESS : undefined,
    protocolReleaseVersion: isNetworkPrivate ? 'test' : undefined,
  });
}

/**
 * Get from SuperFluid framework the operation to start paying a request.
 * @param sf the SuperFluid framework to use
 * @param request the request to pay
 */
async function getStartStreamOp(sf: Framework, request: ClientTypes.IRequestData) {
  const superToken = await sf.loadSuperToken(request.currencyInfo.value);
  const { paymentReference, paymentAddress, expectedFlowRate } = getRequestPaymentValues(request);
  return sf.cfaV1.createFlow({
    flowRate: expectedFlowRate ?? '0',
    receiver: paymentAddress,
    superToken: superToken.address,
    userData: `${USERDATA_PREFIX}${paymentReference}`,
  });
}

/**
 * Get from SuperFluid framework the operation to stop paying a request.
 * @param sf the SuperFluid framework to use
 * @param signer the Web3 signer. Defaults to window.ethereum.
 * @param request the request to pay
 * @param overrides optionally, override default transaction values, like gas.
 */
async function getStopStreamOp(
  sf: Framework,
  signer: Signer,
  request: ClientTypes.IRequestData,
  overrides?: Overrides,
) {
  const superToken = await sf.loadSuperToken(request.currencyInfo.value);
  const { paymentReference, paymentAddress } = getRequestPaymentValues(request);
  return sf.cfaV1.deleteFlow({
    superToken: superToken.address,
    sender: await signer.getAddress(),
    receiver: paymentAddress,
    userData: `${USERDATA_PREFIX}${paymentReference}`,
    overrides: overrides,
  });
}

/**
 * Encodes the call to pay a request through the ERC777 SuperFluid stream contract.
 * @param request the request to pay
 * @param sf the SuperFluid framework to use
 */
export async function encodePayErc777StreamRequest(
  request: ClientTypes.IRequestData,
  sf: Framework,
): Promise<string> {
  // FIXME: according to specs PR https://github.com/RequestNetwork/requestNetwork/pull/688
  // in file packages/advanced-logic/specs/payment-network-erc777-stream-0.1.0.md
  // Below are the SF actions to add in the BatchCall:
  // - use expectedStartDate to compute offset between start of invoicing and start of streaming
  // - start fee streaming
  const streamPayOp = await getStartStreamOp(sf, request);
  const batchCall = sf.batchCall([streamPayOp]);

  const operationStructArray = await Promise.all(batchCall.getOperationStructArrayPromises);
  return batchCall.host.hostContract.interface.encodeFunctionData('batchCall', [
    operationStructArray,
  ]);
}
/**
 * Prepare the transaction to pay a request through the ERC777 SuperFluid stream contract.
 * @param request the request to pay
 * @param provider the Web3 provider. Defaults to window.ethereum.
 */
export async function prepareErc777StreamPaymentTransaction(
  request: ClientTypes.IRequestData,
  provider: providers.Provider,
): Promise<IPreparedTransaction> {
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC777_STREAM);
  const sf = await getSuperFluidFramework(request, provider);

  const encodedTx = await encodePayErc777StreamRequest(request, sf);

  return {
    data: encodedTx,
    to: sf.host.hostContract.address,
    value: 0,
  };
}

/**
 * Gets the future ERC777 balance of an address, based on the request currency information
 * @param request the request that contains currency information
 * @param address the address to check
 * @param timestamp the time to calculate the balance at
 * @param provider the web3 provider. Defaults to Etherscan
 */
export async function getErc777BalanceAt(
  request: ClientTypes.IRequestData,
  address: string,
  timestamp: number,
  provider: providers.Provider = getNetworkProvider(request),
): Promise<BigNumberish> {
  const id = getPaymentNetworkExtension(request)?.id;
  if (id !== ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM) {
    throw new Error('Not a supported ERC777 payment network request');
  }
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC777_STREAM);
  const sf = await getSuperFluidFramework(request, provider);
  const superToken = await sf.loadSuperToken(request.currencyInfo.value);
  const realtimeBalance = await superToken.realtimeBalanceOf({
    providerOrSigner: provider,
    account: address,
    timestamp,
  });
  return realtimeBalance.availableBalance;
}

/**
 * Encode the transaction data for a one off payment of ERC777 Tokens
 * @param request to encode the payment for
 * @param amount the amount to be sent
 * @returns the encoded transaction data
 */
export const encodeErc777OneOffPayment = (
  request: ClientTypes.IRequestData,
  amount: BigNumber,
): string => {
  const id = getPaymentNetworkExtension(request)?.id;
  if (id !== ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM) {
    throw new Error('Not a supported ERC777 payment network request');
  }
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC777_STREAM);
  const { paymentReference, paymentAddress } = getRequestPaymentValues(request);
  const erc777 = ethers.ContractFactory.getInterface(erc777Artefact.abi);
  return erc777.encodeFunctionData('send', [paymentAddress, amount, `0x${paymentReference}`]);
};

/**
 * Prepare the transaction for a one payment for the user to sign
 * @param request to prepare the transaction for
 * @param amount the amount to be sent
 * @returns the prepared transaction
 */
export const prepareErc777OneOffPayment = (
  request: ClientTypes.IRequestData,
  amount: BigNumber,
): IPreparedTransaction => {
  return {
    data: encodeErc777OneOffPayment(request, amount),
    to: request.currencyInfo.value,
    value: 0,
  };
};

/**
 * Make an ERC777 payment
 * @param request associated to the payment
 * @param amount the amount to be sent
 * @param signer the transaction signer
 * @returns the transaction result
 */
export const makeErc777OneOffPayment = async (
  request: ClientTypes.IRequestData,
  amount: BigNumber,
  signer: Signer,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> => {
  const preparedTx = prepareErc777OneOffPayment(request, amount);
  return signer.sendTransaction({ ...preparedTx, ...overrides });
};
