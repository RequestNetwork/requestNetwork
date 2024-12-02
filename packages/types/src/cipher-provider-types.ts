/**
 * A generic interface for Key Management Service (KMS) providers.
 */
export interface ICipherProvider {
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

  /**
   * Checks if encryption is available.
   * @returns A boolean indicating if encryption is available.
   */
  isEncryptionAvailable(): boolean;

  /**
   * Checks if decryption is available.
   * @returns A boolean indicating if decryption is available.
   */
  isDecryptionAvailable(): boolean;

  /**
   * Switches on/off decryption.
   * @param option - A boolean indicating if decryption should be switched on/off.
   */
  enableDecryption(option: boolean): void;

  /**
   * Checks if decryption is enabled.
   * @returns A boolean indicating if decryption is enabled.
   */
  isDecryptionEnabled(): boolean;
}
