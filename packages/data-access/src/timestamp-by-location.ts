import { DataAccess as Types } from '@requestnetwork/types';

// Interface of the object to store the timestamp indexed by location
interface ITimestampByStorageId {
  [key: string]: number;
}

/**
 * Class used to store the block's timestamp indexed by location
 */
export default class LocationTimestamp {
  /**
   * timestamp by location
   * maps dataId => timestamp
   */
  private timestampLocations: ITimestampByStorageId = {};

  /**
   * the timestamp of the latest transaction
   */
  private lastTransactionTimestamp: number | null = null;

  /**
   * Function to push timestamp indexed by location
   *
   * @param dataId dataId of the block
   * @param timestamp timestamp of the block
   */
  public pushTimestampByLocation(dataId: string, timestamp: number): void {
    if (!this.timestampLocations[dataId]) {
      this.timestampLocations[dataId] = timestamp;
    }
    if (!this.lastTransactionTimestamp || timestamp > this.lastTransactionTimestamp) {
      this.lastTransactionTimestamp = timestamp;
    }
  }

  /**
   * Function to get timestamp from location
   *
   * @param dataId location to get the timestamp from
   *
   * @return timestamp of the location, null if not found
   */
  public getTimestampFromLocation(dataId: string): number | null {
    return this.timestampLocations[dataId] || null;
  }

  /**
   * Function to get timestamp from location
   *
   * @param dataId location to get the timestamp from
   *
   * @return timestamp of the location, null if not found
   */
  public isDataInBoundaries(dataId: string, boundaries?: Types.ITimestampBoundaries): boolean {
    const timestamp = this.timestampLocations[dataId];
    if (!timestamp) {
      throw Error(`Timestamp not know for the dataId ${dataId}`);
    }

    return (
      !boundaries ||
      ((boundaries.from === undefined || boundaries.from <= timestamp) &&
        (boundaries.to === undefined || boundaries.to >= timestamp))
    );
  }

  /**
   * Function to get the most recent transaction timestamp
   *
   * @return timestamp of the most recent transaction
   */
  public getLastTransactionTimestamp(): number | null {
    return this.lastTransactionTimestamp;
  }
}
