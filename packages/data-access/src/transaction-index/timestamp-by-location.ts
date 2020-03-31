import { DataAccessTypes } from '@requestnetwork/types';

import * as Keyv from 'keyv';

/**
 * Class used to store the block's timestamp indexed by location
 */
export default class TimestampByLocationTransactionIndex {
  /**
   * timestamp by location
   * maps dataId => timestamp
   */
  private timestampByLocation: Keyv<number>;

  /**
   * TimestampByLocationTransactionIndex constructor
   * @param store a Keyv store to persist the index to
   */
  public constructor(store?: Keyv.Store<any>) {
    this.timestampByLocation = new Keyv<number>({
      namespace: 'timestampByLocation',
      store,
    });
  }

  /**
   * Function to push timestamp indexed by location
   *
   * @param dataId dataId of the block
   * @param timestamp timestamp of the block
   */
  public async pushTimestampByLocation(dataId: string, timestamp: number): Promise<void> {
    if (!(await this.timestampByLocation.get(dataId))) {
      await this.timestampByLocation.set(dataId, timestamp);
    }
    const lastTransactionTimestamp = await this.getLastTransactionTimestamp();
    if (!lastTransactionTimestamp || timestamp > lastTransactionTimestamp) {
      await this.setLastTransactionTimestamp(timestamp);
    }
  }

  /**
   * Removes timestamp indexed by location
   *
   * @param dataId dataId of the block
   */
  public async removeIndexedDataId(dataId: string): Promise<void> {
    await this.timestampByLocation.delete(dataId);
  }

  /**
   * Function to update timestamp indexed by location
   *
   * @param dataId dataId of the block
   * @param timestamp timestamp of the block
   */
  public async updateTimestampByLocation(dataId: string, timestamp: number): Promise<void> {
    await this.timestampByLocation.set(dataId, timestamp);

    const lastTransactionTimestamp = await this.getLastTransactionTimestamp();
    if (!lastTransactionTimestamp || timestamp > lastTransactionTimestamp) {
      await this.setLastTransactionTimestamp(timestamp);
    }
  }

  /**
   * Function to get timestamp from location
   *
   * @param dataId location to get the timestamp from
   * @returns timestamp of the location, null if not found
   */
  public async getTimestampFromLocation(dataId: string): Promise<number | null> {
    const timestamp = await this.timestampByLocation.get(dataId);
    return timestamp !== undefined ? timestamp : null;
  }

  /**
   * Function to get timestamp from location
   *
   * @param dataId location to get the timestamp from
   * @returns timestamp of the location, null if not found
   */
  public async isDataInBoundaries(
    dataId: string,
    boundaries?: DataAccessTypes.ITimestampBoundaries,
  ): Promise<boolean> {
    const timestamp = await this.timestampByLocation.get(dataId);
    if (!timestamp) {
      throw Error(`Unknown timestamp for the dataId ${dataId}`);
    }

    return (
      !boundaries ||
      ((boundaries.from === undefined || boundaries.from <= timestamp) &&
        (boundaries.to === undefined || boundaries.to >= timestamp))
    );
  }

  /**
   * the timestamp of the latest transaction
   */
  public async getLastTransactionTimestamp(): Promise<number | null> {
    return (await this.timestampByLocation.get('last_transaction_timestamp')) || null;
  }

  /**
   * the timestamp of the latest transaction
   */
  private async setLastTransactionTimestamp(value: number): Promise<void> {
    await this.timestampByLocation.set('last_transaction_timestamp', value);
  }
}
