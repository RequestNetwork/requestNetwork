import * as MultiFormat from '@requestnetwork/multi-format';
import {
  CipherProviderTypes,
  DecryptionProviderTypes,
  EncryptionTypes,
  IdentityTypes,
  TransactionTypes,
} from '@requestnetwork/types';

import ClearTransaction from './clear-transaction';
import EncryptedTransaction from './encrypted-transaction';

/**
 * Class to parse transactions
 */
export default class TransactionsParser {
  private decryptionProvider: DecryptionProviderTypes.IDecryptionProvider | undefined;
  private cipherProvider: CipherProviderTypes.ICipherProvider | undefined;

  constructor(
    decryptionProvider?: DecryptionProviderTypes.IDecryptionProvider,
    cipherProvider?: CipherProviderTypes.ICipherProvider,
  ) {
    this.decryptionProvider = decryptionProvider;
    this.cipherProvider = cipherProvider;
  }

  /**
   * Parses a persisted transaction into a ClearTransaction or EncryptedTransaction, and decrypts the channel key if needed
   *
   * @param persistedTransaction the persisted transaction to parse
   * @param channelType The channel type (unknown, clear or encrypted)
   * @param channelKey the channel key to decrypt the transaction if needed
   * @param encryptionMethod the channel encryption method to decrypt the transaction if needed
   * @returns the transaction object and the channel key (if applicable)
   */
  public async parsePersistedTransaction(
    persistedTransaction: TransactionTypes.IPersistedTransaction,
    channelType: TransactionTypes.ChannelType,
    channelKey?: EncryptionTypes.IDecryptionParameters,
    encryptionMethod?: string,
  ): Promise<{
    transaction: TransactionTypes.ITransaction;
    channelKey?: EncryptionTypes.IDecryptionParameters;
    encryptionMethod?: string;
  }> {
    // looks like a clear transaction
    if (persistedTransaction.data) {
      if (channelType === TransactionTypes.ChannelType.ENCRYPTED) {
        throw new Error('Clear transactions are not allowed in encrypted channel');
      }
      if (
        persistedTransaction.encryptedData ||
        persistedTransaction.encryptionMethod ||
        persistedTransaction.keys
      ) {
        throw new Error('only the property "data" is allowed for clear transaction');
      }
      return { transaction: new ClearTransaction(persistedTransaction.data) };
    }

    // looks like an encrypted transaction
    if (persistedTransaction.encryptedData) {
      if (channelType === TransactionTypes.ChannelType.CLEAR) {
        throw new Error('Encrypted transactions are not allowed in clear channel');
      }

      // no channel key, try to decrypt it and validate encryption method
      if (!channelKey) {
        // no encryptionMethod, this is first tx, must contain encryptionMethod
        if (!encryptionMethod) {
          if (!persistedTransaction.encryptionMethod || !persistedTransaction.keys) {
            throw new Error(
              'the properties "encryptionMethod" and "keys" are needed to compute the channel key',
            );
          }
          encryptionMethod = persistedTransaction.encryptionMethod;
          channelKey = await this.decryptChannelKey(persistedTransaction.keys, encryptionMethod);
        }
        // given encryptionMethod, this not first tx, must not contain encryptionMethod
        else {
          if (persistedTransaction.encryptionMethod) {
            throw new Error(
              'the "encryptionMethod" property has been already given for this channel',
            );
          }
          if (!persistedTransaction.keys) {
            throw new Error('the "keys" property is needed to compute the channel key');
          }
          channelKey = await this.decryptChannelKey(persistedTransaction.keys, encryptionMethod);
        }
      }
      // given channel key, validate encryption method
      else {
        // no encryptionMethod, this is first tx, must contain encryptionMethod
        if (!encryptionMethod) {
          if (!persistedTransaction.encryptionMethod) {
            throw new Error('the "encryptionMethod" property is needed to use the channel key');
          }
          encryptionMethod = persistedTransaction.encryptionMethod;
        }
        // given encryptionMethod, this not first tx, must not contain encryptionMethod
        else {
          if (persistedTransaction.encryptionMethod) {
            throw new Error(
              'the "encryptionMethod" property has been already given for this channel',
            );
          }
        }
      }

      return {
        channelKey,
        encryptionMethod,
        transaction: new EncryptedTransaction(persistedTransaction.encryptedData, channelKey),
      };
    }

    throw new Error('Transaction must have a property "data" or "encryptedData"');
  }

  /**
   * Decrypts a channel key
   *
   * @param keys encrypted keys indexed by identity
   * @param encryptionMethod encryption method used for the channel
   * @returns the channel key
   */
  private async decryptChannelKey(
    keys: TransactionTypes.IKeysDictionary,
    encryptionMethod: string,
  ): Promise<EncryptionTypes.IDecryptionParameters> {
    let errorReason = '';
    let channelKey = '';
    let channelKeyMethod: EncryptionTypes.METHOD | undefined;

    if (
      this.cipherProvider &&
      encryptionMethod === `${EncryptionTypes.METHOD.KMS}-${EncryptionTypes.METHOD.AES256_GCM}`
    ) {
      const entries = Object.entries(keys);
      if (entries.length === 0) {
        throw new Error('No encryption keys provided');
      }
      let encryptResponse;
      try {
        encryptResponse = JSON.parse(MultiFormat.deserialize(entries[0][1]).value);
      } catch (e) {
        throw new Error('Invalid encryption response format');
      }
      const encryptionParams = entries.map((entry) => {
        return {
          method: EncryptionTypes.METHOD.KMS,
          key: entry[0],
        };
      });
      try {
        channelKey = await this.cipherProvider.decrypt(encryptResponse, {
          encryptionParams,
        });
        channelKeyMethod = EncryptionTypes.METHOD.AES256_GCM;
      } catch (e) {
        errorReason = e.message;
      }
    } else {
      // Check if the decryption provider is given
      if (!this.decryptionProvider && !this.cipherProvider) {
        throw new Error(`No decryption or cipher provider given`);
      }

      // Check the encryption method
      if (
        encryptionMethod === `${EncryptionTypes.METHOD.ECIES}-${EncryptionTypes.METHOD.AES256_CBC}`
      ) {
        channelKeyMethod = EncryptionTypes.METHOD.AES256_CBC;
      } else if (
        encryptionMethod === `${EncryptionTypes.METHOD.ECIES}-${EncryptionTypes.METHOD.AES256_GCM}`
      ) {
        channelKeyMethod = EncryptionTypes.METHOD.AES256_GCM;
      } else {
        throw new Error(`Encryption method not supported: ${encryptionMethod}`);
      }

      // Try to decrypt the channelKey
      channelKey = await Object.keys(keys || {}).reduce(
        async (decryptedChannelKeyPromise, identityMultiFormatted: string) => {
          let decryptedChannelKey = await decryptedChannelKeyPromise;
          if (keys && decryptedChannelKey === '') {
            let identity: IdentityTypes.IIdentity | undefined;
            try {
              identity = MultiFormat.deserialize(identityMultiFormatted);
            } catch (e) {
              // if we cannot deserialize it, just ignore this identity
            }
            // Ignore what is not an identity Ethereum address
            if (identity && identity.type === IdentityTypes.TYPE.ETHEREUM_ADDRESS) {
              // Check if we can decrypt the key with this identity
              if (
                (this.decryptionProvider &&
                  (await this.decryptionProvider.isIdentityRegistered(identity))) ||
                (this.cipherProvider &&
                  typeof (
                    this.cipherProvider as CipherProviderTypes.ICipherProvider & {
                      isIdentityRegistered: (identity: IdentityTypes.IIdentity) => Promise<boolean>;
                    }
                  ).isIdentityRegistered === 'function' &&
                  (await (
                    this.cipherProvider as CipherProviderTypes.ICipherProvider & {
                      isIdentityRegistered: (identity: IdentityTypes.IIdentity) => Promise<boolean>;
                    }
                  ).isIdentityRegistered(identity)))
              ) {
                try {
                  const key = MultiFormat.deserialize(keys[identityMultiFormatted]);
                  decryptedChannelKey = this.cipherProvider
                    ? await this.cipherProvider.decrypt(key, {
                        identity,
                      })
                    : await this.decryptionProvider?.decrypt(key, identity);
                } catch (e) {
                  errorReason = e.message;
                }
              }
            }
          }
          return decryptedChannelKey;
        },
        Promise.resolve(''),
      );
    }

    if (channelKey === '' || !channelKeyMethod) {
      throw new Error(
        `Impossible to decrypt the channel key from this transaction (${errorReason})`,
      );
    }

    return {
      key: channelKey,
      method: channelKeyMethod,
    };
  }
}
