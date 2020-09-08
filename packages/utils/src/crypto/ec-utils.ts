import EthCrypto from 'eth-crypto';

/**
 * Function to manage Elliptic-curve cryptography
 */
export default {
  decrypt,
  encrypt,
  getAddressFromPrivateKey,
  getAddressFromPublicKey,
  recover,
  sign,
};

/**
 * Function to derive the address from an EC private key
 *
 * @param privateKey the private key to derive
 *
 * @returns the address
 */
function getAddressFromPrivateKey(privateKey: string): string {
  try {
    const publicKey = EthCrypto.publicKeyByPrivateKey(privateKey);
    return EthCrypto.publicKey.toAddress(publicKey);
  } catch (e) {
    if (
      e.message === 'private key length is invalid' ||
      e.message === 'Expected private key to be an Uint8Array with length 32'
    ) {
      throw new Error('The private key must be a string representing 32 bytes');
    }
    throw e;
  }
}

/**
 * Function to derive the address from an EC public key
 *
 * @param publicKey the public key to derive
 *
 * @returns the address
 */
function getAddressFromPublicKey(publicKey: string): string {
  try {
    return EthCrypto.publicKey.toAddress(publicKey);
  } catch (e) {
    if (
      e.message === 'public key length is invalid' ||
      e.message === 'Expected public key to be an Uint8Array with length [33, 65]'
    ) {
      throw new Error('The public key must be a string representing 64 bytes');
    }
    throw e;
  }
}

/**
 * Function sign data with ECDSA
 *
 * @param data the data to sign
 *
 * @returns the signature
 */
function sign(privateKey: string, data: string): string {
  try {
    return EthCrypto.sign(privateKey, data);
  } catch (e) {
    if (
      e.message === 'private key length is invalid' ||
      e.message === 'Expected private key to be an Uint8Array with length 32'
    ) {
      throw new Error('The private key must be a string representing 32 bytes');
    }
    throw e;
  }
}

/**
 * Function to recover address from a signature
 *
 * @param signature the signature
 * @param data the data signed
 *
 * @returns the address
 */
function recover(signature: string, data: string): string {
  try {
    return EthCrypto.recover(signature, data);
  } catch (e) {
    if (
      e.message === 'signature length is invalid' ||
      e.message === 'Expected signature to be an Uint8Array with length 64'
    ) {
      throw new Error('The signature must be a string representing 66 bytes');
    }
    throw e;
  }
}

/**
 * Function to encrypt data with a public key
 *
 * @param publicKey the public key to encrypt with
 * @param data the data to encrypt
 *
 * @returns the encrypted data
 */
async function encrypt(publicKey: string, data: string): Promise<string> {
  try {
    // Encrypts the data with the publicKey, returns the encrypted data with encryption parameters (such as IV..)
    const encrypted = await EthCrypto.encryptWithPublicKey(publicKey, data);

    // Transforms the object with the encrypted data into a smaller string-representation.
    return EthCrypto.cipher.stringify(encrypted);
  } catch (e) {
    if (
      e.message === 'public key length is invalid' ||
      e.message === 'Expected public key to be an Uint8Array with length [33, 65]'
    ) {
      throw new Error('The public key must be a string representing 64 bytes');
    }
    throw e;
  }
}

/**
 * Function to decrypt data with a public key
 *
 * @param privateKey the private key to decrypt with
 * @param data the data to decrypt
 *
 * @returns the decrypted data
 */
async function decrypt(privateKey: string, encrypted: string): Promise<string> {
  try {
    return await EthCrypto.decryptWithPrivateKey(privateKey, EthCrypto.cipher.parse(encrypted));
  } catch (e) {
    if (
      e.message === 'Bad private key' ||
      e.message === 'Expected private key to be an Uint8Array with length 32'
    ) {
      throw new Error('The private key must be a string representing 32 bytes');
    }
    if (
      e.message === 'public key length is invalid' ||
      e.message === 'Expected public key to be an Uint8Array with length [33, 65]' ||
      e.message === 'Bad MAC' ||
      e.message === 'the public key could not be parsed or is invalid' ||
      e.message === 'Public Key could not be parsed'
    ) {
      throw new Error('The encrypted data is not well formatted');
    }
    throw e;
  }
}
