import { Storage as StorageTypes } from '@requestnetwork/types';
import config from './config';

const web3Eth = require('web3-eth');

/**
 * Manages the smart contract used by the storage layer
 * to store the hashes of the data on Ethereum
 */
export default class SmartContractManager {
  public networkName: string = '';
  public eth: any;
  public requestHashStorage: any;

  // Block where the contract has been created
  // This value is stored in config file for each network
  // This value is used to optimize past event retrieval
  public blockCreationNumber: number;

  /**
   * Constructor
   * @param web3Connection Object to connect to the Ethereum network
   * If values are missing, private network is used as http://localhost:8545
   */
  public constructor(web3Connection?: StorageTypes.IWeb3Connection) {
    web3Connection = web3Connection || {};

    this.eth = new web3Eth(
      web3Connection.web3Provider ||
        new web3Eth.providers.HttpProvider(config.ethereum.nodeUrlDefault[config.ethereum.default]),
    );

    if (!this.eth) {
      throw Error('Cannot connect to ethereum network');
    }

    this.networkName = web3Connection.networkId
      ? this.getNetworkNameFromId(web3Connection.networkId)
      : config.ethereum.default;

    // Verify the contract exists for the specified network
    const hashStorageContract = config.ethereum.contracts.RequestHashStorage[this.networkName];
    if (!hashStorageContract) {
      throw Error(`Contract not found on network ${this.networkName}`);
    }

    // Initialize smart contract instance
    this.requestHashStorage = new this.eth.Contract(
      config.ethereum.contracts.RequestHashStorage.abi,
      hashStorageContract.address,
    );

    this.blockCreationNumber = hashStorageContract.blockCreationNumber || 0;
  }

  /**
   * Get the account used for transaction (account[0] of the wallet)
   * @return Promise resolving the default account
   */
  public async getMainAccount(): Promise<string> {
    const accounts = await this.eth.getAccounts();
    if (!accounts && !accounts[0]) {
      throw new Error('No accounts found');
    }
    return accounts[0];
  }

  /**
   * Adds hash to smart contract from content hash and content size
   * @param contentHash Hash of the content to store, this hash should be used to retrieve the content
   * @param contentSize Size of the content stored used to compute storage fee
   * @returns Promise resolved when transaction is confirmed on Ethereum
   */
  public async addHashAndSizeToEthereum(
    contentHash: string,
    contentSize: number,
    gasPrice?: number,
  ): Promise<any> {
    // Get the account for the transaction
    const account = await this.getMainAccount();

    const fee = await this.requestHashStorage.methods.getFeesAmount(contentSize).call();

    // Send transaction to contract
    await this.requestHashStorage.methods
      .submitHash(contentHash, contentSize)
      .send({
        from: account,
        gas: '100000',
        gasPrice: gasPrice || config.ethereum.gasPriceDefault,
        value: fee,
      })
      .on('error', (transactionError: string) => {
        throw Error(`Ethereum transaction error:  ${transactionError}`);
      })
      .on('transactionHash', (transactionHash: string) => {
        // TODO(PROT-181): Implement a log manager for the library
        /* tslint:disable:no-console */
        console.log(`transactionHash :  ${transactionHash}`);
      })
      .on('receipt', (receipt: string) => {
        // TODO(PROT-181): Implement a log manager for the library
        /* tslint:disable:no-console */
        console.log(`receipt :  ${receipt}`);
      })
      .on('confirmation', (confirmationNumber: number, receipt: any) => {
        // TODO(PROT-181): Implement a log manager for the library
        /* tslint:disable:no-console */
        console.log(`confirmation :  ${confirmationNumber}`);
        console.log(`receipt :  ${receipt}`);
      });
  }

  /**
   * Get all hashes inside storage smart contract by reading log events
   * @return Promise resolving hashes from past events
   */
  public async getAllHashesAndSizesFromEthereum(): Promise<any[]> {
    // Reading all event logs
    let events = await this.requestHashStorage.getPastEvents({
      event: 'NewHash',
      fromBlock: this.blockCreationNumber,
      toBlock: 'latest',
    });

    // TODO PROT-235: getPastEvents returns all events, not just NewHash
    events = events.filter((eventItem: any) => eventItem.event === 'NewHash');

    // For each hash read in log events, we verify corresponding size is actual size of data inside ipfs
    // If size is correct, we return hash
    const promises = events.map(
      async (event: any): Promise<any> => {
        // Verify event object is correct
        if (!event.returnValues.hash || !event.returnValues.size) {
          throw new Error(`event is incorrect: doesn't have a hash or size`);
        }

        return { hash: event.returnValues.hash, size: event.returnValues.size };
      },
    );

    return promises;
  }

  /** Get the name of the Ethereum network from its id
   * @param networkId Id of the network
   * @return name of the network
   */
  private getNetworkNameFromId(networkId: StorageTypes.EthereumNetwork): string {
    return {
      [StorageTypes.EthereumNetwork.PRIVATE as StorageTypes.EthereumNetwork]: 'private',
      [StorageTypes.EthereumNetwork.MAINNET as StorageTypes.EthereumNetwork]: 'main',
      [StorageTypes.EthereumNetwork.KOVAN as StorageTypes.EthereumNetwork]: 'kovan',
      [StorageTypes.EthereumNetwork.RINKEBY as StorageTypes.EthereumNetwork]: 'rinkeby',
    }[networkId];
  }
}
