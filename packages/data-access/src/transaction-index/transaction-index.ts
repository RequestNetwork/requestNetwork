import { DataAccessTypes } from '@requestnetwork/types';

import * as Bluebird from 'bluebird';
import * as Keyv from 'keyv';

import LocationByTopic from './location-by-topic';
import TimestampByLocation from './timestamp-by-location';

/**
 * An in-memory implementation of the transaction index.
 */

export default class TransactionIndex implements DataAccessTypes.ITransactionIndex {
  // DataIds (Id of data on storage layer) indexed by transaction topic
  // Will be used to get the data from storage with the transaction topic
  private locationByTopic?: LocationByTopic;

  // Timestamp of the dataIds
  // Will be used to get the data from timestamp boundaries
  private timestampByLocation: TimestampByLocation;

  private indexedLocation: Keyv<string[]>;

  /**
   * Constructor of TransactionIndex
   * @param store a Keyv store to persist the index
   */
  constructor(store?: Keyv.Store<any>) {
    this.timestampByLocation = new TimestampByLocation(store);
    this.locationByTopic = new LocationByTopic(store);

    this.indexedLocation = new Keyv<string[]>({
      namespace: 'indexedLocation',
      store,
    });
  }

  // tslint:disable-next-line: no-empty
  public async initialize(): Promise<void> {}

  /**
   * Get the last indexed timestamp
   */
  public getLastTransactionTimestamp(): Promise<number | null> {
    return this.timestampByLocation.getLastTransactionTimestamp();
  }

  /**
   * Adds a transaction to the index, for indexing by channel, topic and timestamp
   *
   * @param dataId the dataId to index
   * @param header the headers of the block (containing channels and topics)
   * @param timestamp the timestamp of the transaction
   */
  public async addTransaction(
    dataId: string,
    header: DataAccessTypes.IBlockHeader,
    timestamp: number,
  ): Promise<void> {
    if (!this.locationByTopic) {
      throw new Error('TransactionIndex must be initialized');
    }
    // topic the dataId with block topic
    await this.locationByTopic.pushStorageLocationIndexedWithBlockTopics(dataId, header);

    // add the timestamp in the index
    await this.timestampByLocation.pushTimestampByLocation(dataId, timestamp);

    await this.updateIndexedLocation(dataId);
  }

  /**
   * Removes a transaction from the index
   *
   * @param dataId the dataId to remove
   */
  public async removeTransaction(dataId: string): Promise<void> {
    if (!this.locationByTopic) {
      throw new Error('TransactionIndex must be initialized');
    }

    // remove the timestamp in the index
    await this.timestampByLocation.removeIndexedDataId(dataId);
  }

  /**
   * Update timestamp for a dataId
   *
   * @param dataId the dataId to index
   * @param timestamp the timestamp of the transaction
   */
  public async updateTimestamp(dataId: string, timestamp: number): Promise<void> {
    if (!this.timestampByLocation) {
      throw new Error('TransactionIndex must be initialized');
    }
    // update the timestamp in the index
    await this.timestampByLocation.updateTimestampByLocation(dataId, timestamp);
  }

  /**
   * Get a list of transactions indexed by channel id
   * @param channelId channel id to retrieve the transaction from
   * @param timestampBoundaries timestamp boundaries of the transactions search
   * @returns list of location of a channel
   */
  public async getStorageLocationList(
    channelId: string,
    timestampBoundaries?: DataAccessTypes.ITimestampBoundaries,
  ): Promise<string[]> {
    if (!this.locationByTopic) {
      throw new Error('TransactionIndex must be initialized');
    }

    // get transaction locations for the given channel
    let storageLocationList = await this.locationByTopic.getStorageLocationsFromChannelId(
      channelId,
    );

    storageLocationList = await Bluebird.filter(storageLocationList, async (dataId: string) => {
      // if the dataId has not been suppressed
      const exist: boolean =
        (await this.timestampByLocation.getTimestampFromLocation(dataId)) !== null;
      // if boundaries are passed, only return locations of transaction within these boundaries
      const inTimeBoundaries: boolean =
        !timestampBoundaries ||
        (await this.timestampByLocation.isDataInBoundaries(dataId, timestampBoundaries));
      return exist && inTimeBoundaries;
    });

    return storageLocationList;
  }

  /**
   * Get a list of channels indexed by topic
   * @param topic topic to retrieve the channelIds from
   * @param timestampBoundaries timestamp boundaries of the transactions search
   * @returns list of location of the channels indexed by the topic
   */
  public async getChannelIdsForTopic(
    topic: string,
    timestampBoundaries?: DataAccessTypes.ITimestampBoundaries | undefined,
  ): Promise<string[]> {
    if (!this.locationByTopic) {
      throw new Error('TransactionIndex must be initialized');
    }

    // get channels for given topic
    const channelIds = await this.locationByTopic.getChannelIdsFromTopic(topic);

    // if boundaries are passed, only return channelIds with transactions within these boundaries
    if (timestampBoundaries) {
      const result = [];
      // check for each channel if one of its transactions occurred during the given boundaries
      for (const channelId of channelIds) {
        const txLocations = await this.locationByTopic.getStorageLocationsFromChannelId(channelId);
        for (const txLocation of txLocations) {
          const isInBoundaries = await this.timestampByLocation.isDataInBoundaries(
            txLocation,
            timestampBoundaries,
          );
          if (isInBoundaries) {
            result.push(channelId);
            break;
          }
        }
      }
      return result;
    } else {
      return channelIds;
    }
  }

  /**
   * Get a list of channels indexed by topics
   * @param topics topics to retrieve the channelIds from
   * @param timestampBoundaries timestamp boundaries of the transactions search
   * @returns list of location of the channels indexed by the topics
   */
  public async getChannelIdsForMultipleTopics(
    topics: string[],
    timestampBoundaries?: DataAccessTypes.ITimestampBoundaries | undefined,
  ): Promise<string[]> {
    if (!this.locationByTopic) {
      throw new Error('TransactionIndex must be initialized');
    }

    // get channels for given topics
    const channelIds = await this.locationByTopic.getChannelIdsFromMultipleTopics(topics);

    // if boundaries are passed, only return channelIds with transactions within these boundaries
    if (timestampBoundaries) {
      const result = [];
      // check for each channel if one of its transactions occurred inside the given boundaries
      for (const channelId of channelIds) {
        const txLocations = await this.locationByTopic.getStorageLocationsFromChannelId(channelId);
        for (const txLocation of txLocations) {
          const isInBoundaries = await this.timestampByLocation.isDataInBoundaries(
            txLocation,
            timestampBoundaries,
          );
          if (isInBoundaries) {
            result.push(channelId);
            break;
          }
        }
      }
      return result;
    } else {
      return channelIds;
    }
  }

  /**
   * the list of indexed locations
   */
  public async getIndexedLocations(): Promise<string[]> {
    const listDataIds: string[] | undefined = await this.indexedLocation.get('list');
    return listDataIds || [];
  }

  /**
   * Update the list of data ids stored
   *
   * @param dataId data id to add to the list
   * @returns
   */
  private async updateIndexedLocation(dataId: string): Promise<void> {
    let listDataIds: string[] | undefined = await this.indexedLocation.get('list');
    if (!listDataIds) {
      listDataIds = [];
    }

    // push it if not already done
    if (!listDataIds.includes(dataId)) {
      listDataIds.push(dataId);
      await this.indexedLocation.set('list', listDataIds);
    }
  }
}
