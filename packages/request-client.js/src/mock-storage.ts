import { Storage as StorageTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

/**
 * Storage layer implemented with in-memory hashmap, to be used for testing.
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

    const nowTimestampInSec = Utils.getCurrentTimestampInSecond();

    this.data[hash] = { content, timestamp: nowTimestampInSec };

    return {
      meta: {
        storageType: StorageTypes.StorageSystemType.IN_MEMORY_MOCK,
        timestamp: nowTimestampInSec,
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
        timestamp: this.data[id].timestamp,
      },
      result: { content: this.data[id].content },
    };
  }

  public async readMany(ids: string[]): Promise<StorageTypes.IOneContentAndMeta[]> {
    return Promise.all(ids.map(id => this.read(id)));
  }

  public async getDataId(): Promise<StorageTypes.IGetDataIdReturn> {
    const results = Object.keys(this.data);
    const metaDataIds = Object.values(this.data).map(elem => {
      return {
        storageType: StorageTypes.StorageSystemType.IN_MEMORY_MOCK,
        timestamp: elem.timestamp,
      };
    });

    return {
      meta: {
        metaDataIds,
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

  public async getData(): Promise<StorageTypes.IGetDataReturn> {
    const results = Object.values(this.data).map(elem => elem.content);
    const metaData = Object.values(this.data).map(elem => {
      return {
        storageType: StorageTypes.StorageSystemType.IN_MEMORY_MOCK,
        timestamp: elem.timestamp,
      };
    });

    return {
      meta: {
        metaData,
      },
      result: {
        data: results,
      },
    };
  }
}
