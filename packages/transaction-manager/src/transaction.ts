import { EncryptionTypes, TransactionTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

/**
 * Function to manage Request logic transactions
 */
export default {
  createEncryptedTransaction,
  createTransaction,
};

/**
 * Creates a clear transaction
 *
 * @param data The data to add to the transaction
 * @returns the transaction
 */
function createTransaction(data: TransactionTypes.ITransactionData): TransactionTypes.ITransaction {
  return { data };
}

/**
 * Creates an encrypted transaction
 *
 * @param data The data to add to the transaction
 * @param encryptionParams Array of the encryption parameters to encrypt the key with
 * @returns the encrypted transaction
 */
async function createEncryptedTransaction(
  data: TransactionTypes.ITransactionData,
  encryptionParams: EncryptionTypes.IEncryptionParameters[],
): Promise<TransactionTypes.ITransaction> {
  // format encryption method attribute
  const encryptionMethod = `${EncryptionTypes.METHOD.ECIES}-${EncryptionTypes.METHOD.AES256_CBC}`;

  // Generate a key for the AES encryption
  const symmetricKey: string = await Utils.crypto.generate32BufferKey();

  // Encrypt the data with the key and the AES256-CBC algorithm
  const encryptedData: string = await Utils.encryption.encrypt(data, {
    key: symmetricKey,
    method: EncryptionTypes.METHOD.AES256_CBC,
  });

  // Compute the hash of the data
  const hash = Utils.crypto.normalizeKeccak256Hash(data);

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
    ): Promise<{ encryptedKey: string; multiFormattedIdentity: string }> => {
      const encryptedKey = await Utils.encryption.encrypt(symmetricKey, encryptionParam);
      const identityEncryption = Utils.encryption.getIdentityFromEncryptionParams(encryptionParam);
      const multiFormattedIdentity = Utils.multiFormat.formatIdentityEthereumAddress(
        identityEncryption.value,
      );

      return { encryptedKey, multiFormattedIdentity };
    },
  );
  const encryptedKeyAndIdentityHashes = await Promise.all(encryptedKeyAndIdentityHashesPromises);

  // Create the encrypted keys object - Encrypted keys indexed by identity multi-format
  const keys = encryptedKeyAndIdentityHashes.reduce(
    (
      allKeys: any,
      keyAndHash: { encryptedKey: string; multiFormattedIdentity: string },
    ): Promise<any> => {
      allKeys[keyAndHash.multiFormattedIdentity] = keyAndHash.encryptedKey;
      return allKeys;
    },
    {},
  );

  return { data: encryptedData, keys, hash, encryptionMethod };
}
