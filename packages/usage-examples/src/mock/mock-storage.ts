/* eslint-disable spellcheck/spell-checker */
// Copy from packages/request-client.js/src/mock-storage.ts

import { StorageTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

/**
 * Storage layer implemented with in-memory hashmap, to be used for testing.
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
    const hash = Utils.crypto.normalizeKeccak256Hash(content);

    const nowTimestampInSec = Utils.getCurrentTimestampInSecond();

    this.data[hash] = { content, timestamp: nowTimestampInSec };

    return {
      content: '',
      id: hash,
      meta: {
        storageType: StorageTypes.StorageSystemType.IN_MEMORY_MOCK,
        timestamp: nowTimestampInSec,
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
        timestamp: this.data[id].timestamp,
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
