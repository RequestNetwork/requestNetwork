import {
  DataAccess as DataAccessTypes,
  IStorage,
  Signature as SignatureTypes,
} from '@requestnetwork/types';

import Block from './block';
import localDataidTopic from './local-data-id-topic';
import Transaction from './transaction';

/**
 * Implementation of Data-Access layer without encryption
 */
export default class DataAccess implements DataAccessTypes.IDataAccess {
  // DataId (Id of data on storage layer) topiced by transaction topic
  // Will be used to get the data from storage with the transaction topic
  private localDataidTopic: localDataidTopic | null = null;

  // Storage layer
  private storage: IStorage;

  /**
   * Constructor DataAccess interface
   *
   * @param IStorage storage storage object
   */
  public constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Function to initialize the dataId topic with the previous block
   */
  public async initialize() {
    // cannot be initialized twice
    if (this.localDataidTopic) {
      throw new Error('already initialized');
    }
    this.localDataidTopic = new localDataidTopic();

    // initialize the dataId topic with the previous block
    const primalBlocksDataId: string[] = await this.storage.getAllDataId();
    for (const dataId of primalBlocksDataId) {
      const dataToAdd: string = await this.storage.read(dataId);

      const block = JSON.parse(dataToAdd);

      // topic the previous dataId with their block topic
      this.localDataidTopic.pushDataIdIndexedWithBlockTopics(
        dataId,
        block.header.topics,
      );
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
    topics?: string[],
  ): Promise<string> {
    if (!this.localDataidTopic) {
      throw new Error('DataAccess must be initialized');
    }

    // create the transaction
    const transaction = Transaction.createTransaction(
      transactionData,
      signatureParams as SignatureTypes.ISignatureParameters,
    );
    // create a block and add the transaction in it
    const updatedBlock = Block.pushTransaction(
      Block.createEmptyBlock(),
      transaction,
      topics,
    );
    // get the topic of the data in storage
    const dataId = await this.storage.append(JSON.stringify(updatedBlock));

    // topic the dataId with block topic
    this.localDataidTopic.pushDataIdIndexedWithBlockTopics(
      dataId,
      updatedBlock.header.topics,
    );

    return dataId;
  }

  /**
   * Function to get a list of transactions topiced with topic
   *
   * @param string topic toppic to retrieve the transaction from
   *
   * @returns IRequestDataAccessTransaction list of transactions topiced
   */
  public async getTransactionsByTopic(topic: string): Promise<string[]> {
    if (!this.localDataidTopic) {
      throw new Error('DataAccess must be initialized');
    }

    const topicStorageList = this.localDataidTopic.getDataIdFromTopic(topic);
    const blockList: DataAccessTypes.IRequestDataAccessBlock[] = [];

    // get blocks topiced
    for (const topicStorage of topicStorageList) {
      const dataToAdd: string = await this.storage.read(topicStorage);
      blockList.push(JSON.parse(dataToAdd));
    }

    // get transactions topiced in the blocks
    // 1. get the transactions wanted in each block
    // 2. merge all the transactions array in the same array
    const transactionList: string[] = blockList
      .map(block =>
        block.header.topics[topic].map(position =>
          JSON.stringify(block.transactions[position]),
        ),
      )
      .reduce((accumulator, current) => accumulator.concat(current), []);

    return transactionList;
  }
}
