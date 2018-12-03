import { DataAccess as DataAccessTypes, IStorage } from '@requestnetwork/types';

import Block from './block';

// Interface of the object to store the data-id indexed by transactions topics
interface ITopicStorageid {
  [key: string]: string[];
}

// Class use to store the block's data-id indexed by the header topics of the blocks them-self
export default class LocalDataIdIndex {
  // data id by topic
  // maps topic => [dataId]
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
  ) {
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
