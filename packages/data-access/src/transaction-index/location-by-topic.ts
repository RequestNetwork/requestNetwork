import { DataAccessTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import * as Keyv from 'keyv';

// Serialize function used for keyv to serialize a Set data structure into a string
// There is no way to directly stringify a Set, we need to convert it to an array before
// Typescript error from keyv: deserialized's type should be { value: Set<string>, expires: number }
// but it's inferred as a Set<string>
const serializeSet = (deserialized: any): string => JSON.stringify(Array.from(deserialized.value));

// Deserialize function used for keyv to deserialize a string into a Set data structure
// Typescript error from keyv: function return's type should be { value: Set<string>, expires: number }
// but it's inferred as a Set<string>
const deserializeSet = (serialized: string): any => {
  // We use JSON.parse to convert the string into an array before converting it to a Set
  const set: Set<string> = new Set(JSON.parse(serialized));
  return { value: set };
};

/**
 * Helps store and retrieve channelIds by topic, and transaction location per channelId
 */
export default class LocationByTopicTransactionIndex {
  /**
   * Storage location by channel id
   * maps channelId => [storageLocation]
   * This attribute is public for mocking purpose
   */
  public storageLocationByChannelId: Keyv<Set<string>>;

  /**
   * Channel Ids by topic
   * maps topic => [channelId]
   * This attribute is public for mocking purpose
   */
  public channelIdByTopics: Keyv<Set<string>>;

  /**
   * Constructor for LocationByTopicIndex
   * @param store a Keyv store to persist the index to.
   */
  constructor(store?: Keyv.Store<any>) {
    this.storageLocationByChannelId = new Keyv<Set<string>>({
      deserialize: deserializeSet,
      namespace: 'storageLocationByChannelId',
      serialize: serializeSet,
      store,
    });
    this.channelIdByTopics = new Keyv<Set<string>>({
      deserialize: deserializeSet,
      namespace: 'channelIdByTopics',
      serialize: serializeSet,
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
    for (const id of Object.keys(blockHeader.channelIds)) {
      const existingLocationIds: Set<string> =
        (await this.storageLocationByChannelId.get(id)) || new Set([]);
      await this.storageLocationByChannelId.set(id, existingLocationIds.add(storageLocation));
    }

    // index channel ids by the topics
    for (const id of Object.keys(blockHeader.topics)) {
      for (const topic of blockHeader.topics[id]) {
        const existingChannelIds: Set<string> =
          (await this.channelIdByTopics.get(topic)) || new Set([]);
        await this.channelIdByTopics.set(topic, existingChannelIds.add(id));
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
    return Array.from((await this.channelIdByTopics.get(topic)) || []);
  }

  /**
   * Function to get the channel ids from multiple topics
   *
   * @param topics topics to retrieve the dataIds
   * @returns list of the channel ids linked to the topics
   */
  public async getChannelIdsFromMultipleTopics(topics: string[]): Promise<string[]> {
    const channelIdsPromises = topics.map(async topic => {
      return Array.from((await this.channelIdByTopics.get(topic)) || []);
    });
    const channelIds = await Promise.all(channelIdsPromises);

    // flatten the array of array and remove the duplicates
    return Utils.unique(Utils.flatten2DimensionsArray(channelIds)).uniqueItems;
  }
  /**
   * Function to get storage locations from a channel id
   *
   * @param channelId channel id to retrieve the storage location
   * @returns list of the location connected to the channel id
   */
  public async getStorageLocationsFromChannelId(channelId: string): Promise<string[]> {
    return Array.from((await this.storageLocationByChannelId.get(channelId)) || []);
  }
}
