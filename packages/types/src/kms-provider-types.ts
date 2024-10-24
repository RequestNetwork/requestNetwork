/**
 * A generic interface for Key Management Service (KMS) providers.
 */
export interface IKmsProvider {
  /**
   * Encrypts the given data.
   * @param data - The data to encrypt.
   * @param options - Any additional options required for encryption.
   * @returns A Promise that resolves to an object containing the encrypted data and any necessary metadata.
   */
  encrypt(data: any, options: any): Promise<any>;

  /**
   * Decrypts the given encrypted data.
   * @param encryptedData - The encrypted data to decrypt.
   * @param options - Any additional options required for decryption.
   * @returns A Promise that resolves to the decrypted data.
   */
  decrypt(encryptedData: any, options: any): Promise<any>;
}
