import { DataAccess as DataAccessTypes, IStorage } from '@requestnetwork/types';

import Block from './block';

// Interface of the object to store the data-id indexed by transactions indexes
interface IIndexStorageId {
  [key: string]: string[];
}

// Class use to store the block's data-id indexed by the header index of the blocks them-self
export default class LocalDataIdIndex {
  // data id by index
  // maps index => [dataId]
  private indexStorageDataId: IIndexStorageId = {};

  /**
   * Function to push dataId indexed with block index
   *
   * @param string dataId dataId to index
   * @param IRequestDataAccessIndex blockIndex index of the block
   */
  public pushDataIdIndexedWithBlockIndex(
    dataId: string,
    blockIndex: DataAccessTypes.IRequestDataAccessIndex,
  ) {
    // index the new block with the index
    for (const index in blockIndex) {
      if (blockIndex.hasOwnProperty(index)) {
        this.indexStorageDataId[index] = this.indexStorageDataId[index] || [];
        this.indexStorageDataId[index].push(dataId);
      }
    }
  }

  /**
   * Function to get dataId in the local index
   *
   * @param string index index to retreives the dataId
   *
   * @return string[] list of the dataId connected to the index
   */
  public getDataIdByIndex(index: string): string[] {
    return this.indexStorageDataId[index] || [];
  }
}
