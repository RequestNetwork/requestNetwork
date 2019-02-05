// Copy from packages\request-client.js\src\mock-storage.ts

import { Storage as StorageTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

/**
 * Storage layer implemented with in-memory hashmap, to be used for testing.
 *
 * @export
 * @class MockStorage
 * @implements {StorageTypes.IStorage}
 */
export default class MockStorage implements StorageTypes.IStorage {
  private data: { [key: string]: string } = {};

  public async append(content: string): Promise<StorageTypes.IRequestStorageOneDataIdAndMeta> {
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

  public async read(id: string): Promise<StorageTypes.IRequestStorageOneContentAndMeta> {
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

  public async getAllDataId(): Promise<StorageTypes.IRequestStorageGetAllDataIdReturn> {
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

  public async getAllData(): Promise<StorageTypes.IRequestStorageGetAllDataReturn> {
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
