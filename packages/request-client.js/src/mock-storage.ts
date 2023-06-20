import MultiFormat from '@requestnetwork/multi-format';
import { StorageTypes } from '@requestnetwork/types';
import { EventEmitter } from 'events';
import { getCurrentTimestampInSecond, normalizeKeccak256Hash } from '@requestnetwork/utils';

/**
 * Storage layer implemented with in-memory hashmap, to be used for testing.
 */
export class MockStorage implements StorageTypes.IStorage {
  private data: Map<string, StorageTypes.IEntry> = new Map();

  // For test purpose we can force the next append call to emit Error
  private forceEmitError = false;

  public async initialize(): Promise<void> {
    return;
  }

  public async append(content: string): Promise<StorageTypes.IAppendResult> {
    if (!content) {
      throw Error('Error: no content provided');
    }
    const hash = MultiFormat.serialize(normalizeKeccak256Hash(content));

    const nowTimestampInSec = getCurrentTimestampInSecond();

    const resultData = {
      content,
      id: hash,
      meta: {
        state: StorageTypes.ContentState.PENDING,
        storageType: StorageTypes.StorageSystemType.IN_MEMORY_MOCK,
        timestamp: nowTimestampInSec,
      },
    };
    this.data.set(hash, resultData);

    const result = Object.assign(
      new EventEmitter() as StorageTypes.AppendResultEmitter,
      resultData,
    );

    setTimeout(() => {
      if (this.forceEmitError) {
        // emit error
        this.forceEmitError = false;
        result.emit('error', 'forced error asked by _makeNextAppendFailInsteadOfConfirmed()');
      } else {
        resultData.meta.state = StorageTypes.ContentState.CONFIRMED;
        this.data.set(hash, resultData);
        result.emit('confirmed', resultData);
      }
      // eslint-disable-next-line no-magic-numbers
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
    return data;
  }

  public async readMany(ids: string[]): Promise<StorageTypes.IEntry[]> {
    return Promise.all(ids.map((id) => this.read(id)));
  }

  public async getData(): Promise<StorageTypes.IEntriesWithLastTimestamp> {
    const entries = Array.from(this.data.values());

    const nowTimestampInSec = getCurrentTimestampInSecond();

    return {
      entries,
      lastTimestamp: nowTimestampInSec,
    };
  }

  /**
   * Gets information
   *
   */
  public async _getStatus(): Promise<any> {
    return {
      dataIds: {
        count: Object.entries(this.data).length,
        values: [],
      },
      ignoredDataIds: {
        count: 0,
        values: [],
      },
    };
  }

  public _makeNextAppendFailInsteadOfConfirmed(): void {
    this.forceEmitError = true;
  }
}
