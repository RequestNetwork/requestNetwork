import * as Keyv from 'keyv';

/**
 * Allows to save and retrieve ethereum metadata associated to a data id
 * Metadata represents general information about the Ethereum network used like network name and smart contract address
 * and specific information of the data id like number and timestamp of the block of the transaction of the data id
 * This module has been created to avoid multiple call of getPastEvents web3 function
 */
export default class DataIdsIgnored {
  /**
   * Store the reason we ignored data ids in a dictionary
   */
  public reasonsDataIdIgnored: Keyv<string>;

  public listDataIdsIgnored: Keyv<string[]>;

  /**
   * Constructor
   * @param store a Keyv store to persist the metadata
   */
  public constructor(store?: Keyv.Store<any>) {
    this.reasonsDataIdIgnored = new Keyv<string>({
      namespace: 'reasonsDataIdIgnored',
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
   */
  public async saveReason(dataId: string, reason: string): Promise<void> {
    await this.reasonsDataIdIgnored.set(dataId, reason);
    await this.updateListDataId(dataId);
  }

  /**
   * Retrieve Ethereum metadata from cache
   * If metadata of the specified dataId are not found in the cache
   * we get them and save them in the cache
   * @param dataId dataId to get Ethereum metadata from
   * @returns Ethereum metadata of the dataId
   */
  public async getReason(dataId: string): Promise<string | undefined> {
    return this.reasonsDataIdIgnored.get(dataId);
  }

  /**
   * Get the list of data ids stored
   *
   * @returns the list of data ids stored
   */
  public async getListDataId(): Promise<string[]> {
    const listDataId: string[] | undefined = await this.listDataIdsIgnored.get('list');
    return listDataId || [];
  }

  /**
   * Get the list of data ids stored
   *
   * @returns the list of data ids stored
   */
  public async getListDataIdWithReason(): Promise<any> {
    const listDataId: string[] | undefined = await this.listDataIdsIgnored.get('list');

    if (!listDataId) {
      return {};
    }
    const result: any = {};

    for (const dataId of Array.from(listDataId)) {
      result[dataId] = await this.reasonsDataIdIgnored.get(dataId);
    }

    return result;
  }

  /**
   * Update the list of data ids stored
   *
   * @param dataId data id to add to the list
   * @returns
   */
  private async updateListDataId(dataId: string): Promise<void> {
    let listDataIds: string[] | undefined = await this.listDataIdsIgnored.get('list');
    if (!listDataIds) {
      listDataIds = [];
    }
    listDataIds.push(dataId);
    await this.listDataIdsIgnored.set('list', listDataIds);
  }
}
