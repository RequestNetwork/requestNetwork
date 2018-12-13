import {
  DataAccess as DataAccessTypes,
  Signature as SignatureTypes,
  Storage as StorageTypes,
} from '@requestnetwork/types';

import Block from './block';
import LocationByTopic from './location-by-topic';
import Transaction from './transaction';

/**
 * Implementation of Data-Access layer without encryption
 */
export default class DataAccess implements DataAccessTypes.IDataAccess {
  // DataId (Id of data on storage layer) indexed by transaction topic
  // Will be used to get the data from storage with the transaction topic
  private locationByTopic?: LocationByTopic;

  // Storage layer
  private storage: StorageTypes.IStorage;

  /**
   * Constructor DataAccess interface
   *
   * @param IStorage storage storage object
   */
  public constructor(storage: StorageTypes.IStorage) {
    this.storage = storage;
  }

  /**
   * Function to initialize the dataId topic with the previous block
   */
  public async initialize(): Promise<void> {
    // cannot be initialized twice
    if (this.locationByTopic) {
      throw new Error('already initialized');
    }
    this.locationByTopic = new LocationByTopic();

    // initialize the dataId topic with the previous block
    const primalBlocksDataId: string[] = await this.storage.getAllDataId();
    for (const dataId of primalBlocksDataId) {
      const dataToAdd: string = await this.storage.read(dataId);
      const block = JSON.parse(dataToAdd);
      if (!block.header || !block.header.topics) {
        throw Error(`data from storage do not follow the standard, storage location: "${dataId}"`);
      }

      // topic the previous dataId with their block topic
      this.locationByTopic.pushLocationIndexedWithBlockTopics(dataId, block.header.topics);
    }
  }

  /**
   * Function to persist transaction and topic in storage
   * For now, we create a block for each transaction
   *
   * @param string transaction transaction to persist
   * @param string[] topics list of string to topic the transaction
   *
   * @returns string dataId where the transaction is stored
   */
  public async persistTransaction(
    transactionData: string,
    signatureParams: SignatureTypes.ISignatureParameters,
    topics: string[] = [],
  ): Promise<DataAccessTypes.IRequestDataReturnPersistTransaction> {
    if (!this.locationByTopic) {
      throw new Error('DataAccess must be initialized');
    }

    // create the transaction
    const transaction = Transaction.createTransaction(
      transactionData,
      signatureParams as SignatureTypes.ISignatureParameters,
    );
    // create a block and add the transaction in it
    const updatedBlock = Block.pushTransaction(Block.createEmptyBlock(), transaction, topics);
    // get the topic of the data in storage
    const dataId = await this.storage.append(JSON.stringify(updatedBlock));

    // topic the dataId with block topic
    this.locationByTopic.pushLocationIndexedWithBlockTopics(dataId, updatedBlock.header.topics);

    return {
      meta: {
        topics,
        transactionStorageLocation: dataId,
      },
      result: {},
    };
  }

  /**
   * Function to get a list of transactions indexed by topic
   *
   * @param string topic topic to retrieve the transaction from
   *
   * @returns IRequestDataAccessTransaction list of transactions indexed by topic
   */
  public async getTransactionsByTopic(
    topic: string,
  ): Promise<DataAccessTypes.IRequestDataReturnGetTransactionsByTopic> {
    if (!this.locationByTopic) {
      throw new Error('DataAccess must be initialized');
    }

    const locationStorageList = this.locationByTopic.getLocationFromTopic(topic);
    const blockList: any[] = [];

    // get blocks indexed by topic
    for (const location of locationStorageList) {
      const dataToAdd: string = await this.storage.read(location);
      blockList.push({
        block: JSON.parse(dataToAdd),
        location,
      });
    }

    // get transactions indexed by topic in the blocks
    // 1. get the transactions wanted in each block
    // 2. merge all the transactions array in the same array
    const transactions: DataAccessTypes.IRequestDataAccessTransaction[] = blockList
      .map(data =>
        data.block.header.topics[topic].map(
          (position: number) => data.block.transactions[position],
        ),
      )
      .reduce((accumulator, current) => accumulator.concat(current), []);

    // Generate the list of storage location of the transactions listed above
    const transactionsStorageLocation: string[] = blockList
      .map(data => Array(data.block.header.topics[topic].length).fill(data.location))
      .reduce((accumulator, current) => accumulator.concat(current), []);

    return {
      meta: {
        transactionsStorageLocation,
      },
      result: { transactions },
    };
  }
}
