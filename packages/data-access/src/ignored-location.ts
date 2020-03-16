import * as Keyv from 'keyv';

/**
 * Class used to store the block's timestamp indexed by location
 */
export default class TimestampByIgnoredLocationIndex {
  /**
   * timestamp by location
   * maps dataId => timestamp
   */
  private timestampByIgnoredLocation: Keyv<number>;

  /**
   * TimestampByLocationTransactionIndex constructor
   * @param store a Keyv store to persist the index to
   */
  public constructor(store?: Keyv.Store<any>) {
    this.timestampByIgnoredLocation = new Keyv<number>({
      namespace: 'timestampByIgnoredLocation',
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
    if (!(await this.timestampByIgnoredLocation.get(dataId))) {
      await this.timestampByIgnoredLocation.set(dataId, timestamp);
    }
  }

  /**
   * Function to update timestamp indexed by location
   *
   * @param dataId dataId of the block
   * @param timestamp timestamp of the block
   */
  public async removeTimestampByLocation(dataId: string): Promise<void> {
    await this.timestampByIgnoredLocation.delete(dataId);
  }

  /**
   * Function to get timestamp from location
   *
   * @param dataId location to get the timestamp from
   * @returns timestamp of the location, null if not found
   */
  public async getTimestampFromLocation(dataId: string): Promise<number | null> {
    const timestamp = await this.timestampByIgnoredLocation.get(dataId);
    return timestamp ? timestamp : null;
  }
}
