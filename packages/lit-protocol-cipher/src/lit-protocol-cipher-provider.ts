import { CipherProviderTypes, DataAccessTypes, EncryptionTypes } from '@requestnetwork/types';
import { HttpDataAccess, NodeConnectionConfig } from '@requestnetwork/request-client.js';
import {
  SessionSigsMap,
  AccessControlConditions,
  EncryptResponse,
  AccsDefaultParams,
  AuthSig,
  AuthCallbackParams,
} from '@lit-protocol/types';
import {
  LitAccessControlConditionResource,
  createSiweMessage,
  generateAuthSig,
} from '@lit-protocol/auth-helpers';
import { Signer } from 'ethers';
import { LIT_ABILITY } from '@lit-protocol/constants';
import { disconnectWeb3 } from '@lit-protocol/lit-node-client';
import type { LitNodeClientNodeJs, LitNodeClient } from '@lit-protocol/lit-node-client';

/**
 * @class LitProtocolCipherProvider
 * @description A provider class that simplifies the usage of Lit Protocol for encryption and decryption.
 * This class can be used with both client-side and Node.js Lit clients.
 * It implements the `IKmsProvider` interface for a standardized KMS provider structure.
 */
export default class LitProtocolCipherProvider implements CipherProviderTypes.ICipherProvider {
  /**
   * @property {string} chain - The blockchain to use for access control conditions.
   */
  private chain: string;

  /**
   * @property {DataAccessTypes.IDataAccess} dataAccess - The data access layer for Request Network.
   */
  private dataAccess: DataAccessTypes.IDataAccess;

  /**
   * @property {SessionSigsMap|null} sessionSigs - The session signatures required for encryption and decryption.
   */
  private sessionSigs: SessionSigsMap | null = null;

  /**
   * @property {LitNodeClient|LitNodeClientNodeJs|null} client - The Lit Protocol client instance.
   */
  private litClient: LitNodeClient | LitNodeClientNodeJs;

  /**
   * @property {boolean} isDecryptionOn - A boolean indicating if decryption is enabled.
   */
  private decryptionEnabled = false;

  /**
   * @constructor
   * @param {LitNodeClient|LitNodeClientNodeJs} litClient - An instance of a Lit Protocol client (either client-side or Node.js).
   * @throws {Error} Throws an error if the provided Lit client is invalid.
   */
  constructor(
    litClient: LitNodeClient | LitNodeClientNodeJs,
    nodeConnectionConfig: NodeConnectionConfig,
    chain = 'ethereum',
  ) {
    this.litClient = litClient;
    this.chain = chain;
    this.dataAccess = new HttpDataAccess({ nodeConnectionConfig });
  }

  /**
   * @function initializeClient
   * @description Initializes the Lit client based on the environment.
   * @throws {Error} Throws an error if the environment is not supported.
   * @returns {Promise<void>}
   */
  public async initializeClient(): Promise<void> {
    try {
      await this.litClient?.connect();
    } catch (error) {
      throw new Error(`Failed to initialize Lit client: ${error.message}`);
    }
  }

  /**
   * @async
   * @function disconnectWallet
   * @description Disconnects wallet from the Lit network.
   */
  public async disconnectWallet(): Promise<void> {
    if (typeof window !== 'undefined') {
      disconnectWeb3();
    }
    this.sessionSigs = null;
  }

  /**
   * @async
   * @function disconnectClient
   * @description Disconnects the Lit client.
   * @returns {Promise<void>}
   */
  public async disconnectClient(): Promise<void> {
    if (this.litClient) {
      await this.litClient.disconnect();
    }
  }

  /**
   * @async
   * @function getSessionSignatures
   * @description Gets the session signatures required for encryption and decryption.
   * @param {any} signer - The signer object to use for generating the auth sig.
   * @param {string} walletAddress - The wallet address to use for generating the auth sig.
   * @returns {Promise<void>}
   */
  public async getSessionSignatures(signer: Signer, walletAddress: string): Promise<void> {
    if (!this.litClient) {
      throw new Error('Lit client not initialized');
    }
    if (this.sessionSigs) {
      return;
    }

    const capacityDelegationAuthSig: AuthSig = this.dataAccess.getLitCapacityDelegationAuthSig
      ? await this.dataAccess.getLitCapacityDelegationAuthSig(walletAddress)
      : ({} as AuthSig);

    // Get the latest blockhash
    const latestBlockhash = await this.litClient?.getLatestBlockhash();

    // Define the authNeededCallback function
    const authNeededCallback = async (params: AuthCallbackParams) => {
      if (!params.uri) {
        throw new Error('uri is required');
      }
      if (!params.expiration) {
        throw new Error('expiration is required');
      }

      if (!params.resourceAbilityRequests) {
        throw new Error('resourceAbilityRequests is required');
      }

      // Create the SIWE message
      const toSign = await createSiweMessage({
        uri: params.uri,
        expiration: params.expiration,
        resources: params.resourceAbilityRequests,
        walletAddress: walletAddress,
        nonce: latestBlockhash || '',
        litNodeClient: this.litClient,
      });

      // Generate the authSig
      const authSig = await generateAuthSig({
        signer: signer,
        toSign,
      });

      return authSig;
    };

    // Define the Lit resource
    const litResource = new LitAccessControlConditionResource('*');

    // Get the session signatures
    this.sessionSigs =
      (await this.litClient?.getSessionSigs({
        chain: this.chain,
        capabilityAuthSigs: [capacityDelegationAuthSig],
        resourceAbilityRequests: [
          {
            resource: litResource,
            ability: LIT_ABILITY.AccessControlConditionDecryption,
          },
        ],
        authNeededCallback,
      })) || {};
  }

  /**
   * @async
   * @function getLitAccessControlConditions
   * @description Gets the access control conditions required for Lit Protocol encryption and decryption.
   * @param {Array} encryptionParams - An array of encryption parameters.
   * @returns {Promise<AccessControlConditions>} An array of access control conditions.
   * @private
   */
  private async getLitAccessControlConditions(
    encryptionParams: EncryptionTypes.IEncryptionParameters[],
  ): Promise<AccessControlConditions> {
    if (encryptionParams.length === 0) {
      throw new Error('encryptionParams cannot be empty');
    }

    // Validate params and sort by key
    encryptionParams.forEach((param, index) => {
      if (!param.key)
        throw new Error(`Invalid encryption parameter at index ${index}: missing key`);
    });

    // Sort by key as lit protocol requires the keys to be in the same order for decryption and encryption
    encryptionParams.sort((a, b) => a.key.localeCompare(b.key));

    // Create base condition object
    const createCondition = (key: string) => ({
      contractAddress: '',
      standardContractType: '' as AccsDefaultParams['standardContractType'],
      chain: this.chain as AccsDefaultParams['chain'],
      method: '',
      parameters: [':userAddress'],
      returnValueTest: {
        comparator: '=' as AccsDefaultParams['returnValueTest']['comparator'],
        value: key,
      },
    });

    // Build conditions array with 'or' operators between each condition
    return encryptionParams.reduce((accessControlConditions, encryptionParam, index) => {
      if (index > 0) accessControlConditions.push({ operator: 'or' });
      accessControlConditions.push(createCondition(encryptionParam.key));
      return accessControlConditions;
    }, [] as AccessControlConditions);
  }

  /**
   * Switches on decryption
   *
   * @param option
   */
  public enableDecryption(option: boolean): void {
    this.decryptionEnabled = option;
  }

  /**
   * Checks if decryption is enabled.
   * @returns A boolean indicating if decryption is enabled.
   */
  public isDecryptionEnabled(): boolean {
    return this.decryptionEnabled;
  }

  /**
   * @function isEncryptionAvailable
   * @description Checks if encryption is available.
   * @returns {boolean} A boolean indicating if encryption is available.
   */
  public isEncryptionAvailable(): boolean {
    return this.litClient !== undefined;
  }

  /**
   * @async
   * @function encrypt
   * @description Encrypts data using Lit Protocol with a randomly generated AES key.
   * @param {string|object} data - The data to encrypt. Can be a string or an object.
   * @param {object} options - Encryption options.
   * @param {Array} options.accessControlConditions - An array of access control conditions that define who can decrypt the data.
   * @param {string} [options.chain="ethereum"] - The blockchain to use for access control conditions.
   * @returns {Promise<EncryptResponse>} The encrypted data.
   */
  public async encrypt(
    data: string | { [key: string]: any },
    options: {
      encryptionParams: EncryptionTypes.IEncryptionParameters[];
    },
  ): Promise<EncryptResponse | null> {
    if (!this.litClient) {
      throw new Error('Lit client not initialized');
    }

    const stringifiedData = typeof data === 'string' ? data : JSON.stringify(data);

    const accessControlConditions = await this.getLitAccessControlConditions(
      options.encryptionParams,
    );

    return await this.litClient.encrypt({
      accessControlConditions: accessControlConditions,
      dataToEncrypt: new TextEncoder().encode(stringifiedData),
    });
  }

  /**
   * @function isDecryptionAvailable
   * @description Checks if decryption is available.
   * @returns {boolean} A boolean indicating if decryption is available.
   */
  public isDecryptionAvailable(): boolean {
    return this.litClient && this.sessionSigs !== null && this.decryptionEnabled;
  }

  /**
   * @async
   * @function decrypt
   * @description Decrypts data that was encrypted using the `encrypt` method.
   * @param {string} encryptedData - The encrypted data to decrypt.
   * @param {object} options - Decryption options.
   * @param {Uint8Array} options.encryptedSymmetricKey - The encrypted symmetric key.
   * @param {Array} options.accessControlConditions - An array of access control conditions that define who can decrypt the data.
   * @param {string} [options.chain="ethereum"] - The blockchain to use for access control conditions.
   * @returns {Promise<string>} The decrypted data as a string.
   */
  public async decrypt(
    encryptedData: EncryptResponse,
    options: {
      encryptionParams: EncryptionTypes.IEncryptionParameters[];
    },
  ): Promise<string | null> {
    if (!this.litClient) {
      throw new Error('Lit client not initialized');
    }

    if (!this.sessionSigs) {
      throw new Error('Session signatures are required to decrypt data');
    }

    const accessControlConditions = await this.getLitAccessControlConditions(
      options.encryptionParams,
    );

    const { decryptedData } = await this.litClient.decrypt({
      accessControlConditions: accessControlConditions,
      chain: this.chain,
      ciphertext: encryptedData.ciphertext,
      dataToEncryptHash: encryptedData.dataToEncryptHash,
      sessionSigs: this.sessionSigs,
    });
    return new TextDecoder().decode(decryptedData);
  }
}
