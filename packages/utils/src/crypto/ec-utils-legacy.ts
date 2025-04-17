import { PrivateKey, PublicKey } from 'eciesjs';
import { secp256k1 } from '@noble/curves/secp256k1';
import { sha256, sha512 } from '@noble/hashes/sha2';
import { aes256cbc } from '@ecies/ciphers/aes';
import { hmac } from '@noble/hashes/hmac';

/**
 * Decrypt the `eccrypto` way: using ECIES with AES-CBC-MAC and SHA-512 derivation.
 * Migrated from https://github.com/torusresearch/eccrypto/blob/923ebc03e5be016a7ee27a04d8c3b496ee949bfa/src/index.ts#L264
 * but using `@noble/curves` instead of `elliptics`
 */
export const ecDecryptLegacy = (privateKey: string, dataHex: string, padding = false): string => {
  const { iv, ephemPublicKey, mac, ciphertext } = legacyAes256CbcMacSplit(dataHex);
  const receiverPrivateKey = PrivateKey.fromHex(privateKey.replace(/^0x/, ''));
  const sharedKey = deriveSharedKeyWithSha512(receiverPrivateKey, ephemPublicKey, padding);
  const encryptionKey = sharedKey.subarray(0, 32);
  const macKey = sharedKey.subarray(32);
  const dataToMac = Buffer.concat([iv, ephemPublicKey.toBytes(false), ciphertext]);
  const macGood = hmacSha256Verify(macKey, dataToMac, mac);
  if (!macGood) {
    if (!padding) {
      return ecDecryptLegacy(privateKey, dataHex, true);
    }
    throw new Error('The encrypted data is not well formatted');
  }
  const decrypted = aes256cbc(encryptionKey, iv).decrypt(ciphertext);
  return Buffer.from(decrypted).toString();
};

const hmacSha256Verify = (key: Uint8Array, msg: Uint8Array, sig: Uint8Array): boolean => {
  const expectedSig = hmac(sha256, key, msg);
  return equalConstTime(expectedSig, sig);
};

// Compare two buffers in constant time to prevent timing attacks.
const equalConstTime = (b1: Uint8Array, b2: Uint8Array): boolean => {
  if (b1.length !== b2.length) {
    return false;
  }
  let res = 0;
  for (let i = 0; i < b1.length; i++) {
    res |= b1[i] ^ b2[i];
  }
  return res === 0;
};

const deriveSharedKeyWithSha512 = (
  privateKey: PrivateKey,
  publicKey: PublicKey,
  padding = false,
): Uint8Array => {
  const sharedPoint = secp256k1.getSharedSecret(privateKey.secret, publicKey.toBytes());
  const paddedBytes = padding ? sharedPoint.subarray(1) : sharedPoint.subarray(2);
  const hash = sha512.create().update(paddedBytes).digest();
  return new Uint8Array(hash);
};

/**
 * Split a legacy-encrypted hex string to its AES-CBC-MAC params.
 * See legacy way of generating an encrypted strings with the `@toruslabs/eccrypto` > `elliptic` library:
 * https://github.com/RequestNetwork/requestNetwork/blob/4597d373b0284787273471cf306dd9b849c9f76a/packages/utils/src/crypto/ec-utils.ts#L141
 */
const legacyAes256CbcMacSplit = (dataHex: string) => {
  const buffer = Buffer.from(dataHex, 'hex');

  const ivSize = 16;
  const ephemPublicKeySize = 33;
  const ephemPublicKeyEnd = ivSize + ephemPublicKeySize;
  const macSize = 32;
  const macEnd = ephemPublicKeyEnd + macSize;

  const ephemPublicKeyStr = buffer.subarray(ivSize, ephemPublicKeyEnd);
  const ephemPublicKey = new PublicKey(ephemPublicKeyStr);

  return {
    iv: buffer.subarray(0, ivSize),
    ephemPublicKey,
    mac: buffer.subarray(ephemPublicKeyEnd, macEnd),
    ciphertext: buffer.subarray(macEnd),
  };
};
