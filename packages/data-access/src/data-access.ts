import {
  DataAccess as DataAccessTypes,
  IStorage,
  Signature as SignatureTypes,
} from '@requestnetwork/types';

import Block from './block';
import LocalDataidIndex from './local-data-id-index';
import Transaction from './transaction';

export default class DataAccess implements DataAccessTypes.IDataAccess {
  // DataId (Id of data on storage layer) indexed by transaction index
  // Will be used to get the data from storage with the transaction index
  private localDataidIndex: LocalDataidIndex | null = null;

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
   * Function to initialize the dataId index with the previous block
   */
  public async initialize() {
    // cannot be initialized twice
    if (this.localDataidIndex) {
      throw new Error('already initialized');
    }
    this.localDataidIndex = new LocalDataidIndex();

    // initialize the dataId index with the previous block
    const primalBlocksDataId: string[] = await this.storage.getAllDataId();
    for (const dataId of primalBlocksDataId) {
      const dataToAdd: string = await this.storage.read(dataId);

      const block = JSON.parse(dataToAdd);

      // index the previous dataId with their block index
      this.localDataidIndex.pushDataIdIndexedWithBlockIndex(
        dataId,
        block.header.index,
      );
    }
  }

  /**
   * Function to persist transaction and index in storage
   * For now, we create a block for each transaction
   *
   * @param string transaction transaction to persist
   * @param string[] indexes list of string to index the transaction
   *
   * @returns string dataId where the transaction is stored
   */
  public async persistTransaction(
    transactionData: string,
    signatureParams: SignatureTypes.ISignatureParameters,
    indexes?: string[],
  ): Promise<string> {
    if (!this.localDataidIndex) {
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
      indexes,
    );

    // get the index of the data in storage
    const dataId = await this.storage.append(JSON.stringify(updatedBlock));

    // index the dataId with block index
    this.localDataidIndex.pushDataIdIndexedWithBlockIndex(
      dataId,
      updatedBlock.header.index,
    );

    return dataId;
  }

  /**
   * Function to get a list of transactions indexed with index
   *
   * @param string index index to retrieve the transaction from
   *
   * @returns IRequestDataAccessTransaction list of transactions indexed
   */
  public async getTransactionsByIndex(index: string): Promise<string[]> {
    if (!this.localDataidIndex) {
      throw new Error('DataAccess must be initialized');
    }

    const indexStorageList = this.localDataidIndex.getDataIdByIndex(index);
    const blockList: DataAccessTypes.IRequestDataAccessBlock[] = [];

    // get blocks indexed
    for (const indexStorage of indexStorageList) {
      const dataToAdd: string = await this.storage.read(indexStorage);
      blockList.push(JSON.parse(dataToAdd));
    }

    // get transactions indexed in the blocks
    // 1. get the transactions wanted in each block
    // 2. merge all the transactions array in the same array
    const transactionList: string[] = blockList
      .map(block =>
        block.header.index[index].map(position =>
          JSON.stringify(block.transactions[position]),
        ),
      )
      .reduce((accumulator, current) => accumulator.concat(current), []);

    return transactionList;
  }
}
