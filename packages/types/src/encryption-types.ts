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

/** Supported encryption methods */
export enum METHOD {
  ECIES = 'ecies',
  AES256_CBC = 'aes256-cbc',
}
