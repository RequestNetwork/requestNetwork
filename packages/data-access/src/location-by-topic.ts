import { DataAccess as DataAccessTypes } from '@requestnetwork/types';

// Interface of the object to store the data-id indexed by transactions topics
// We use a Set data structure because dataIds are unique
interface ITopicStorageId {
  [key: string]: Set<string>;
}

/**
 * Class used to store the block's data-id indexed by the header topics of the blocks themselves
 */
export default class LocalLocationIndex {
  /**
   * Data id by topic
   * maps topic => [dataId]
   */
  private topicStorageLocation: ITopicStorageId = {};

  /**
   * Function to push location indexed with block topics
   *
   * @param string dataId dataId to index
   * @param IRequestDataAccessTopics blockTopics topics of the block
   */
  public pushLocationIndexedWithBlockTopics(
    dataId: string,
    blockTopics: DataAccessTypes.IRequestDataAccessTopics,
  ): void {
    // index the new block with the topics
    for (const topic in blockTopics) {
      if (blockTopics.hasOwnProperty(topic)) {
        this.topicStorageLocation[topic] = this.topicStorageLocation[topic] || new Set([]);
        this.topicStorageLocation[topic].add(dataId);
      }
    }
  }

  /**
   * Function to get location from topic
   *
   * @param string topic topic to retrieve the dataId
   *
   * @return string[] list of the location connected to the topic
   */
  public getLocationFromTopic(topic: string): string[] {
    return Array.from(this.topicStorageLocation[topic] || []);
  }
}
