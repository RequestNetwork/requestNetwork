import { Storage as StorageTypes } from '@requestnetwork/types';
import * as artifactsUtils from './artifacts-utils';
import * as config from './config';

const web3Eth = require('web3-eth');

const bigNumber: any = require('bn.js');

// Interface for the cache of block timestamp (see below)
interface IBlockTimestampDictionary {
  [key: number]: number;
}

/**
 * Manages the smart contract used by the storage layer
 * to store the hashes of the data on Ethereum
 */
export default class SmartContractManager {
  public eth: any;
  public requestHashStorage: any;

  /**
   * cache of the blocks timestamp
   * to ask only once the timestamp of a block
   * Dictionary of timestamp index by blockNumber
   */
  protected blockTimestamp: IBlockTimestampDictionary = {};
  protected networkName: string = '';
  protected smartContractAddress: string;

  // Block where the contract has been created
  // This value is stored in config file for each network
  // This value is used to optimize past event retrieval
  private creationBlockNumber: number;
  private timeout: number;

  /**
   * Constructor
   * @param web3Connection Object to connect to the Ethereum network
   * If values are missing, private network is used as http://localhost:8545
   */
  public constructor(web3Connection?: StorageTypes.IWeb3Connection) {
    web3Connection = web3Connection || {};

    try {
      this.eth = new web3Eth(
        web3Connection.web3Provider ||
          new web3Eth.providers.HttpProvider(config.getDefaultEthereumProvider()),
      );
    } catch (error) {
      throw Error(`Can't initialize web3-eth ${error}`);
    }

    // Checks if networkId is defined
    // If not defined we use default value from config
    this.networkName =
      typeof web3Connection.networkId === 'undefined'
        ? config.getDefaultEthereumNetwork()
        : this.getNetworkNameFromId(web3Connection.networkId);

    // If networkName is undefined, it means the network doesn't exist
    if (typeof this.networkName === 'undefined') {
      throw Error(`The network id ${web3Connection.networkId} doesn't exist`);
    }

    this.smartContractAddress = artifactsUtils.getAddress(this.networkName);

    // Initialize smart contract instance
    this.requestHashStorage = new this.eth.Contract(
      artifactsUtils.getContractAbi(),
      this.smartContractAddress,
    );

    this.timeout = web3Connection.timeout || config.getDefaultEthereumProviderTimeout();

    this.creationBlockNumber = artifactsUtils.getCreationBlockNumber(this.networkName) || 0;
  }

  /**
   * Get the account used for transaction (account[0] of the wallet)
   * @return Promise resolving the default account
   */
  public async getMainAccount(): Promise<string> {
    // Get the accounts on the provider
    // Throws an error if timeout is reached
    const accounts = await Promise.race([
      this.timeoutPromise(this.timeout, 'Web3 provider connection timeout'),
      this.eth.getAccounts(),
    ]);

    if (!accounts || !accounts[0]) {
      throw Error('No account found');
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
  ): Promise<StorageTypes.IRequestStorageEthereumMetadata> {
    // Get the account for the transaction
    const account = await this.getMainAccount();

    // Get the fee from the size of the content
    // Throws an error if timeout is reached
    const fee = await Promise.race([
      this.timeoutPromise(this.timeout, 'Web3 provider connection timeout'),
      this.requestHashStorage.methods.getFeesAmount(contentSize).call(),
    ]);

    const gasPriceToUse = gasPrice || config.getDefaultEthereumGasPrice();

    // Send transaction to contract
    // Throws an error if timeout is reached
    const receipt = await Promise.race([
      this.timeoutPromise(this.timeout, 'Web3 provider connection timeout'),
      this.requestHashStorage.methods
        .submitHash(contentHash, contentSize)
        .send({
          from: account,
          gas: '100000',
          gasPrice: gasPriceToUse,
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
        .on('receipt', (receiptInCallback: string) => {
          // TODO(PROT-181): Implement a log manager for the library
          /* tslint:disable:no-console */
          console.log(`receipt :  ${receiptInCallback}`);
        })
        .on('confirmation', (confirmationNumber: number, receiptAfterConfirmation: any) => {
          // TODO(PROT-181): Implement a log manager for the library
          // TODO(PROT-252): return after X confirmation instead of 0
          /* tslint:disable:no-console */
          console.log(`confirmation :  ${confirmationNumber}`);
          console.log(`receipt :  ${receiptAfterConfirmation}`);
        }),
    ]);

    const gasFee = new bigNumber(receipt.gasUsed).mul(new bigNumber(gasPriceToUse));
    const cost = gasFee.add(new bigNumber(fee));

    return this.createEthereumMetaData(
      receipt.blockNumber,
      receipt.transactionHash,
      cost.toString(),
      fee,
      gasFee.toString(),
    );
  }

  /**
   * Get Ethereum metadata from the content hash
   * @param contentHash Hash of the content to store, this hash should be used to retrieve the content
   * @returns Promise resolved when transaction is confirmed on Ethereum
   */
  public async getMetaFromEthereum(
    contentHash: string,
  ): Promise<StorageTypes.IRequestStorageEthereumMetadata> {
    // Reading all event logs
    const events = await this.requestHashStorage.getPastEvents({
      event: 'NewHash',
      fromBlock: this.creationBlockNumber,
      toBlock: 'latest',
    });

    const event = events.find((element: any) => element.returnValues.hash === contentHash);
    if (!event) {
      throw Error(`contentHash not indexed on ethereum`);
    }

    return this.createEthereumMetaData(event.blockNumber, event.transactionHash);
  }

  /**
   * Get all hashes inside storage smart contract by reading log events
   * @return Promise resolving hashes from past events
   */
  public async getAllHashesAndSizesFromEthereum(): Promise<
    StorageTypes.IRequestStorageGetAllHashesAndSizes[]
  > {
    // Reading all event logs
    let events = await Promise.race([
      this.timeoutPromise(this.timeout, 'Web3 provider connection timeout'),
      this.requestHashStorage.getPastEvents({
        event: 'NewHash',
        fromBlock: this.creationBlockNumber,
        toBlock: 'latest',
      }),
    ]);

    // TODO PROT-235: getPastEvents returns all events, not just NewHash
    events = events.filter((eventItem: any) => eventItem.event === 'NewHash');

    // For each hash read in log events, we verify corresponding size is actual size of data inside ipfs
    // If size is correct, we return hash
    const promises = events.map(
      async (event: any): Promise<any> => {
        // Check if the event object is correct
        // We check "typeof field === 'undefined'"" instead of "!field"
        // because you can add empty string as hash or 0 as size in the storage smart contract
        if (
          typeof event.returnValues === 'undefined' ||
          typeof event.returnValues.hash === 'undefined' ||
          typeof event.returnValues.size === 'undefined'
        ) {
          throw Error(`event is incorrect: doesn't have a hash or size`);
        }

        const meta = this.createEthereumMetaData(event.blockNumber, event.transactionHash);

        return {
          hash: event.returnValues.hash,
          meta,
          size: event.returnValues.size,
        };
      },
    );

    return promises;
  }

  /**
   * get timestamp of a block
   * @param    blockNumber    number of the block
   * @return   timestamp of a blocks
   */
  private async getBlockTimestamp(blockNumber: number): Promise<any> {
    if (!this.blockTimestamp[blockNumber]) {
      // if we don't know the information, let's get it
      const block = await this.eth.getBlock(blockNumber);
      if (!block) {
        throw Error(`block ${blockNumber} not found`);
      }
      this.blockTimestamp[blockNumber] = block.timestamp;
    }
    return this.blockTimestamp[blockNumber];
  }

  /**
   * get last block number
   * @return   blockNumber of the last block
   */
  private async getConfirmationNumber(blockNumber: number): Promise<number> {
    try {
      return (await this.getLastBlockNumber()) - blockNumber;
    } catch (e) {
      throw Error('Error getting the confirmation number: $(e)');
    }
  }

  /**
   * get last block number
   * @return   blockNumber of the last block
   */
  private getLastBlockNumber(): Promise<number> {
    return this.eth.getBlockNumber();
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

  /**
   * Promise that rejects when the specified timeout is reached
   * This promise is used concurrently with Web3 functions to throw
   * when the Web3 provider is not responding
   * @param timeout Timeout threshold to throw the error
   * @param message Timeout error message
   */
  private async timeoutPromise(timeout: number, message: string): Promise<any> {
    return new Promise(
      (_resolve, reject): any => {
        const timeoutId = setTimeout(() => {
          clearTimeout(timeoutId);
          reject(new Error(message));
        }, timeout);
      },
    );
  }

  /** Create the ethereum metadata
   * @param blockNumber block number of the ethereum transaction
   * @param transactionHash transactionHash of the ethereum transaction
   * @param cost total cost of the transaction (gas fee + request network fee)
   * @param fee Request network fee
   * @param gasFee gas fee of the ethereum transaction
   * @return IRequestStorageEthereumMetadata the metadata formatted
   */
  private async createEthereumMetaData(
    blockNumber: number,
    transactionHash: string,
    cost?: string,
    fee?: string,
    gasFee?: string,
  ): Promise<StorageTypes.IRequestStorageEthereumMetadata> {
    // Get the number confirmations of the block hosting the transaction
    let blockConfirmation;
    try {
      blockConfirmation = await this.getConfirmationNumber(blockNumber);
    } catch (error) {
      throw Error(`Error getting block timestamp: ${error}`);
    }

    // Get timestamp of the block hosting the transaction
    let blockTimestamp;
    try {
      blockTimestamp = await this.getBlockTimestamp(blockNumber);
    } catch (error) {
      throw Error(`Error getting block timestamp: ${error}`);
    }

    return {
      blockConfirmation,
      blockNumber,
      blockTimestamp,
      cost,
      fee,
      gasFee,
      networkName: this.networkName,
      smartContractAddress: this.smartContractAddress,
      transactionHash,
    };
  }
}
