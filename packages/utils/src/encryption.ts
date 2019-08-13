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
): Promise<any> {
  if (multiFormat.isEciesEncryption(encryptedData)) {
    if (decryptionParams.method !== EncryptionTypes.METHOD.ECIES) {
      throw new Error(`decryptionParams.method should be ${EncryptionTypes.METHOD.ECIES}`);
    }
    const data = await Crypto.EcUtils.decrypt(decryptionParams.key, encryptedData.slice(2));

    return JSON.parse(data);
  }

  throw new Error('encryptedData method not supported');
}
