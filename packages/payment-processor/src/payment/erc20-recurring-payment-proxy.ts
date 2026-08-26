import { CurrencyTypes, PaymentTypes } from '@requestnetwork/types';
import { providers, Signer, BigNumberish, utils } from 'ethers';
import { erc20RecurringPaymentProxyArtifact } from '@requestnetwork/smart-contracts';
import { ERC20__factory } from '@requestnetwork/smart-contracts/types';
import { getErc20Allowance } from './erc20';

const RECURRING_PROXY_V1 = '0.1.0';
const RECURRING_PROXY_V2 = '0.2.0';
const EIP712_DOMAIN_NAME = 'ERC20RecurringPaymentProxy';
const EIP712_DOMAIN_VERSION = '1';

function getSchedulePermitBatchDomain(chainId: number, verifyingContract: string) {
  return {
    name: EIP712_DOMAIN_NAME,
    version: EIP712_DOMAIN_VERSION,
    chainId,
    verifyingContract,
  };
}

function getRecurringPaymentProxyInterface(version: string): utils.Interface {
  return new utils.Interface(erc20RecurringPaymentProxyArtifact.getContractAbi(version));
}

function connectRecurringPaymentProxy(
  network: CurrencyTypes.EvmChainName,
  provider: Signer | providers.Provider,
  version?: string,
) {
  return version
    ? erc20RecurringPaymentProxyArtifact.connect(network, provider, version)
    : erc20RecurringPaymentProxyArtifact.connect(network, provider);
}

/**
 * Retrieves the current ERC-20 allowance that a subscriber (`payerAddress`) has
 * granted to the `ERC20RecurringPaymentProxy` on a specific network.
 *
 * @param payerAddress - Address of the token owner (subscriber) whose allowance is queried.
 * @param tokenAddress - Address of the ERC-20 token involved in the recurring payment schedule.
 * @param provider     - A Web3 provider or signer used to perform the on-chain call.
 * @param network      - The EVM chain name (e.g. `'mainnet'`, `'goerli'`, `'matic'`).
 * @param version      - Artifact version. Defaults to the artifact last version (`0.2.0`).
 *
 * @returns A Promise that resolves to the allowance **as a decimal string** (same
 *          units as `token.decimals`). An empty allowance is returned as `"0"`.
 *
 * @throws {Error} If the `ERC20RecurringPaymentProxy` has no known deployment
 *                 on the provided `network`.
 */
export async function getPayerRecurringPaymentAllowance({
  payerAddress,
  tokenAddress,
  provider,
  network,
  version,
}: {
  payerAddress: string;
  tokenAddress: string;
  provider: Signer | providers.Provider;
  network: CurrencyTypes.EvmChainName;
  version?: string;
}): Promise<string> {
  const erc20RecurringPaymentProxy = connectRecurringPaymentProxy(network, provider, version);

  if (!erc20RecurringPaymentProxy.address) {
    throw new Error(`ERC20RecurringPaymentProxy not found on ${network}`);
  }

  const allowance = await getErc20Allowance(
    payerAddress,
    erc20RecurringPaymentProxy.address,
    provider,
    tokenAddress,
  );

  return allowance.toString();
}

/**
 * Encodes the transaction data to set the allowance for the ERC20RecurringPaymentProxy.
 *
 * @param tokenAddress - The ERC20 token contract address
 * @param amount - The amount to approve, as a BigNumberish value
 * @param provider - Web3 provider or signer to interact with the blockchain
 * @param network - The EVM chain name where the proxy is deployed
 * @param version - Artifact version. Defaults to the artifact last version (`0.2.0`).
 *
 * @returns Array of transaction objects ready to be sent to the blockchain
 *
 * @throws {Error} If the ERC20RecurringPaymentProxy is not deployed on the specified network
 */
export function encodeSetRecurringAllowance({
  tokenAddress,
  amount,
  provider,
  network,
  version,
}: {
  tokenAddress: string;
  amount: BigNumberish;
  provider: providers.Provider | Signer;
  network: CurrencyTypes.EvmChainName;
  version?: string;
}): Array<{ to: string; data: string; value: number }> {
  const erc20RecurringPaymentProxy = connectRecurringPaymentProxy(network, provider, version);

  if (!erc20RecurringPaymentProxy.address) {
    throw new Error(`ERC20RecurringPaymentProxy not found on ${network}`);
  }

  const paymentTokenContract = ERC20__factory.connect(tokenAddress, provider);

  const setData = paymentTokenContract.interface.encodeFunctionData('approve', [
    erc20RecurringPaymentProxy.address,
    amount,
  ]);

  return [{ to: tokenAddress, data: setData, value: 0 }];
}

/**
 * Encodes the transaction data to trigger a recurring payment through the ERC20RecurringPaymentProxy.
 *
 * @param permitTuple - The SchedulePermit struct data
 * @param permitSignature - The signature authorizing the recurring payment schedule
 * @param paymentIndex - The index of the payment to trigger (1-based)
 * @param paymentReference - Reference data for the payment
 * @param network - The EVM chain name where the proxy is deployed
 *
 * @returns The encoded function data as a hex string, ready to be used in a transaction
 *
 * @throws {Error} If the ERC20RecurringPaymentProxy is not deployed on the specified network
 *
 * @remarks
 * • The function only encodes the transaction data without sending it
 * • The encoded data can be used with any web3 library or multisig wallet
 * • Make sure the paymentIndex matches the expected payment sequence
 */
export function encodeRecurringPaymentTrigger({
  permitTuple,
  permitSignature,
  paymentIndex,
  paymentReference,
  network,
  provider,
}: {
  permitTuple: PaymentTypes.SchedulePermit;
  permitSignature: string;
  paymentIndex: number;
  paymentReference: string;
  network: CurrencyTypes.EvmChainName;
  provider: providers.Provider | Signer;
}): string {
  const proxyContract = connectRecurringPaymentProxy(network, provider, RECURRING_PROXY_V1);

  return proxyContract.interface.encodeFunctionData('triggerRecurringPayment', [
    permitTuple,
    permitSignature,
    paymentIndex,
    paymentReference,
  ]);
}

/**
 * Triggers a recurring payment through the ERC20RecurringPaymentProxy.
 *
 * @param permitTuple - The SchedulePermit struct data
 * @param permitSignature - The signature authorizing the recurring payment schedule
 * @param paymentIndex - The index of the payment to trigger (1-based)
 * @param paymentReference - Reference data for the payment
 * @param signer - The signer that will trigger the transaction (must have RELAYER_ROLE)
 * @param network - The EVM chain name where the proxy is deployed
 *
 * @returns A Promise resolving to the transaction response (TransactionResponse)
 *
 * @throws {Error} If the ERC20RecurringPaymentProxy is not deployed on the specified network
 * @throws {Error} If the transaction fails (e.g. wrong index, expired permit, insufficient allowance)
 *
 * @remarks
 * • The function returns the transaction response immediately after sending
 * • The signer must have been granted RELAYER_ROLE by the proxy admin
 * • Make sure all preconditions are met (allowance, balance, timing) before calling
 * • To wait for confirmation, call tx.wait() on the returned TransactionResponse
 */
export async function triggerRecurringPayment({
  permitTuple,
  permitSignature,
  paymentIndex,
  paymentReference,
  signer,
  network,
}: {
  permitTuple: PaymentTypes.SchedulePermit;
  permitSignature: string;
  paymentIndex: number;
  paymentReference: string;
  signer: Signer;
  network: CurrencyTypes.EvmChainName;
}): Promise<providers.TransactionResponse> {
  const proxyAddress = getRecurringPaymentProxyAddress(network, RECURRING_PROXY_V1);

  const data = encodeRecurringPaymentTrigger({
    permitTuple,
    permitSignature,
    paymentIndex,
    paymentReference,
    network,
    provider: signer,
  });

  const tx = await signer.sendTransaction({
    to: proxyAddress,
    data,
    value: 0,
  });

  return tx;
}

/**
 * Encodes the 0.2.0 `triggerRecurringPaymentBatch` calldata.
 * Does not require a deployed proxy address.
 */
export function encodeRecurringPaymentTriggerBatch({
  permitTuple,
  permitSignature,
  paymentIndex,
}: {
  permitTuple: PaymentTypes.SchedulePermitBatch;
  permitSignature: string;
  paymentIndex: number;
}): string {
  return getRecurringPaymentProxyInterface(RECURRING_PROXY_V2).encodeFunctionData(
    'triggerRecurringPaymentBatch',
    [permitTuple, permitSignature, paymentIndex],
  );
}

/**
 * Triggers a 0.2.0 recurring payment through `triggerRecurringPaymentBatch`.
 *
 * @throws {Error} If the 0.2.0 proxy has no known deployment on the provided network
 */
export async function triggerRecurringPaymentBatch({
  permitTuple,
  permitSignature,
  paymentIndex,
  signer,
  network,
}: {
  permitTuple: PaymentTypes.SchedulePermitBatch;
  permitSignature: string;
  paymentIndex: number;
  signer: Signer;
  network: CurrencyTypes.EvmChainName;
}): Promise<providers.TransactionResponse> {
  return sendToRecurringProxyV2(
    signer,
    network,
    encodeRecurringPaymentTriggerBatch({
      permitTuple,
      permitSignature,
      paymentIndex,
    }),
  );
}

/**
 * Encodes the 0.2.0 `cancelScheduleBatch` calldata.
 * Does not require a deployed proxy address.
 */
export function encodeCancelScheduleBatch({
  permitTuple,
}: {
  permitTuple: PaymentTypes.SchedulePermitBatch;
}): string {
  return getRecurringPaymentProxyInterface(RECURRING_PROXY_V2).encodeFunctionData(
    'cancelScheduleBatch',
    [permitTuple],
  );
}

/**
 * Cancels a 0.2.0 schedule. The signer must be the permit subscriber.
 *
 * @throws {Error} If the 0.2.0 proxy has no known deployment on the provided network
 */
export async function cancelScheduleBatch({
  permitTuple,
  signer,
  network,
}: {
  permitTuple: PaymentTypes.SchedulePermitBatch;
  signer: Signer;
  network: CurrencyTypes.EvmChainName;
}): Promise<providers.TransactionResponse> {
  return sendToRecurringProxyV2(signer, network, encodeCancelScheduleBatch({ permitTuple }));
}

/**
 * Off-chain EIP-712 digest of a 0.2.0 `SchedulePermitBatch`.
 * Uses the same domain as the contract (`ERC20RecurringPaymentProxy` / `1`).
 */
export function hashScheduleBatch({
  permitTuple,
  network,
  chainId,
}: {
  permitTuple: PaymentTypes.SchedulePermitBatch;
  network: CurrencyTypes.EvmChainName;
  chainId: number;
}): string {
  const verifyingContract = getRecurringPaymentProxyAddress(network, RECURRING_PROXY_V2);
  return utils._TypedDataEncoder.hash(
    getSchedulePermitBatchDomain(chainId, verifyingContract),
    PaymentTypes.SCHEDULE_PERMIT_BATCH_EIP712_TYPES,
    permitTuple,
  );
}

/**
 * On-chain `scheduleKeyFromBatch` for a 0.2.0 permit.
 *
 * @throws {Error} If the 0.2.0 proxy has no known deployment on the provided network
 */
export async function scheduleKeyFromBatch({
  permitTuple,
  provider,
  network,
}: {
  permitTuple: PaymentTypes.SchedulePermitBatch;
  provider: providers.Provider | Signer;
  network: CurrencyTypes.EvmChainName;
}): Promise<string> {
  const proxyContract = connectRecurringPaymentProxy(network, provider, RECURRING_PROXY_V2);
  return proxyContract.scheduleKeyFromBatch(permitTuple);
}

/**
 * Signs a 0.2.0 `SchedulePermitBatch` with EIP-712 typed data.
 */
export async function signSchedulePermitBatch({
  permitTuple,
  signer,
  network,
}: {
  permitTuple: PaymentTypes.SchedulePermitBatch;
  signer: Signer;
  network: CurrencyTypes.EvmChainName;
}): Promise<string> {
  const verifyingContract = getRecurringPaymentProxyAddress(network, RECURRING_PROXY_V2);
  const chainId = await signer.getChainId();
  const domain = getSchedulePermitBatchDomain(chainId, verifyingContract);
  const types = PaymentTypes.SCHEDULE_PERMIT_BATCH_EIP712_TYPES;
  const address = await signer.getAddress();

  try {
    if (!signer.provider) {
      throw new Error('No provider');
    }
    return await (signer.provider as providers.JsonRpcProvider).send('eth_signTypedData', [
      address,
      {
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          ...types,
        },
        primaryType: 'SchedulePermitBatch',
        domain,
        message: permitTuple,
      },
    ]);
  } catch (_) {
    return await (
      signer as Signer & {
        _signTypedData: (
          typedDomain: ReturnType<typeof getSchedulePermitBatchDomain>,
          typedTypes: typeof PaymentTypes.SCHEDULE_PERMIT_BATCH_EIP712_TYPES,
          value: PaymentTypes.SchedulePermitBatch,
        ) => Promise<string>;
      }
    )._signTypedData(domain, types, permitTuple);
  }
}

/**
 * Encodes the 0.2.0 `admitCycles` calldata.
 * Does not require a deployed proxy address.
 */
export function encodeAdmitCycles({
  scheduleKey,
  mask,
}: {
  scheduleKey: string;
  mask: BigNumberish;
}): string {
  return getRecurringPaymentProxyInterface(RECURRING_PROXY_V2).encodeFunctionData('admitCycles', [
    scheduleKey,
    mask,
  ]);
}

/**
 * Admits cycles so a subscriber can self-trigger them.
 * The signer must hold `RELAYER_ROLE`.
 *
 * @throws {Error} If the 0.2.0 proxy has no known deployment on the provided network
 */
export async function admitCycles({
  scheduleKey,
  mask,
  signer,
  network,
}: {
  scheduleKey: string;
  mask: BigNumberish;
  signer: Signer;
  network: CurrencyTypes.EvmChainName;
}): Promise<providers.TransactionResponse> {
  return sendToRecurringProxyV2(signer, network, encodeAdmitCycles({ scheduleKey, mask }));
}

/**
 * Encodes the 0.2.0 `revokeCycles` calldata.
 * Does not require a deployed proxy address.
 */
export function encodeRevokeCycles({
  scheduleKey,
  mask,
}: {
  scheduleKey: string;
  mask: BigNumberish;
}): string {
  return getRecurringPaymentProxyInterface(RECURRING_PROXY_V2).encodeFunctionData('revokeCycles', [
    scheduleKey,
    mask,
  ]);
}

/**
 * Revokes previously admitted cycles. Relayer-initiated triggers are unaffected.
 * The signer must hold `RELAYER_ROLE`.
 *
 * @throws {Error} If the 0.2.0 proxy has no known deployment on the provided network
 */
export async function revokeCycles({
  scheduleKey,
  mask,
  signer,
  network,
}: {
  scheduleKey: string;
  mask: BigNumberish;
  signer: Signer;
  network: CurrencyTypes.EvmChainName;
}): Promise<providers.TransactionResponse> {
  return sendToRecurringProxyV2(signer, network, encodeRevokeCycles({ scheduleKey, mask }));
}

async function sendToRecurringProxyV2(
  signer: Signer,
  network: CurrencyTypes.EvmChainName,
  data: string,
): Promise<providers.TransactionResponse> {
  const proxyAddress = getRecurringPaymentProxyAddress(network, RECURRING_PROXY_V2);
  return signer.sendTransaction({
    to: proxyAddress,
    data,
    value: 0,
  });
}

/**
 * Returns the deployed address of the ERC20RecurringPaymentProxy contract for a given network.
 *
 * @param network - The EVM chain name (e.g. 'mainnet', 'sepolia', 'matic')
 * @param version - Artifact version. Defaults to the artifact last version (`0.2.0`).
 *
 * @returns The deployed proxy contract address for the specified network
 *
 * @throws {Error} If the ERC20RecurringPaymentProxy has no known deployment
 *                 on the provided network
 *
 * @remarks
 * • This is a pure helper that doesn't require a provider or make any network calls
 * • The address is looked up from the deployment artifacts maintained by the smart-contracts package
 * • Use this when you only need the address and don't need to interact with the contract
 */
export function getRecurringPaymentProxyAddress(
  network: CurrencyTypes.EvmChainName,
  version?: string,
): string {
  const address = version
    ? erc20RecurringPaymentProxyArtifact.getAddress(network, version)
    : erc20RecurringPaymentProxyArtifact.getAddress(network);

  if (!address) {
    throw new Error(`ERC20RecurringPaymentProxy not found on ${network}`);
  }

  return address;
}
