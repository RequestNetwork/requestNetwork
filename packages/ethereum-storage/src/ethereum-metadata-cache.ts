import { StorageTypes } from '@requestnetwork/types';
import SmartContractManager from './smart-contract-manager';

import * as Keyv from 'keyv';

/**
 * Allows to save and retrieve ethereum metadata associated to a data id
 * Metadata represents general information about the Ethereum network used like network name and smart contract address
 * and specific information of the data id like number and timestamp of the block of the transaction of the data id
 * This module has been created to avoid multiple call of getPastEvents web3 function
 */
export default class EthereumMetadataCache {
  /**
   * Store the ethereum metadata for a data id in a dictionary
   * This attribute is left public for mocking purpose to facilitate tests on the module
   */
  public metadataCache: Keyv<StorageTypes.IEthereumMetadata>;

  public listDataIds: Keyv<string[]>;

  /**
   * Manager for the storage smart contract
   * This attribute  is used to get metadata in case they're not registered yet
   */
  private smartContractManager: SmartContractManager;

  /**
   * Constructor
   * @param smartContractManager Instance of SmartContractManager used to get metadata in case they're not registered yet
   * @param store a Keyv store to persist the metadata
   */
  public constructor(smartContractManager: SmartContractManager, store?: Keyv.Store<any>) {
    this.smartContractManager = smartContractManager;

    this.metadataCache = new Keyv<StorageTypes.IEthereumMetadata>({
      namespace: 'ethereumMetadata',
      store,
    });

    this.listDataIds = new Keyv<string[]>({
      namespace: 'listDataIds',
      store,
    });
  }

  /**
   * Saves in the cache the Ethereum metadata related to a dataId
   * @param dataId dataId to index ethereum metadata
   * @param meta Ethereum metadata related to the dataId
   */
  public async saveDataIdMeta(dataId: string, meta: StorageTypes.IEthereumMetadata): Promise<void> {
    // We save the metadata only if it doesn't exist yet
    // A user can add the same dataId into the smart contract indefinitely
    // Therefore, only the first occurrence of the dataId has valid metadata
    // Finding several occurrences of the same dataId is not abnormal and we don't throw an error in this case
    // PROT-503: We should ensure the corresponding metadata is the metadata of the first occurrence of the dataId
    if (!(await this.metadataCache.get(dataId))) {
      await this.metadataCache.set(dataId, meta);
      await this.updateDataId(dataId);
    }
  }

  /**
   * Retrieve Ethereum metadata from cache
   * If metadata of the specified dataId are not found in the cache
   * we get them and save them in the cache
   * @param dataId dataId to get Ethereum metadata from
   * @returns Ethereum metadata of the dataId
   */
  public async getDataIdMeta(dataId: string): Promise<StorageTypes.IEthereumMetadata> {
    // If the metadata has not been saved in the cache yet
    // we get them with smartContractManager and save them
    let metadata: StorageTypes.IEthereumMetadata | undefined = await this.metadataCache.get(dataId);

    if (!metadata) {
      metadata = await this.smartContractManager.getMetaFromEthereum(dataId);
      await this.metadataCache.set(dataId, metadata);
      await this.updateDataId(dataId);
    }

    return metadata;
  }

  /**
   * Get the list of data ids stored
   *
   * @returns the list of data ids stored
   */
  public async getDataIds(): Promise<string[]> {
    const listDataIds: string[] | undefined = await this.listDataIds.get('list');
    if (!listDataIds) {
      return [];
    }
    return listDataIds;
  }

  /**
   * Update the list of data ids stored
   *
   * @param dataId data id to add to the list
   * @returns
   */
  private async updateDataId(dataId: string): Promise<void> {
    let listDataIds: string[] | undefined = await this.listDataIds.get('list');
    if (!listDataIds) {
      listDataIds = [];
    }
    if (!listDataIds.includes(dataId)) {
      listDataIds.push(dataId);
      await this.listDataIds.set('list', listDataIds);
    }
  }
}
