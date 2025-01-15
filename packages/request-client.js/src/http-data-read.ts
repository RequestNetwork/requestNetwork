import { DataAccessTypes } from '@requestnetwork/types';
import { validatePaginationParams } from '@requestnetwork/utils';
import { HttpDataAccessConfig } from './http-data-access-config';

export class HttpDataRead implements DataAccessTypes.IDataRead {
  constructor(private readonly dataAccessConfig: HttpDataAccessConfig) {}

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
   * Gets the transactions for a channel from the node through HTTP.
   *
   * @param channelId The channel id to search for
   * @param timestampBoundaries filter timestamp boundaries
   */
  public async getTransactionsByChannelId(
    channelId: string,
    timestampBoundaries?: DataAccessTypes.ITimestampBoundaries,
  ): Promise<DataAccessTypes.IReturnGetTransactions> {
    return await this.dataAccessConfig.fetchAndRetry<DataAccessTypes.IReturnGetTransactions>(
      '/getTransactionsByChannelId',
      {
        channelId,
        timestampBoundaries,
      },
    );
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
    validatePaginationParams(page, pageSize);

    const params = {
      topic,
      updatedBetween,
      ...(page !== undefined && { page }),
      ...(pageSize !== undefined && { pageSize }),
    };

    return await this.dataAccessConfig.fetchAndRetry('/getChannelsByTopic', params);
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
    validatePaginationParams(page, pageSize);

    return await this.dataAccessConfig.fetchAndRetry('/getChannelsByMultipleTopics', {
      topics,
      updatedBetween,
      page,
      pageSize,
    });
  }
}
