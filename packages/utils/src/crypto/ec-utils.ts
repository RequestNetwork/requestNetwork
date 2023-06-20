import { hexToNumber, isHex, toHex, padHex } from 'viem';
import { privateKeyToAccount, publicKeyToAddress } from 'viem/accounts';
import { secp256k1 } from '@noble/curves/secp256k1';
import { Ecies, decrypt, encrypt } from '@toruslabs/eccrypto';
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

/**
 * Function to derive the address from an EC private key
 *
 * @param privateKey the private key to derive
 *
 * @returns the address
 */
function getAddressFromPrivateKey(privateKey: string): string {
  if (isHex(privateKey)) {
    return privateKeyToAccount(privateKey).address;
  }
  return privateKeyToAccount(`0x${privateKey}`).address;
}

/**
 * Function to derive the address from an EC public key
 *
 * @param publicKey the public key to derive
 *
 * @returns the address
 */
function getAddressFromPublicKey(publicKey: string): string {
  const normalizedPublicKey = padHex(isHex(publicKey) ? publicKey : `0x${publicKey}`, { size: 65 });
  return publicKeyToAddress(normalizedPublicKey);
}

/**
 * Function ecSigndata with ECDSA
 *
 * @param data the data to sign
 *
 * @returns the signature
 */
function ecSign(privateKey: string, message: string): string {
  // NB: viem doesn't expose the "raw" sign method, only abstractions (signMessage...)
  // so this code copies the behaviour
  // https://github.com/wagmi-dev/viem/blob/7bf9189b03f75a56d8435ffe33c2d16ccfdec137/src/accounts/utils/sign.ts
  const { r, s, recovery } = secp256k1.sign(message.slice(2), privateKey.slice(2));
  const signature = new secp256k1.Signature(r, s).toCompactHex();
  const suffix = toHex(recovery ? 28n : 27n).slice(2);
  return `0x${signature}${suffix}`;
}

/**
 * Function to recover address from a signature
 *
 *
 * @param signature the signature
 * @param data the data signed
 *
 * @returns the address
 */
function ecRecover(signature: string, hash: string): string {
  /*
   * This function is a copy from viem's recoverPublicKey method
   * When using recoverPublicKey, the code crashes with Segmentation fault.
   * This might be due to the dynamic import of the secp256k1 module
   */

  const signatureHex = isHex(signature) ? signature : toHex(signature);

  if (signatureHex.length !== 132) {
    throw new Error('The signature must be a string representing 66 bytes');
  }

  const hashHex = isHex(hash) ? hash : toHex(hash);

  // Derive v = recoveryId + 27 from end of the signature (27 is added when signing the message)
  // The recoveryId represents the y-coordinate on the secp256k1 elliptic curve and can have a value [0, 1].
  let v = hexToNumber(`0x${signatureHex.slice(130)}`);
  if (v === 0 || v === 1) v += 27;

  const publicKey = secp256k1.Signature.fromCompact(signatureHex.substring(2, 130))
    .addRecoveryBit(v - 27)
    .recoverPublicKey(hashHex.substring(2))
    .toHex(false);
  return publicKeyToAddress(`0x${publicKey}`);
}

/**
 * Function to encrypt data with a public key
 *
 * @param publicKey the public key to encrypt with
 * @param data the data to encrypt
 *
 * @returns the encrypted data
 */
async function ecEncrypt(publicKey: string, data: string): Promise<string> {
  try {
    // encrypts the data with the publicKey, returns the encrypted data with encryption parameters (such as IV..)
    const uncompressedPublicKey = uncompressPublicKey(publicKey);

    const encrypted = await encrypt(Buffer.from(uncompressedPublicKey), Buffer.from(data));

    const ephemCompressedPublicKey = compressPublicKey(encrypted.ephemPublicKey);

    // Transforms the object with the encrypted data into a smaller string-representation.
    return Buffer.concat([
      encrypted.iv,
      ephemCompressedPublicKey,
      encrypted.mac,
      encrypted.ciphertext,
    ]).toString('hex');
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
async function ecDecrypt(privateKey: string, data: string): Promise<string> {
  try {
    const buf = await decrypt(Buffer.from(privateKey.replace(/^0x/, ''), 'hex'), eciesSplit(data));
    return buf.toString();
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
      e.message === 'bad MAC after trying padded' ||
      e.message === 'the public key could not be parsed or is invalid' ||
      e.message === 'Public Key could not be parsed'
    ) {
      throw new Error('The encrypted data is not well formatted');
    }
    throw e;
  }
}

/**
 * Converts a public key to its compressed form.
 */
function uncompressPublicKey(publicKey: string): Uint8Array {
  publicKey = publicKey.replace(/^0x/, '');
  // if there are more bytes than the key itself, it means there is already a prefix
  if (publicKey.length % 32 === 0) {
    publicKey = `04${publicKey}`;
  }
  // return publicKeyConvert(Buffer.from(publicKey, 'hex'));
  return secp256k1.ProjectivePoint.fromHex(publicKey).toRawBytes(false);
}

function compressPublicKey(publicKey: Buffer): Uint8Array {
  return secp256k1.ProjectivePoint.fromHex(publicKey).toRawBytes(true);
}

/**
 * Split an encrypted string to ECIES params
 * inspired from https://github.com/pubkey/eth-crypto/blob/master/src/ecDecrypt-with-private-key.js
 */
const eciesSplit = (str: string): Ecies => {
  const buf = Buffer.from(str, 'hex');

  const ephemPublicKeyStr = buf.toString('hex', 16, 49);

  return {
    iv: Buffer.from(buf.toString('hex', 0, 16), 'hex'),
    mac: Buffer.from(buf.toString('hex', 49, 81), 'hex'),
    ciphertext: Buffer.from(buf.toString('hex', 81, buf.length), 'hex'),
    ephemPublicKey: Buffer.from(uncompressPublicKey(ephemPublicKeyStr)),
  };
};
