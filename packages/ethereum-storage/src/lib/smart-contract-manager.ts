import { Storage as Types } from '@requestnetwork/types';
import * as artifactsUtils from './artifacts-utils';
import * as config from './config';
import EthereumBlocks from './ethereum-blocks';

const web3Eth = require('web3-eth');

const bigNumber: any = require('bn.js');

// Confirmation to wait in order to create metadata of the new added hash
// TODO(PROT-252): Find the optimal value or fix to use 1
const CONFIRMATION_TO_WAIT = 2;

/**
 * Manages the smart contract used by the storage layer
 * to store the hashes of the data on Ethereum
 */
export default class SmartContractManager {
  public eth: any;
  public requestHashStorage: any;
  /**
   * Handles the block numbers and blockTimestamp
   */
  public ethereumBlocks: EthereumBlocks;

  protected networkName: string = '';
  protected smartContractAddress: string;

  // Block where the contract has been created
  // This value is stored in config file for each network
  // This value is used to optimize past event retrieval
  private creationBlockNumber: number;

  // Timeout threshold when connecting to Web3 provider
  private timeout: number;

  /**
   * Constructor
   * @param web3Connection Object to connect to the Ethereum network
   * If values are missing, private network is used as http://localhost:8545
   */
  public constructor(web3Connection?: Types.IWeb3Connection) {
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

    this.ethereumBlocks = new EthereumBlocks(this.eth, this.creationBlockNumber);
  }

  /**
   * Get the account used for transaction (account[0] of the wallet)
   * @return Promise resolving the default account
   */
  public async getMainAccount(): Promise<string> {
    // Get the accounts on the provider
    // Throws an error if timeout is reached
    const accounts = await Promise.race([
      this.timeoutPromise(this.timeout, 'Web3 getAccounts connection timeout'),
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
   * @param gasPrice Replace the default gas price
   * @returns Promise resolved when transaction is confirmed on Ethereum
   */
  public async addHashAndSizeToEthereum(
    contentHash: string,
    contentSize: number,
    gasPrice?: number,
  ): Promise<Types.IEthereumMetadata> {
    // Get the account for the transaction
    const account = await this.getMainAccount();

    // Get the fee from the size of the content
    // Throws an error if timeout is reached
    const fee = await Promise.race([
      this.timeoutPromise(this.timeout, 'Web3 getFeesAmount connection timeout'),
      this.requestHashStorage.methods.getFeesAmount(contentSize).call(),
    ]);

    const gasPriceToUse = gasPrice || config.getDefaultEthereumGasPrice();

    // Send transaction to contract
    // TODO(PROT-181): Implement a log manager for the library
    // use it for the different events (error, transactionHash, receipt and confirmation)
    return new Promise(
      (resolve, reject): any => {
        this.requestHashStorage.methods
          .submitHash(contentHash, contentSize)
          .send({
            from: account,
            gas: '100000',
            gasPrice: gasPriceToUse,
            value: fee,
          })
          .on('error', (transactionError: string) => {
            reject(Error(`Ethereum transaction error:  ${transactionError}`));
          })
          .on('confirmation', (confirmationNumber: number, receiptAfterConfirmation: any) => {
            // TODO(PROT-252): search for the best number of confirmation to wait for
            if (confirmationNumber >= CONFIRMATION_TO_WAIT) {
              const gasFee = new bigNumber(receiptAfterConfirmation.gasUsed).mul(
                new bigNumber(gasPriceToUse),
              );
              const cost = gasFee.add(new bigNumber(fee));

              resolve(
                this.createEthereumMetaData(
                  receiptAfterConfirmation.blockNumber,
                  receiptAfterConfirmation.transactionHash,
                  cost.toString(),
                  fee,
                  gasFee.toString(),
                ),
              );
            }
          });
      },
    );
  }

  /**
   * Get Ethereum metadata from the content hash
   * @param contentHash Hash of the content to store, this hash should be used to retrieve the content
   * @returns Promise resolved when transaction is confirmed on Ethereum
   */
  public async getMetaFromEthereum(contentHash: string): Promise<Types.IEthereumMetadata> {
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
   * Get all hashes and sizes with metadata inside storage smart contract past events
   *
   * @param options timestamp boundaries for the hash retrieval
   * @return hashes and sizes with metadata
   */
  public async getHashesAndSizesFromEthereum(
    options?: Types.ITimestampBoundaries,
  ): Promise<Types.IGetAllHashesAndSizes[]> {
    let fromBlock = this.creationBlockNumber;
    let toBlock: number | undefined;

    // get fromBlock from the timestamp given in options
    if (options && options.from) {
      const optionFromBlockNumbers = await this.ethereumBlocks.getBlockNumbersFromTimestamp(
        options.from,
      );
      fromBlock = optionFromBlockNumbers.blockAfter;
    }

    // get toBlock from the timestamp given in options
    if (options && options.to) {
      const optionToBlockNumbers = await this.ethereumBlocks.getBlockNumbersFromTimestamp(
        options.to,
      );
      toBlock = optionToBlockNumbers.blockBefore;
    }

    return this.getHashesAndSizesFromEvents(fromBlock, toBlock);
  }

  /**
   * Get hashes and sizes with metadata inside storage smart contract past events
   *
   * @param fromBlock number of the block to start to get events
   * @param toBlock number of the block to stop to get events
   * @return Hashes and sizes with metadata
   */
  private async getHashesAndSizesFromEvents(
    fromBlock: number,
    toBlock?: number | string,
  ): Promise<Types.IGetAllHashesAndSizes[]> {
    fromBlock = fromBlock < this.creationBlockNumber ? this.creationBlockNumber : fromBlock;
    toBlock = toBlock || 'latest';

    // Reading all event logs
    let events = await Promise.race([
      this.timeoutPromise(this.timeout, 'Web3 getPastEvents connection timeout'),
      this.requestHashStorage.getPastEvents({
        event: 'NewHash',
        fromBlock,
        toBlock,
      }),
    ]);

    // TODO PROT-235: getPastEvents returns all events, not just NewHash
    events = events.filter((eventItem: any) => eventItem.event === 'NewHash');

    const eventsWithMetaData = events.map((eventItem: any) =>
      this.checkAndAddMetaDataToEvent(eventItem),
    );

    return eventsWithMetaData;
  }

  /**
   * Throws an error if the event is not correctly formatted (missing field)
   * Attaches to the event the corresponding metadata
   * @param event event of type NewHash
   * @returns processed event
   */
  private async checkAndAddMetaDataToEvent(event: any): Promise<any> {
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

    const meta = await this.createEthereumMetaData(event.blockNumber, event.transactionHash);

    return {
      hash: event.returnValues.hash,
      meta,
      size: +event.returnValues.size,
    };
  }

  /** Get the name of the Ethereum network from its id
   * @param networkId Id of the network
   * @return name of the network
   */
  private getNetworkNameFromId(networkId: Types.EthereumNetwork): string {
    return {
      [Types.EthereumNetwork.PRIVATE as Types.EthereumNetwork]: 'private',
      [Types.EthereumNetwork.MAINNET as Types.EthereumNetwork]: 'main',
      [Types.EthereumNetwork.KOVAN as Types.EthereumNetwork]: 'kovan',
      [Types.EthereumNetwork.RINKEBY as Types.EthereumNetwork]: 'rinkeby',
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
   * @return IEthereumMetadata the metadata formatted
   */
  private async createEthereumMetaData(
    blockNumber: number,
    transactionHash: string,
    cost?: string,
    fee?: string,
    gasFee?: string,
  ): Promise<Types.IEthereumMetadata> {
    // Get the number confirmations of the block hosting the transaction
    let blockConfirmation;
    try {
      blockConfirmation = await this.ethereumBlocks.getConfirmationNumber(blockNumber);
    } catch (error) {
      throw Error(`Error getting block confirmation number: ${error}`);
    }

    // Get timestamp of the block hosting the transaction
    let blockTimestamp;
    try {
      blockTimestamp = await this.ethereumBlocks.getBlockTimestamp(blockNumber);
    } catch (error) {

      throw Error(`Error getting block ${blockNumber} timestamp: ${error}`);
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
