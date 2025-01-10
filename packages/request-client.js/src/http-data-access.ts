import { ClientTypes, DataAccessTypes } from '@requestnetwork/types';
import { utils } from 'ethers';
import { CombinedDataAccess, NoPersistDataWrite } from '@requestnetwork/data-access';
import { HttpDataRead } from './http-data-read';
import { HttpDataWrite } from './http-data-write';
import { HttpDataAccessConfig, NodeConnectionConfig } from './http-data-access-config';
import { HttpTransaction } from './http-transaction';

/**
 * Exposes a Data-Access module over HTTP
 */
export default class HttpDataAccess extends CombinedDataAccess {
  protected readonly dataAccessConfig: HttpDataAccessConfig;
  private readonly transaction: HttpTransaction;
  /**
   * Creates an instance of HttpDataAccess.
   * @param httpConfig @see ClientTypes.IHttpDataAccessConfig for available options.
   * @param nodeConnectionConfig Configuration options to connect to the node.
   */
  constructor(
    {
      httpConfig,
      nodeConnectionConfig,
      persist,
    }: {
      httpConfig?: Partial<ClientTypes.IHttpDataAccessConfig>;
      nodeConnectionConfig?: Partial<NodeConnectionConfig>;
      persist?: boolean;
    } = {
      httpConfig: {},
      nodeConnectionConfig: {},
      persist: true,
    },
  ) {
    const dataAccessConfig = new HttpDataAccessConfig({ httpConfig, nodeConnectionConfig });
    const transaction = new HttpTransaction(dataAccessConfig);
    const reader = new HttpDataRead(dataAccessConfig);
    const writer = persist
      ? new HttpDataWrite(dataAccessConfig, transaction)
      : new NoPersistDataWrite();

    super(reader, writer);

    this.dataAccessConfig = dataAccessConfig;
    this.transaction = transaction;
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
   * Closes the module. Does nothing, exists only to implement IDataAccess
   *
   * @returns nothing
   */
  public async close(): Promise<void> {
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
    return await this.writer.persistTransaction(transactionData, channelId, topics);
  }

  /**
   * Gets a transaction from the node through HTTP.
   * @param transactionData The transaction data
   */
  public async getConfirmedTransaction(
    transactionData: DataAccessTypes.ITransaction,
  ): Promise<DataAccessTypes.IReturnPersistTransaction> {
    return await this.transaction.getConfirmedTransaction(transactionData);
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
    return await this.reader.getTransactionsByChannelId(channelId, timestampBoundaries);
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
    page?: number,
    pageSize?: number,
  ): Promise<DataAccessTypes.IReturnGetChannelsByTopic> {
    return await this.reader.getChannelsByTopic(topic, updatedBetween, page, pageSize);
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
    page?: number,
    pageSize?: number,
  ): Promise<DataAccessTypes.IReturnGetChannelsByTopic> {
    return await this.reader.getChannelsByMultipleTopics(topics, updatedBetween, page, pageSize);
  }

  /**
   * Gets information from the node (version, files etc...)
   *
   */
  public async _getStatus(): Promise<any> {
    return await this.dataAccessConfig.fetchAndRetry('/information', {});
  }

  /**
   * Gets the Lit Protocol capacity delegation auth sig from the node through HTTP.
   *
   * @param delegateeAddress the address of the delegatee
   */
  public async getLitCapacityDelegationAuthSig(
    delegateeAddress: string,
  ): Promise<DataAccessTypes.AuthSig> {
    if (!delegateeAddress || typeof delegateeAddress !== 'string') {
      throw new Error('delegateeAddress must be a non-empty string');
    }
    if (!utils.isAddress(delegateeAddress)) {
      throw new Error('delegateeAddress must be a valid Ethereum address');
    }
    return await this.dataAccessConfig.fetchAndRetry('/getLitCapacityDelegationAuthSig', {
      delegateeAddress,
    });
  }
}
