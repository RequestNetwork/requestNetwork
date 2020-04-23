import MultiFormat from '@requestnetwork/multi-format';
import { StorageTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import { EventEmitter } from 'events';

/**
 * Storage layer implemented with in-memory hashmap, to be used for testing.
 */
export default class MockStorage implements StorageTypes.IStorage {
  private data: {
    [key: string]: { state: StorageTypes.ContentState; content: string; timestamp: number };
  } = {};

  public async initialize(): Promise<void> {
    return;
  }

  public async _ipfsAdd(): Promise<never> {
    throw Error('will never be used');
  }

  public async _getStatus(): Promise<never> {
    throw Error('will never be used');
  }

  public async append(content: string): Promise<StorageTypes.IAppendResult> {
    if (!content) {
      throw Error('Error: no content provided');
    }
    const hash = MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(content));

    const nowTimestampInSec = Utils.getCurrentTimestampInSecond();

    this.data[hash] = {
      content,
      state: StorageTypes.ContentState.PENDING,
      timestamp: nowTimestampInSec,
    };

    const resultData = {
      content,
      id: hash,
      meta: {
        state: StorageTypes.ContentState.PENDING,
        storageType: StorageTypes.StorageSystemType.IN_MEMORY_MOCK,
        timestamp: nowTimestampInSec,
      },
    };
    const result = Object.assign(new EventEmitter(), resultData);

    // emit confirmed
    setTimeout(() => {
      this.data[hash].state = StorageTypes.ContentState.CONFIRMED;
      result.emit('confirmed', resultData);
      // tslint:disable-next-line:no-magic-numbers
    }, 100);

    return result;
  }

  public async read(id: string): Promise<StorageTypes.IEntry> {
    if (!id) {
      throw Error('No id provided');
    }
    return {
      content: this.data[id].content,
      id,
      meta: {
        state: this.data[id].state,
        storageType: StorageTypes.StorageSystemType.IN_MEMORY_MOCK,
        timestamp: this.data[id].timestamp,
      },
    };
  }

  public async readMany(ids: string[]): Promise<StorageTypes.IEntry[]> {
    return Promise.all(ids.map(id => this.read(id)));
  }

  public async getData(): Promise<StorageTypes.IEntriesWithLastTimestamp> {
    const entries = Object.entries(this.data).map(([id, { content, state, timestamp }]) => ({
      content,
      id,
      meta: {
        state,
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

  public async getIgnoredData(): Promise<StorageTypes.IEntry[]> {
    return [];
  }
}
