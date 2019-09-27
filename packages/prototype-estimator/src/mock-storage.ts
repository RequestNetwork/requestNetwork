// Copy from packages\request-client.js\src\mock-storage.ts

import MultiFormat from '@requestnetwork/multi-format';
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

  public async append(content: string): Promise<StorageTypes.IEntry> {
    if (!content) {
      throw Error('Error: no content provided');
    }
    const hash = MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(content));

    const timestamp = Utils.getCurrentTimestampInSecond();
    this.data[hash] = { content, timestamp };

    return {
      content: '',
      id: hash,
      meta: {
        storageType: StorageTypes.StorageSystemType.IN_MEMORY_MOCK,
        timestamp,
      },
    };
  }

  public async read(id: string): Promise<StorageTypes.IEntry> {
    if (!id) {
      throw Error('No id provided');
    }
    return {
      content: this.data[id].content,
      id,
      meta: {
        storageType: StorageTypes.StorageSystemType.IN_MEMORY_MOCK,
        timestamp: 1,
      },
    };
  }

  public async readMany(ids: string[]): Promise<StorageTypes.IEntry[]> {
    return Promise.all(ids.map(id => this.read(id)));
  }

  public async getData(): Promise<StorageTypes.IEntriesWithLastTimestamp> {
    const entries = Object.entries(this.data).map(([id, { content, timestamp }]) => ({
      content,
      id,
      meta: {
        storageType: StorageTypes.StorageSystemType.IN_MEMORY_MOCK,
        timestamp,
      },
    }));

    const nowTimestampInSec = Utils.getCurrentTimestampInSecond();

    return {
      entries,
      lastTimestamp: nowTimestampInSec,
    };
  }
}
