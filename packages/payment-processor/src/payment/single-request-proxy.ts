import { Signer } from 'ethers';
import { PaymentReferenceCalculator } from 'payment-detection/dist';
import { getPaymentNetworkExtension } from 'payment-detection/src/utils';
import { SingleRequestProxyFactory__factory } from 'smart-contracts/dist/src/types';
import { singleRequestProxyFactoryArtifact } from 'smart-contracts/src/lib/artifacts';
import { VMChainName } from 'types/dist/currency-types';
import { ClientTypes, ExtensionTypes } from 'types/src';

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

  let factoryAddress: string;

  // Get factory address, if provided in test options, otherwise get it from the artifacts
  if (testOptions?.factoryAddress) {
    factoryAddress = testOptions.factoryAddress;
  } else {
    const paymentChain = request.currencyInfo.network;
    if (!paymentChain) {
      throw new Error('Payment chain not found');
    }
    factoryAddress = singleRequestProxyFactoryArtifact.getAddress(paymentChain as VMChainName);
  }

  if (!factoryAddress) {
    throw new Error('Single request proxy factory address not found');
  }

  const signleRequestProxyFactory = SingleRequestProxyFactory__factory.connect(
    factoryAddress,
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
    tx = await signleRequestProxyFactory.createERC20SingleRequestProxy(
      payee,
      tokenAddress,
      paymentReference,
      feeAddress,
      feeAmount,
    );
  } else {
    tx = await signleRequestProxyFactory.createEthereumSingleRequestProxy(
      payee,
      paymentReference,
      feeAddress,
      feeAmount,
    );
  }

  const receipt = await tx.wait();
  const event = receipt.events?.find(
    (e) =>
      e.event ===
      (isERC20 ? 'ERC20SingleRequestProxyCreated' : 'EthereumSingleRequestProxyCreated'),
  );

  if (!event) {
    throw new Error('Single request proxy creation event not found');
  }

  return event.args?.proxyAddress;
}
