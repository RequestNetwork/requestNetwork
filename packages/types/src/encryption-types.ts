import { EnumToType } from './shared';

/** Parameters needed to encrypt */
export interface IEncryptionParameters {
  // method of the encryption
  method: METHOD;
  // value used to encrypt
  key: string;
}

/** Parameters needed to decrypt */
export interface IDecryptionParameters {
  // method of the decryption
  method: METHOD;
  // value used to decrypt
  key: string;
}

/** Encrypted data */
export interface IEncryptedData {
  // type of the encrypted data
  type: METHOD;
  // the encryptedData itself
  value: string;
}

export const METHOD = {
  ECIES: 'ecies',
  AES256_CBC: 'aes256-cbc',
  AES256_GCM: 'aes256-gcm',
} as const;

/** Supported encryption methods */
export type METHOD = EnumToType<typeof METHOD>;
