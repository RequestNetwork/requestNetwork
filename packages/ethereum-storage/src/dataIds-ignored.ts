import * as Keyv from 'keyv';

import { StorageTypes } from '@requestnetwork/types';

/**
 * Interval time between iteration for the retry
 */
const INTERVAL_RETRY_MS = 60000; // every minute

/**
 * Allows to save and retrieve the dataIds ignored with the reason
 */
export default class DataIdsIgnored {
  /**
   * Store the reason we ignored data ids in a dictionary
   */
  public dataIdsIgnored: Keyv<StorageTypes.IDataIdIgnored>;

  public listDataIdsIgnored: Keyv<string[]>;

  /**
   * Constructor
   * @param store a Keyv store to persist the metadata
   */
  public constructor(store?: Keyv.Store<any>) {
    this.dataIdsIgnored = new Keyv<StorageTypes.IDataIdIgnored>({
      namespace: 'dataIdIgnored',
      store,
    });

    this.listDataIdsIgnored = new Keyv<string[]>({
      namespace: 'listDataIdsIgnored',
      store,
    });
  }

  /**
   * Saves in the cache the reason to ignore the dataId
   * @param dataId dataId
   * @param reason reason we ignored the dataId
   * @param toRetry will be retry later if true
   */
  public async save(
    entry: StorageTypes.IEthereumEntry,
  ): Promise<void> {
    const previous = await this.dataIdsIgnored.get(entry.hash);

    if (!previous) {
      // add the dataId id if new in the store
      await this.dataIdsIgnored.set(entry.hash, {
        entry,
        iteration: 1,
        lastTryTimestamp: Date.now(),
        toRetry: entry.error?.type === StorageTypes.ErrorEntries.ipfsConnectionError,
      });
      // update the list
      await this.addToDataIdsList(entry.hash);
    } else {
      // if already in the store
      if (previous.toRetry) {
        // update it only if it was mean to be retry
        await this.dataIdsIgnored.set(entry.hash, {
          entry,
          iteration: previous.iteration as number + 1,
          lastTryTimestamp: Date.now(),
          toRetry: entry.error?.type === StorageTypes.ErrorEntries.ipfsConnectionError,
        });
      }
    }
  }

  /**
   * Removes in the cache the ignored dataId
   * @param dataId dataId
   */
  public async delete(
    dataId: string,
  ): Promise<void> {
    await this.dataIdsIgnored.delete(dataId);
    // update the list
    await this.deleteFromDataIdsList(dataId);
  }

  /**
   * Retrieve reason from cache
   * @param dataId dataId to get Ethereum metadata from
   * @returns the reason or null
   */
  public async getReason(dataId: string): Promise<string | undefined> {
    return (await this.dataIdsIgnored.get(dataId))?.entry.error?.message;
  }

  /**
   * Get the list of data ids stored
   *
   * @returns the list of data ids stored
   */
  public async getDataIds(): Promise<string[]> {
    const listDataId: string[] | undefined = await this.listDataIdsIgnored.get('list');
    return listDataId || [];
  }
  /**
   * Get the list of data ids that should be retry
   *
   * @returns the list of data ids
   */
  public async getDataIdsToRetry(): Promise<StorageTypes.IEthereumEntry[]> {
    const listDataId: string[] | undefined = await this.listDataIdsIgnored.get('list');

    const result: StorageTypes.IEthereumEntry[] = [];

    if (listDataId) {
      for (const dataId of Array.from(listDataId)) {
        const data: StorageTypes.IDataIdIgnored | undefined = await this.dataIdsIgnored.get(dataId);
        if (data && this.shouldBeRetry(data)) {
          result.push(data.entry);
        }
      }
    }

    return result;
  }

  /**
   * Get the list of data ids stored with reason
   *
   * @returns the list of data ids stored with reason
   */
  public async getDataIdsWithReasons(): Promise<any> {
    const listDataId: string[] | undefined = await this.listDataIdsIgnored.get('list');

    if (!listDataId) {
      return {};
    }
    const result: any = {};

    for (const dataId of Array.from(listDataId)) {
      result[dataId] = await this.dataIdsIgnored.get(dataId);
    }

    return result;
  }

  /**
   * Check if it is the time to retry the entry
   * @param entry to check
   * @returns true if it is time to retry
   */
  private shouldBeRetry(
    entry: StorageTypes.IDataIdIgnored,
  ): boolean {
    return entry.toRetry && (entry.lastTryTimestamp + Math.pow(entry.iteration, 2) * INTERVAL_RETRY_MS) <= Date.now();
  }

  /**
   * Update the list of data ids stored with reason
   *
   * @param dataId data id to add to the list
   * @returns
   */
  private async addToDataIdsList(dataId: string): Promise<void> {
    let listDataIds: string[] | undefined = await this.listDataIdsIgnored.get('list');
    if (!listDataIds) {
      listDataIds = [];
    }
    // update the list only if the dataId is not already stored
    if (!listDataIds.includes(dataId)) {
      listDataIds.push(dataId);
      await this.listDataIdsIgnored.set('list', listDataIds);
    }
  }

  /**
   * Update the list of data ids stored with reason
   *
   * @param dataId data id to add to the list
   * @returns
   */
  private async deleteFromDataIdsList(dataId: string): Promise<void> {
    let listDataIds: string[] | undefined = await this.listDataIdsIgnored.get('list');
    if (!listDataIds) {
      return;
    }
    listDataIds = listDataIds.filter(e => e !== dataId);
    await this.listDataIdsIgnored.set('list', listDataIds);
  }
}
