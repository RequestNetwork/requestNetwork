import { PrivateKey, PublicKey } from 'eciesjs';
import { secp256k1 } from '@noble/curves/secp256k1';
import { sha512 } from '@noble/hashes/sha2';
import { aes256cbc } from '@ecies/ciphers/aes';

export const ecDecryptLegacy = (privateKey: string, data: string): string => {
  const { iv, ciphertext, ephemPublicKey } = legacyAes256CbcMacSplit(data);
  const receiverPrivateKey = PrivateKey.fromHex(privateKey.replace(/^0x/, ''));
  const sharedKey = deriveSharedKeyWithSha512(receiverPrivateKey, ephemPublicKey, false);
  const decrypted = aes256cbc(sharedKey.slice(0, 32), iv).decrypt(ciphertext);
  return Buffer.from(decrypted).toString();
};

const deriveSharedKeyWithSha512 = (
  privateKey: PrivateKey,
  publicKey: PublicKey,
  compressed = false,
): Uint8Array => {
  const sharedPoint = secp256k1
    .getSharedSecret(privateKey.secret, publicKey.toBytes(compressed))
    .subarray(1);
  return new Uint8Array(sha512.create().update(sharedPoint).digest());
};

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
  const ephemPublicKey = new PublicKey(ephemPublicKeyStr);

  return {
    iv: Buffer.from(buf.toString('hex', 0, ivSize), 'hex'),
    mac: Buffer.from(buf.toString('hex', ephemPublicKeyEnd, macEnd), 'hex'),
    ciphertext: Buffer.from(buf.toString('hex', macEnd, buf.length), 'hex'),
    ephemPublicKey,
  };
};
