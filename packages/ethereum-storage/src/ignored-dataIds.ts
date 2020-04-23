import * as Keyv from 'keyv';

import { StorageTypes } from '@requestnetwork/types';

/**
 * Allows to save and retrieve the dataIds ignored with the reason
 */
export default class IgnoredDataIds {
  /**
   * Store the reason we ignored data ids in a dictionary
   */
  public ignoredDataIds: Keyv<StorageTypes.IIgnoredDataId>;

  /**
   * as KeyV don't allow to get the list of the keys, we need to store it manually
   * TODO (PROT-1189): replace KeyV by a database service
   */
  public listIgnoredDataIds: Keyv<string[]>;

  /**
   * Constructor
   * @param store a Keyv store to persist the metadata
   */
  public constructor(store?: Keyv.Store<any>) {
    this.ignoredDataIds = new Keyv<StorageTypes.IIgnoredDataId>({
      namespace: 'dataIdIgnored',
      store,
    });

    this.listIgnoredDataIds = new Keyv<string[]>({
      namespace: 'listIgnoredDataIds',
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
    dataId: string,
    reason: string,
    toRetry: boolean,
  ): Promise<void> {
    const previous = await this.ignoredDataIds.get(dataId);

    if (!previous) {
      // add the dataId id if new in the store
      await this.ignoredDataIds.set(dataId, {
        iteration: 1,
        lastTryTimestamp: Date.now(),
        reason,
        toRetry,
      });
      // update the list
      await this.addToDataIdsList(dataId);
    } else {
      // if already in the store
      if (previous.toRetry) {
        // update it only if it was mean to be retry
        await this.ignoredDataIds.set(dataId, {
          iteration: previous.iteration as number + 1,
          lastTryTimestamp: Date.now(),
          reason,
          toRetry,
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
    await this.ignoredDataIds.delete(dataId);
    // update the list
    await this.deleteFromDataIdsList(dataId);
  }

  /**
   * Retrieve reason from cache
   * @param dataId dataId to get Ethereum metadata from
   * @returns the reason or null
   */
  public async getReason(dataId: string): Promise<string | undefined> {
    return (await this.ignoredDataIds.get(dataId))?.reason;
  }

  /**
   * Get the list of data ids stored
   *
   * @returns the list of data ids stored
   */
  public async getDataIds(): Promise<string[]> {
    const listDataId: string[] | undefined = await this.listIgnoredDataIds.get('list');
    return listDataId || [];
  }

  /**
   * Get the list of data ids stored with reason
   *
   * @returns the list of data ids stored with reason
   */
  public async getDataIdsWithReasons(): Promise<any> {
    const listDataId: string[] | undefined = await this.listIgnoredDataIds.get('list');

    if (!listDataId) {
      return {};
    }
    const result: any = {};

    for (const dataId of Array.from(listDataId)) {
      result[dataId] = await this.ignoredDataIds.get(dataId);
    }

    return result;
  }

  /**
   * Update the list of data ids stored with reason
   *
   * @param dataId data id to add to the list
   * @returns
   */
  private async addToDataIdsList(dataId: string): Promise<void> {
    let listDataIds: string[] | undefined = await this.listIgnoredDataIds.get('list');
    if (!listDataIds) {
      listDataIds = [];
    }
    // update the list only if the dataId is not already stored
    if (!listDataIds.includes(dataId)) {
      listDataIds.push(dataId);
      await this.listIgnoredDataIds.set('list', listDataIds);
    }
  }

  /**
   * Update the list of data ids stored with reason
   *
   * @param dataId data id to add to the list
   * @returns
   */
  private async deleteFromDataIdsList(dataId: string): Promise<void> {
    let listDataIds: string[] | undefined = await this.listIgnoredDataIds.get('list');
    if (!listDataIds) {
      return;
    }
    listDataIds = listDataIds.filter(e => e !== dataId);
    await this.listIgnoredDataIds.set('list', listDataIds);
  }
}
