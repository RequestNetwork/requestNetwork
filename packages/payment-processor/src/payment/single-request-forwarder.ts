import { Contract, Signer, ethers } from 'ethers';
import {
  PaymentReferenceCalculator,
  getPaymentNetworkExtension,
} from '@requestnetwork/payment-detection';
import { ClientTypes, ExtensionTypes, CurrencyTypes } from '@requestnetwork/types';
import { singleRequestForwarderFactoryArtifact } from '@requestnetwork/smart-contracts';
import { IERC20__factory } from '@requestnetwork/smart-contracts/types';

/**
 * Deploys a Single Request Forwarder contract for a given request.
 *
 * @param request - The request data object containing payment network and currency information.
 * @param signer - The Ethereum signer used to deploy the contract.
 * @returns A Promise that resolves to the address of the deployed Single Request Forwarder contract.
 * @throws {Error} If the payment network is unsupported, payment chain is not found, payee is not found, or if there are invalid payment network values.
 *
 * @remarks
 * This function supports deploying forwarders for ERC20_FEE_PROXY_CONTRACT and ETH_FEE_PROXY_CONTRACT payment networks.
 * It uses the SingleRequestForwarderFactory contract to create either an ERC20 or Ethereum Single Request Forwarder.
 * The function calculates the payment reference and handles the deployment transaction, including waiting for confirmation.
 * The factory address is automatically determined based on the payment chain using the singleRequestForwarderFactoryArtifact.
 */
export async function deploySingleRequestForwarder(
  request: ClientTypes.IRequestData,
  signer: Signer,
): Promise<string> {
  const requestPaymentNetwork = getPaymentNetworkExtension(request);

  // Check if the payment network is supported, only ERC20_FEE_PROXY_CONTRACT and ETH_FEE_PROXY_CONTRACT are supported
  if (
    !requestPaymentNetwork ||
    (requestPaymentNetwork.id !== ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT &&
      requestPaymentNetwork.id !== ExtensionTypes.PAYMENT_NETWORK_ID.ETH_FEE_PROXY_CONTRACT)
  ) {
    throw new Error('Unsupported payment network');
  }

  const paymentChain = request.currencyInfo.network;
  if (!paymentChain) {
    throw new Error('Payment chain not found');
  }

  // Use artifact's default address for the payment chain
  const singleRequestForwarderFactory = singleRequestForwarderFactoryArtifact.connect(
    paymentChain as CurrencyTypes.EvmChainName,
    signer,
  );

  if (!singleRequestForwarderFactory.address) {
    throw new Error(`SingleRequestForwarderFactory not found on chain ${paymentChain}`);
  }

  const salt = requestPaymentNetwork?.values?.salt;
  const feeAddress = requestPaymentNetwork?.values?.feeAddress;
  const feeAmount = requestPaymentNetwork?.values?.feeAmount;
  const paymentRecipient = requestPaymentNetwork?.values?.paymentAddress;

  if (!salt || !feeAddress || !feeAmount || !paymentRecipient) {
    throw new Error('Invalid payment network values');
  }

  const paymentReference = `0x${PaymentReferenceCalculator.calculate(
    request.requestId,
    salt,
    paymentRecipient,
  )}`;

  const isERC20 =
    requestPaymentNetwork.id === ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT;

  let tx;

  if (isERC20) {
    const tokenAddress = request.currencyInfo.value;
    tx = await singleRequestForwarderFactory.createERC20SingleRequestProxy(
      paymentRecipient,
      tokenAddress,
      paymentReference,
      feeAddress,
      feeAmount,
    );
  } else {
    tx = await singleRequestForwarderFactory.createEthereumSingleRequestProxy(
      paymentRecipient,
      paymentReference,
      feeAddress,
      feeAmount,
    );
  }

  const receipt = await tx.wait();

  const event = receipt.events?.find(
    (e: ethers.Event) =>
      e.event ===
      (isERC20 ? 'ERC20SingleRequestProxyCreated' : 'EthereumSingleRequestProxyCreated'),
  );

  if (!event) {
    throw new Error('Single request forwarder creation event not found');
  }

  const forwarderAddress = event.args?.proxyAddress || event.args?.[0];

  if (!forwarderAddress) {
    throw new Error('Forwarder address not found in event data');
  }

  return forwarderAddress;
}

/**
 * Validates that a contract is a SingleRequestForwarder by checking required methods
 * @param proxyAddress - The address of the contract to validate
 * @param signer - The Ethereum signer used to interact with the contract
 * @throws {Error} If the contract is not a valid SingleRequestForwarder
 */
async function validateSingleRequestForwarder(
  forwarderAddress: string,
  signer: Signer,
): Promise<void> {
  const forwarderInterface = new ethers.utils.Interface([
    'function payee() view returns (address)',
    'function paymentReference() view returns (bytes)',
    'function feeAddress() view returns (address)',
    'function feeAmount() view returns (uint256)',
  ]);

  const forwarderContract = new Contract(forwarderAddress, forwarderInterface, signer);

  try {
    await Promise.all([
      forwarderContract.payee(),
      forwarderContract.paymentReference(),
      forwarderContract.feeAddress(),
      forwarderContract.feeAmount(),
    ]);
  } catch (error) {
    throw new Error('Invalid SingleRequestForwarder contract');
  }
}

/**
 * Executes a payment through an ERC20SingleRequestForwarder contract
 * @param forwarderAddress - The address of the SingleRequestForwarder contract
 * @param signer - The Ethereum signer used to execute the payment transaction
 * @param amount - The amount to be paid
 * @throws {Error} If the contract is not an ERC20SingleRequestForwarder
 */
export async function payWithERC20SingleRequestForwarder(
  forwarderAddress: string,
  signer: Signer,
  amount: string,
): Promise<void> {
  if (!amount || ethers.BigNumber.from(amount).lte(0)) {
    throw new Error('Amount must be a positive number');
  }

  const forwarderInterface = new ethers.utils.Interface([
    'function tokenAddress() view returns (address)',
  ]);

  const forwarderContract = new Contract(forwarderAddress, forwarderInterface, signer);

  let tokenAddress: string;
  try {
    // Attempt to fetch the token address from the forwarder contract, to determine if it's an ERC20 SingleRequestForwarder.
    tokenAddress = await forwarderContract.tokenAddress();
  } catch {
    throw new Error('Contract is not an ERC20SingleRequestForwarder');
  }

  const erc20Contract = IERC20__factory.connect(tokenAddress, signer);

  // Transfer tokens to the forwarder
  const transferTx = await erc20Contract.transfer(forwarderAddress, amount);
  await transferTx.wait();

  // Trigger the proxy's receive function to finalize payment
  const triggerTx = await signer.sendTransaction({
    to: forwarderAddress,
    value: ethers.constants.Zero,
  });
  await triggerTx.wait();
}

/**
 * Executes a payment through an EthereumSingleRequestForwarder contract
 * @param forwarderAddress - The address of the SingleRequestForwarder contract
 * @param signer - The Ethereum signer used to execute the payment transaction
 * @param amount - The amount to be paid
 * @throws {Error} If the contract is not an EthereumSingleRequestForwarder
 */
export async function payWithEthereumSingleRequestForwarder(
  forwarderAddress: string,
  signer: Signer,
  amount: string,
): Promise<void> {
  if (!amount || ethers.BigNumber.from(amount).lte(0)) {
    throw new Error('Amount must be a positive number');
  }

  const forwarderInterface = new ethers.utils.Interface([
    'function tokenAddress() view returns (address)',
  ]);

  const forwarderContract = new Contract(forwarderAddress, forwarderInterface, signer);

  try {
    // Attempt to fetch the token address from the forwarder contract, to determine if it's an Ethereum SingleRequestForwarder.
    await forwarderContract.tokenAddress();

    // If the token address is fetched, it means the contract is an ERC20SingleRequestForwarder.
    throw new Error('Contract is not an EthereumSingleRequestForwarder');
  } catch (error) {
    // If the token address is not fetched, it means the contract is an EthereumSingleRequestForwarder.
    if (error.message === 'Contract is not an EthereumSingleRequestForwarder') {
      // If the error message is 'Contract is not an EthereumSingleRequestForwarder', throw the error.
      throw error;
    }
  }

  const tx = await signer.sendTransaction({
    to: forwarderAddress,
    value: amount,
  });
  await tx.wait();
}

/**
 * Executes a payment through a Single Request Proxy contract.
 *
 * @param singleRequestForwarderAddress - The address of the deployed Single Request Forwarder contract.
 * @param signer - The Ethereum signer used to execute the payment transaction.
 * @param amount - The amount to be paid, as a string representation of the value.
 * @returns A Promise that resolves when the payment transaction is confirmed.
 * @throws {Error} If the SingleRequestForwarder contract is invalid.
 * @throws {Error} If the forwarder contract type cannot be determined, or if any transaction fails.
 *
 * @remarks
 * This function supports both ERC20 and Ethereum payments.
 * For ERC20 payments, it first transfers the tokens to the forwarder contract and then triggers the payment.
 * For Ethereum payments, it directly sends the Ether to the forwarder contract.
 * The function automatically detects whether the proxy is for ERC20 or Ethereum based on the contract interface.
 */
export async function payRequestWithSingleRequestForwarder(
  singleRequestForwarderAddress: string,
  signer: Signer,
  amount: string,
): Promise<void> {
  if (!amount || ethers.BigNumber.from(amount).lte(0)) {
    throw new Error('Amount must be a positive number');
  }

  // Validate the SingleRequestForwarder contract
  await validateSingleRequestForwarder(singleRequestForwarderAddress, signer);

  const forwarderInterface = new ethers.utils.Interface([
    'function tokenAddress() view returns (address)',
  ]);

  const forwarderContract = new Contract(singleRequestForwarderAddress, forwarderInterface, signer);

  let isERC20: boolean;
  try {
    await forwarderContract.tokenAddress();
    isERC20 = true;
  } catch {
    isERC20 = false;
  }

  if (isERC20) {
    await payWithERC20SingleRequestForwarder(singleRequestForwarderAddress, signer, amount);
  } else {
    await payWithEthereumSingleRequestForwarder(singleRequestForwarderAddress, signer, amount);
  }
}
