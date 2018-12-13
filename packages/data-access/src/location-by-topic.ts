import { DataAccess as DataAccessTypes } from '@requestnetwork/types';

// Interface of the object to store the data-id indexed by transactions topics
interface ITopicStorageId {
  [key: string]: string[];
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
        this.topicStorageLocation[topic] = this.topicStorageLocation[topic] || [];
        this.topicStorageLocation[topic].push(dataId);
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
    return this.topicStorageLocation[topic] || [];
  }
}
