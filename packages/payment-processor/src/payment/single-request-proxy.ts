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

  const payee = request.payee?.value;
  if (!payee) {
    throw new Error('Payee not found');
  }

  const salt = requestPaymentNetwork?.values?.salt;
  const feeAddress = requestPaymentNetwork?.values?.feeAddress;
  const feeAmount = requestPaymentNetwork?.values?.feeAmount;

  if (!salt || !feeAddress || !feeAmount) {
    throw new Error('Invalid payment network values');
  }

  const paymentReference = `0x${PaymentReferenceCalculator.calculate(
    request.requestId,
    salt,
    payee,
  )}`;

  const isERC20 =
    requestPaymentNetwork.id === ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT;

  let tx;

  if (isERC20) {
    const tokenAddress = request.currencyInfo.value;
    tx = await singleRequestProxyFactory.createERC20SingleRequestProxy(
      payee,
      tokenAddress,
      paymentReference,
      feeAddress,
      feeAmount,
    );
  } else {
    tx = await singleRequestProxyFactory.createEthereumSingleRequestProxy(
      payee,
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
    throw new Error('Single request proxy creation event not found');
  }

  const proxyAddress = event.args?.[0];
  if (!proxyAddress) {
    throw new Error('Proxy address not found in event args');
  }

  return proxyAddress;
}

/**
 * Executes a payment through a Single Request Proxy contract.
 *
 * @param singleRequestProxyAddress - The address of the deployed Single Request Proxy contract.
 * @param signer - The Ethereum signer used to execute the payment transaction.
 * @param amount - The amount to be paid, as a string representation of the value.
 * @returns A Promise that resolves when the payment transaction is confirmed.
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
  const proxyContract = new Contract(
    singleRequestProxyAddress,
    ['function tokenAddress() view returns (address)'],
    signer,
  );

  let isERC20: boolean;
  let tokenAddress: string | null = null;
  try {
    tokenAddress = await proxyContract.tokenAddress();
    isERC20 = true;
  } catch {
    isERC20 = false;
  }

  if (isERC20 && tokenAddress) {
    // ERC20 payment
    const erc20Contract = IERC20__factory.connect(tokenAddress, signer);

    // Transfer tokens to the proxy
    const transferTx = await erc20Contract.transfer(singleRequestProxyAddress, amount);
    await transferTx.wait();

    // Trigger the receive function with 0 ETH
    const triggerTx = await signer.sendTransaction({
      to: singleRequestProxyAddress,
      value: ethers.constants.Zero,
    });
    await triggerTx.wait();
  } else {
    // Ethereum payment
    const tx = await signer.sendTransaction({
      to: singleRequestProxyAddress,
      value: amount,
    });
    await tx.wait();
  }
}
