import { createCipheriv, createDecipheriv, randomBytes as cryptoRandomBytes } from 'crypto';

/**
 * Functions to manage native crypto functions of nodeJs
 */
export default {
  decryptWithAes256cbc,
  encryptWithAes256cbc,
  random32Bytes,
};

// Algorithm name used for aes256-cbc encryption with the package 'crypto'
const AES_256_CBC_ALGORITHM = 'aes-256-cbc';

// Size of the initialization vector used for the aes256-cbc encryption
const INITIALIZATION_VECTOR_LENGTH = 16;

/**
 * Generates 32 cryptographically strong pseudo-random bytes
 *
 * @returns Promise resolving the 32 bytes generated
 */
async function random32Bytes(): Promise<Buffer> {
  // tslint:disable-next-line:no-magic-numbers
  return randomBytes(32);
}

/**
 * Encrypts a buffer using AES-256-cbc plus a random Initialization Vector (IV)
 *
 * @param data the data to encrypt
 * @param key the key that will be used for the encryption
 *
 * @returns Promise resolving a buffer containing the IV and the encrypted data
 */
async function encryptWithAes256cbc(data: Buffer, key: Buffer): Promise<Buffer> {
  // Generate randomly the Initialization Vector
  const iv = await randomBytes(INITIALIZATION_VECTOR_LENGTH);

  // Create the cipher object to encrypt data
  const cipher = createCipheriv(AES_256_CBC_ALGORITHM, key, iv);

  // Encrypt data
  const encrypted = cipher.update(data);

  // Concat the IV and the encrypted data, the call of final() makes the cipher not usable and flush the buffer
  return Buffer.concat([iv, encrypted, cipher.final()]);
}

/**
 * Decrypts an encrypted buffer using AES-256-cbc plus a random Initialization Vector (IV)
 *
 * @param encrypted the data to decrypt
 * @param key key of the encryption
 *
 * @returns Promise resolving a buffer containing the data decrypted
 */
async function decryptWithAes256cbc(encryptedAndIv: Buffer, key: Buffer): Promise<Buffer> {
  // Get the IV
  const iv = encryptedAndIv.slice(0, INITIALIZATION_VECTOR_LENGTH);
  // Get the encrypted data itself
  const encryptedData = encryptedAndIv.slice(INITIALIZATION_VECTOR_LENGTH);

  // Create the decipher object
  const decipher = createDecipheriv(AES_256_CBC_ALGORITHM, key, iv);

  // Return the buffer decrypted (the call of final() makes the decipher not usable and flush the buffer)
  return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
}

/**
 * Generates N cryptographically strong pseudo-random bytes
 *
 * @param n the number of bytes to generate
 *
 * @returns Promise resolving the N bytes generated
 */
async function randomBytes(n: number): Promise<Buffer> {
  return new Promise(
    (resolve, reject): any => {
      cryptoRandomBytes(n, (error, buffer) => {
        if (error) {
          return reject(`Error generating random bytes: ${error}`);
        }
        return resolve(buffer);
      });
    },
  );
}
