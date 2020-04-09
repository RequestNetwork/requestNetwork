import * as Keyv from 'keyv';

/**
 * Interface for reason from location
 */
export interface IReasonByIgnoredLocation {
  [location: string]: string;
}
/**
 * Class used to store the block's reason indexed by location of blocks
 */
export default class ReasonsByIgnoredLocationIndex {
  /**
   * reason by location
   * maps dataId => reason
   */
  private reasonsByIgnoredLocation: Keyv<string>;

  private listIgnoredLocation: Keyv<string[]>;

  /**
   * reasonByLocationTransactionIndex constructor
   * @param store a Keyv store to persist the index to
   */
  public constructor(store?: Keyv.Store<any>) {
    this.reasonsByIgnoredLocation = new Keyv<string>({
      namespace: 'reasonsByIgnoredLocation',
      store,
    });

    this.listIgnoredLocation = new Keyv<string[]>({
      namespace: 'listIgnoredLocation',
      store,
    });
  }

  /**
   * Function to push reason indexed by location
   *
   * @param dataId dataId of the block
   * @param reason reason to be ignored
   */
  public async pushReasonByLocation(dataId: string, reason: string): Promise<void> {
    if (!(await this.reasonsByIgnoredLocation.get(dataId))) {
      await this.reasonsByIgnoredLocation.set(dataId, reason);
      await this.updateDataId(dataId);
    }
  }

  /**
   * Function to update reason indexed by location
   *
   * @param dataId dataId of the block
   * @param reason reason to be ignored
   */
  public async removeReasonByLocation(dataId: string): Promise<void> {
    await this.reasonsByIgnoredLocation.delete(dataId);
  }

  /**
   * Function to get reason from location
   *
   * @param dataId location to get the reason from
   * @returns reason of the location, null if not found
   */
  public async getReasonFromLocation(dataId: string): Promise<string | null> {
    const reason: string | undefined = await this.reasonsByIgnoredLocation.get(dataId);
    return reason ? reason : null;
  }

  /**
   * Get the list of data ids stored
   *
   * @returns the list of data ids stored
   */
  public async getIgnoredLocations(): Promise<IReasonByIgnoredLocation> {
    const listDataId: string[] | undefined = await this.listIgnoredLocation.get('list');

    if (!listDataId) {
      return {};
    }
    const result: any = {};
    for (const dataId of Array.from(listDataId)) {
      result[dataId] = await this.reasonsByIgnoredLocation.get(dataId);
    }

    return result;
  }

  /**
   * Update the list of data ids stored
   *
   * @param dataId data id to add to the list
   * @returns
   */
  private async updateDataId(dataId: string): Promise<void> {
    let listDataIds: string[] | undefined = await this.listIgnoredLocation.get('list');
    if (!listDataIds) {
      listDataIds = [];
    }
    listDataIds.push(dataId);
    await this.listIgnoredLocation.set('list', listDataIds);
  }
}
