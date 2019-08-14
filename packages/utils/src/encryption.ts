import { EncryptionTypes, IdentityTypes } from '@requestnetwork/types';
import Crypto from './crypto';
import multiFormat from './multi-format';

/**
 * Functions to manage encryption
 */
export default {
  decrypt,
  encrypt,
  getIdentityFromEncryptionParams,
};

/**
 * Function to get the identity from the encryption parameters
 *
 * @param encryptionParams encryption parameters
 *
 * @returns the identity behind the encryption parameters
 */
function getIdentityFromEncryptionParams(
  encryptionParams: EncryptionTypes.IEncryptionParameters,
): IdentityTypes.IIdentity {
  if (encryptionParams.method === EncryptionTypes.METHOD.ECIES) {
    return {
      type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      value: Crypto.EcUtils.getAddressFromPublicKey(encryptionParams.key),
    };
  }

  throw new Error('encryptionParams.method not supported');
}

/**
 * Encrypts data using encryption parameters
 *
 * @param data the data to sign
 * @param encryptionParams Encryption parameters
 * @returns the encrypted data
 */
async function encrypt(
  data: string,
  encryptionParams: EncryptionTypes.IEncryptionParameters,
): Promise<string> {
  if (encryptionParams.method === EncryptionTypes.METHOD.ECIES) {
    const encryptedData = await Crypto.EcUtils.encrypt(encryptionParams.key, data);
    return multiFormat.formatEciesEncryption(encryptedData);
  }

  if (encryptionParams.method === EncryptionTypes.METHOD.AES256_CBC) {
    const encryptedDataBuffer = await Crypto.CryptoWrapper.encryptWithAes256cbc(
      Buffer.from(data, 'utf-8'),
      Buffer.from(encryptionParams.key, 'base64'),
    );
    return multiFormat.formatAes256cbcEncryption(encryptedDataBuffer.toString('Base64'));
  }

  throw new Error('encryptionParams.method not supported');
}

/**
 * Decrypt data using decryption parameters
 *
 * IMPORTANT: This must be used for test purpose only. An decryption provider must be used in production.
 *
 * @param encryptedData the encrypted data
 * @param key the decryption parameters
 * @returns the decrypted data
 */
async function decrypt(
  encryptedData: string,
  decryptionParams: EncryptionTypes.IDecryptionParameters,
): Promise<string> {
  if (multiFormat.isEciesEncryption(encryptedData)) {
    if (decryptionParams.method !== EncryptionTypes.METHOD.ECIES) {
      throw new Error(`decryptionParams.method should be ${EncryptionTypes.METHOD.ECIES}`);
    }
    return Crypto.EcUtils.decrypt(decryptionParams.key, encryptedData.slice(2));
  }

  if (multiFormat.isAes256cbcEncryption(encryptedData)) {
    if (decryptionParams.method !== EncryptionTypes.METHOD.AES256_CBC) {
      throw new Error(`decryptionParams.method should be ${EncryptionTypes.METHOD.AES256_CBC}`);
    }
    const dataBuffer = await Crypto.CryptoWrapper.decryptWithAes256cbc(
      // remove the multi-format padding and decode from the base64 to a buffer
      Buffer.from(multiFormat.removePadding(encryptedData), 'base64'),
      Buffer.from(decryptionParams.key, 'base64'),
    );
    return dataBuffer.toString();
  }

  throw new Error('encryptedData method not supported');
}
