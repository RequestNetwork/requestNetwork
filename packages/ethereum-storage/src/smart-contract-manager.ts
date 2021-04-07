import * as SmartContracts from '@requestnetwork/smart-contracts';
import { LogTypes, StorageTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import * as Bluebird from 'bluebird';
import * as config from './config';
import EthereumBlocks from './ethereum-blocks';
import EthereumUtils from './ethereum-utils';
import GasPriceDefiner from './gas-price-definer';

import { providers, Signer, BigNumber, CallOverrides } from 'ethers';
import {
  RequestHashStorage,
  RequestHashStorage__factory,
  RequestOpenHashSubmitter,
  RequestOpenHashSubmitter__factory,
} from '@requestnetwork/smart-contracts/types';
import { TypedEvent } from '@requestnetwork/smart-contracts/types/commons';

// eslint-disable-next-line @typescript-eslint/no-var-requires
import * as web3Utils from 'web3-utils';

// Maximum number of attempt to create ethereum metadata when transaction to add hash and size to Ethereum is confirmed
// 23 is the number of call of the transaction's confirmation event function
// if higher the promise may block since the confirmation event function will not be called anymore
// const CREATING_ETHEREUM_METADATA_MAX_ATTEMPTS = 23;

// Regular expression to detect if the Web3 API returns "query returned more than XXX results" error
const MORE_THAN_XXX_RESULTS_REGEX = new RegExp('query returned more than [1-9][0-9]* results');

// String to match if the Web3 API throws "Transaction was not mined within XXX seconds" error
const TRANSACTION_POLLING_TIMEOUT = 'Transaction was not mined within';

const LENGTH_BYTES32_STRING = 64;

export type NewHashEvent = TypedEvent<
  [string, string, string] & {
    hash: string;
    hashSubmitter: string;
    feesParameters: string;
  }
>;

type SmartContractManagerOptions = {
  /**
   * Maximum number of concurrent calls
   */
  maxConcurrency: number;
  /**
   * Maximum number of retries to attempt for web3 API calls
   */
  maxRetries: number;
  /**
   * Delay between retries for web3 API calls
   */
  retryDelay: number;
};

type SmartContractManagerConfig = SmartContractManagerOptions & {
  creationBlockNumberHashStorage: number;
  currentProvider: string;
  hashStorageAddress: string;
  hashSubmitterAddress: string;
  networkName: string;
};

/**
 * Manages the smart contract used by the storage layer
 * to store the hashes of the data on Ethereum
 */
export default class SmartContractManager {
  public provider: providers.Provider;
  public signer: Signer;
  public requestHashStorage: RequestHashStorage;
  public requestHashSubmitter: RequestOpenHashSubmitter;

  /**
   * Handles the block numbers and blockTimestamp
   */
  public ethereumBlocks: EthereumBlocks;

  protected networkName = '';
  protected hashStorageAddress: string;
  protected hashSubmitterAddress: string;

  // Block where the contract has been created
  // This value is stored in config file for each network
  // This value is used to optimize past event retrieval
  private creationBlockNumberHashStorage: number;

  // Timeout threshold when connecting to Web3 provider
  private timeout: number;

  /**
   * Logger instance
   */
  private logger: LogTypes.ILogger;

  private options: SmartContractManagerOptions;

  /**
   * Constructor
   * @param web3Connection Object to connect to the Ethereum network
   * @param [options.getLastBlockNumberDelay] the minimum delay to wait between fetches of lastBlockNumber
   * If values are missing, private network is used as http://localhost:8545
   */
  public constructor(
    { networkId, signer, timeout }: StorageTypes.IWeb3Connection,
    {
      logger,
      getLastBlockNumberDelay,
      ...options
    }: Partial<SmartContractManagerOptions> & {
      logger?: LogTypes.ILogger;
      getLastBlockNumberDelay?: number;
    } = {},
  ) {
    this.logger = logger || new Utils.SimpleLogger();
    this.options = {
      ...{
        maxConcurrency: Number.MAX_SAFE_INTEGER,
        retryDelay: config.getEthereumRetryDelay(),
        maxRetries: config.getEthereumMaxRetries(),
      },
      ...options,
    };

    this.signer = signer;
    if (!signer.provider) {
      throw new Error('no provider');
    }
    this.provider = signer.provider;

    // Set the default transaction polling timeout to the value in our config
    // TODO
    // this.eth.transactionPollingTimeout = config.getTransactionPollingTimeout();

    // Checks if networkId is defined
    // If not defined we use default value from config
    this.networkName =
      typeof networkId === 'undefined'
        ? config.getDefaultEthereumNetwork()
        : EthereumUtils.getEthereumNetworkNameFromId(networkId);

    // If networkName is undefined, it means the network doesn't exist
    if (typeof this.networkName === 'undefined') {
      throw Error(`The network id ${networkId} doesn't exist`);
    }

    this.hashStorageAddress = SmartContracts.requestHashStorageArtifact.getAddress(
      this.networkName,
    );

    this.hashSubmitterAddress = SmartContracts.requestHashSubmitterArtifact.getAddress(
      this.networkName,
    );

    // Initialize smart contract instance
    this.requestHashStorage = RequestHashStorage__factory.connect(
      this.hashStorageAddress,
      this.signer,
    );
    this.requestHashSubmitter = RequestOpenHashSubmitter__factory.connect(
      this.hashSubmitterAddress,
      this.signer,
    );

    this.timeout = timeout || config.getDefaultEthereumProviderTimeout();

    this.creationBlockNumberHashStorage =
      SmartContracts.requestHashStorageArtifact.getCreationBlockNumber(this.networkName) || 0;

    this.ethereumBlocks = new EthereumBlocks(
      this.provider,
      this.creationBlockNumberHashStorage,
      this.options.retryDelay,
      this.options.maxRetries,
      getLastBlockNumberDelay,
      this.logger,
    );
  }

  /**
   * Check if the web3 provider is accessible
   * @param timeout Time to wait before considering the provider is not reachable
   * @return Promise resolving if the web3 provider is accessible, throw otherwise
   */
  public async checkWeb3ProviderConnection(timeout: number): Promise<void> {
    const check = async () => {
      let listening;
      try {
        listening = await (this.provider as providers.JsonRpcProvider).send('net_listening', []);
      } catch (e) {
        throw new Error('Error when trying to reach Web3 provider');
      }
      if (!listening) {
        throw new Error('The Web3 provider is not listening');
      }
    };
    await Utils.timeoutPromise(
      check(),
      timeout,
      'The Web3 provider is not reachable, did you use the correct protocol (http/https)?',
    );
  }

  /**
   * Check if the contracts are deployed and configured on ethereum
   * @return Promise resolving if the contracts are deployed and configured, throws otherwise
   */
  public async checkContracts(): Promise<void> {
    try {
      const isSubmitterWhitelisted = await this.requestHashStorage.isWhitelisted(
        this.hashSubmitterAddress,
      );
      if (!isSubmitterWhitelisted) {
        throw Error('The hash submitter not whitelisted in request Hash Storage contract');
      }

      // throw if requestHashSubmitter is not deployed
      await this.requestHashSubmitter.getFeesAmount(0);
    } catch (error) {
      throw Error(`Contracts are not deployed or not well configured: ${error}`);
    }
  }

  /**
   * Get the account used for transaction (account[0] of the wallet)
   * @return Promise resolving the default account
   */
  public async getMainAccount(): Promise<string> {
    const signer = this.signer;
    // Get the accounts on the provider
    // Throws an error if timeout is reached
    return Utils.timeoutPromise(
      signer.getAddress(),
      this.timeout,
      'Web3 getAccounts connection timeout',
    );
  }

  /**
   * Adds hash to smart contract from content hash and content feesParameters
   * @param contentHash Hash of the content to store, this hash should be used to retrieve the content
   * @param feesParameters parameters used to compute storage fee
   * @param gasPrice Replace the default gas price
   * @returns Promise resolved when transaction is confirmed on Ethereum
   */
  public async addHashAndSizeToEthereum(
    contentHash: string,
    feesParameters: StorageTypes.IFeesParameters,
    gasPrice?: BigNumber,
    nonce?: number,
  ): Promise<StorageTypes.IEthereumMetadata> {
    // Get the account for the transaction
    const account = await this.getMainAccount();

    // Handler to get gas price
    const gasPriceDefiner = new GasPriceDefiner();

    // Get the fee from the size of the content
    // Throws an error if timeout is reached
    const fee = await Utils.timeoutPromise(
      this.requestHashSubmitter.getFeesAmount(feesParameters.contentSize),
      this.timeout,
      'Web3 getFeesAmount connection timeout',
    );

    // Determines the gas price to use
    // If the gas price is provided as a parameter, we use this value
    // If the gas price is not provided and we use mainnet, we determine it from gas price api providers
    // We use the fast value provided by the api providers
    // Otherwise, we use default value from config
    const gasPriceToUse =
      gasPrice ||
      (await gasPriceDefiner.getGasPrice(StorageTypes.GasPriceType.STANDARD, this.networkName));

    // parse the fees parameters to hex bytes
    const feesParametersAsBytes = web3Utils.padLeft(
      web3Utils.toHex(feesParameters.contentSize),
      LENGTH_BYTES32_STRING,
    );

    // Send transaction to contract
    // TODO(PROT-181): Implement a log manager for the library
    // use it for the different events (error, transactionHash, receipt and confirmation)
    // This boolean is set to true once the ethereum metadata has been created and the promise has been resolved
    // When set to true, we use it to ignore next confirmation event function call

    // Keep the transaction hash for future needs
    const transactionParameters: CallOverrides = {
      from: account,
      gasLimit: '100000',
      gasPrice: gasPriceToUse,
      nonce,
      value: fee,
    };
    let txHash: string | undefined = undefined;
    try {
      const tx = await this.requestHashSubmitter.submitHash(
        contentHash,
        feesParametersAsBytes,
        transactionParameters,
      );
      txHash = tx.hash;
      const receiptAfterConfirmation = await tx.wait(1);

      const gasFee = BigNumber.from(receiptAfterConfirmation.gasUsed).mul(gasPriceToUse);
      const cost = gasFee.add(BigNumber.from(fee));

      return this.createEthereumMetaData(
        receiptAfterConfirmation.blockNumber,
        receiptAfterConfirmation.transactionHash,
        cost.toString(),
        fee.toString(),
        gasFee.toString(),
      );
    } catch (e) {
      const transactionError: string = e.message || e.toString();
      if (transactionError.includes(TRANSACTION_POLLING_TIMEOUT) && txHash) {
        if (!nonce) {
          const tx = await this.provider.getTransaction(txHash);
          nonce = tx.nonce;
        }
        // Get the new gas price for the transaction
        const newGasPrice = await gasPriceDefiner.getGasPrice(
          StorageTypes.GasPriceType.FAST,
          this.networkName,
        );
        if (newGasPrice.gt(gasPriceToUse)) {
          this.logger.info(
            `New attempt to store ${contentHash} with gas ${gasPriceToUse.toString()}`,
          );
          return this.addHashAndSizeToEthereum(contentHash, feesParameters, newGasPrice, nonce);
        } else {
          this.logger.info(
            `New attempt to store ${contentHash} with gas ${gasPriceToUse.toString()}`,
          );
        }
      }
      const logObject = JSON.stringify({
        contentHash,
        fee,
        feesParametersAsBytes,
        from: account,
        gasPrice: gasPriceToUse,
        nonce,
      });
      this.logger.error(`Failed transaction: ${logObject}`);
      throw e;
    }
  }
  /**
   * Get Ethereum metadata from the content hash
   * @param contentHash Hash of the content to store, this hash should be used to retrieve the content
   * @returns Promise resolved when transaction is confirmed on Ethereum
   */
  public async getMetaFromEthereum(contentHash: string): Promise<StorageTypes.IEthereumMetadata> {
    // Read all event logs
    const events = await this.recursiveGetPastEvents(this.creationBlockNumberHashStorage, 'latest');

    this.logger.debug(`${events.length} events fetched in getMetaFromEthereum`, ['ethereum']);

    const event = events.find((element) => element.args.hash === contentHash);
    if (!event) {
      throw Error(`contentHash not indexed on ethereum`);
    }

    return this.createEthereumMetaData(event.blockNumber, event.transactionHash);
  }

  /**
   * Get all entries from storage smart contract past events
   *
   * @param options timestamp boundaries for the hash retrieval
   * @return hashes with with metadata
   */
  public async getEntriesFromEthereum(
    options?: StorageTypes.ITimestampBoundaries,
  ): Promise<StorageTypes.IEthereumEntriesWithLastTimestamp> {
    let fromBlock = this.creationBlockNumberHashStorage;
    let toBlock: number | undefined;

    // get fromBlock from the timestamp given in options
    if (options && options.from) {
      const optionFromBlockNumbers = await this.ethereumBlocks.getBlockNumbersFromTimestamp(
        options.from,
      );
      fromBlock = optionFromBlockNumbers.blockAfter;
    }

    // get toBlock from the timestamp given in options or use the latest block
    if (options && options.to) {
      const optionToBlockNumbers = await this.ethereumBlocks.getBlockNumbersFromTimestamp(
        options.to,
      );
      toBlock = optionToBlockNumbers.blockBefore;
    } else {
      toBlock = await this.ethereumBlocks.getLastBlockNumber();
    }

    if (toBlock < fromBlock) {
      throw Error(
        `toBlock must be larger than fromBlock: fromBlock:${fromBlock} toBlock:${toBlock}`,
      );
    }

    // Get the toBlock timestamp and returns it with the data
    // This is important because the upper layers using this function shouldn't
    // know what a block is and they (probably) will use timestamps as abstractions.
    // We need to return this value, so the upper layers can use as "last sync time".
    // Using now as "last sync time" will lead to issues, because new blocks can be
    // added between the last block created and now.
    const lastTimestamp = await this.ethereumBlocks.getBlockTimestamp(toBlock);

    return {
      ethereumEntries: await this.getEthereumEntriesFromEvents(fromBlock, toBlock),
      lastTimestamp,
    };
  }

  /**
   * Get hashes and sizes with metadata inside storage smart contract past events
   *
   * @param fromBlock number of the block to start to get events
   * @param toBlock number of the block to stop to get events
   * @return Hashes and sizes with metadata
   */
  public async getEthereumEntriesFromEvents(
    fromBlock: number,
    toBlock?: number | string,
  ): Promise<StorageTypes.IEthereumEntry[]> {
    fromBlock =
      fromBlock < this.creationBlockNumberHashStorage
        ? this.creationBlockNumberHashStorage
        : fromBlock;
    toBlock = toBlock || 'latest';

    // Read all event logs
    let events = await this.recursiveGetPastEvents(fromBlock, toBlock);

    this.logger.debug(`${events.length} events fetched in getEthereumEntriesFromEvents`, [
      'ethereum',
    ]);

    // TODO PROT-235: getPastEvents returns all events, not just NewHash
    events = events.filter((eventItem) => eventItem.event === 'NewHash');

    const eventsWithMetaData = await Bluebird.map(
      events,
      (eventItem) => this.checkAndAddMetaDataToEvent(eventItem),
      {
        concurrency: this.options.maxConcurrency,
      },
    );

    return eventsWithMetaData;
  }

  /**
   * Gets current configuration
   *
   * @return the current configuration attributes
   */
  public getConfig(): SmartContractManagerConfig {
    return {
      creationBlockNumberHashStorage: this.creationBlockNumberHashStorage,
      currentProvider: (this.provider as providers.JsonRpcProvider).connection?.url,
      hashStorageAddress: this.hashStorageAddress,
      hashSubmitterAddress: this.hashSubmitterAddress,
      networkName: this.networkName,
      ...this.options,
    };
  }

  /**
   * Get events inside storage smart contract for a specified block range
   * Some web3 providers, including Infura, send error if the past event number for a specific range is over 1000
   * In this case we divide the range and call the function recursively
   *
   * @param fromBlock number of the block to start to get events
   * @param toBlock number of the block to stop to get events
   * @return Past events of requestHashStorage of the specified range
   */
  private async recursiveGetPastEvents(
    fromBlock: number,
    toBlock: number | string,
  ): Promise<NewHashEvent[]> {
    const toBlockNumber: number = await this.getBlockNumberFromNumberOrString(toBlock);

    try {
      const filter = this.requestHashStorage.filters.NewHash(null, null, null);

      const events = await Utils.retry(
        () =>
          Utils.timeoutPromise(
            this.requestHashStorage.queryFilter(filter, fromBlock, toBlockNumber),
            this.timeout,
            'Web3 getPastEvents connection timeout',
          ),
        this.options,
      )();

      this.logger.debug(`Events from ${fromBlock} to ${toBlock} fetched`, ['ethereum']);

      return events;
    } catch (e) {
      // Checks if the API returns "query returned more than XXX results" error
      // In this case we perform a dichotomy in order to fetch past events with a smaller range
      if (e.toString().match(MORE_THAN_XXX_RESULTS_REGEX)) {
        const intervalHalf = Math.floor((fromBlock + toBlockNumber) / 2);
        const eventsFirstHalfPromise = this.recursiveGetPastEvents(fromBlock, intervalHalf);
        const eventsSecondHalfPromise = this.recursiveGetPastEvents(
          intervalHalf + 1,
          toBlockNumber,
        );

        const halves = await Promise.all([eventsFirstHalfPromise, eventsSecondHalfPromise]);
        return Utils.flatten2DimensionsArray(halves);
      } else {
        throw e;
      }
    }
  }

  /**
   * Throws an error if the event is not correctly formatted (missing field)
   * Attaches to the event the corresponding metadata
   * @param event event of type NewHash
   * @returns processed event
   */
  private async checkAndAddMetaDataToEvent(
    event: NewHashEvent,
  ): Promise<StorageTypes.IEthereumEntry> {
    // Check if the event object is correct
    // We check "typeof field === 'undefined'"" instead of "!field"
    // because you can add empty string as hash or 0 as size in the storage smart contract
    if (
      typeof event.args === 'undefined' ||
      typeof event.args.hash === 'undefined' ||
      typeof event.args.feesParameters === 'undefined'
    ) {
      throw Error(`event is incorrect: doesn't have a hash or feesParameters`);
    }

    const contentSize = web3Utils.hexToNumber(event.args.feesParameters);
    const meta = await this.createEthereumMetaData(event.blockNumber, event.transactionHash);

    return {
      feesParameters: { contentSize },
      hash: event.args.hash,
      meta,
    };
  }

  /**
   * Create the ethereum metadata
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
  ): Promise<StorageTypes.IEthereumMetadata> {
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
      smartContractAddress: this.hashStorageAddress,
      transactionHash,
    };
  }

  /**
   * Get the number of a block given its number or string describing it
   * We need this function because recursive calls of getPastEvents need to use variable of type number
   *
   * @param block block number or string describing the block (latest, genesis, pending)
   * @return number of the block
   */
  private async getBlockNumberFromNumberOrString(block: number | string): Promise<number> {
    if (typeof block === 'number') {
      // If the block number is already of type number, we return it
      return block;
    } else {
      let blockObject;
      try {
        // Otherwise, we get the number of the block with getBlock web3 function
        // Use Utils.retry to rerun if getBlock fails
        blockObject = await this.ethereumBlocks.getBlock(block);
      } catch (e) {
        // getBlock can throw in certain case
        // For example, if the block describer is "pending", we're not able to get the number of the block
        // Therefore, this function should throw
        throw Error(`Cannot get the number of the block: ${e}`);
      }

      if (!blockObject || !blockObject.number) {
        throw Error(`Block ${block} has no number`);
      }

      return blockObject.number;
    }
  }
}
