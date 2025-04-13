import { decrypt, ECIES_CONFIG, encrypt, PublicKey } from 'eciesjs';
import { secp256k1 } from '@noble/curves/secp256k1';
import { computeAddress, hexlify } from 'ethers/lib/utils';
import { ecDecryptLegacy } from './ec-utils-legacy';

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
    return computeAddress(hexlify(privateKey));
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
    return computeAddress(`0x${PublicKey.fromHex(publicKeyHex).toHex(true)}`);
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
 * @param data the data to sign
 *
 * @returns the signature
 */
function ecSign(privateKey: string, data: string): string {
  try {
    const privateKeyHex = privateKey.replace(/^0x/, '');
    const dataHex = data.replace(/^0x/, '');
    const signature = secp256k1.sign(dataHex, privateKeyHex);
    return `0x${signature.toCompactHex()}${signature.recovery ? '1c' : '1b'}`;
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
 * @param signature the signature
 * @param data the data signed
 *
 * @returns the address
 */
function ecRecover(signature: string, data: string): string {
  try {
    const signatureHex = signature.replace(/^0x/, '');
    data = data.replace(/^0x/, '');

    const sigOnly = signatureHex.substring(0, signatureHex.length - 2); // all but last 2 chars
    const vValue = signatureHex.slice(-2); // last 2 chars
    const recoveryNumber = vValue === '1c' ? 1 : 0;

    const signatureObj = secp256k1.Signature.fromCompact(sigOnly);
    const signatureRecover = signatureObj.addRecoveryBit(recoveryNumber);
    return computeAddress(`0x${signatureRecover.recoverPublicKey(data).toHex()}`);
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
    const paddedData = data.startsWith('04') ? data : `04${data}`;
    return decrypt(privateKey.replace(/^0x/, ''), Buffer.from(paddedData, 'hex')).toString();
  } catch (e) {
    if (e.message === 'bad point: equation left != right') {
      return ecDecryptLegacy(privateKey, data);
    }
    if (e.message === 'Invalid private key') {
      throw new Error('The private key must be a string representing 32 bytes');
    }
    if (e.message === 'second arg must be public key') {
      throw new Error('The encrypted data is not well formatted');
    }
    throw e;
  }
}
