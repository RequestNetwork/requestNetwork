import { providers } from 'ethers';
import { BigNumberish } from 'ethers';
import { Signer } from 'ethers';
import { ClientTypes, ExtensionTypes } from '@requestnetwork/types';
import { getProvider, getRequestPaymentValues, getSigner, validateRequest } from './utils';
import { EthersProviderAdapter, Hinkal } from '@hinkal/client';
import { emporiumOp, MultiThreadedUtxoUtils } from '@hinkal/crypto';
import { ERC20__factory } from 'smart-contracts/types';
import { RelayerTransaction } from '@hinkal/client/dist/types/relay';

export async function payErc20RequestHinkalWallet(
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
  const utxoUtils = new MultiThreadedUtxoUtils();

  const tokenAddress = request.currencyInfo.value;
  // FIX:  MultichainUtxoUtils generic incompatibility
  const hinkal = new Hinkal(utxoUtils as unknown as ConstructorParameters<typeof Hinkal>[0]);

  await hinkal.initProviderAdapter(undefined, hinkalProviderAdapter);

  await hinkal.initUserKeys();

  await hinkal.resetMerkle();

  const erc20Instance = hinkal.getContract(ERC20__factory, tokenAddress);

  // Should we use paymentReference here?
  const { paymentReference } = getRequestPaymentValues(request);

  const transferOp = emporiumOp(erc20Instance, 'transfer', [`0x${paymentReference}`, amount]);

  return (await hinkal.actionPrivateWallet(
    [tokenAddress],
    [BigInt(amount.toString())],
    [false],
    [transferOp],
    undefined,
    false,
  )) as RelayerTransaction;
}
