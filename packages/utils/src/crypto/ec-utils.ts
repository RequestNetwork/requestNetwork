import { publicKeyConvert, ecdsaRecover } from 'secp256k1';
import { ethers } from 'ethers';
// import { Ecies, decrypt, encrypt } from '@toruslabs/eccrypto';

import { decrypt, encrypt, ECIES_CONFIG } from 'eciesjs';

/**
 * Function to manage Elliptic-curve cryptography
 */
export {
  ecDecrypt,
  ecEncrypt,
  getAddressFromPrivateKey,
  getAddressFromPublicKey,
  ecRecover,
  ecSign,
};

ECIES_CONFIG.ellipticCurve = 'secp256k1';
ECIES_CONFIG.isEphemeralKeyCompressed = false;
ECIES_CONFIG.symmetricAlgorithm = 'aes-256-gcm';
ECIES_CONFIG.symmetricNonceLength = 16;

/**
 * Function to derive the address from an EC private key
 *
 * @param privateKey the private key to derive
 *
 * @returns the address
 */
function getAddressFromPrivateKey(privateKey: string): string {
  try {
    if (!privateKey.match(/^0x/)) {
      privateKey = `0x` + privateKey;
    }
    return ethers.utils.computeAddress(ethers.utils.hexlify(privateKey));
  } catch (e) {
    if (
      e.message === 'private key length is invalid' ||
      e.message === 'Expected private key to be an Uint8Array with length 32' ||
      e.code === 'INVALID_ARGUMENT'
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
    return ethers.utils.computeAddress(compressPublicKey(publicKey));
  } catch (e) {
    if (
      e.message === 'public key length is invalid' ||
      e.message === 'Expected public key to be an Uint8Array with length [33, 65]' ||
      e.code === 'INVALID_ARGUMENT'
    ) {
      throw new Error('The public key must be a string representing 64 bytes');
    }
    throw e;
  }
}

/**
 * Function ecSigndata with ECDSA
 *
 * @param data the data to sign
 *
 * @returns the signature
 */
function ecSign(privateKey: string, data: string): string {
  try {
    const signingKey = new ethers.utils.SigningKey(privateKey);
    return ethers.utils.joinSignature(signingKey.signDigest(data));
  } catch (e) {
    if (
      e.message === 'private key length is invalid' ||
      e.message === 'Expected private key to be an Uint8Array with length 32' ||
      e.code === 'INVALID_ARGUMENT'
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
function ecRecover(signature: string, data: string): string {
  try {
    signature = signature.replace(/^0x/, '');
    data = data.replace(/^0x/, '');
    // split into v-value and sig
    const sigOnly = signature.substring(0, signature.length - 2); // all but last 2 chars
    const vValue = signature.slice(-2); // last 2 chars

    const recoveryNumber = vValue === '1c' ? 1 : 0;

    return ethers.utils.computeAddress(
      Buffer.from(
        ecdsaRecover(
          new Uint8Array(Buffer.from(sigOnly, 'hex')),
          recoveryNumber,
          new Uint8Array(Buffer.from(data, 'hex')),
          false,
        ),
      ),
    );
  } catch (e) {
    if (
      e.message === 'signature length is invalid' ||
      e.message === 'Expected signature to be an Uint8Array with length 64' ||
      e.code === 'INVALID_ARGUMENT'
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
function ecEncrypt(publicKey: string, data: string): string {
  try {
    // encrypts the data with the publicKey, returns the encrypted data with encryption parameters (such as IV..)
    // const compressed = compressPublicKey(publicKey);
    // const encrypted = await encrypt(Buffer.from(compressed), Buffer.from(data));

    return encrypt(publicKey, Buffer.from(data)).toString('hex').slice(2);

    // Transforms the object with the encrypted data into a smaller string-representation.
    // return Buffer.concat([
    //   encrypted.iv,
    //   publicKeyConvert(encrypted.ephemPublicKey),
    //   encrypted.mac,
    //   encrypted.ciphertext,
    // ]).toString('hex');
  } catch (e) {
    if (e.message === 'second arg must be public key') {
      throw new Error('The public key must be a string representing 64 bytes');
    }
    throw e;
  }
}
//
// /**
//  * Function to encrypt data with a public key
//  *
//  * @param publicKey the public key to encrypt with
//  * @param data the data to encrypt
//  *
//  * @returns the encrypted data
//  */
// function ecEncrypt(publicKey: string, data: string): string {
//   try {
//     // encrypts the data with the publicKey, returns the encrypted data with encryption parameters (such as IV..)
//     return encrypt(publicKey, Buffer.from(data)).toString('hex');
//   } catch (e) {
//     if (
//       e.message === 'public key length is invalid' ||
//       e.message === 'Expected public key to be an Uint8Array with length [33, 65]'
//     ) {
//       throw new Error('The public key must be a string representing 64 bytes');
//     }
//     throw e;
//   }
// }

/**
 * Function to decrypt data with a public key
 *
 * @param privateKey the private key to decrypt with
 * @param data the data to decrypt
 *
 * @returns the decrypted data
 */
function ecDecrypt(privateKey: string, data: string): string {
  try {
    if (!data.startsWith('04')) {
      data = `04${data}`;
    }
    return decrypt(privateKey, Buffer.from(data, 'hex')).toString();
  } catch (e) {
    if (e.message === 'Invalid private key') {
      throw new Error('The private key must be a string representing 32 bytes');
    }
    if (e.message === 'second arg must be public key') {
      throw new Error('The encrypted data is not well formatted');
    }
    throw e;
  }
}

/**
 * Converts a public key to its compressed form.
 */
function compressPublicKey(publicKey: string): Uint8Array {
  publicKey = publicKey.replace(/^0x/, '');
  // if there are more bytes than the key itself, it means there is already a prefix
  if (publicKey.length % 32 === 0) {
    publicKey = `04${publicKey}`;
  }
  return publicKeyConvert(Buffer.from(publicKey, 'hex'));
}

/**
 * Split an encrypted string to ECIES params
 * inspired from https://github.com/pubkey/eth-crypto/blob/master/src/ecDecrypt-with-private-key.js
 */
// const eciesSplit = (str: string): Ecies => {
//   const buf = Buffer.from(str, 'hex');
//
//   const ephemPublicKeyStr = buf.toString('hex', 16, 49);
//
//   return {
//     iv: Buffer.from(buf.toString('hex', 0, 16), 'hex'),
//     mac: Buffer.from(buf.toString('hex', 49, 81), 'hex'),
//     ciphertext: Buffer.from(buf.toString('hex', 81, buf.length), 'hex'),
//     ephemPublicKey: Buffer.from(
//       publicKeyConvert(new Uint8Array(Buffer.from(ephemPublicKeyStr, 'hex')), false),
//     ),
//   };
// };
