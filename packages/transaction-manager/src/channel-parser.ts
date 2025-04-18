import {
  CipherProviderTypes,
  DecryptionProviderTypes,
  EncryptionTypes,
  TransactionTypes,
} from '@requestnetwork/types';

import TransactionsParser from './transactions-parser';

/**
 * Class to parse channels from a list of transactions and their channel id
 */
export default class ChannelParser {
  private transactionParser: TransactionsParser;
  private cipherProvider?: CipherProviderTypes.ICipherProvider;

  public constructor(
    decryptionProvider?: DecryptionProviderTypes.IDecryptionProvider,
    cipherProvider?: CipherProviderTypes.ICipherProvider,
  ) {
    this.transactionParser = new TransactionsParser(decryptionProvider, cipherProvider);
    this.cipherProvider = cipherProvider;
  }
  /**
   * Decrypts and cleans a channel by removing the wrong transactions
   *
   * @param channelId the channelId of the channel
   * @param transactions the transactions of the channel to decrypt and clean
   * @returns Promise resolving the kept transactions and the ignored ones with the reason
   */
  public async decryptAndCleanChannel(
    channelId: string,
    transactions: TransactionTypes.ITimestampedTransaction[],
  ): Promise<{
    encryptionMethod: string | undefined;
    transactions: Array<TransactionTypes.ITimestampedTransaction | null>;
    ignoredTransactions: Array<TransactionTypes.IIgnoredTransaction | null>;
  }> {
    let channelType: TransactionTypes.ChannelType = TransactionTypes.ChannelType.UNKNOWN;
    let encryptionMethod: string | undefined;
    interface IValidAndIgnoredTransactions {
      valid: TransactionTypes.ITimestampedTransaction | null;
      ignored: TransactionTypes.IIgnoredTransaction | null;
    }

    // Search for channel key
    const { channelKey } = await this.getChannelTypeAndChannelKey(channelId, transactions);

    // use of .reduce instead of .map to keep a sequential execution
    const validAndIgnoredTransactions: IValidAndIgnoredTransactions[] = await transactions.reduce(
      async (
        accumulatorPromise: Promise<IValidAndIgnoredTransactions[]>,
        timestampedTransaction: TransactionTypes.ITimestampedTransaction,
      ) => {
        const result = await accumulatorPromise;

        let parsedData;
        try {
          // Parse the transaction from data-access to get a transaction object and the channel key if encrypted
          parsedData = await this.transactionParser.parsePersistedTransaction(
            timestampedTransaction.transaction,
            channelType,
            channelKey,
            encryptionMethod,
          );
        } catch (error) {
          return result.concat([
            {
              ignored: {
                reason: error.message,
                transaction: timestampedTransaction,
              },
              valid: null,
            },
          ]);
        }

        const transaction: TransactionTypes.ITransaction = parsedData.transaction;

        // We check if the transaction is valid
        const error = await transaction.getError();
        if (error !== '') {
          return result.concat([
            {
              ignored: {
                reason: error,
                transaction: timestampedTransaction,
              },
              valid: null,
            },
          ]);
        }

        // If this is the first transaction, it removes the transaction if the hash is not the same as the channelId
        if (channelType === TransactionTypes.ChannelType.UNKNOWN) {
          const hash = await transaction.getHash();
          if (hash !== channelId) {
            return result.concat([
              {
                ignored: {
                  reason:
                    'as first transaction, the hash of the transaction do not match the channelId',
                  transaction: timestampedTransaction,
                },
                valid: null,
              },
            ]);
          }
          // from the first valid transaction, we can deduce the type of the channel
          channelType = parsedData.channelKey
            ? TransactionTypes.ChannelType.ENCRYPTED
            : TransactionTypes.ChannelType.CLEAR;

          encryptionMethod = parsedData.encryptionMethod;
        }

        const data = await transaction.getData();

        // add the decrypted transaction as valid
        return result.concat([
          {
            ignored: null,
            valid: {
              state: timestampedTransaction.state,
              timestamp: timestampedTransaction.timestamp,
              transaction: { data },
            },
          },
        ]);
      },
      Promise.resolve([]),
    );

    const ignoredTransactions: Array<TransactionTypes.IIgnoredTransaction | null> =
      validAndIgnoredTransactions.map((elem: any) => elem.ignored);

    const cleanTransactions: Array<TransactionTypes.ITimestampedTransaction | null> =
      validAndIgnoredTransactions.map((elem: any) => elem.valid);

    // The cleaned result
    return {
      encryptionMethod,
      ignoredTransactions,
      transactions: cleanTransactions,
    };
  }

  /**
   * Get channel type and channel key from a list of transactions (if applicable)
   *
   * @param _channelId the channelId of the channel
   * @param transactions the transactions of the channel to decrypt and clean
   * @returns Promise resolving the channel type and the channel key (if applicable)
   */
  public async getChannelTypeAndChannelKey(
    // TODO: Consider removing channelId argument
    _channelId: string,
    transactions: TransactionTypes.ITimestampedTransaction[],
  ): Promise<{
    channelType: TransactionTypes.ChannelType;
    channelKey: EncryptionTypes.IDecryptionParameters | undefined;
    encryptionMethod: string | undefined;
  }> {
    // use of .reduce instead of .map to keep a sequential execution
    const channelTypeAndKey: {
      channelType: TransactionTypes.ChannelType;
      channelKey: EncryptionTypes.IDecryptionParameters | undefined;
      encryptionMethod: string | undefined;
    } = await transactions.reduce(
      async (
        accumulatorPromise: Promise<{
          channelType: TransactionTypes.ChannelType;
          channelKey: EncryptionTypes.IDecryptionParameters | undefined;
          encryptionMethod: string | undefined;
        }>,
        timestampedTransaction: TransactionTypes.ITimestampedTransaction,
      ) => {
        const result = await accumulatorPromise;

        // Skip remaining transactions if channel is CLEAR or after channelKey is found
        if (result.channelType === TransactionTypes.ChannelType.CLEAR || result.channelKey) {
          return result;
        }

        let parsedData;
        try {
          // Parse the transaction from data-access to get a transaction object and the channel key if encrypted
          parsedData = await this.transactionParser.parsePersistedTransaction(
            timestampedTransaction.transaction,
            result.channelType,
            result.channelKey,
            result.encryptionMethod,
          );
        } catch (error) {
          // If the transaction is encrypted but the channel key is not found, save channelType and encryptionMethod
          if (
            error?.message?.startsWith(
              'Impossible to decrypt the channel key from this transaction',
            ) &&
            result.channelType === TransactionTypes.ChannelType.UNKNOWN
          ) {
            result.channelType = TransactionTypes.ChannelType.ENCRYPTED;
            result.encryptionMethod = timestampedTransaction.transaction.encryptionMethod;
          }

          // Error during the parsing, we just ignore this transaction
          return result;
        }

        const transaction: TransactionTypes.ITransaction = parsedData.transaction;

        // We check if the transaction is valid
        const error = await transaction.getError();
        if (error !== '') {
          // Error in the transaction, we just ignore it
          return result;
        }

        // We can deduce the type of the channel
        result.channelType = parsedData.channelKey
          ? TransactionTypes.ChannelType.ENCRYPTED
          : TransactionTypes.ChannelType.CLEAR;

        // we keep the channelKey for this channel
        result.channelKey = parsedData.channelKey;

        // we keep the encryption method for this channel
        result.encryptionMethod = parsedData.encryptionMethod;

        return result;
      },
      Promise.resolve({
        channelKey: undefined,
        channelType: TransactionTypes.ChannelType.UNKNOWN,
        encryptionMethod: undefined,
      }),
    );

    return channelTypeAndKey;
  }
}
