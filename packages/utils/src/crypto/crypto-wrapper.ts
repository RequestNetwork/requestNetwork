import { createCipheriv, createDecipheriv, randomBytes as cryptoRandomBytes } from 'crypto';

/**
 * Functions to manage native crypto functions of nodeJs
 */
export default {
  decryptWithAes256cbc,
  decryptWithAes256gcm,
  encryptWithAes256cbc,
  encryptWithAes256gcm,
  random32Bytes,
};

// Algorithm name used for aes256-cbc encryption with the package 'crypto'
const AES_256_CBC_ALGORITHM = 'aes-256-cbc';
// Algorithm name used for aes256-gcm encryption with the package 'crypto'
const AES_256_GCM_ALGORITHM = 'aes-256-gcm';

// Size of the initialization vector used for the aes256-cbc & aes256-gcm encryption
const INITIALIZATION_VECTOR_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

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
 * Encrypts a buffer using AES-256-gcm plus a random Initialization Vector (IV)
 *
 * @param data the data to encrypt
 * @param key the key that will be used for the encryption
 *
 * @returns Promise resolving a buffer containing the IV and the encrypted data
 */
async function encryptWithAes256gcm(data: Buffer, key: Buffer): Promise<Buffer> {
  // Generate randomly the Initialization Vector
  const iv = await randomBytes(INITIALIZATION_VECTOR_LENGTH);
  // Create the cipher object to encrypt data
  const cipher = createCipheriv(AES_256_GCM_ALGORITHM, key, iv);

  const encrypted = cipher.update(data);
  const final = cipher.final();
  const authTag = cipher.getAuthTag();

  // Concat the IV and the encrypted data, the call of final() makes the cipher not usable and flush the buffer
  return Buffer.concat([iv, authTag, encrypted, final]);
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
  // decipher.setAuthTag(authTag);

  // Return the buffer decrypted (the call of final() makes the decipher not usable and flush the buffer)
  return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
}

/**
 * Decrypts an encrypted buffer using AES-256-gcm plus a random Initialization Vector (IV)
 *
 * @param encrypted the data to decrypt
 * @param key key of the encryption
 *
 * @returns Promise resolving a buffer containing the data decrypted
 */
async function decryptWithAes256gcm(encryptedAndIv: Buffer, key: Buffer): Promise<Buffer> {
  // Get the IV
  const iv = encryptedAndIv.slice(0, INITIALIZATION_VECTOR_LENGTH);
  // Get the Auth tag
  const authTag = encryptedAndIv.slice(
    INITIALIZATION_VECTOR_LENGTH,
    INITIALIZATION_VECTOR_LENGTH + AUTH_TAG_LENGTH,
  );

  // Get the encrypted data itself
  const encryptedData = encryptedAndIv.slice(INITIALIZATION_VECTOR_LENGTH + AUTH_TAG_LENGTH);

  // Create the decipher object
  const decipher = createDecipheriv(AES_256_GCM_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

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
