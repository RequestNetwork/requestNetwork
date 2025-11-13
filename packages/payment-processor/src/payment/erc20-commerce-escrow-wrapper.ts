import { CurrencyTypes, PaymentTypes } from '@requestnetwork/types';
import { providers, Signer, BigNumberish, utils } from 'ethers';
import { erc20CommerceEscrowWrapperArtifact } from '@requestnetwork/smart-contracts';
import { ERC20__factory } from '@requestnetwork/smart-contracts/types';
import { getErc20Allowance } from './erc20';

// Re-export types from @requestnetwork/types for convenience
export type CommerceEscrowPaymentData = PaymentTypes.CommerceEscrowPaymentData;
export type AuthorizePaymentParams = PaymentTypes.CommerceEscrowAuthorizeParams;
export type CapturePaymentParams = PaymentTypes.CommerceEscrowCaptureParams;
export type ChargePaymentParams = PaymentTypes.CommerceEscrowChargeParams;
export type RefundPaymentParams = PaymentTypes.CommerceEscrowRefundParams;
export type CommerceEscrowPaymentState = PaymentTypes.CommerceEscrowPaymentState;

/**
 * Get the deployed address of the ERC20CommerceEscrowWrapper contract for a given network.
 *
 * @param network - The EVM chain name (e.g. 'mainnet', 'sepolia', 'matic')
 * @returns The deployed wrapper contract address for the specified network
 * @throws {Error} If the ERC20CommerceEscrowWrapper has no known deployment on the provided network
 */
export function getCommerceEscrowWrapperAddress(network: CurrencyTypes.EvmChainName): string {
  const address = erc20CommerceEscrowWrapperArtifact.getAddress(network);

  if (!address || address === '0x0000000000000000000000000000000000000000') {
    throw new Error(`No deployment for network: ${network}.`);
  }

  return address;
}

/**
 * Retrieves the current ERC-20 allowance that a payer has granted to the ERC20CommerceEscrowWrapper on a specific network.
 *
 * @param payerAddress - Address of the token owner (payer) whose allowance is queried
 * @param tokenAddress - Address of the ERC-20 token involved in the commerce escrow payment
 * @param provider - A Web3 provider or signer used to perform the on-chain call
 * @param network - The EVM chain name (e.g. 'mainnet', 'sepolia', 'matic')
 * @returns A Promise that resolves to the allowance as a decimal string (same units as token.decimals)
 * @throws {Error} If the ERC20CommerceEscrowWrapper has no known deployment on the provided network
 */
export async function getPayerCommerceEscrowAllowance({
  payerAddress,
  tokenAddress,
  provider,
  network,
}: {
  payerAddress: string;
  tokenAddress: string;
  provider: Signer | providers.Provider;
  network: CurrencyTypes.EvmChainName;
}): Promise<string> {
  const wrapperAddress = getCommerceEscrowWrapperAddress(network);

  const allowance = await getErc20Allowance(payerAddress, wrapperAddress, provider, tokenAddress);

  return allowance.toString();
}

/**
 * Encodes the transaction data to set the allowance for the ERC20CommerceEscrowWrapper.
 *
 * @param tokenAddress - The ERC20 token contract address
 * @param amount - The amount to approve, as a BigNumberish value
 * @param provider - Web3 provider or signer to interact with the blockchain
 * @param network - The EVM chain name where the wrapper is deployed
 * @returns Array of transaction objects ready to be sent to the blockchain
 * @throws {Error} If the ERC20CommerceEscrowWrapper is not deployed on the specified network
 */
export function encodeSetCommerceEscrowAllowance({
  tokenAddress,
  amount,
  provider,
  network,
}: {
  tokenAddress: string;
  amount: BigNumberish;
  provider: providers.Provider | Signer;
  network: CurrencyTypes.EvmChainName;
}): Array<{ to: string; data: string; value: number }> {
  const wrapperAddress = getCommerceEscrowWrapperAddress(network);
  const paymentTokenContract = ERC20__factory.connect(tokenAddress, provider);

  const setData = paymentTokenContract.interface.encodeFunctionData('approve', [
    wrapperAddress,
    amount,
  ]);

  return [{ to: tokenAddress, data: setData, value: 0 }];
}

/**
 * Encodes the transaction data to authorize a payment through the ERC20CommerceEscrowWrapper.
 *
 * @param params - Authorization parameters
 * @param network - The EVM chain name where the wrapper is deployed
 * @param provider - Web3 provider or signer to interact with the blockchain
 * @returns The encoded function data as a hex string, ready to be used in a transaction
 * @throws {Error} If the ERC20CommerceEscrowWrapper is not deployed on the specified network
 * @remarks
 * Uses utils.Interface to handle large parameter count (12 params). TypeScript has encoding limitations
 * when dealing with functions that have many parameters. This workaround is needed for functions with
 * 12+ parameters. Similar pattern used in single-request-forwarder.ts.
 */
export function encodeAuthorizePayment({
  params,
  network,
  provider,
}: {
  params: AuthorizePaymentParams;
  network: CurrencyTypes.EvmChainName;
  provider: providers.Provider | Signer;
}): string {
  const wrapperContract = erc20CommerceEscrowWrapperArtifact.connect(network, provider);

  // Use utils.Interface to encode with the raw ABI to avoid TypeScript interface issues
  const iface = new utils.Interface(
    wrapperContract.interface.format(utils.FormatTypes.json) as string,
  );

  // Pass individual parameters as expected by the ABI (not struct)
  return iface.encodeFunctionData('authorizePayment', [
    params.paymentReference,
    params.payer,
    params.merchant,
    params.operator,
    params.token,
    params.amount,
    params.maxAmount,
    params.preApprovalExpiry,
    params.authorizationExpiry,
    params.refundExpiry,
    params.tokenCollector,
    params.collectorData,
  ]);
}

/**
 * Encodes the transaction data to capture a payment through the ERC20CommerceEscrowWrapper.
 *
 * @param params - Capture parameters
 * @param network - The EVM chain name where the wrapper is deployed
 * @param provider - Web3 provider or signer to interact with the blockchain
 * @returns The encoded function data as a hex string, ready to be used in a transaction
 * @throws {Error} If the ERC20CommerceEscrowWrapper is not deployed on the specified network
 */
export function encodeCapturePayment({
  params,
  network,
  provider,
}: {
  params: CapturePaymentParams;
  network: CurrencyTypes.EvmChainName;
  provider: providers.Provider | Signer;
}): string {
  const wrapperContract = erc20CommerceEscrowWrapperArtifact.connect(network, provider);
  return wrapperContract.interface.encodeFunctionData('capturePayment', [
    params.paymentReference,
    params.captureAmount,
    params.feeBps,
    params.feeReceiver,
  ]);
}

/**
 * Encodes the transaction data to void a payment through the ERC20CommerceEscrowWrapper.
 *
 * @param paymentReference - The payment reference to void
 * @param network - The EVM chain name where the wrapper is deployed
 * @param provider - Web3 provider or signer to interact with the blockchain
 * @returns The encoded function data as a hex string, ready to be used in a transaction
 * @throws {Error} If the ERC20CommerceEscrowWrapper is not deployed on the specified network
 */
export function encodeVoidPayment({
  paymentReference,
  network,
  provider,
}: {
  paymentReference: string;
  network: CurrencyTypes.EvmChainName;
  provider: providers.Provider | Signer;
}): string {
  const wrapperContract = erc20CommerceEscrowWrapperArtifact.connect(network, provider);
  return wrapperContract.interface.encodeFunctionData('voidPayment', [paymentReference]);
}

/**
 * Encodes the transaction data to charge a payment (authorize + capture) through the ERC20CommerceEscrowWrapper.
 *
 * @param params - Charge parameters
 * @param network - The EVM chain name where the wrapper is deployed
 * @param provider - Web3 provider or signer to interact with the blockchain
 * @returns The encoded function data as a hex string, ready to be used in a transaction
 * @throws {Error} If the ERC20CommerceEscrowWrapper is not deployed on the specified network
 * @remarks
 * Uses utils.Interface to handle large parameter count (14 params). TypeScript has encoding limitations
 * when dealing with functions that have many parameters. This workaround is needed for functions with
 * 12+ parameters. Similar pattern used in single-request-forwarder.ts.
 */
export function encodeChargePayment({
  params,
  network,
  provider,
}: {
  params: ChargePaymentParams;
  network: CurrencyTypes.EvmChainName;
  provider: providers.Provider | Signer;
}): string {
  const wrapperContract = erc20CommerceEscrowWrapperArtifact.connect(network, provider);

  // Use utils.Interface to encode with the raw ABI to avoid TypeScript interface issues
  const iface = new utils.Interface(
    wrapperContract.interface.format(utils.FormatTypes.json) as string,
  );

  // Pass individual parameters as expected by the ABI (not struct)
  return iface.encodeFunctionData('chargePayment', [
    params.paymentReference,
    params.payer,
    params.merchant,
    params.operator,
    params.token,
    params.amount,
    params.maxAmount,
    params.preApprovalExpiry,
    params.authorizationExpiry,
    params.refundExpiry,
    params.feeBps,
    params.feeReceiver,
    params.tokenCollector,
    params.collectorData,
  ]);
}

/**
 * Encodes the transaction data to reclaim a payment through the ERC20CommerceEscrowWrapper.
 *
 * @param paymentReference - The payment reference to reclaim
 * @param network - The EVM chain name where the wrapper is deployed
 * @param provider - Web3 provider or signer to interact with the blockchain
 * @returns The encoded function data as a hex string, ready to be used in a transaction
 * @throws {Error} If the ERC20CommerceEscrowWrapper is not deployed on the specified network
 */
export function encodeReclaimPayment({
  paymentReference,
  network,
  provider,
}: {
  paymentReference: string;
  network: CurrencyTypes.EvmChainName;
  provider: providers.Provider | Signer;
}): string {
  const wrapperContract = erc20CommerceEscrowWrapperArtifact.connect(network, provider);
  return wrapperContract.interface.encodeFunctionData('reclaimPayment', [paymentReference]);
}

/**
 * Encodes the transaction data to refund a payment through the ERC20CommerceEscrowWrapper.
 *
 * @param params - Refund parameters
 * @param network - The EVM chain name where the wrapper is deployed
 * @param provider - Web3 provider or signer to interact with the blockchain
 * @returns The encoded function data as a hex string, ready to be used in a transaction
 * @throws {Error} If the ERC20CommerceEscrowWrapper is not deployed on the specified network
 */
export function encodeRefundPayment({
  params,
  network,
  provider,
}: {
  params: RefundPaymentParams;
  network: CurrencyTypes.EvmChainName;
  provider: providers.Provider | Signer;
}): string {
  const wrapperContract = erc20CommerceEscrowWrapperArtifact.connect(network, provider);
  return wrapperContract.interface.encodeFunctionData('refundPayment', [
    params.paymentReference,
    params.refundAmount,
    params.tokenCollector,
    params.collectorData,
  ]);
}

/**
 * Authorize a payment through the ERC20CommerceEscrowWrapper.
 *
 * @param params - Authorization parameters
 * @param signer - The signer that will authorize the transaction
 * @param network - The EVM chain name where the wrapper is deployed
 * @returns A Promise resolving to the transaction response
 * @throws {Error} If the ERC20CommerceEscrowWrapper is not deployed on the specified network
 */
export async function authorizePayment({
  params,
  signer,
  network,
}: {
  params: AuthorizePaymentParams;
  signer: Signer;
  network: CurrencyTypes.EvmChainName;
}): Promise<providers.TransactionResponse> {
  const wrapperAddress = getCommerceEscrowWrapperAddress(network);

  const data = encodeAuthorizePayment({
    params,
    network,
    provider: signer,
  });

  const tx = await signer.sendTransaction({
    to: wrapperAddress,
    data,
    value: 0,
  });

  return tx;
}

/**
 * Capture a payment through the ERC20CommerceEscrowWrapper.
 *
 * @param params - Capture parameters
 * @param signer - The signer that will capture the transaction (must be the operator)
 * @param network - The EVM chain name where the wrapper is deployed
 * @returns A Promise resolving to the transaction response
 * @throws {Error} If the ERC20CommerceEscrowWrapper is not deployed on the specified network
 */
export async function capturePayment({
  params,
  signer,
  network,
}: {
  params: CapturePaymentParams;
  signer: Signer;
  network: CurrencyTypes.EvmChainName;
}): Promise<providers.TransactionResponse> {
  const wrapperAddress = getCommerceEscrowWrapperAddress(network);

  const data = encodeCapturePayment({
    params,
    network,
    provider: signer,
  });

  const tx = await signer.sendTransaction({
    to: wrapperAddress,
    data,
    value: 0,
  });

  return tx;
}

/**
 * Void a payment through the ERC20CommerceEscrowWrapper.
 *
 * @param paymentReference - The payment reference to void
 * @param signer - The signer that will void the transaction (must be the operator)
 * @param network - The EVM chain name where the wrapper is deployed
 * @returns A Promise resolving to the transaction response
 * @throws {Error} If the ERC20CommerceEscrowWrapper is not deployed on the specified network
 */
export async function voidPayment({
  paymentReference,
  signer,
  network,
}: {
  paymentReference: string;
  signer: Signer;
  network: CurrencyTypes.EvmChainName;
}): Promise<providers.TransactionResponse> {
  const wrapperAddress = getCommerceEscrowWrapperAddress(network);

  const data = encodeVoidPayment({
    paymentReference,
    network,
    provider: signer,
  });

  const tx = await signer.sendTransaction({
    to: wrapperAddress,
    data,
    value: 0,
  });

  return tx;
}

/**
 * Charge a payment (authorize + capture) through the ERC20CommerceEscrowWrapper.
 *
 * @param params - Charge parameters
 * @param signer - The signer that will charge the transaction
 * @param network - The EVM chain name where the wrapper is deployed
 * @returns A Promise resolving to the transaction response
 * @throws {Error} If the ERC20CommerceEscrowWrapper is not deployed on the specified network
 */
export async function chargePayment({
  params,
  signer,
  network,
}: {
  params: ChargePaymentParams;
  signer: Signer;
  network: CurrencyTypes.EvmChainName;
}): Promise<providers.TransactionResponse> {
  const wrapperAddress = getCommerceEscrowWrapperAddress(network);

  const data = encodeChargePayment({
    params,
    network,
    provider: signer,
  });

  const tx = await signer.sendTransaction({
    to: wrapperAddress,
    data,
    value: 0,
  });

  return tx;
}

/**
 * Reclaim a payment through the ERC20CommerceEscrowWrapper.
 *
 * @param paymentReference - The payment reference to reclaim
 * @param signer - The signer that will reclaim the transaction (must be the payer)
 * @param network - The EVM chain name where the wrapper is deployed
 * @returns A Promise resolving to the transaction response
 * @throws {Error} If the ERC20CommerceEscrowWrapper is not deployed on the specified network
 */
export async function reclaimPayment({
  paymentReference,
  signer,
  network,
}: {
  paymentReference: string;
  signer: Signer;
  network: CurrencyTypes.EvmChainName;
}): Promise<providers.TransactionResponse> {
  const wrapperAddress = getCommerceEscrowWrapperAddress(network);

  const data = encodeReclaimPayment({
    paymentReference,
    network,
    provider: signer,
  });

  const tx = await signer.sendTransaction({
    to: wrapperAddress,
    data,
    value: 0,
  });

  return tx;
}

/**
 * Refund a payment through the ERC20CommerceEscrowWrapper.
 *
 * @param params - Refund parameters
 * @param signer - The signer that will refund the transaction (must be the operator)
 * @param network - The EVM chain name where the wrapper is deployed
 * @returns A Promise resolving to the transaction response
 * @throws {Error} If the ERC20CommerceEscrowWrapper is not deployed on the specified network
 */
export async function refundPayment({
  params,
  signer,
  network,
}: {
  params: RefundPaymentParams;
  signer: Signer;
  network: CurrencyTypes.EvmChainName;
}): Promise<providers.TransactionResponse> {
  const wrapperAddress = getCommerceEscrowWrapperAddress(network);

  const data = encodeRefundPayment({
    params,
    network,
    provider: signer,
  });

  const tx = await signer.sendTransaction({
    to: wrapperAddress,
    data,
    value: 0,
  });

  return tx;
}

/**
 * Get payment data from the ERC20CommerceEscrowWrapper.
 *
 * @param paymentReference - The payment reference to query
 * @param provider - Web3 provider or signer to interact with the blockchain
 * @param network - The EVM chain name where the wrapper is deployed
 * @returns A Promise resolving to the payment data
 * @throws {Error} If the ERC20CommerceEscrowWrapper is not deployed on the specified network
 */
export async function getPaymentData({
  paymentReference,
  provider,
  network,
}: {
  paymentReference: string;
  provider: providers.Provider | Signer;
  network: CurrencyTypes.EvmChainName;
}): Promise<CommerceEscrowPaymentData> {
  const wrapperContract = erc20CommerceEscrowWrapperArtifact.connect(network, provider);
  const rawData = await wrapperContract.getPaymentData(paymentReference);

  // Convert BigNumber fields to numbers/strings as expected by the interface
  return {
    payer: rawData.payer,
    merchant: rawData.merchant,
    operator: rawData.operator,
    token: rawData.token,
    amount: rawData.amount,
    maxAmount: rawData.maxAmount,
    preApprovalExpiry: rawData.preApprovalExpiry.toNumber(),
    authorizationExpiry: rawData.authorizationExpiry.toNumber(),
    refundExpiry: rawData.refundExpiry.toNumber(),
    commercePaymentHash: rawData.commercePaymentHash,
    isActive: rawData.isActive,
  };
}

/**
 * Get payment state from the ERC20CommerceEscrowWrapper.
 *
 * @param paymentReference - The payment reference to query
 * @param provider - Web3 provider or signer to interact with the blockchain
 * @param network - The EVM chain name where the wrapper is deployed
 * @returns A Promise resolving to the payment state
 * @throws {Error} If the ERC20CommerceEscrowWrapper is not deployed on the specified network
 */
export async function getPaymentState({
  paymentReference,
  provider,
  network,
}: {
  paymentReference: string;
  provider: providers.Provider | Signer;
  network: CurrencyTypes.EvmChainName;
}): Promise<CommerceEscrowPaymentState> {
  const wrapperContract = erc20CommerceEscrowWrapperArtifact.connect(network, provider);
  const [hasCollectedPayment, capturableAmount, refundableAmount] =
    await wrapperContract.getPaymentState(paymentReference);
  return { hasCollectedPayment, capturableAmount, refundableAmount };
}

/**
 * Check if a payment can be captured.
 *
 * @param paymentReference - The payment reference to check
 * @param provider - Web3 provider or signer to interact with the blockchain
 * @param network - The EVM chain name where the wrapper is deployed
 * @returns A Promise resolving to true if the payment can be captured
 * @throws {Error} If the ERC20CommerceEscrowWrapper is not deployed on the specified network
 */
export async function canCapture({
  paymentReference,
  provider,
  network,
}: {
  paymentReference: string;
  provider: providers.Provider | Signer;
  network: CurrencyTypes.EvmChainName;
}): Promise<boolean> {
  const wrapperContract = erc20CommerceEscrowWrapperArtifact.connect(network, provider);
  return await wrapperContract.canCapture(paymentReference);
}

/**
 * Check if a payment can be voided.
 *
 * @param paymentReference - The payment reference to check
 * @param provider - Web3 provider or signer to interact with the blockchain
 * @param network - The EVM chain name where the wrapper is deployed
 * @returns A Promise resolving to true if the payment can be voided
 * @throws {Error} If the ERC20CommerceEscrowWrapper is not deployed on the specified network
 */
export async function canVoid({
  paymentReference,
  provider,
  network,
}: {
  paymentReference: string;
  provider: providers.Provider | Signer;
  network: CurrencyTypes.EvmChainName;
}): Promise<boolean> {
  const wrapperContract = erc20CommerceEscrowWrapperArtifact.connect(network, provider);
  return await wrapperContract.canVoid(paymentReference);
}
