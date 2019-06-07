import { DataAccessTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import * as  Keyv from 'keyv';

/**
 * Helps store and retrieve channelIds by topic, and transaction location per channelId
 */
export default class LocationByTopicTransactionIndex {
  /**
   * Storage location by channel id
   * maps channelId => [storageLocation]
   */
  private storageLocationByChannelId: Keyv<string[]>;

  /**
   * Channel Ids by topic
   * maps topic => [channelId]
   */
  private channelIdByTopics: Keyv<string[]>;

  /**
   * Constructor for LocationByTopicIndex
   * @param store a Keyv store to persist the index to.
   */
  constructor(store?: Keyv.Store<any>) {
    this.storageLocationByChannelId = new Keyv<string[]>({
      namespace: 'storageLocationByChannelId',
      store,
    });
    this.channelIdByTopics = new Keyv<string[]>({
      namespace: 'channelIdByTopics',
      store,
    });
  }

  /**
   * Function to push location indexed with block topics
   *
   * @param storageLocation storage location to index
   * @param blockHeader header of the block
   */
  public async pushStorageLocationIndexedWithBlockTopics(
    storageLocation: string,
    blockHeader: DataAccessTypes.IBlockHeader,
  ): Promise<void> {
    // index the new block with the channel ids
    for (const id in blockHeader.channelIds) {
      if (blockHeader.channelIds.hasOwnProperty(id)) {
        const existingLocationIds = (await this.storageLocationByChannelId.get(id)) || [];
        const newLocationIds = Utils.unique([...existingLocationIds, storageLocation]);
        await this.storageLocationByChannelId.set(id, newLocationIds.uniqueItems);

      }
    }

    // index channel ids by the topics
    for (const id in blockHeader.topics) {
      if (blockHeader.topics.hasOwnProperty(id)) {
        for (const topic of blockHeader.topics[id]) {
          const existingChannelIds = (await this.channelIdByTopics.get(topic)) || [];
          const newChannelIds = Utils.unique([...existingChannelIds, id]);
          await this.channelIdByTopics.set(topic, newChannelIds.uniqueItems);
        }
      }
    }
  }

  /**
   * Function to get the channel ids from a topic
   *
   * @param topic topic to retrieve the dataId
   * @returns list of the channel ids connected to the topic
   */
  public async getChannelIdsFromTopic(topic: string): Promise<string[]> {
    const channelIds = (await this.channelIdByTopics.get(topic)) || [];
    // get the ids indexed by the topic
    return Utils.unique(channelIds).uniqueItems;
  }

  /**
   * Function to get storage locations from a channel id
   *
   * @param channelId channel id to retrieve the storage location
   * @returns list of the location connected to the channel id
   */
  public async getStorageLocationsFromChannelId(channelId: string): Promise<string[]> {
    return (await this.storageLocationByChannelId.get(channelId)) || [];
  }
}
