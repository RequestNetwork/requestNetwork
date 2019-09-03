import {
  DecryptionProviderTypes,
  EncryptionTypes,
  IdentityTypes,
  TransactionTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import ClearTransaction from './clear-transaction';
import EncryptedTransaction from './encrypted-transaction';

/**
 * Class to parse transactions
 */
export default class TransactionsParser {
  private decryptionProvider: DecryptionProviderTypes.IDecryptionProvider | undefined;

  constructor(decryptionProvider?: DecryptionProviderTypes.IDecryptionProvider) {
    this.decryptionProvider = decryptionProvider;
  }

  /**
   * Parses a persisted transaction into a ClearTransaction or EncryptedTransaction, and decrypts the channel key if needed
   *
   * @param persistedTransaction the persisted transaction to parse
   * @param channelType The channel type (unknown, clear or encrypted)
   * @param channelKey the channel key to decrypt the transaction if needed
   * @returns the transaction object and the channel key (if applicable)
   */
  public async parsePersistedTransaction(
    persistedTransaction: TransactionTypes.IPersistedTransaction,
    channelType: TransactionTypes.ChannelType,
    channelKey?: EncryptionTypes.IDecryptionParameters,
  ): Promise<{
    transaction: TransactionTypes.ITransaction;
    channelKey?: EncryptionTypes.IDecryptionParameters;
  }> {
    // looks like a clear transaction
    if (persistedTransaction.data) {
      if (channelType === TransactionTypes.ChannelType.ENCRYPTED) {
        throw new Error('Clear transactions are not allowed in encrypted channel');
      }
      if (
        persistedTransaction.encryptedData ||
        persistedTransaction.encryptionMethod ||
        persistedTransaction.hash ||
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
      if (!persistedTransaction.hash) {
        throw new Error('the property "hash" is missing for the encrypted transaction');
      }

      // if we don't have the channel key we need to decrypt it
      if (!channelKey) {
        if (!persistedTransaction.encryptionMethod || !persistedTransaction.keys) {
          throw new Error(
            'the properties "encryptionMethod" and "keys" are needed to compute the channel key',
          );
        }
        channelKey = await this.decryptChannelKey(
          persistedTransaction.keys,
          persistedTransaction.encryptionMethod,
        );
      } else {
        if (persistedTransaction.encryptionMethod || persistedTransaction.keys) {
          throw new Error(
            'the properties "encryptionMethod" and "keys" have been already given for this channel',
          );
        }
      }

      return {
        channelKey,
        transaction: new EncryptedTransaction(
          persistedTransaction.encryptedData,
          persistedTransaction.hash,
          channelKey,
        ),
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
    // Check the encryption method
    if (
      encryptionMethod !== `${EncryptionTypes.METHOD.ECIES}-${EncryptionTypes.METHOD.AES256_CBC}`
    ) {
      throw new Error(`Encryption method not supported: ${encryptionMethod}`);
    }

    let errorReason = '';
    // Try to decrypt the channelKey
    const channelKey = await Object.keys(keys || {}).reduce(
      async (decryptedChannelKeyPromise, identityMultiFormatted: string) => {
        let decryptedChannelKey = await decryptedChannelKeyPromise;
        if (keys && decryptedChannelKey === '') {
          // TODO: PROT-745 - need a library to serialize/de-serialize multi-format
          // Ignore what is not an identity Ethereum address
          if (Utils.multiFormat.isIdentityEthereumAddress(identityMultiFormatted)) {
            const identity: IdentityTypes.IIdentity = {
              type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
              value: `0x${Utils.multiFormat.removePadding(identityMultiFormatted)}`,
            };
            // Check if we can decrypt the key with this identity
            if (
              this.decryptionProvider &&
              (await this.decryptionProvider.isIdentityRegistered(identity))
            ) {
              try {
                decryptedChannelKey = await this.decryptionProvider.decrypt(
                  keys[identityMultiFormatted],
                  identity,
                );
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

    if (channelKey === '') {
      throw new Error(
        `Impossible to decrypt the channel key from this transaction (${errorReason})`,
      );
    }

    return {
      key: channelKey,
      method: EncryptionTypes.METHOD.AES256_CBC,
    };
  }
}
