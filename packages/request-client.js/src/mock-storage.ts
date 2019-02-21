import { Storage as StorageTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

/**
 * Storage layer implemented with in-memory hashmap, to be used for testing.
 */
export default class MockStorage implements StorageTypes.IStorage {
  private data: { [key: string]: string } = {};

  public async append(content: string): Promise<StorageTypes.IOneDataIdAndMeta> {
    if (!content) {
      throw Error('Error: no content provided');
    }
    const hash = Utils.crypto.normalizeKeccak256Hash(content);

    this.data[hash] = content;

    return {
      meta: {
        storageType: StorageTypes.StorageSystemType.IN_MEMORY_MOCK,
      },
      result: {
        dataId: hash,
      },
    };
  }

  public async read(id: string): Promise<StorageTypes.IOneContentAndMeta> {
    if (!id) {
      throw Error('No id provided');
    }
    return {
      meta: {
        storageType: StorageTypes.StorageSystemType.IN_MEMORY_MOCK,
      },
      result: { content: this.data[id] },
    };
  }

  public async getAllDataId(): Promise<StorageTypes.IGetAllDataIdReturn> {
    const results = Object.keys(this.data);
    return {
      meta: {
        metaDataIds: new Array(results.length).fill({
          storageType: StorageTypes.StorageSystemType.IN_MEMORY_MOCK,
        }),
      },
      result: {
        dataIds: results,
      },
    };
  }

  public async getNewDataId(): Promise<StorageTypes.IGetNewDataIdReturn> {
    return {
      meta: {
        metaDataIds: [],
      },
      result: {
        dataIds: [],
      },
    };
  }

  public async getAllData(): Promise<StorageTypes.IGetAllDataReturn> {
    const results = Object.values(this.data).map(String);

    return {
      meta: {
        metaData: new Array(results.length).fill({
          storageType: StorageTypes.StorageSystemType.IN_MEMORY_MOCK,
        }),
      },
      result: {
        data: results,
      },
    };
  }
}
