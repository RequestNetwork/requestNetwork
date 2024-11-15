import * as MultiFormat from '@requestnetwork/multi-format';
import { CypherProviderTypes, EncryptionTypes, TransactionTypes } from '@requestnetwork/types';
import {
  encrypt,
  generate32BufferKey,
  getIdentityFromEncryptionParams,
} from '@requestnetwork/utils';

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
    cypherProvider?: CypherProviderTypes.ICypherProvider,
  ): Promise<TransactionTypes.IPersistedTransaction> {
    // Generate a key for the AES encryption
    const symmetricKey: string = await generate32BufferKey();

    // Encrypt the data with the key and the AES256-GCM algorithm
    const encryptedData: EncryptionTypes.IEncryptedData = await encrypt(data, {
      key: symmetricKey,
      method: EncryptionTypes.METHOD.AES256_GCM,
    });

    try {
      JSON.parse(data);
    } catch (error) {
      throw new Error('Data not parsable');
    }

    let encryptionMethod = '';
    let keys: TransactionTypes.IKeysDictionary = {};

    // TODO: refactor this part once the decryption provider is removed and the cypher provider is used
    if (
      encryptionParams.every(
        (encryptionParam: EncryptionTypes.IEncryptionParameters) =>
          encryptionParam.method === EncryptionTypes.METHOD.ECIES,
      )
    ) {
      encryptionMethod = `${EncryptionTypes.METHOD.ECIES}-${EncryptionTypes.METHOD.AES256_GCM}`;
      // Compute key encryption and identity hash for every encryption parameters given
      const encryptedKeyAndIdentityHashesPromises = encryptionParams.map(
        async (
          encryptionParam: EncryptionTypes.IEncryptionParameters,
        ): Promise<{
          encryptedKey: EncryptionTypes.IEncryptedData;
          multiFormattedIdentity: string;
        }> => {
          const identityEncryption = getIdentityFromEncryptionParams(encryptionParam);
          const multiFormattedIdentity: string = MultiFormat.serialize(identityEncryption);

          if (
            cypherProvider &&
            'supportedMethods' in cypherProvider &&
            'supportedIdentityTypes' in cypherProvider &&
            'isIdentityRegistered' in cypherProvider
          ) {
            const encryptedKey: EncryptionTypes.IEncryptedData = await cypherProvider.encrypt(
              symmetricKey,
              { encryptionParams },
            );
            return { encryptedKey, multiFormattedIdentity };
          } else {
            const encryptedKey: EncryptionTypes.IEncryptedData = await encrypt(
              symmetricKey,
              encryptionParam,
            );
            return { encryptedKey, multiFormattedIdentity };
          }
        },
      );
      const encryptedKeyAndIdentityHashes = await Promise.all(
        encryptedKeyAndIdentityHashesPromises,
      );

      // Create the encrypted keys object - Encrypted keys indexed by identity multi-format
      keys = encryptedKeyAndIdentityHashes.reduce(
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
    } else if (
      encryptionParams.every(
        (encryptionParam: EncryptionTypes.IEncryptionParameters) =>
          encryptionParam.method === EncryptionTypes.METHOD.KMS,
      )
    ) {
      encryptionMethod = `${EncryptionTypes.METHOD.KMS}-${EncryptionTypes.METHOD.AES256_GCM}`;
      if (!cypherProvider) {
        throw new Error('No cypher provider given');
      }

      const encryptResponse = await cypherProvider.encrypt(symmetricKey, {
        encryptionParams,
      });

      keys = Object.fromEntries(
        encryptionParams.map((encryptionParam) => {
          return [
            encryptionParam.key,
            MultiFormat.serialize({
              type: EncryptionTypes.METHOD.KMS,
              value: JSON.stringify(encryptResponse),
            }),
          ];
        }),
      );
    } else {
      throw new Error(
        `encryptionParams method must be all: ${EncryptionTypes.METHOD.ECIES} or ${EncryptionTypes.METHOD.KMS}`,
      );
    }

    const encryptedDataSerialized: string = MultiFormat.serialize(encryptedData);

    return { encryptedData: encryptedDataSerialized, keys, encryptionMethod };
  }

  /**
   * Creates an encrypted transaction with a channel key
   *
   * @param data The data to create the transaction with
   * @param channelKey Channel key use to encrypt the transaction
   * @param encryptionParams Array of additional encryption parameters to encrypt the key with

   * @returns the encrypted transaction
   */
  public static async createEncryptedTransaction(
    data: TransactionTypes.ITransactionData,
    channelKey: EncryptionTypes.IEncryptionParameters,
    encryptionParams: EncryptionTypes.IEncryptionParameters[] = [],
    cypherProvider?: CypherProviderTypes.ICypherProvider,
  ): Promise<TransactionTypes.IPersistedTransaction> {
    // check if the encryption method is the good one
    if (channelKey.method !== EncryptionTypes.METHOD.AES256_GCM) {
      throw new Error(`encryption method not supported for the channel key: ${channelKey.method}`);
    }

    // Encrypt the data with the key and the AES256-GCM algorithm
    const encryptedData: EncryptionTypes.IEncryptedData = await encrypt(data, channelKey);

    try {
      JSON.parse(data);
    } catch (error) {
      throw new Error('Data not parsable');
    }

    const encryptedDataSerialized: string = MultiFormat.serialize(encryptedData);
    let keys: TransactionTypes.IKeysDictionary = {};

    if (encryptionParams.length === 0) {
      return { encryptedData: encryptedDataSerialized };
    } else {
      // FIXME: Refactor, duplicated from createEncryptedTransactionInNewChannel
      // Check that all the encryption parameters given are ECIES (the only encryption method supported for now)
      if (
        encryptionParams.every(
          (encryptionParam: EncryptionTypes.IEncryptionParameters) =>
            encryptionParam.method === EncryptionTypes.METHOD.ECIES,
        )
      ) {
        // Compute key encryption and identity hash for every encryption parameters given
        const encryptedKeyAndIdentityHashesPromises = encryptionParams.map(
          async (
            encryptionParam: EncryptionTypes.IEncryptionParameters,
          ): Promise<{
            encryptedKey: EncryptionTypes.IEncryptedData;
            multiFormattedIdentity: string;
          }> => {
            const identityEncryption = getIdentityFromEncryptionParams(encryptionParam);
            const multiFormattedIdentity: string = MultiFormat.serialize(identityEncryption);

            if (
              cypherProvider &&
              'supportedMethods' in cypherProvider &&
              'supportedIdentityTypes' in cypherProvider &&
              'isIdentityRegistered' in cypherProvider
            ) {
              const encryptedKey: EncryptionTypes.IEncryptedData = await cypherProvider.encrypt(
                channelKey.key,
                { encryptionParams },
              );
              return { encryptedKey, multiFormattedIdentity };
            } else {
              const encryptedKey: EncryptionTypes.IEncryptedData = await encrypt(
                channelKey.key,
                encryptionParam,
              );
              return { encryptedKey, multiFormattedIdentity };
            }
          },
        );
        const encryptedKeyAndIdentityHashes = await Promise.all(
          encryptedKeyAndIdentityHashesPromises,
        );

        // Create the encrypted keys object - Encrypted keys indexed by identity multi-format
        keys = encryptedKeyAndIdentityHashes.reduce(
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
      } else if (
        encryptionParams.every(
          (encryptionParam: EncryptionTypes.IEncryptionParameters) =>
            encryptionParam.method === EncryptionTypes.METHOD.KMS,
        )
      ) {
        if (!cypherProvider) {
          throw new Error('No cypher provider given');
        }
        const encryptResponse = await cypherProvider.encrypt(channelKey.key, {
          encryptionParams,
        });

        keys = Object.fromEntries(
          encryptionParams.map((encryptionParam) => {
            return [
              encryptionParam.key,
              MultiFormat.serialize({
                type: EncryptionTypes.METHOD.KMS,
                value: JSON.stringify(encryptResponse),
              }),
            ];
          }),
        );
      } else {
        throw new Error(
          `encryptionParams method must be all: ${EncryptionTypes.METHOD.ECIES} or ${EncryptionTypes.METHOD.KMS}`,
        );
      }

      return { encryptedData: encryptedDataSerialized, keys };
    }
  }
}
