import { Signer } from 'ethers';
import {
  PaymentReferenceCalculator,
  getPaymentNetworkExtension,
} from '@requestnetwork/payment-detection';
import { ClientTypes, ExtensionTypes, CurrencyTypes } from '@requestnetwork/types';
import { singleRequestProxyFactoryArtifact } from '@requestnetwork/smart-contracts';
import { Contract } from 'ethers';

interface TestOptions {
  factoryAddress?: string;
}

export async function deploySingleRequestProxy(
  request: ClientTypes.IRequestData,
  signer: Signer,
  testOptions?: TestOptions,
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

  let singleRequestProxyFactory;

  if (testOptions?.factoryAddress) {
    // Use custom address for testing, assuming it's on the local test network
    singleRequestProxyFactory = new Contract(
      testOptions.factoryAddress,
      singleRequestProxyFactoryArtifact.getContractAbi(),
      signer,
    );
  } else {
    const paymentChain = request.currencyInfo.network;
    if (!paymentChain) {
      throw new Error('Payment chain not found');
    }
    // Use artifact's default address for the payment chain
    singleRequestProxyFactory = singleRequestProxyFactoryArtifact.connect(
      paymentChain as CurrencyTypes.EvmChainName,
      signer,
    );
  }

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
    (e: { event: string }) =>
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
