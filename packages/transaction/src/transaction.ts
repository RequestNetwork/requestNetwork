import {
  DataAccess as DataAccessTypes,
  Signature as SignatureTypes,
  Transaction as TransactionTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

/**
 * Implementation of Transaction layer without encryption
 */
export default class Transaction implements TransactionTypes.ITransactionLayer {
  private dataAccess: DataAccessTypes.IDataAccess;

  public constructor(dataAccess: DataAccessTypes.IDataAccess) {
    this.dataAccess = dataAccess;
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
  ): Promise<TransactionTypes.IRequestDataReturnPersistTransaction> {}

  /**
   * Function to get a list of transactions indexed by topic
   *
   * @param string topic topic to retrieve the transaction from
   *
   * @returns IRequestDataAccessTransaction list of transactions indexed by topic
   */
  public async getTransactionsByTopic(
    topic: string,
  ): Promise<TransactionTypes.IRequestDataReturnGetTransactionsByTopic> {}
}
