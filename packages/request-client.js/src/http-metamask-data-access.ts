import { CombinedDataAccess } from '@requestnetwork/data-access';
import { ClientTypes, CurrencyTypes, DataAccessTypes } from '@requestnetwork/types';
import { ethers } from 'ethers';
import HttpDataAccess from './http-data-access';
import { HttpDataAccessConfig, NodeConnectionConfig } from './http-data-access-config';
import { HttpDataRead } from './http-data-read';
import { HttpMetaMaskDataWrite } from './http-metamask-data-write';
/**
 * Exposes a Data-Access module over HTTP
 */
export default class HttpMetaMaskDataAccess extends CombinedDataAccess {
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

  private readonly dataAccessConfig: HttpDataAccessConfig;
  private readonly dataAccess: HttpDataAccess;

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
    ethereumProviderUrl = ethereumProviderUrl ? ethereumProviderUrl : 'http://localhost:8545';

    // Creates a local or default provider
    const provider = web3
      ? new ethers.providers.Web3Provider(web3)
      : new ethers.providers.JsonRpcProvider({ url: ethereumProviderUrl });

    const dataAccessConfig = new HttpDataAccessConfig({ httpConfig, nodeConnectionConfig });
    const reader = new HttpDataRead(dataAccessConfig);
    const writer = new HttpMetaMaskDataWrite(dataAccessConfig, provider);

    super(reader, writer);

    this.dataAccessConfig = dataAccessConfig;
    this.dataAccess = new HttpDataAccess(dataAccessConfig);
    this.provider = provider;
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
    return this.writer.persistTransaction(transactionData, channelId, topics);
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
    const data = await this.dataAccessConfig.fetchAndRetry<DataAccessTypes.IReturnGetTransactions>(
      '/getTransactionsByChannelId',
      {
        params: { channelId, timestampBoundaries },
      },
      {
        maxRetries: this.dataAccessConfig.httpConfig.httpRequestMaxRetry,
        retryDelay: this.dataAccessConfig.httpConfig.httpRequestRetryDelay,
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
