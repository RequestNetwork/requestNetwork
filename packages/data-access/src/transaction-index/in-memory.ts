import { DataAccess as DataAccessTypes } from '@requestnetwork/types';

import LocationByTopic from '../location-by-topic';
import TimestampByLocation from '../timestamp-by-location';

/**
 * An in-memory implementation of the transaction index.
 */
export default class InMemoryTransactionIndex implements DataAccessTypes.ITransactionIndex {
  // DataIds (Id of data on storage layer) indexed by transaction topic
  // Will be used to get the data from storage with the transaction topic
  private locationByTopic?: LocationByTopic;

  // Timestamp of the dataIds
  // Will be used to get the data from timestamp boundaries
  private timestampByLocation: TimestampByLocation;

  /**
   * Constructor InMemoryTransactionIndex
   */
  constructor() {
    this.timestampByLocation = new TimestampByLocation();
  }

  /**
   * Creates an empty LocationByTopic
   */
  public initializeEmpty(): void {
    if (this.locationByTopic) {
      throw new Error('already initialized');
    }
    this.locationByTopic = new LocationByTopic();
  }

  /**
   * Method to check if the InMemoryTransactionIndex was already initialized.
   *
   * @returns true if initialized, false otherwise
   */
  public isInitialized(): boolean {
    return !!this.locationByTopic;
  }

  /**
   * Get the last indexed timestamp
   */
  public getLastTransactionTimestamp(): Promise<number | null> {
    return Promise.resolve(this.timestampByLocation.getLastTransactionTimestamp());
  }

  /**
   * Adds a transaction to the index, for indexing by channel, topic and timestamp
   *
   * @param dataId the dataId to index
   * @param header the headers of the block (containing channels and topics)
   * @param timestamp the timestamp of the transaction
   */
  public async addTransaction(dataId: string, header: any, timestamp: number): Promise<void> {
    if (!this.locationByTopic) {
      throw new Error('TransactionIndex must be initialized');
    }
    // topic the dataId with block topic
    this.locationByTopic.pushStorageLocationIndexedWithBlockTopics(dataId, header);

    // add the timestamp in the index
    this.timestampByLocation.pushTimestampByLocation(dataId, timestamp);
    return Promise.resolve();
  }

  /**
   * Get a list of transactions indexed by channel id
   * @param channelId channel id to retrieve the transaction from
   * @param timestampBoundaries timestamp boundaries of the transactions search
   */
  public async getStorageLocationList(
    channelId: string,
    timestampBoundaries?: DataAccessTypes.ITimestampBoundaries,
  ): Promise<string[]> {
    if (!this.locationByTopic) {
      throw new Error('TransactionIndex must be initialized');
    }
    const storageLocationList = this.locationByTopic
      .getStorageLocationsFromChannelId(channelId)
      .filter(dataId => this.timestampByLocation.isDataInBoundaries(dataId, timestampBoundaries));

    return Promise.resolve(storageLocationList);
  }

  /**
   * Get a list of channels indexed by topic
   * @param topic topic to retrieve the transaction from
   * @param timestampBoundaries timestamp boundaries of the transactions search
   */
  public async getChannelIdsForTopic(
    topic: string,
    timestampBoundaries?: DataAccessTypes.ITimestampBoundaries | undefined,
  ): Promise<string[]> {
    if (!this.locationByTopic) {
      throw new Error('TransactionIndex must be initialized');
    }
    // Gets the list of locationStorage grouped by channel id for the topic given
    const storageLocationByChannelId = this.locationByTopic.getStorageLocationFromTopicGroupedByChannelId(
      topic,
    );

    let channelIds = Object.keys(storageLocationByChannelId);

    // Filters the channels to only keep the modified ones during the time boundaries
    if (timestampBoundaries) {
      channelIds = channelIds.filter(channelId => {
        return storageLocationByChannelId[channelId].find(dataId =>
          this.timestampByLocation.isDataInBoundaries(dataId, timestampBoundaries),
        );
      });
    }
    return Promise.resolve(channelIds);
  }
}
