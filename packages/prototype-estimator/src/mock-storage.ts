// Copy from packages\request-client.js\src\mock-storage.ts

import { StorageTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

/**
 * Storage layer implemented with in-memory hashmap, to be used for testing.
 *
 * @export
 * @class MockStorage
 * @implements {StorageTypes.IStorage}
 */
export default class MockStorage implements StorageTypes.IStorage {
  private data: { [key: string]: { content: string; timestamp: number } } = {};

  public async initialize(): Promise<void> {
    return;
  }

  public async append(content: string): Promise<StorageTypes.IOneDataIdAndMeta> {
    if (!content) {
      throw Error('Error: no content provided');
    }
    const hash = Utils.crypto.normalizeKeccak256Hash(content);

    const timestamp = Utils.getCurrentTimestampInSecond();
    this.data[hash] = { content, timestamp };

    return {
      meta: {
        storageType: StorageTypes.StorageSystemType.IN_MEMORY_MOCK,
        timestamp,
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
        timestamp: 1,
      },
      result: { content: this.data[id].content },
    };
  }

  public async readMany(ids: string[]): Promise<StorageTypes.IOneContentAndMeta[]> {
    return Promise.all(ids.map(id => this.read(id)));
  }

  public async getDataId(): Promise<StorageTypes.IGetDataIdReturn> {
    const results = Object.keys(this.data);
    return {
      meta: {
        metaData: new Array(results.length).fill({
          storageType: StorageTypes.StorageSystemType.IN_MEMORY_MOCK,
        }),
      },
      result: {
        dataIds: results,
      },
    };
  }

  public async getData(): Promise<StorageTypes.IGetDataIdContentAndMeta> {
    const results = Object.values(this.data).map(data => String(data.content));
    const dataIds = Object.keys(this.data);

    return {
      meta: {
        metaData: new Array(results.length).fill({
          storageType: StorageTypes.StorageSystemType.IN_MEMORY_MOCK,
        }),
      },
      result: {
        data: results,
        dataIds,
      },
    };
  }
}
