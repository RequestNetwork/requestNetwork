import { randomBytes as cryptoRandomBytes } from 'crypto';

/**
 * Functions to manage native crypto functions of nodeJs
 */
export default {
  random32Bytes,
};

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
