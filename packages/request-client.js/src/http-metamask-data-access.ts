import { Block } from '@requestnetwork/data-access';
import { requestHashSubmitterArtifact } from '@requestnetwork/smart-contracts';
import { ClientTypes, CurrencyTypes, DataAccessTypes, StorageTypes } from '@requestnetwork/types';
import { ethers } from 'ethers';
import { EventEmitter } from 'events';
import HttpDataAccess, { NodeConnectionConfig } from './http-data-access';

/**
 * Exposes a Data-Access module over HTTP
 */
export default class HttpMetaMaskDataAccess extends HttpDataAccess {
  /**
   * Cache block persisted directly (in case the node did not have the time to retrieve it)
   * (public for easier testing)
   */
  public cache: {
    [channelId: string]: {
      [ipfsHash: string]: { block: DataAccessTypes.IBlock; storageMeta: any } | null;
    };
  } = {};

  private provider: ethers.providers.JsonRpcProvider | ethers.providers.Web3Provider;
  private networkName: CurrencyTypes.EvmChainName = 'private';

  /**
   * Creates an instance of HttpDataAccess.
   * @param httpConfig Http config that will be used by the underlying http-data-access. @see ClientTypes.IHttpDataAccessConfig
   * @param nodeConnectionConfig Configuration options to connect to the node.
   */
  constructor(
    {
      httpConfig,
      nodeConnectionConfig,
      web3,
      ethereumProviderUrl,
    }: {
      httpConfig?: Partial<ClientTypes.IHttpDataAccessConfig>;
      nodeConnectionConfig?: NodeConnectionConfig;
      web3?: any;
      ethereumProviderUrl?: string;
    } = {
      httpConfig: {},
    },
  ) {
    super({ httpConfig, nodeConnectionConfig });

    ethereumProviderUrl = ethereumProviderUrl ? ethereumProviderUrl : 'http://localhost:8545';

    // Creates a local or default provider
    this.provider = web3
      ? new ethers.providers.Web3Provider(web3)
      : new ethers.providers.JsonRpcProvider({ url: ethereumProviderUrl });
  }

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
    const { ipfsHash, ipfsSize } = await this.fetch<{ ipfsHash: string; ipfsSize: number }>(
      'POST',
      '/ipfsAdd',
      { data: block },
    );

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

    const eventEmitter = new EventEmitter() as DataAccessTypes.PersistTransactionEmitter;
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

  /**
   * Gets the transactions for a channel from the node through HTTP.
   *
   * @param channelId The channel id to search for
   * @param timestampBoundaries filter timestamp boundaries
   */
  public async getTransactionsByChannelId(
    channelId: string,
    timestampBoundaries?: DataAccessTypes.ITimestampBoundaries,
  ): Promise<DataAccessTypes.IReturnGetTransactions> {
    const data = await this.fetchAndRetry<DataAccessTypes.IReturnGetTransactions>(
      '/getTransactionsByChannelId',
      {
        params: { channelId, timestampBoundaries },
      },
      {
        maxRetries: this.httpConfig.httpRequestMaxRetry,
        retryDelay: this.httpConfig.httpRequestRetryDelay,
      },
    );

    // get the transactions from the cache
    const transactionsCached = this.getCachedTransactionsAndCleanCache(
      channelId,
      data.meta.transactionsStorageLocation,
      timestampBoundaries,
    );

    // merge cache and data from the node
    return {
      meta: {
        storageMeta: data.meta.storageMeta?.concat(transactionsCached.meta.storageMeta ?? []) ?? [],
        transactionsStorageLocation: data.meta.transactionsStorageLocation.concat(
          transactionsCached.meta.transactionsStorageLocation,
        ),
      },
      result: {
        transactions: data.result.transactions.concat(transactionsCached.result.transactions),
      },
    };
  }

  /**
   * Gets the cached transactions and remove the ones that have been retrieved from the node
   * (public for easier testing)
   *
   * @param channelId The channel id to search for
   * @param storageLocationFromNode location retrieved from the node
   * @param timestampBoundaries filter timestamp boundaries
   */
  public getCachedTransactionsAndCleanCache(
    channelId: string,
    storageLocationFromNode: string[],
    timestampBoundaries?: DataAccessTypes.ITimestampBoundaries,
  ): DataAccessTypes.IReturnGetTransactions {
    // Remove cache found by the node
    for (const location of storageLocationFromNode) {
      this.cache[channelId][location] = null;
    }

    // Create a IReturnGetTransactions object to be merged later with the one from the node
    return Object.keys(this.cache[channelId] || []).reduce(
      (accumulator: DataAccessTypes.IReturnGetTransactions, location: string) => {
        const cache = this.cache[channelId][location];

        // For each cached block for the channel, we return the transaction if they are in the time boundaries
        if (
          this.cache[channelId][location] &&
          (!timestampBoundaries ||
            ((timestampBoundaries.from === undefined ||
              timestampBoundaries.from <= cache?.storageMeta.blockTimestamp) &&
              (timestampBoundaries.to === undefined ||
                timestampBoundaries.to >= cache?.storageMeta.blockTimestamp)))
        ) {
          accumulator.meta.storageMeta?.push(cache?.storageMeta);
          accumulator.meta.transactionsStorageLocation.push(location);
          // cache?.block.transactions will always contain one transaction
          accumulator.result.transactions.push({
            state: DataAccessTypes.TransactionState.PENDING,
            timestamp: cache?.storageMeta.blockTimestamp,
            transaction: cache?.block.transactions[0] as DataAccessTypes.ITransaction,
          });
        }
        return accumulator;
      },
      {
        meta: { storageMeta: [], transactionsStorageLocation: [] },
        result: { transactions: [] },
      },
    );
  }
}
