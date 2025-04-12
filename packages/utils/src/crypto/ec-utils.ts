import { ethers } from 'ethers';

import { decrypt, ECIES_CONFIG, encrypt, PrivateKey, PublicKey } from 'eciesjs';
import { secp256k1 } from '@noble/curves/secp256k1';
import { computeAddress } from 'ethers/lib/utils';
import { createHash } from 'node:crypto';
import { concatBytes } from '@noble/curves/abstract/utils';
import * as console from 'node:console';
import { aes256cbc } from '@ecies/ciphers/aes';

/**
 * Function to manage Elliptic-curve cryptography
 */
export {
  ecDecrypt,
  ecDecryptLegacy,
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
 * @param publicKeyHex the public key to derive
 *
 * @returns the address
 */
function getAddressFromPublicKey(publicKeyHex: string): string {
  try {
    return ethers.utils.computeAddress(`0x${PublicKey.fromHex(publicKeyHex).toHex(true)}`);
  } catch (e) {
    if (e.code === 'INVALID_ARGUMENT' || e.message === 'second arg must be public key') {
      throw new Error('The public key must be a string representing 64 bytes');
    }
    throw e;
  }
}

/**
 * Function ecSign data with ECDSA
 *
 * @param privateKey the private key used to sign the message
 * @param dataHash the data to sign
 *
 * @returns the signature
 */
function ecSign(privateKey: string, dataHash: string): string {
  try {
    privateKey = privateKey.replace(/^0x/, '');
    dataHash = dataHash.replace(/^0x/, '');
    return `0x${secp256k1.sign(dataHash, privateKey).toCompactHex()}1b`;
  } catch (e) {
    if (e.message === 'invalid private key, expected hex or 32 bytes, got string') {
      throw new Error('The private key must be a string representing 32 bytes');
    }
    throw e;
  }
}

/**
 * Function to recover address from a signature
 *
 * @param signatureHex the signature
 * @param dataHash the data signed
 *
 * @returns the address
 */
function ecRecover(signatureHex: string, dataHash: string): string {
  try {
    signatureHex = signatureHex.replace(/^0x/, '');
    dataHash = dataHash.replace(/^0x/, '');

    const sigOnly = signatureHex.substring(0, signatureHex.length - 2); // all but last 2 chars
    const vValue = signatureHex.slice(-2); // last 2 chars
    const recoveryNumber = vValue === '1c' ? 1 : 0;

    const signature = secp256k1.Signature.fromCompact(sigOnly);
    const signatureRecover = signature.addRecoveryBit(recoveryNumber);
    return computeAddress(`0x${signatureRecover.recoverPublicKey(dataHash).toHex()}`);
  } catch (e) {
    if (e.message === 'compactSignature of length 64 expected, got 0') {
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
    return encrypt(publicKey, Buffer.from(data)).toString('hex').slice(2);
  } catch (e) {
    if (e.message === 'second arg must be public key') {
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
function ecDecrypt(privateKey: string, data: string): string {
  try {
    if (!data.startsWith('04')) {
      data = `04${data}`;
    }
    return decrypt(privateKey.replace(/^0x/, ''), Buffer.from(data, 'hex')).toString();
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

function ecDecryptLegacy(privateKey: string, data: string): string {
  const { iv, mac, ciphertext, ephemPublicKey } = legacyAes256CbcMacSplit(data);
  console.log(new Uint8Array(mac));

  const receiverPrivateKey = PrivateKey.fromHex(privateKey.replace(/^0x/, ''));

  const sharedKey = ephemPublicKey.decapsulate(receiverPrivateKey);
  console.log('shared', sharedKey);
  return aes256cbc(sharedKey, iv).decrypt(ciphertext).toString();
}

class PublicKeyWithSha512Derivation extends PublicKey {
  public decapsulate(sk: PrivateKey, compressed = false): Uint8Array {
    const senderPoint = this.toBytes(compressed);
    const sharedPoint = sk.multiply(this, compressed);
    const px = concatBytes(senderPoint, sharedPoint).subarray(0, 32);
    console.log('px', Buffer.from(px));
    return this.sha512(px);
  }

  private sha512(content: Uint8Array): Uint8Array {
    return new Uint8Array(createHash('sha512').update(content).digest());
  }
}

/**
 * Split a legacy-encrypted string to its AES-CDC-MAC params.
 * See legacy way of generating an encrypted strings with the `@toruslabs/eccrypto` > `elliptic` library:
 * https://github.com/RequestNetwork/requestNetwork/blob/4597d373b0284787273471cf306dd9b849c9f76a/packages/utils/src/crypto/ec-utils.ts#L141
 */
const legacyAes256CbcMacSplit = (str: string) => {
  const buf = Buffer.from(str, 'hex');

  const ivSize = 16;
  const ephemPublicKeySize = 33;
  const ephemPublicKeyEnd = ivSize + ephemPublicKeySize;
  const macSize = 32;
  const macEnd = ephemPublicKeyEnd + macSize;

  const ephemPublicKeyStr = buf.subarray(ivSize, ephemPublicKeyEnd);
  const ephemPublicKey = new PublicKeyWithSha512Derivation(ephemPublicKeyStr);

  return {
    iv: Buffer.from(buf.toString('hex', 0, ivSize), 'hex'),
    mac: Buffer.from(buf.toString('hex', ephemPublicKeyEnd, macEnd), 'hex'),
    ciphertext: Buffer.from(buf.toString('hex', macEnd, buf.length), 'hex'),
    ephemPublicKey,
  };
};
