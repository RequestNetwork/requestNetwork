import MultiFormat from '@requestnetwork/multi-format';
import { StorageTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import { EventEmitter } from 'events';

/**
 * Storage layer implemented with in-memory hashmap, to be used for testing.
 */
export default class MockStorage implements StorageTypes.IStorage {
  private data: Map<
    string,
    { state: StorageTypes.ContentState; content: string; timestamp: number }
  > = new Map();

  // For test purpose we can force the next append call to emit Error
  private forceEmitError: boolean = false;

  public async initialize(): Promise<void> {
    return;
  }

  public async _ipfsAdd(content: string): Promise<StorageTypes.IIpfsMeta> {
    if (!content) {
      throw Error('Error: no content provided');
    }
    const hash = MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(content));

    const nowTimestampInSec = Utils.getCurrentTimestampInSecond();

    this.data.set(hash, {
      content,
      state: StorageTypes.ContentState.PENDING,
      timestamp: nowTimestampInSec,
    });

    return {
      ipfsHash: hash,
      ipfsSize: content.length,
    };
  }

  public async append(content: string): Promise<StorageTypes.IAppendResult> {
    if (!content) {
      throw Error('Error: no content provided');
    }
    const hash = MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(content));

    const nowTimestampInSec = Utils.getCurrentTimestampInSecond();

    const dataToStore = {
      content,
      state: StorageTypes.ContentState.PENDING,
      timestamp: nowTimestampInSec,
    };

    this.data.set(hash, dataToStore);

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

    setTimeout(() => {
      if (this.forceEmitError) {
        // emit error
        this.forceEmitError = false;
        result.emit('error', 'forced error asked by _makeNextAppendFailInsteadOfConfirmed()');
      } else {
        // emit confirmed
        dataToStore.state = StorageTypes.ContentState.CONFIRMED;
        this.data.set(hash, dataToStore);
        result.emit('confirmed', resultData);
      }
      // tslint:disable-next-line:no-magic-numbers
    }, 100);

    return result;
  }

  public async read(id: string): Promise<StorageTypes.IEntry> {
    if (!id) {
      throw Error('No id provided');
    }
    const data = this.data.get(id);
    if (!data) {
      throw Error('No content found from this id');
    }
    return {
      content: data.content,
      id,
      meta: {
        state: data.state,
        storageType: StorageTypes.StorageSystemType.IN_MEMORY_MOCK,
        timestamp: data.timestamp,
      },
    };
  }

  public async readMany(ids: string[]): Promise<StorageTypes.IEntry[]> {
    return Promise.all(ids.map(id => this.read(id)));
  }

  public async getData(): Promise<StorageTypes.IEntriesWithLastTimestamp> {
    const entries = Array.from(this.data.entries()).map(([id, { content, state, timestamp }]) => ({
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

  /**
   * Gets information
   *
   * @param detailed if true get the list of files hash
   */
  public async _getStatus(detailed?: boolean): Promise<any> {
    return {
      dataIds: {
        count: Object.entries(this.data).length,
        values: detailed ? Object.entries(this.data) : undefined,
      },
      ignoredDataIds: {
        count: 0,
        values: detailed ? [] : undefined,
      },
    };
  }

  public _makeNextAppendFailInsteadOfConfirmed(): void {
    this.forceEmitError = true;
  }
}
