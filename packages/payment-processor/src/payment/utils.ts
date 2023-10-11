import { ethers, Signer, providers, BigNumber, BigNumberish, ContractTransaction } from 'ethers';

import { getDefaultProvider, getPaymentReference } from '@requestnetwork/payment-detection';
import {
  ClientTypes,
  CurrencyTypes,
  ExtensionTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { EvmChains, getCurrencyHash } from '@requestnetwork/currency';
import { ERC20__factory } from '@requestnetwork/smart-contracts/types';
import { getPaymentNetworkExtension } from '@requestnetwork/payment-detection';

/** @constant MAX_ALLOWANCE set to the max uint256 value */
export const MAX_ALLOWANCE = BigNumber.from(2).pow(256).sub(1);

/**
 * Thrown when the library does not support a payment blockchain network.
 */
export class UnsupportedCurrencyNetwork extends Error {
  constructor(public networkName?: string) {
    super(`Currency network ${networkName} is not supported`);
  }
}

/**
 * Utility to get the default window.ethereum provider, or throws an error.
 */
export function getProvider(): providers.Web3Provider {
  if (typeof window !== 'undefined' && 'ethereum' in window) {
    return new ethers.providers.Web3Provider((window as any).ethereum);
  }
  throw new Error('ethereum not found, you must pass your own web3 provider');
}

/**
 * Utility to get a network provider, depending on the request's currency network.
 * Will throw an error if the network isn't mainnet, rinkeby, or goerli
 */
export function getNetworkProvider(request: ClientTypes.IRequestData): providers.Provider {
  return getDefaultProvider(request.currencyInfo.network);
}

/**
 * Utility to return a signer from a provider.
 * @param signerOrProvider the provider, or signer. If Signer, it will simply be returned directly
 * @param address optionally, the address to retrieve the signer for.
 */
export function getSigner(
  signerOrProvider?: providers.Provider | Signer,
  address?: string,
): Signer {
  if (!signerOrProvider) {
    signerOrProvider = getProvider();
  }
  if (Signer.isSigner(signerOrProvider)) {
    return signerOrProvider;
  }
  if (
    providers.Web3Provider.isProvider(signerOrProvider) &&
    (signerOrProvider as providers.Web3Provider).getSigner
  ) {
    return (signerOrProvider as providers.Web3Provider).getSigner(address);
  }
  throw new Error('cannot get signer');
}

/**
 * Utility to access payment-related information from a request.
 * All data is taken from the request's payment extension, except the network that may be retrieved from the request's currency if needed.
 */
export async function getRequestPaymentValues(request: ClientTypes.IRequestData): Promise<{
  paymentAddress: string;
  paymentReference?: string;
  feeAmount?: string;
  feeAddress?: string;
  expectedFlowRate?: string;
  expectedStartDate?: string;
  acceptedTokens?: string[];
  maxRateTimespan?: string;
  network?: CurrencyTypes.ChainName;
  version: string;
}> {
  const extension = getPaymentNetworkExtension(request);
  if (!extension) {
    throw new Error('no payment network found');
  }
  return {
    ...extension.values,
    paymentReference: await getPaymentReference(request),
    network: extension.values.network ?? request.currencyInfo.network,
    version: extension.version,
  };
}

export function getPaymentExtensionVersion(request: ClientTypes.IRequestData): string {
  const extension = getPaymentNetworkExtension(request);
  if (!extension) {
    throw new Error('no payment network found');
  }
  return extension.version;
}

/**
 * @param pn It contains the payment network extension
 * @param currency It contains the currency information
 */
export const getProxyNetwork = (
  pn: ExtensionTypes.IState,
  currency: RequestLogicTypes.ICurrency,
): string => {
  if (pn.values.network) {
    return pn.values.network;
  }
  if (currency.network) {
    return currency.network;
  }
  throw new Error('Payment currency must have a network');
};

/**
 * @param request The request to pay
 * @return An object that contains the payment network extension and the currency information
 */
export function getPnAndNetwork(request: ClientTypes.IRequestData): {
  paymentNetwork: ExtensionTypes.IState<any>;
  network: string;
} {
  const pn = getPaymentNetworkExtension(request);
  if (!pn) {
    throw new Error('PaymentNetwork not found');
  }
  return { paymentNetwork: pn, network: getProxyNetwork(pn, request.currencyInfo) };
}

/**
 * @param request The request to pay
 * @param getDeploymentInformation The function to get the proxy address
 * @param version The version has to be set to get batch conversion proxy
 */
export const getProxyAddress = (
  request: ClientTypes.IRequestData,
  getDeploymentInformation: (
    network: CurrencyTypes.EvmChainName,
    version: string,
  ) => { address: string } | null,
  version?: string,
): string => {
  const { paymentNetwork, network } = getPnAndNetwork(request);
  EvmChains.assertChainSupported(network);
  const deploymentInfo = getDeploymentInformation(network, version || paymentNetwork.version);
  if (!deploymentInfo) {
    throw new Error(
      `No deployment found for network ${network}, version ${version || paymentNetwork.version}`,
    );
  }
  return deploymentInfo.address;
};

const {
  ERC777_STREAM,
  ERC20_PROXY_CONTRACT,
  ETH_INPUT_DATA,
  ETH_FEE_PROXY_CONTRACT,
  ERC20_FEE_PROXY_CONTRACT,
  ANY_TO_ERC20_PROXY,
  NATIVE_TOKEN,
  ERC20_TRANSFERABLE_RECEIVABLE,
} = ExtensionTypes.PAYMENT_NETWORK_ID;
const currenciesMap: any = {
  [ERC777_STREAM]: RequestLogicTypes.CURRENCY.ERC777,
  [ERC20_PROXY_CONTRACT]: RequestLogicTypes.CURRENCY.ERC20,
  [ERC20_FEE_PROXY_CONTRACT]: RequestLogicTypes.CURRENCY.ERC20,
  [ETH_INPUT_DATA]: RequestLogicTypes.CURRENCY.ETH,
  [ETH_FEE_PROXY_CONTRACT]: RequestLogicTypes.CURRENCY.ETH,
  [NATIVE_TOKEN]: RequestLogicTypes.CURRENCY.ETH,
  [ERC20_TRANSFERABLE_RECEIVABLE]: RequestLogicTypes.CURRENCY.ERC20,
};

/**
 * Utility to validate a request currency and payment details against a paymentNetwork.
 */
export async function validateRequest(
  request: ClientTypes.IRequestData,
  paymentNetworkId: ExtensionTypes.PAYMENT_NETWORK_ID,
): Promise<void> {
  const { feeAmount, feeAddress, expectedFlowRate, expectedStartDate } =
    await getRequestPaymentValues(request);
  let extension = request.extensions[paymentNetworkId];

  // FIXME: updating the extension: not needed anymore when ETH_INPUT_DATA gets deprecated
  if (paymentNetworkId === ExtensionTypes.PAYMENT_NETWORK_ID.ETH_FEE_PROXY_CONTRACT && !extension) {
    extension = request.extensions[ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA];
  }

  // Compatibility of the request currency type with the payment network
  const expectedCurrencyType = currenciesMap[paymentNetworkId];
  const validCurrencyType = [
    ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY,
    ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN,
    ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ETH_PROXY,
  ].includes(paymentNetworkId)
    ? // Any currency type is valid with Any to ERC20 / ETH / Native conversion
      true
    : expectedCurrencyType &&
      request.currencyInfo.type === expectedCurrencyType &&
      request.currencyInfo.network;

  // ERC20 based payment networks are only valid if the request currency has a value
  const validCurrencyValue =
    ![
      ERC20_PROXY_CONTRACT,
      ERC20_FEE_PROXY_CONTRACT,
      ERC777_STREAM,
      ERC20_TRANSFERABLE_RECEIVABLE,
    ].includes(paymentNetworkId) || request.currencyInfo.value;

  // Payment network with fees should have both or none of fee address and fee amount
  const validFeeParams =
    (paymentNetworkId !== ANY_TO_ERC20_PROXY && paymentNetworkId !== ERC20_FEE_PROXY_CONTRACT) ||
    !!feeAddress === !!feeAmount;

  if (!validFeeParams) {
    throw new Error('Both fee address and fee amount have to be declared, or both left empty');
  }

  // Payment network with stream should have both or none of stream flow rate and stream start date
  const validStreamParams =
    paymentNetworkId !== ERC777_STREAM || (!!expectedFlowRate && !!expectedStartDate);

  if (!validStreamParams) {
    throw new Error(
      'Both stream flow rate and stream start date have to be declared, or both left empty',
    );
  }

  if (
    !validCurrencyType ||
    !validCurrencyValue ||
    !extension?.values?.salt ||
    !extension?.values?.paymentAddress
  ) {
    throw new Error(`request cannot be processed, or is not an ${paymentNetworkId} request`);
  }
}

/**
 * Validates the amount and fee parameters for an ERC20 Fee Proxy based request.
 * @param request to validate
 * @param amount optionally, the custom amount to pay
 * @param feeAmountOverride optionally, the custom fee amount
 * @param paymentNetwork defaults to ERC20 Fee Proxy contract
 */
export async function validateErc20FeeProxyRequest(
  request: ClientTypes.IRequestData,
  amount?: BigNumberish,
  feeAmountOverride?: BigNumberish,
  paymentNetwork: ExtensionTypes.PAYMENT_NETWORK_ID = ExtensionTypes.PAYMENT_NETWORK_ID
    .ERC20_FEE_PROXY_CONTRACT,
): Promise<void> {
  validateRequest(request, paymentNetwork);

  const { feeAmount } = await getRequestPaymentValues(request);
  const amountToPay = getAmountToPay(request, amount);
  const feeToPay = BigNumber.from(feeAmountOverride || feeAmount || 0);

  if (amountToPay.isZero() && feeToPay.isZero()) {
    throw new Error('Request payment amount and fee are 0');
  }
}

/**
 * Validates the parameters for an ERC20 Fee Proxy payment.
 * @param request to validate
 * @param tokenAddress token address to pay with
 * @param amount optionally, the custom amount to pay
 * @param feeAmountOverride optionally, the custom fee amount
 */
export async function validateConversionFeeProxyRequest(
  request: ClientTypes.IRequestData,
  path: string[],
  amount?: BigNumberish,
  feeAmountOverride?: BigNumberish,
): Promise<void> {
  validateErc20FeeProxyRequest(
    request,
    amount,
    feeAmountOverride,
    ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY,
  );
  const { acceptedTokens } = await getRequestPaymentValues(request);
  const requestCurrencyHash = path[0];
  if (requestCurrencyHash.toLowerCase() !== getCurrencyHash(request.currencyInfo).toLowerCase()) {
    throw new Error(`The first entry of the path does not match the request currency`);
  }

  const tokenAddress = path[path.length - 1];
  if (
    acceptedTokens &&
    !acceptedTokens?.map((t) => t.toLowerCase()).includes(tokenAddress.toLowerCase())
  ) {
    throw new Error(`The token ${tokenAddress} is not accepted to pay this request`);
  }
}


/**
 * Validates the parameters for an ERC20 Transferable Receivable Payment or Mint.
 * @param request to validate
 * @param amount optionally, the custom amount to pay
 * @param feeAmountOverride optionally, the custom fee amount
 */
export function validateERC20TransferableReceivable(
  request: ClientTypes.IRequestData,
  amount?: BigNumberish,
  feeAmountOverride?: BigNumberish,
): void {
  validateErc20FeeProxyRequest(
    request,
    amount,
    feeAmountOverride,
    ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_TRANSFERABLE_RECEIVABLE,
  );

  // Validate that there exists a payee
  if (request.payee == null) {
    throw new Error(`Expected a payee for this request`);
  }
}

/**
 * Computes the amount to pay.
 * If `amount` is specified, it will return it.
 * Otherwise, it will return the amount left to pay in the request.
 *
 * @param request the request to pay
 * @param amount the optional amount to pay.
 */
export function getAmountToPay(
  request: ClientTypes.IRequestData,
  amount?: BigNumberish,
): BigNumber {
  const amountToPay =
    amount === undefined
      ? BigNumber.from(request.expectedAmount).sub(request.balance?.balance || 0)
      : BigNumber.from(amount);

  if (amountToPay.lt(0)) {
    throw new Error('cannot pay a negative amount');
  }
  if (amountToPay.isZero()) {
    throw new Error('cannot pay a null amount');
  }
  return amountToPay;
}

/**
 * Compare 2 payment networks type and version in request's extension
 * and throw an exception if they are different
 * @param pn The payment network extension
 * @param request The request to pay
 */
export function comparePnTypeAndVersion(
  pn: ExtensionTypes.IState | undefined,
  request: ClientTypes.IRequestData,
): void {
  const extension = getPaymentNetworkExtension(request);
  if (!extension) {
    throw new Error('no payment network found');
  }
  if (!(pn?.type === extension.type && pn?.version === extension.version)) {
    throw new Error(`Every payment network type and version must be identical`);
  }
}

/**
 * Revoke ERC20 approval of a token for a given `spenderAddress`
 */
export async function revokeErc20Approval(
  spenderAddress: string,
  paymentTokenAddress: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
): Promise<ContractTransaction> {
  const erc20interface = ERC20__factory.connect(paymentTokenAddress, signerOrProvider).interface;
  const encodedTx = erc20interface.encodeFunctionData('approve', [
    spenderAddress,
    BigNumber.from(0),
  ]);

  const preparedTx = {
    data: encodedTx,
    to: paymentTokenAddress,
    value: 0,
  };
  const signer = getSigner(signerOrProvider);
  const tx = await signer.sendTransaction(preparedTx);
  return tx;
}
