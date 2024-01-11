import SafeApiKit from '@safe-global/api-kit';
import { Contract, Overrides, Wallet } from 'ethers';
import { safeAdminArtifact } from '../../src/lib/';
import Safe, { EthersAdapter, EthersAdapterConfig } from '@safe-global/protocol-kit';
import { ethers } from 'ethers';
import { CurrencyTypes } from '@requestnetwork/types';

const txServiceUrls: Record<string, string> = {
  mainnet: 'https://safe-transaction-mainnet.safe.global/',
  goerli: 'https://safe-transaction-goerli.safe.global/',
  sepolia: 'https://safe-transaction-sepolia.safe.global/',
  matic: 'https://safe-transaction-polygon.safe.global/',
  celo: 'https://safe-transaction-celo.safe.global/',
  xdai: 'https://safe-transaction-gnosis-chain.safe.global/',
  bsc: 'https://safe-transaction-bsc.safe.global/',
  'arbitrum-one': 'https://safe-transaction-arbitrum.safe.global/',
  avalanche: 'https://safe-transaction-avalanche.safe.global/',
  optimism: 'https://safe-transaction-optimism.safe.global/',
  zksyncera: 'https://safe-transaction-zksync.safe.global/',
};

export const executeContractMethod = async ({
  network,
  contract,
  method,
  props,
  txOverrides,
  signer,
  signWithEoa,
}: {
  network: string;
  contract: Contract;
  method: string;
  props: any[];
  txOverrides: Overrides;
  signer: Wallet;
  signWithEoa?: boolean;
}): Promise<void> => {
  const safeAddress = safeAdminArtifact.getAddress(network as CurrencyTypes.VMChainName);
  const txServiceUrl = txServiceUrls[network];
  if (!signWithEoa && !!safeAddress && !!txServiceUrl) {
    const ethAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: signer,
    } as unknown as EthersAdapterConfig);
    const safeService = new SafeApiKit({ txServiceUrl, ethAdapter });
    const safeSdk = await Safe.create({ ethAdapter, safeAddress });

    const safeTransactionData = [
      {
        to: contract.address,
        data: contract.interface.encodeFunctionData(method, props),
        value: '0',
      },
    ];
    const nonce = await safeService.getNextNonce(safeAddress);
    const safeTransaction = await safeSdk.createTransaction({
      safeTransactionData,
      options: { nonce },
    });
    const safeTxHash = await safeSdk.getTransactionHash(safeTransaction);
    const senderSignature = await safeSdk.signTransactionHash(safeTxHash);

    await safeService.proposeTransaction({
      safeAddress,
      safeTransactionData: safeTransaction.data,
      safeTxHash,
      senderAddress: signer.address,
      senderSignature: senderSignature.data,
    });
    console.log(`Transaction to be confirmed in Safe ${safeAddress} on ${network}`);
  } else {
    const contractConnected = contract.connect(signer);
    const tx = await contractConnected[method](...props, txOverrides);
    await tx.wait(1);
  }
};
