import { Block } from '@requestnetwork/data-access';
import { DataAccessTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import axios, { AxiosRequestConfig } from 'axios';
import { ethers } from 'ethers';

// Maximum number of retries to attempt when http requests to the Node fail
const HTTP_REQUEST_MAX_RETRY = 3;

// Delay between retry in ms
const HTTP_REQUEST_RETRY_DELAY = 100;

/**
 * Exposes a Data-Access module over HTTP
 */
export default class HttpMetamaskDataAccess implements DataAccessTypes.IDataAccess {
  /**
   * Cache block persisted directly (in case the node did not have the time to retrieve it)
   * (public for easier testing)
   */
  public cache: {
    [channelId: string]: {
      [ipfsHash: string]: { block: DataAccessTypes.IBlock; storageMeta: any } | null;
    };
  } = {};

  /**
   * Configuration that will be sent to axios for each request.
   * We can also create a AxiosInstance with axios.create() but it dramatically complicates testing.
   */
  private axiosConfig: AxiosRequestConfig;

  private submitterContract: ethers.Contract;
  private provider: ethers.providers.JsonRpcProvider;

  /**
   * Creates an instance of HttpDataAccess.
   * @param nodeConnectionConfig Configuration options to connect to the node. Follows Axios configuration format.
   */
  constructor(nodeConnectionConfig: AxiosRequestConfig = {}) {
    this.axiosConfig = Object.assign(
      {
        baseURL: 'http://localhost:3000',
      },
      nodeConnectionConfig,
    );

    // Creates a local or default provider
    // TODO !
    this.provider =
      // this.network === 'private' ?
      new ethers.providers.JsonRpcProvider({ url: 'http://localhost:8545', allowInsecure: true });
    // : ethers.getDefaultProvider(this.network);

    this.submitterContract = new ethers.Contract(
      // TODO !
      '0xf25186b5081ff5ce73482ad761db0eb0d25abfbf',
      [
        'function submitHash(string _hash, bytes _feesParameters) payable external',
        'function getFeesAmount(uint256 _contentSize) public view returns(uint256)',
      ],
      this.provider.getSigner(),
    );
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
   * Persists a new transaction on a node through HTTP.
   *
   * @param transactionData The transaction data
   * @param topics The topics used to index the transaction
   */
  public async persistTransaction(
    transactionData: DataAccessTypes.ITransaction,
    channelId: string,
    topics?: string[],
  ): Promise<DataAccessTypes.IReturnPersistTransaction> {
    // We don't use the node to persist the transaction, but we will Do it ourselves

    // create a block and add the transaction in it
    const block: DataAccessTypes.IBlock = Block.pushTransaction(
      Block.createEmptyBlock(),
      transactionData,
      channelId,
      topics,
    );

    // store on ipfs the block and the the ipfs hash and size
    const {
      data: { ipfsHash, ipfsSize },
    } = await axios.post('/ipfsAdd', { data: block }, this.axiosConfig);

    // get the fee require to submit the hash
    const fee = await this.submitterContract.getFeesAmount(ipfsSize);

    // submit the hash to ethereum
    const tx = await this.submitterContract.submitHash(
      ipfsHash,
      // tslint:disable:no-magic-numbers
      ethers.utils.hexZeroPad(ethers.utils.hexlify(parseInt(ipfsSize, 10)), 32), { value: fee },
    );

    const ethBlock = await this.provider.getBlock(tx.blockNumber);

    // create the storage meta from the transaction receipt
    const storageMeta = {
      blockConfirmation: tx.confirmations,
      blockNumber: tx.blockNumber,
      blockTimestamp: ethBlock.timestamp,
      fee,
      // TODO !
      networkName: 'private',
      smartContractAddress: tx.to,
      transactionHash: tx.hash,
    };

    // Add the block to the cache
    if (!this.cache[channelId]) {
      this.cache[channelId] = {};
    }
    this.cache[channelId][ipfsHash] = {block, storageMeta};

    return {
      meta: {
        storageMeta,
        topics: topics || [],
        transactionStorageLocation: ipfsHash,
      },
      result: {},
    };
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
    const { data } = await Utils.retry(
      async () =>
        axios.get(
          '/getTransactionsByChannelId',
          Object.assign(this.axiosConfig, {
            params: { channelId, timestampBoundaries },
          }),
        ),
      {
        maxRetries: HTTP_REQUEST_MAX_RETRY,
        retryDelay: HTTP_REQUEST_RETRY_DELAY,
      },
    )();

    // get the transactions from the cache
    const transactionsCached: DataAccessTypes.IReturnGetTransactions = this.getTransactionsCachedAndCleanCache(channelId, data.meta.transactionsStorageLocation, timestampBoundaries);

    // merge cache and data from the node
    return {
      meta: {
        storageMeta: data.meta.storageMeta.concat(transactionsCached.meta.storageMeta),
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
   * Gets all the transactions of channel indexed by topic from the node through HTTP.
   *
   * @param topic topic to search for
   * @param updatedBetween filter timestamp boundaries
   */
  public async getChannelsByTopic(
    topic: string,
    updatedBetween?: DataAccessTypes.ITimestampBoundaries,
  ): Promise<DataAccessTypes.IReturnGetChannelsByTopic> {
    const { data } = await Utils.retry(
      async () =>
        axios.get(
          '/getChannelsByTopic',
          Object.assign(this.axiosConfig, {
            params: { topic, updatedBetween },
          }),
        ),
      {
        maxRetries: HTTP_REQUEST_MAX_RETRY,
        retryDelay: HTTP_REQUEST_RETRY_DELAY,
      },
    )();

    return data;
  }

  /**
   * Gets all the transactions of channel indexed by multiple topics from the node through HTTP.
   *
   * @param topics topics to search for
   * @param updatedBetween filter timestamp boundaries
   */
  public async getChannelsByMultipleTopics(
    topics: string[],
    updatedBetween?: DataAccessTypes.ITimestampBoundaries,
  ): Promise<DataAccessTypes.IReturnGetChannelsByTopic> {
    const { data } = await Utils.retry(
      async () =>
        axios.get(
          '/getChannelsByMultipleTopics',
          Object.assign(this.axiosConfig, {
            params: { topics, updatedBetween },
          }),
        ),
      {
        maxRetries: HTTP_REQUEST_MAX_RETRY,
        retryDelay: HTTP_REQUEST_RETRY_DELAY,
      },
    )();

    return data;
  }

  /**
   * Gets the transactions cached and remove the ones that have been retrieved from the node
   * (public for easier testing)
   *
   * @param channelId The channel id to search for
   * @param storageLocationFromNode location retrieved from the node
   * @param timestampBoundaries filter timestamp boundaries
   */
  public getTransactionsCachedAndCleanCache(
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
        if (this.cache[channelId][location] && (
          !timestampBoundaries ||
          ((timestampBoundaries.from === undefined || timestampBoundaries.from <= cache?.storageMeta.blockTimestamp) &&
            (timestampBoundaries.to === undefined || timestampBoundaries.to >= cache?.storageMeta.blockTimestamp))
        ) ) {
          accumulator.meta.storageMeta.push(cache?.storageMeta);
          accumulator.meta.transactionsStorageLocation.push(location);
          // cache?.block.transactions will always contain one transaction
          accumulator.result.transactions.push({transaction: cache?.block.transactions[0] as DataAccessTypes.ITransaction, timestamp: cache?.storageMeta.blockTimestamp});
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
