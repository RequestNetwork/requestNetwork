import MultiFormat from '@requestnetwork/multi-format';
import { TransactionTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

/**
 * Class representing a clear transaction
 */
export default class ClearTransaction implements TransactionTypes.ITransaction {
  private data: TransactionTypes.ITransactionData;

  constructor(data: TransactionTypes.ITransactionData) {
    this.data = data;
  }

  /**
   * Gets the data of the transaction
   *
   * @returns a promise resolving the transaction data
   */
  public async getData(): Promise<TransactionTypes.ITransactionData> {
    return this.data;
  }

  /**
   * Gets the transaction data hash
   *
   * @returns a promise resolving the transaction data hash
   */
  public async getHash(): Promise<string> {
    return MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(JSON.parse(this.data)));
  }

  /**
   * Gets the transaction error
   *
   * @returns a promise resolving a string of the error if any, otherwise an empty string
   */
  public async getError(): Promise<string> {
    try {
      JSON.parse(this.data);
      return '';
    } catch (e) {
      return 'Impossible to JSON parse the transaction';
    }
  }
}
