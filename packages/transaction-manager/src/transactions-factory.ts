import MultiFormat from '@requestnetwork/multi-format';
import { EncryptionTypes, TransactionTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

/**
 * Class to create transactions (clear and encrypted)
 */
export default class TransactionsFactory {
  /**
   * Creates a clear transaction with data
   *
   * @param data The data to create the transaction with
   * @returns the transaction
   */
  public static async createClearTransaction(
    data: TransactionTypes.ITransactionData,
  ): Promise<TransactionTypes.IPersistedTransaction> {
    try {
      JSON.parse(data);
    } catch (error) {
      throw new Error('Data not parsable');
    }

    return { data };
  }

  /**
   * Creates an encrypted transaction without a channel key
   *
   * @param data The data to create the transaction with
   * @param encryptionParams Array of the encryption parameters to encrypt the key with
   * @returns the encrypted transaction
   */
  public static async createEncryptedTransactionInNewChannel(
    data: TransactionTypes.ITransactionData,
    encryptionParams: EncryptionTypes.IEncryptionParameters[],
  ): Promise<TransactionTypes.IPersistedTransaction> {
    // format encryption method property
    const encryptionMethod = `${EncryptionTypes.METHOD.ECIES}-${EncryptionTypes.METHOD.AES256_GCM}`;

    // Generate a key for the AES encryption
    const symmetricKey: string = await Utils.crypto.generate32BufferKey();

    // Encrypt the data with the key and the AES256-GCM algorithm
    const encryptedData: EncryptionTypes.IEncryptedData = await Utils.encryption.encrypt(data, {
      key: symmetricKey,
      method: EncryptionTypes.METHOD.AES256_GCM,
    });

    try {
      JSON.parse(data);
    } catch (error) {
      throw new Error('Data not parsable');
    }

    // Check that all the encryption parameters given are ECIES (the only encryption method supported for now)
    if (
      !encryptionParams.every(
        (encryptionParam: EncryptionTypes.IEncryptionParameters) =>
          encryptionParam.method === EncryptionTypes.METHOD.ECIES,
      )
    ) {
      throw new Error(`encryptionParams method must be all: ${EncryptionTypes.METHOD.ECIES}`);
    }

    // Compute key encryption and identity hash for every encryption parameters given
    const encryptedKeyAndIdentityHashesPromises = encryptionParams.map(
      async (
        encryptionParam: EncryptionTypes.IEncryptionParameters,
      ): Promise<{
        encryptedKey: EncryptionTypes.IEncryptedData;
        multiFormattedIdentity: string;
      }> => {
        const encryptedKey: EncryptionTypes.IEncryptedData = await Utils.encryption.encrypt(
          symmetricKey,
          encryptionParam,
        );
        const identityEncryption = Utils.encryption.getIdentityFromEncryptionParams(
          encryptionParam,
        );
        const multiFormattedIdentity: string = MultiFormat.serialize(identityEncryption);

        return { encryptedKey, multiFormattedIdentity };
      },
    );
    const encryptedKeyAndIdentityHashes = await Promise.all(encryptedKeyAndIdentityHashesPromises);

    // Create the encrypted keys object - Encrypted keys indexed by identity multi-format
    const keys: TransactionTypes.IKeysDictionary = encryptedKeyAndIdentityHashes.reduce(
      (
        allKeys: TransactionTypes.IKeysDictionary,
        keyAndHash: {
          encryptedKey: EncryptionTypes.IEncryptedData;
          multiFormattedIdentity: string;
        },
      ): TransactionTypes.IKeysDictionary => {
        const encryptedKeySerialized: string = MultiFormat.serialize(keyAndHash.encryptedKey);

        allKeys[keyAndHash.multiFormattedIdentity] = encryptedKeySerialized;
        return allKeys;
      },
      {},
    );

    const encryptedDataSerialized: string = MultiFormat.serialize(encryptedData);

    return { encryptedData: encryptedDataSerialized, keys, encryptionMethod };
  }

  /**
   * Creates an encrypted transaction with a channel key
   *
   * @param data The data to create the transaction with
   * @param channelKey Channel key use to encrypt the transaction
   * @returns the encrypted transaction
   */
  public static async createEncryptedTransaction(
    data: TransactionTypes.ITransactionData,
    channelKey: EncryptionTypes.IEncryptionParameters,
  ): Promise<TransactionTypes.IPersistedTransaction> {
    // check if the encryption method is the good one
    if (channelKey.method !== EncryptionTypes.METHOD.AES256_GCM) {
      throw new Error(`encryption method not supported for the channel key: ${channelKey.method}`);
    }

    // Encrypt the data with the key and the AES256-GCM algorithm
    const encryptedData: EncryptionTypes.IEncryptedData = await Utils.encryption.encrypt(
      data,
      channelKey,
    );

    try {
      JSON.parse(data);
    } catch (error) {
      throw new Error('Data not parsable');
    }

    const encryptedDataSerialized: string = MultiFormat.serialize(encryptedData);

    return { encryptedData: encryptedDataSerialized };
  }
}
