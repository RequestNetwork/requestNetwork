import { DataAccess as DataAccessTypes } from '@requestnetwork/types';

// Interface of the object to store the data-id indexed by transactions topics
interface ITopicStorageid {
  [key: string]: string[];
}

/**
 * Class used to store the block's data-id indexed by the header topics of the blocks themselves
 */
export default class LocalDataIdIndex {
  /**
   * Data id by topic
   * maps topic => [dataId]
   */
  private topicStorageDataId: ITopicStorageid = {};

  /**
   * Function to push dataId indexed with block topics
   *
   * @param string dataId dataId to index
   * @param IRequestDataAccessTopics blockTopics topics of the block
   */
  public pushDataIdIndexedWithBlockTopics(
    dataId: string,
    blockTopics: DataAccessTypes.IRequestDataAccessTopics,
  ): void {
    // index the new block with the topics
    for (const topic in blockTopics) {
      if (blockTopics.hasOwnProperty(topic)) {
        this.topicStorageDataId[topic] = this.topicStorageDataId[topic] || [];
        this.topicStorageDataId[topic].push(dataId);
      }
    }
  }

  /**
   * Function to get dataId in the local index from topic
   *
   * @param string topic topic to retreives the dataId
   *
   * @return string[] list of the dataId connected to the topic
   */
  public getDataIdFromTopic(topic: string): string[] {
    return this.topicStorageDataId[topic] || [];
  }
}
