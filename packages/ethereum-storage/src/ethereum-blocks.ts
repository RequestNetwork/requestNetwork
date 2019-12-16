import { LogTypes, StorageTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

/**
 * Manages every info linked to the ethereum blocks (blockNumber, blockTimestamp, confirmations ... )
 */
export default class EthereumBlocks {
  // 'web3-eth' object
  public eth: any;

  /**
   * Gets last block number
   * The return value of this function will be cached for `lastBlockNumberDelay` milliseconds
   *
   * @return   blockNumber of the last block
   */
  public getLastBlockNumber: () => Promise<number>;

  // The time to wait between query retries
  public retryDelay: number;

  // Maximum number of retries for a query
  public maxRetries: number;

  /**
   * Cache of the blockTimestamp indexed by blockNumber
   * to ask only once the timestamp of a block from a node
   *
   */
  protected blockTimestamp: number[] = [];

  // All the block before this one are ignored
  // Basically, the block where the contract has been created
  private firstSignificantBlockNumber: number;

  // The minimum amount of time to wait between fetches of lastBlockNumber
  private getLastBlockNumberMinDelay: number;

  /**
   * Logger instance
   */
  private logger: LogTypes.ILogger;

  /**
   * Constructor
   * @param eth eth object from web3
   * @param firstSignificantBlockNumber all the block before this one will be ignored
   * @param getLastBlockNumberMinDelay the minimum delay to wait between fetches of lastBlockNumber
   */
  public constructor(
    eth: any,
    firstSignificantBlockNumber: number,
    retryDelay: number,
    maxRetries: number,
    getLastBlockNumberMinDelay: number = 0,
    logger?: LogTypes.ILogger,
  ) {
    this.eth = eth;

    this.firstSignificantBlockNumber = firstSignificantBlockNumber;

    this.getLastBlockNumberMinDelay = getLastBlockNumberMinDelay;

    this.logger = logger || new Utils.SimpleLogger();

    // Get retry parameter values from config
    this.retryDelay = retryDelay;
    this.maxRetries = maxRetries;

    // Setup the throttled and retriable getLastBlockNumber function
    this.getLastBlockNumber = Utils.cachedThrottle(
      () =>
        Utils.retry(
          () => {
            this.logger.debug(`Getting last block number`, ['ethereum', 'ethereum-blocks']);
            return this.eth.getBlockNumber();
          },
          {
            maxRetries: this.maxRetries,
            retryDelay: this.retryDelay,
          },
        )(),
      this.getLastBlockNumberMinDelay,
    );
  }

  /**
   * Gets timestamp of a block
   * @param blockNumber number of the block
   * @return timestamp of a block
   */
  public async getBlockTimestamp(blockNumber: number): Promise<number> {
    // If we already have it, give it
    if (this.blockTimestamp[blockNumber]) {
      return this.blockTimestamp[blockNumber];
    }

    // if we don't know the information, let's get it
    // Use Utils.retry to rerun if getBlock fails
    const block = await Utils.retry((bn: number) => this.eth.getBlock(bn), {
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay,
    })(blockNumber);
    if (!block) {
      throw Error(`block ${blockNumber} not found`);
    }
    this.blockTimestamp[blockNumber] = block.timestamp;

    return this.blockTimestamp[blockNumber];
  }

  /**
   * Gets the two block numbers surrounding a timestamp
   * if the timestamp match exactly a blockTimestamp, returns twice this block number
   * If the timestamp is before than the significant block return, returns twice this significant block number
   *
   * @param timestamp timestamp to search from
   * @return {blockBefore, blockAfter} or null if the timestamp is after the last ethereum block
   */
  public async getBlockNumbersFromTimestamp(
    timestamp: number,
  ): Promise<StorageTypes.IBlockNumbersInterval> {
    // check if we have the blockTimestamp of the first significant block number
    if (!this.blockTimestamp[this.firstSignificantBlockNumber]) {
      // update the blockTimestamp cache with the first significant block
      await this.getBlockTimestamp(this.firstSignificantBlockNumber);
    }

    // update the second last block number in memory
    // we get the number of the second last block instead of the last block
    // because the information of the last block may not be retrieved by the web3 provider
    const secondLastBlockNumber: number = await this.getSecondLastBlockNumber();

    // check if we have the blockTimestamp of the number of the second last block
    if (!this.blockTimestamp[secondLastBlockNumber]) {
      // update the blockTimestamp cache with the second last block
      await this.getBlockTimestamp(secondLastBlockNumber);
    }

    // if timestamp before first significant block, return the significant block
    if (timestamp <= this.blockTimestamp[this.firstSignificantBlockNumber]) {
      return {
        blockAfter: this.firstSignificantBlockNumber,
        blockBefore: this.firstSignificantBlockNumber,
      };
    }

    // if timestamp after second last block, return secondLastBlockNumber
    if (timestamp > this.blockTimestamp[secondLastBlockNumber]) {
      return {
        blockAfter: secondLastBlockNumber,
        blockBefore: secondLastBlockNumber,
      };
    }

    // Before doing the dichotomic search, we restrict the search to the two closest block we already know
    // the boundaries start with the first significant block and the last block
    const { result, lowBlockNumber, highBlockNumber } = this.getKnownBlockNumbersFromTimestamp(
      timestamp,
      secondLastBlockNumber,
    );

    // if the result is not found on the known blocks, we search by dichotomy between the two closest known blocks
    return (
      result ||
      this.getBlockNumbersFromTimestampByDichotomy(timestamp, lowBlockNumber, highBlockNumber)
    );
  }

  /**
   * Gets second last block number
   * @return   blockNumber of the second last block
   */
  public async getSecondLastBlockNumber(): Promise<number> {
    return (await this.getLastBlockNumber()) - 1;
  }

  /**
   * Gets the number of confirmation from a blockNumber
   * @return   blockNumber of the last block
   */
  public async getConfirmationNumber(blockNumber: number): Promise<number> {
    try {
      return (await this.getLastBlockNumber()) - blockNumber;
    } catch (e) {
      throw Error(`Error getting the confirmation number: ${e}`);
    }
  }

  /**
   * Get a block from ethereum
   *
   * @param blockNumber The block number
   * @returns An Ethereum block
   */
  public async getBlock(blockNumber: number | string): Promise<any> {
    return Utils.retry(this.eth.getBlock, {
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay,
    })(blockNumber);
  }

  /**
   * Gets the two known block numbers surrounding a timestamp
   *
   * @param timestamp timestamp to search from
   * @param lastBlockNumber last block number known
   * @returns
   */
  private getKnownBlockNumbersFromTimestamp(
    timestamp: number,
    lastBlockNumber: number,
  ): {
    result: StorageTypes.IBlockNumbersInterval | null;
    lowBlockNumber: number;
    highBlockNumber: number;
  } {
    let lowBlockNumber = this.firstSignificantBlockNumber;
    let highBlockNumber = lastBlockNumber;

    let currentBlockNumber = this.firstSignificantBlockNumber;
    let currentBlockTimestamp;
    let result: StorageTypes.IBlockNumbersInterval | null = null;

    let foundKnownBoundaries: boolean = false;
    // We iterate on the known blocks from the first significant block until we found a blockTimestamp bigger than the timestamp
    while (!foundKnownBoundaries) {
      currentBlockTimestamp = this.blockTimestamp[currentBlockNumber];
      // if the block is unknown yet, we skip it
      if (currentBlockTimestamp) {
        // if we are lucky a block we know has the exact same timestamp
        if (currentBlockTimestamp === timestamp) {
          result = { blockBefore: currentBlockNumber, blockAfter: currentBlockNumber };
          foundKnownBoundaries = true;
        } else {
          // otherwise we restrict the boundaries
          lowBlockNumber = highBlockNumber;
          highBlockNumber = currentBlockNumber;

          // If the current timestamp is bigger than the one we research,
          // it means we have the best boundaries from what we already know
          if (currentBlockTimestamp > timestamp) {
            foundKnownBoundaries = true;
          }
        }
      }
      currentBlockNumber++;
    }

    return { result, lowBlockNumber, highBlockNumber };
  }

  /**
   * Gets the two block numbers surrounding a timestamp
   * This is done by a dichotomic search between two blocks
   *
   * @param timestamp timestamp to search from
   * @param lowBlockNumber low boundary
   * @param highBlockNumber high boundary
   * @returns
   */
  private async getBlockNumbersFromTimestampByDichotomy(
    timestamp: number,
    lowBlockNumber: number,
    highBlockNumber: number,
  ): Promise<StorageTypes.IBlockNumbersInterval> {
    let result: StorageTypes.IBlockNumbersInterval | null = null;

    // if blocks not found yet, we do a dichotomic search between the two closest known blocks
    while (!result) {
      // Picks the block in the middle of the two closest known blocks
      const currentBlockNumber =
        lowBlockNumber + Math.floor((highBlockNumber - lowBlockNumber) / 2);
      // Gets the timestamp of the block and stores it
      const currentBlockTimestamp = await this.getBlockTimestamp(currentBlockNumber);

      // Restricts the boundaries
      if (currentBlockTimestamp < timestamp) {
        lowBlockNumber = currentBlockNumber;
      } else if (currentBlockTimestamp > timestamp) {
        highBlockNumber = currentBlockNumber;
      } else {
        // If we are lucky, the timestamp is equal to the block timestamp
        result = { blockBefore: currentBlockNumber, blockAfter: currentBlockNumber };
        break;
      }

      // If we are not lucky, we wait to have the two block surrounding the timestamp
      if (highBlockNumber === lowBlockNumber + 1) {
        result = { blockBefore: lowBlockNumber, blockAfter: highBlockNumber };
      }
    }

    return result;
  }
}
