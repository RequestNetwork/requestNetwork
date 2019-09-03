import { EncryptionTypes, TransactionTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

/**
 * Class representing an encrypted transaction
 */
export default class EncryptedTransaction implements TransactionTypes.ITransaction {
  /** Decrypted data - start empty then filled by getData() */
  private data: TransactionTypes.ITransactionData = '';

  /** Hash computed from the decrypted data - start empty then filled by getHash() */
  private dataHash: string = '';

  /** Encrypted data */
  private encryptedData: TransactionTypes.ITransactionData;

  /** hash given by the persisted transaction */
  private hashFromPersistedTransaction: string;

  /** channel key to decrypt the encrypted data */
  private channelKey: EncryptionTypes.IDecryptionParameters;

  /**
   * Creates an instance of EncryptedTransaction.
   * @param encryptedData the encrypted data of the transaction
   * @param hashFromPersistedTransaction the hash of the decrypted data (not checked)
   * @param channelKey decryption parameters to decrypted the encrypted data
   */
  constructor(
    encryptedData: TransactionTypes.ITransactionData,
    hashFromPersistedTransaction: string,
    channelKey: EncryptionTypes.IDecryptionParameters,
  ) {
    this.encryptedData = encryptedData;
    this.channelKey = channelKey;
    this.hashFromPersistedTransaction = hashFromPersistedTransaction;
  }

  /**
   * Gets the data of the transaction
   *
   * @returns a promise resolving the transaction data
   */
  public async getData(): Promise<TransactionTypes.ITransactionData> {
    if (this.data === '') {
      try {
        this.data = await Utils.encryption.decrypt(this.encryptedData, this.channelKey);
      } catch {
        throw new Error('Impossible to decrypt the transaction');
      }
    }
    return this.data;
  }

  /**
   * Gets the transaction data hash
   *
   * @returns a promise resolving the transaction data hash
   */
  public async getHash(): Promise<string> {
    if (this.dataHash === '') {
      const data = await this.getData();
      try {
        this.dataHash = await Utils.crypto.normalizeKeccak256Hash(JSON.parse(data));
      } catch (e) {
        throw new Error('Impossible to JSON parse the decrypted transaction data');
      }
    }
    return this.dataHash;
  }

  /**
   * Gets the transaction error
   *
   * @returns a promise resolving a string of the error if any, otherwise an empty string
   */
  public async getError(): Promise<string> {
    try {
      if ((await this.getHash()) !== this.hashFromPersistedTransaction) {
        throw Error('The given hash does not match the hash of the decrypted data');
      }
      return '';
    } catch (error) {
      return error.message;
    }
  }
}
