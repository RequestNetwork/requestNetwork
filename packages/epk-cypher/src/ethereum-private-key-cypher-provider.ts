import { CypherProviderTypes, EncryptionTypes, IdentityTypes } from '@requestnetwork/types';

import {
  decrypt,
  ecEncrypt,
  encryptWithAes256cbc,
  encryptWithAes256gcm,
  getAddressFromPrivateKey,
} from '@requestnetwork/utils';

/** Type of the dictionary of decryptionParameters (private keys) indexed by ethereum address */
type IDecryptionParametersDictionary = Map<string, EncryptionTypes.IDecryptionParameters>;

/**
 * Implementation of the decryption provider from private key
 * Allows to decrypt() with "ethereumAddress" identities thanks to their private key given in constructor() or addDecryptionParameters()
 */
export default class EthereumPrivateKeyCypherProvider
  implements CypherProviderTypes.ICypherProvider
{
  /** list of supported encryption method */
  public supportedMethods: EncryptionTypes.METHOD[] = [EncryptionTypes.METHOD.ECIES];
  /** list of supported identity types */
  public supportedIdentityTypes: IdentityTypes.TYPE[] = [IdentityTypes.TYPE.ETHEREUM_ADDRESS];

  /** Dictionary containing all the private keys indexed by address */
  private decryptionParametersDictionary: IDecryptionParametersDictionary;

  constructor(decryptionParameters?: EncryptionTypes.IDecryptionParameters) {
    this.decryptionParametersDictionary = new Map<string, EncryptionTypes.IDecryptionParameters>();
    if (decryptionParameters) {
      this.addDecryptionParameters(decryptionParameters);
    }
  }

  /**
   * Encrypts data
   *
   * @param data
   * @param options
   */
  public async encrypt(data: any, options: any): Promise<EncryptionTypes.IEncryptedData> {
    const encryptionParams = options.encryptionParams;

    if (encryptionParams.method === EncryptionTypes.METHOD.ECIES) {
      const encryptedData = await ecEncrypt(encryptionParams.key, data);
      return {
        type: EncryptionTypes.METHOD.ECIES,
        value: encryptedData,
      };
    }

    if (encryptionParams.method === EncryptionTypes.METHOD.AES256_CBC) {
      const encryptedDataBuffer = await encryptWithAes256cbc(
        Buffer.from(data, 'utf-8'),
        Buffer.from(encryptionParams.key, 'base64'),
      );
      return {
        type: EncryptionTypes.METHOD.AES256_CBC,
        value: encryptedDataBuffer.toString('base64'),
      };
    }

    if (encryptionParams.method === EncryptionTypes.METHOD.AES256_GCM) {
      const encryptedDataBuffer = await encryptWithAes256gcm(
        Buffer.from(data, 'utf-8'),
        Buffer.from(encryptionParams.key, 'base64'),
      );
      return {
        type: EncryptionTypes.METHOD.AES256_GCM,
        value: encryptedDataBuffer.toString('base64'),
      };
    }

    throw new Error('encryptionParams.method not supported');
  }

  /**
   * Decrypts data
   *
   * @param data the encrypted data
   * @param identity identity to decrypt with
   *
   * @returns the data decrypted
   */
  public async decrypt(
    encryptedData: EncryptionTypes.IEncryptedData,
    options: {
      identity: IdentityTypes.IIdentity;
    },
  ): Promise<string> {
    if (encryptedData.type !== EncryptionTypes.METHOD.ECIES) {
      throw Error(`The data must be encrypted with ${EncryptionTypes.METHOD.ECIES}`);
    }

    if (!this.supportedIdentityTypes.includes(options.identity.type)) {
      throw Error(`Identity type not supported ${options.identity.type}`);
    }

    // toLowerCase to avoid mismatch because of case
    const decryptionParameters: EncryptionTypes.IDecryptionParameters | undefined =
      this.decryptionParametersDictionary.get(options.identity.value.toLowerCase());

    if (!decryptionParameters) {
      throw Error(`private key unknown for the identity: ${options.identity.value}`);
    }

    return decrypt(encryptedData, decryptionParameters);
  }

  /**
   * Check if an identity is registered in the provider
   *
   * @param identity identity to check
   *
   * @returns true if the identity is registered, false otherwise
   */
  public async isIdentityRegistered(identity: IdentityTypes.IIdentity): Promise<boolean> {
    return Array.from(this.decryptionParametersDictionary.keys()).some(
      (address) => identity.value.toLowerCase() === address.toLowerCase(),
    );
  }

  /**
   * Adds a new private key in the provider
   *
   * @param decryptionParameters decryption parameters to add
   *
   * @returns identity from the decryption parameter added
   */
  public addDecryptionParameters(
    decryptionParameters: EncryptionTypes.IDecryptionParameters,
  ): IdentityTypes.IIdentity {
    if (!this.supportedMethods.includes(decryptionParameters.method)) {
      throw Error(`Encryption method not supported ${decryptionParameters.method}`);
    }

    // compute the address from private key
    // toLowerCase to avoid mismatch because of case
    const address = getAddressFromPrivateKey(decryptionParameters.key).toLowerCase();

    this.decryptionParametersDictionary.set(address, decryptionParameters);

    return {
      type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      value: address,
    };
  }

  /**
   * Removes a private key from the provider
   *
   * @param identity identity to remove the private key
   *
   * @returns void
   */
  public removeRegisteredIdentity(identity: IdentityTypes.IIdentity): void {
    // Check the type of the identity to be sure that the value used to delete will be the right type
    if (!this.supportedIdentityTypes.includes(identity.type)) {
      throw Error(`Identity type not supported ${identity.type}`);
    }

    this.decryptionParametersDictionary.delete(identity.value);
  }

  /**
   * Removes all private keys from the provider
   *
   * @param identity identity to remove the private key
   *
   * @returns void
   */
  public clearAllRegisteredIdentities(): void {
    this.decryptionParametersDictionary.clear();
  }

  /**
   * Gets all the identities available to decrypt with
   *
   * @returns all the identities registered
   */
  public getAllRegisteredIdentities(): IdentityTypes.IIdentity[] {
    return Array.from(this.decryptionParametersDictionary.keys(), (address) => ({
      type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      value: address,
    }));
  }
}
