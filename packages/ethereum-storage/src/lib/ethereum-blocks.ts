import { Storage as Types } from '@requestnetwork/types';

/**
 * Manages every info linked to the ethereum blocks (blockNumber, blockTimestamp, confirmations ... )
 */
export default class EthereumBlocks {
  // 'web3-eth' object
  public eth: any;

  /**
   * Cache of the blockTimestamp indexed by blockNumber
   * to ask only once the timestamp of a block from a node
   *
   */
  protected blockTimestamp: number[] = [];

  // All the block before this one are ignored
  // Basically, the block where the contract has been created
  private firstSignificantBlockNumber: number;

  /**
   * Constructor
   * @param eth eth object from web3
   * @param firstSignificantBlockNumber all the block before this one will be ignored
   */
  public constructor(eth: any, firstSignificantBlockNumber: number) {
    this.eth = eth;

    this.firstSignificantBlockNumber = firstSignificantBlockNumber;
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
    const block = await this.eth.getBlock(blockNumber);
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
  ): Promise<Types.IBlockNumbersInterval> {

    // check if we have the blockTimestamp of the first significant block number
    if (!this.blockTimestamp[this.firstSignificantBlockNumber]) {
      // update the blockTimestamp cache with the first significant block
      await this.getBlockTimestamp(this.firstSignificantBlockNumber);
    }

    // update the last block number in memory
    const lastBlockNumber: number = await this.getLastBlockNumber();

    // check if we have the blockTimestamp of the last number
    if (!this.blockTimestamp[lastBlockNumber]) {
      // update the blockTimestamp cache with the last block
      await this.getBlockTimestamp(lastBlockNumber);
    }

    // if timestamp before first significant block, return the significant block
    if (timestamp <= this.blockTimestamp[this.firstSignificantBlockNumber]) {
      return {
        blockAfter: this.firstSignificantBlockNumber,
        blockBefore: this.firstSignificantBlockNumber,
      };
    }

    // if timestamp after last block, return lastBlockNumber
    if (timestamp > this.blockTimestamp[lastBlockNumber]) {
      return {
        blockAfter: lastBlockNumber,
        blockBefore: lastBlockNumber,
      };
    }

    // Before doing the dichotomic search, we restrict the search to the two closest block we already know
    // the boundaries start with the first significant block and the last block
    const { result, lowBlockNumber, highBlockNumber } = this.getKnownBlockNumbersFromTimestamp(
      timestamp,
      lastBlockNumber,
    );

    // if the result is not found on the known blocks, we search by dichotomy between the two closest known blocks
    return (
      result ||
      this.getBlockNumbersFromTimestampByDichotomy(timestamp, lowBlockNumber, highBlockNumber)
    );
  }

  /**
   * Gets last block number
   * @return   blockNumber of the last block
   */
  public async getLastBlockNumber(): Promise<number> {
    return this.eth.getBlockNumber();
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
    result: Types.IBlockNumbersInterval | null;
    lowBlockNumber: number;
    highBlockNumber: number;
  } {
    let lowBlockNumber = this.firstSignificantBlockNumber;
    let highBlockNumber = lastBlockNumber;

    let currentBlockNumber = this.firstSignificantBlockNumber;
    let currentBlockTimestamp;
    let result: Types.IBlockNumbersInterval | null = null;

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
  ): Promise<Types.IBlockNumbersInterval> {
    let result: Types.IBlockNumbersInterval | null = null;

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
