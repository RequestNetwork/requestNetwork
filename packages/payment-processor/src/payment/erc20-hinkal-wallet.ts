import { providers } from 'ethers';
import { BigNumberish } from 'ethers';
import { Signer } from 'ethers';
import { ClientTypes, ExtensionTypes } from '@requestnetwork/types';
import {
  getAmountToPay,
  getProvider,
  getRequestPaymentValues,
  getSigner,
  validateRequest,
} from './utils';
import { EthersProviderAdapter, Hinkal } from '@hinkal/client';
import { ERC20__factory, ERC20Proxy__factory } from '@requestnetwork/smart-contracts/types';
import { RelayerTransaction } from '@hinkal/client/dist/types/relay';
import { emporiumOp } from '@hinkal/crypto';
import { erc20ProxyArtifact } from '@requestnetwork/smart-contracts';
import { getPaymentNetworkExtension } from '@requestnetwork/payment-detection';
import { EvmChains } from 'currency/dist/chains';

export async function payErc20HinkalWalletProxyRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Provider | Signer = getProvider(),
  amount: BigNumberish,
): Promise<providers.TransactionResponse> {
  const signer = getSigner(signerOrProvider);

  const { transactionHash } = await constructAndSendTransferOp(request, signer, amount);

  return await signer.provider!.getTransaction(transactionHash);
}

export async function constructAndSendTransferOp(
  request: ClientTypes.IRequestData,
  signer: Signer,
  amount: BigNumberish,
): Promise<RelayerTransaction> {
  validateRequest(request, ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_HINKAL_WALLET);
  const hinkalProviderAdapter = new EthersProviderAdapter(signer, await signer.getChainId());

  const tokenAddress = request.currencyInfo.value;
  const { network } = request.currencyInfo;

  const tokenInstance = ERC20__factory.connect(tokenAddress, signer.provider!);

  const { paymentReference, paymentAddress } = getRequestPaymentValues(request);

  const amountToPay = getAmountToPay(request, amount);

  // TODO: calculate/get Hinkal fee

  const pn = getPaymentNetworkExtension(request);
  // TODO: add hinkal instance support check also
  EvmChains.assertChainSupported(network!);

  const proxyAddress = erc20ProxyArtifact.getAddress(network, pn?.version);

  const proxyContract = ERC20Proxy__factory.connect(proxyAddress, signer.provider!);

  const hinkal = new Hinkal();

  await hinkal.initProviderAdapter(undefined, hinkalProviderAdapter);

  await hinkal.initUserKeys();

  await hinkal.resetMerkle();

  const approveOp = emporiumOp(tokenInstance, 'approve', [proxyAddress, amountToPay]);

  const transferOp = emporiumOp(proxyContract, 'transferFromWithReference', [
    tokenAddress,
    paymentAddress,
    amountToPay,
    `0x${paymentReference}`,
  ]);

  return (await hinkal.actionPrivateWallet(
    [tokenAddress],
    [BigInt(amount.toString())],
    [false],
    [approveOp, transferOp],
    undefined,
    false,
  )) as RelayerTransaction;
}
