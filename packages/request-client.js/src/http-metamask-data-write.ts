import { DataAccessTypes, StorageTypes } from '@requestnetwork/types';
import { HttpDataAccessConfig } from './http-data-access-config';
import { CurrencyTypes } from '@requestnetwork/types';
import { ethers } from 'ethers';
import { EventEmitter } from 'events';
import { requestHashSubmitterArtifact } from '@requestnetwork/smart-contracts';
import { Block } from '@requestnetwork/data-access';

export class HttpMetaMaskDataWrite implements DataAccessTypes.IDataWrite {
  /**
   * Cache block persisted directly (in case the node did not have the time to retrieve it)
   * (public for easier testing)
   */
  public cache: {
    [channelId: string]: {
      [ipfsHash: string]: { block: DataAccessTypes.IBlock; storageMeta: any } | null;
    };
  } = {};

  constructor(
    private readonly dataAccessConfig: HttpDataAccessConfig,
    private provider: ethers.providers.JsonRpcProvider | ethers.providers.Web3Provider,
    private networkName: CurrencyTypes.EvmChainName = 'private',
  ) {}

  /**
   * Initialize the module. Does nothing, exists only to implement IDataAccess
   *
   * @returns nothing
   */
  public async initialize(): Promise<void> {
    // no-op, nothing to do
    return;
  }

  /**
   * Closes the module. Does nothing, exists only to implement IDataAccess
   *
   * @returns nothing
   */
  public async close(): Promise<void> {
    // no-op, nothing to do
    return;
  }

  /**
   * Persists a new transaction using the node only for IPFS but persisting on ethereum through local provider
   *
   * @param transactionData The transaction data
   * @param topics The topics used to index the transaction
   */
  public async persistTransaction(
    transactionData: DataAccessTypes.ITransaction,
    channelId: string,
    topics?: string[],
  ): Promise<DataAccessTypes.IReturnPersistTransaction> {
    const eventEmitter = new EventEmitter() as DataAccessTypes.PersistTransactionEmitter;

    if (!this.networkName) {
      const network = await this.provider.getNetwork();

      this.networkName =
        network.chainId === 1 ? 'mainnet' : network.chainId === 4 ? 'rinkeby' : 'private';
    }
    const submitterContract = requestHashSubmitterArtifact.connect(
      this.networkName,
      this.provider.getSigner(),
    );

    // We don't use the node to persist the transaction, but we will Do it ourselves

    // create a block and add the transaction in it
    const block: DataAccessTypes.IBlock = Block.pushTransaction(
      Block.createEmptyBlock(),
      transactionData,
      channelId,
      topics,
    );

    // store the block on ipfs and get the the ipfs hash and size
    const { ipfsHash, ipfsSize } = await this.dataAccessConfig.fetch<{
      ipfsHash: string;
      ipfsSize: number;
    }>('POST', '/ipfsAdd', { data: block });

    // get the fee required to submit the hash
    const fee = await submitterContract.getFeesAmount(ipfsSize);

    // submit the hash to ethereum
    const tx = await submitterContract.submitHash(
      ipfsHash,
      /* eslint-disable no-magic-numbers */
      ethers.utils.hexZeroPad(ethers.utils.hexlify(ipfsSize), 32),
      { value: fee },
    );

    const ethBlock = await this.provider.getBlock(tx.blockNumber ?? -1);

    // create the storage meta from the transaction receipt
    const storageMeta: StorageTypes.IEthereumMetadata = {
      blockConfirmation: tx.confirmations,
      blockNumber: tx.blockNumber ?? -1,
      blockTimestamp: ethBlock.timestamp,
      fee: fee.toString(),
      networkName: this.networkName,
      smartContractAddress: tx.to ?? '',
      transactionHash: tx.hash,
    };

    // Add the block to the cache
    if (!this.cache[channelId]) {
      this.cache[channelId] = {};
    }
    this.cache[channelId][ipfsHash] = { block, storageMeta };

    const result: DataAccessTypes.IReturnPersistTransactionRaw = {
      meta: {
        storageMeta: {
          ethereum: storageMeta,
          ipfs: { size: ipfsSize },
          state: StorageTypes.ContentState.PENDING,
          timestamp: storageMeta.blockTimestamp,
        },
        topics: topics || [],
        transactionStorageLocation: ipfsHash,
      },
      result: {},
    };

    // When the ethereum transaction is mined, emit an event 'confirmed'
    void tx.wait().then((txConfirmed) => {
      // emit the event to tell the request transaction is confirmed
      eventEmitter.emit('confirmed', {
        meta: {
          storageMeta: {
            ethereum: {
              blockConfirmation: txConfirmed.confirmations,
              blockNumber: txConfirmed.blockNumber,
              blockTimestamp: ethBlock.timestamp,
              fee: fee.toString(),
              networkName: this.networkName,
              smartContractAddress: txConfirmed.to,
              transactionHash: txConfirmed.transactionHash,
            },
            state: StorageTypes.ContentState.CONFIRMED,
            timestamp: ethBlock.timestamp,
          },
          topics: topics || [],
          transactionStorageLocation: ipfsHash,
        },
        result: {},
      });
    });

    return Object.assign(eventEmitter, result);
  }
}
