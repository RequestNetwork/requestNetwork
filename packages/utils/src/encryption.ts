import { EncryptionTypes, IdentityTypes } from '@requestnetwork/types';
import Crypto from './crypto';

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
): Promise<EncryptionTypes.IEncryptedData> {
  if (encryptionParams.method === EncryptionTypes.METHOD.ECIES) {
    const encryptedData = await Crypto.EcUtils.encrypt(encryptionParams.key, data);
    return {
      type: EncryptionTypes.METHOD.ECIES,
      value: encryptedData,
    };
  }

  if (encryptionParams.method === EncryptionTypes.METHOD.AES256_CBC) {
    const encryptedDataBuffer = await Crypto.CryptoWrapper.encryptWithAes256cbc(
      Buffer.from(data, 'utf-8'),
      Buffer.from(encryptionParams.key, 'base64'),
    );
    return {
      type: EncryptionTypes.METHOD.AES256_CBC,
      value: encryptedDataBuffer.toString('base64'),
    };
  }

  if (encryptionParams.method === EncryptionTypes.METHOD.AES256_GCM) {
    const encryptedDataBuffer = await Crypto.CryptoWrapper.encryptWithAes256gcm(
      Buffer.from(data, 'utf-8'),
      Buffer.from(encryptionParams.key, 'base64'),
    );
    return {
      type: EncryptionTypes.METHOD.AES256_GCM,
      value: encryptedDataBuffer.toString('base64'),
    };
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
  encryptedData: EncryptionTypes.IEncryptedData,
  decryptionParams: EncryptionTypes.IDecryptionParameters,
): Promise<string> {
  if (encryptedData.type === EncryptionTypes.METHOD.ECIES) {
    if (decryptionParams.method !== EncryptionTypes.METHOD.ECIES) {
      throw new Error(`decryptionParams.method should be ${EncryptionTypes.METHOD.ECIES}`);
    }
    return Crypto.EcUtils.decrypt(decryptionParams.key, encryptedData.value);
  }

  if (encryptedData.type === EncryptionTypes.METHOD.AES256_CBC) {
    if (decryptionParams.method !== EncryptionTypes.METHOD.AES256_CBC) {
      throw new Error(`decryptionParams.method should be ${EncryptionTypes.METHOD.AES256_CBC}`);
    }
    const dataBuffer = await Crypto.CryptoWrapper.decryptWithAes256cbc(
      // remove the multi-format padding and decode from the base64 to a buffer
      Buffer.from(encryptedData.value, 'base64'),
      Buffer.from(decryptionParams.key, 'base64'),
    );
    return dataBuffer.toString();
  }

  if (encryptedData.type === EncryptionTypes.METHOD.AES256_GCM) {
    if (decryptionParams.method !== EncryptionTypes.METHOD.AES256_GCM) {
      throw new Error(`decryptionParams.method should be ${EncryptionTypes.METHOD.AES256_GCM}`);
    }

    const dataBuffer = await Crypto.CryptoWrapper.decryptWithAes256gcm(
      // remove the multi-format padding and decode from the base64 to a buffer
      Buffer.from(encryptedData.value, 'base64'),
      Buffer.from(decryptionParams.key, 'base64'),
    );
    return dataBuffer.toString();
  }

  throw new Error('encryptedData method not supported');
}
