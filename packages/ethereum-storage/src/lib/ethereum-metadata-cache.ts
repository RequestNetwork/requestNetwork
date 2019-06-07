import { StorageTypes } from '@requestnetwork/types';
import SmartContractManager from './smart-contract-manager';

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
  public metadataCache: { [dataId: string]: StorageTypes.IEthereumMetadata } = {};

  /**
   * Manager for the storage smart contract
   * This attribute  is used to get metadata in case they're not registered yet
   */
  private smartContractManager: SmartContractManager;

  /**
   * Constructor
   * @param smartContractManager Instance of SmartContractManager used to get metadata in case they're not registered yet
   */
  public constructor(smartContractManager: SmartContractManager) {
    this.smartContractManager = smartContractManager;
  }

  /**
   * Saves in the cache the Ethereum metadata related to a dataId
   * @param dataId dataId to index ethereum metadata
   * @param meta Ethereum metadata related to the dataId
   */
  public saveDataIdMeta(dataId: string, meta: StorageTypes.IEthereumMetadata): void {
    // We save the metadata only if it doesn't exist yet
    // A user can add the same dataId into the smart contract indefinitely
    // Therefore, only the first occurrence of the dataId has valid metadata
    // Finding several occurrences of the same dataId is not abnormal and we don't throw an error in this case
    // PROT-503: We should ensure the corresponding metadata is the metadata of the first occurrence of the dataId
    if (!this.metadataCache[dataId]) {
      this.metadataCache[dataId] = meta;
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
    if (!this.metadataCache[dataId]) {
      this.metadataCache[dataId] = await this.smartContractManager.getMetaFromEthereum(dataId);
    }

    return this.metadataCache[dataId];
  }
}
