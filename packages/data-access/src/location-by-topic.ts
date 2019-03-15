import { DataAccess as DataAccessTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

// Interface of the object to store the storageLocation indexed by channel id
// We use a Set data structure because dataIds are unique
interface IStorageLocationByChannelId {
  [key: string]: Set<string>;
}

// Interface of the object to store the channel ids indexed by topic
interface IChannelIdByTopics {
  [key: string]: Set<string>;
}

/**
 * Class used to store the block's data-id indexed by the header topics of the blocks themselves
 */
export default class LocalLocationIndex {
  /**
   * Storage location by channel id
   * maps channelId => [storageLocation]
   */
  private storageLocationByChannelId: IStorageLocationByChannelId = {};

  /**
   * Channel Ids by topic
   * maps topic => [channelId]
   */
  private channelIdByTopics: IChannelIdByTopics = {};

  /**
   * Function to push location indexed with block topics
   *
   * @param storageLocation storage location to index
   * @param blockHeader header of the block
   */
  public pushStorageLocationIndexedWithBlockTopics(
    storageLocation: string,
    blockHeader: DataAccessTypes.IBlockHeader,
  ): void {
    // index the new block with the channel ids
    for (const id in blockHeader.channelIds) {
      if (blockHeader.channelIds.hasOwnProperty(id)) {
        this.storageLocationByChannelId[id] = this.storageLocationByChannelId[id] || new Set([]);
        this.storageLocationByChannelId[id].add(storageLocation);
      }
    }

    // index channel ids by the topics
    for (const id in blockHeader.topics) {
      if (blockHeader.topics.hasOwnProperty(id)) {
        for (const topic of blockHeader.topics[id]) {
          this.channelIdByTopics[topic] = this.channelIdByTopics[topic] || new Set([]);
          this.channelIdByTopics[topic].add(id);
        }
      }
    }
  }

  /**
   * Function to get location from a topic
   *
   * @param topic topic to retrieve the dataId
   *
   * @return list of the location connected to the topic
   */
  public getStorageLocationFromTopic(topic: string): string[] {
    return Utils.unique(
      Utils.flatten2DimensionsArray(
        this.getChannelIdsFromTopic(topic).map(id => this.getStorageLocationsFromChannelId(id)),
      ),
    ).uniqueItems;
  }

  /**
   * Function to get the channel ids from a topic
   *
   * @param topic topic to retrieve the dataId
   *
   * @return list of the channel ids connected to the topic
   */
  public getChannelIdsFromTopic(topic: string): string[] {
    return Utils.unique(
      // get the ids indexed by the topic
      Array.from(this.channelIdByTopics[topic] || []),
    ).uniqueItems;
  }

  /**
   * Function to get storage locations from a channel id
   *
   * @param channelId channel id to retrieve the storage location
   *
   * @return list of the location connected to the channel id
   */
  public getStorageLocationsFromChannelId(channelId: string): string[] {
    return Array.from(this.storageLocationByChannelId[channelId] || []);
  }
}
