import { Contract, Signer, ethers } from 'ethers';
import {
  PaymentReferenceCalculator,
  getPaymentNetworkExtension,
} from '@requestnetwork/payment-detection';
import { ClientTypes, ExtensionTypes, CurrencyTypes } from '@requestnetwork/types';
import { singleRequestProxyFactoryArtifact } from '@requestnetwork/smart-contracts';
import { IERC20__factory } from '@requestnetwork/smart-contracts/types';

/**
 * Deploys a Single Request Proxy contract for a given request.
 *
 * @param request - The request data object containing payment network and currency information.
 * @param signer - The Ethereum signer used to deploy the contract.
 * @returns A Promise that resolves to the address of the deployed Single Request Proxy contract.
 * @throws {Error} If the payment network is unsupported, payment chain is not found, payee is not found, or if there are invalid payment network values.
 *
 * @remarks
 * This function supports deploying proxies for ERC20_FEE_PROXY_CONTRACT and ETH_FEE_PROXY_CONTRACT payment networks.
 * It uses the SingleRequestProxyFactory contract to create either an ERC20 or Ethereum Single Request Proxy.
 * The function calculates the payment reference and handles the deployment transaction, including waiting for confirmation.
 * The factory address is automatically determined based on the payment chain using the singleRequestProxyFactoryArtifact.
 */
export async function deploySingleRequestProxy(
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
  const singleRequestProxyFactory = singleRequestProxyFactoryArtifact.connect(
    paymentChain as CurrencyTypes.EvmChainName,
    signer,
  );

  if (!singleRequestProxyFactory.address) {
    throw new Error(`SingleRequestProxyFactory not found on chain ${paymentChain}`);
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
    tx = await singleRequestProxyFactory.createERC20SingleRequestProxy(
      paymentRecipient,
      tokenAddress,
      paymentReference,
      feeAddress,
      feeAmount,
    );
  } else {
    tx = await singleRequestProxyFactory.createEthereumSingleRequestProxy(
      paymentRecipient,
      paymentReference,
      feeAddress,
      feeAmount,
    );
  }

  const receipt = await tx.wait();

  const event = receipt.events?.[0];

  if (!event) {
    throw new Error('Single request proxy creation event not found');
  }

  const proxyAddress = ethers.utils.defaultAbiCoder.decode(['address', 'address'], event.data)[0];

  if (!proxyAddress) {
    throw new Error('Proxy address not found in event data');
  }

  return proxyAddress;
}

/**
 * Validates that a contract is a SingleRequestProxy by checking required methods
 * @param proxyAddress - The address of the contract to validate
 * @param signer - The Ethereum signer used to interact with the contract
 * @throws {Error} If the contract is not a valid SingleRequestProxy
 */
async function validateSingleRequestProxy(proxyAddress: string, signer: Signer): Promise<void> {
  const proxyInterface = new ethers.utils.Interface([
    'function payee() view returns (address)',
    'function paymentReference() view returns (bytes)',
    'function feeAddress() view returns (address)',
    'function feeAmount() view returns (uint256)',
  ]);

  const proxyContract = new Contract(proxyAddress, proxyInterface, signer);

  try {
    await Promise.all([
      proxyContract.payee(),
      proxyContract.paymentReference(),
      proxyContract.feeAddress(),
      proxyContract.feeAmount(),
    ]);
  } catch (error) {
    throw new Error('Invalid SingleRequestProxy contract');
  }
}

/**
 * Executes a payment through an ERC20SingleRequestProxy contract
 * @param proxyAddress - The address of the SingleRequestProxy contract
 * @param signer - The Ethereum signer used to execute the payment transaction
 * @param amount - The amount to be paid
 * @throws {Error} If the contract is not an ERC20SingleRequestProxy
 */
export async function payWithERC20SingleRequestProxy(
  proxyAddress: string,
  signer: Signer,
  amount: string,
): Promise<void> {
  if (!amount || ethers.BigNumber.from(amount).lte(0)) {
    throw new Error('Amount must be a positive number');
  }

  const proxyInterface = new ethers.utils.Interface([
    'function tokenAddress() view returns (address)',
  ]);

  const proxyContract = new Contract(proxyAddress, proxyInterface, signer);

  let tokenAddress: string;
  try {
    // Attempt to fetch the token address from the proxy contract, to determine if it's an ERC20 SingleRequestProxy.
    tokenAddress = await proxyContract.tokenAddress();
  } catch {
    throw new Error('Contract is not an ERC20SingleRequestProxy');
  }

  const erc20Contract = IERC20__factory.connect(tokenAddress, signer);

  // Transfer tokens to the proxy
  const transferTx = await erc20Contract.transfer(proxyAddress, amount);
  await transferTx.wait();

  // Trigger the proxy's receive function to finalize payment
  const triggerTx = await signer.sendTransaction({
    to: proxyAddress,
    value: ethers.constants.Zero,
  });
  await triggerTx.wait();
}

/**
 * Executes a payment through an EthereumSingleRequestProxy contract
 * @param proxyAddress - The address of the SingleRequestProxy contract
 * @param signer - The Ethereum signer used to execute the payment transaction
 * @param amount - The amount to be paid
 * @throws {Error} If the contract is an ERC20SingleRequestProxy
 */
export async function payWithEthereumSingleRequestProxy(
  proxyAddress: string,
  signer: Signer,
  amount: string,
): Promise<void> {
  if (!amount || ethers.BigNumber.from(amount).lte(0)) {
    throw new Error('Amount must be a positive number');
  }

  const proxyInterface = new ethers.utils.Interface([
    'function tokenAddress() view returns (address)',
  ]);

  const proxyContract = new Contract(proxyAddress, proxyInterface, signer);

  try {
    // Attempt to fetch the token address from the proxy contract, to determine if it's an Ethereum SingleRequestProxy.
    await proxyContract.tokenAddress();

    // If the token address is fetched, it means the contract is an ERC20SingleRequestProxy.
    throw new Error('Contract is not an EthereumSingleRequestProxy');
  } catch (error) {
    // If the token address is not fetched, it means the contract is an EthereumSingleRequestProxy.
    if (error.message === 'Contract is not an EthereumSingleRequestProxy') {
      // If the error message is 'Contract is not an EthereumSingleRequestProxy', throw the error.
      throw error;
    }
  }

  const tx = await signer.sendTransaction({
    to: proxyAddress,
    value: amount,
  });
  await tx.wait();
}

/**
 * Executes a payment through a Single Request Proxy contract.
 *
 * @param singleRequestProxyAddress - The address of the deployed Single Request Proxy contract.
 * @param signer - The Ethereum signer used to execute the payment transaction.
 * @param amount - The amount to be paid, as a string representation of the value.
 * @returns A Promise that resolves when the payment transaction is confirmed.
 * @throws {Error} If the SingleRequestProxy contract is invalid.
 * @throws {Error} If the proxy contract type cannot be determined, or if any transaction fails.
 *
 * @remarks
 * This function supports both ERC20 and Ethereum payments.
 * For ERC20 payments, it first transfers the tokens to the proxy contract and then triggers the payment.
 * For Ethereum payments, it directly sends the Ether to the proxy contract.
 * The function automatically detects whether the proxy is for ERC20 or Ethereum based on the contract interface.
 */
export async function payRequestWithSingleRequestProxy(
  singleRequestProxyAddress: string,
  signer: Signer,
  amount: string,
): Promise<void> {
  if (!amount || ethers.BigNumber.from(amount).lte(0)) {
    throw new Error('Amount must be a positive number');
  }

  // Validate the SingleRequestProxy contract
  await validateSingleRequestProxy(singleRequestProxyAddress, signer);

  const proxyInterface = new ethers.utils.Interface([
    'function tokenAddress() view returns (address)',
  ]);

  const proxyContract = new Contract(singleRequestProxyAddress, proxyInterface, signer);

  let isERC20: boolean;
  try {
    await proxyContract.tokenAddress();
    isERC20 = true;
  } catch {
    isERC20 = false;
  }

  if (isERC20) {
    await payWithERC20SingleRequestProxy(singleRequestProxyAddress, signer, amount);
  } else {
    await payWithEthereumSingleRequestProxy(singleRequestProxyAddress, signer, amount);
  }
}
