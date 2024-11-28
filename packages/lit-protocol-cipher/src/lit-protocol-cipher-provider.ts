import * as LitJsSdk from '@lit-protocol/lit-node-client';
import { CipherProviderTypes, DataAccessTypes, EncryptionTypes } from '@requestnetwork/types';
import { HttpDataAccess, NodeConnectionConfig } from '@requestnetwork/request-client.js';
import {
  SessionSigsMap,
  AccessControlConditions,
  EncryptResponse,
  AccsDefaultParams,
  AuthSig,
  LIT_NETWORKS_KEYS,
  AuthCallbackParams,
} from '@lit-protocol/types';
import {
  LitAccessControlConditionResource,
  createSiweMessageWithRecaps,
  generateAuthSig,
} from '@lit-protocol/auth-helpers';
import { disconnectWeb3 } from '@lit-protocol/auth-browser';
import { Signer } from 'ethers';
import { LIT_ABILITY } from '@lit-protocol/constants';
import { decryptToString, encryptString } from '@lit-protocol/encryption';

/**
 * @class LitProvider
 * @description A provider class that simplifies the usage of Lit Protocol for encryption and decryption.
 * This class can be used with both client-side and Node.js Lit clients.
 * It implements the `IKmsProvider` interface for a standardized KMS provider structure.
 */
export default class LitProvider implements CipherProviderTypes.ICipherProvider {
  /**
   * @property {string} chain - The blockchain to use for access control conditions.
   */
  private chain: string;

  /**
   * @property {string} network - The network to use for access control conditions.
   */
  private network: LIT_NETWORKS_KEYS;

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
  private client: LitJsSdk.LitNodeClient | LitJsSdk.LitNodeClientNodeJs | null = null;

  /**
   * @property {any} storageProvider - The storage provider for the Node.js Lit client.
   */
  private storageProvider: any;

  /**
   * @constructor
   * @param {LitNodeClient|LitNodeClientNodeJs} litClient - An instance of a Lit Protocol client (either client-side or Node.js).
   * @throws {Error} Throws an error if the provided Lit client is invalid.
   */
  constructor(
    chain: string,
    network: LIT_NETWORKS_KEYS,
    nodeConnectionConfig: NodeConnectionConfig,
  ) {
    this.chain = chain;
    this.network = network;
    this.dataAccess = new HttpDataAccess({ nodeConnectionConfig });
    void this.initializeClient();
  }

  /**
   * @function initializeClient
   * @description Initializes the Lit client based on the environment.
   * @returns {LitNodeClient|LitNodeClientNodeJs} A Lit Protocol client instance.
   * @throws {Error} Throws an error if the environment is not supported.
   * @private
   */
  private async initializeClient() {
    try {
      // Using process.browser instead of typeof window
      if (typeof window !== 'undefined') {
        this.client = new LitJsSdk.LitNodeClient({
          litNetwork: this.network,
        });
        await this.client.connect();
      } else {
        // Evaluate the code in a way that prevents static analysis
        const getNodeStorage = new Function(
          'require',
          `
          const { LocalStorage } = require('node-localstorage');
          return new LocalStorage('./request-network-lit-protocol-cipher');
        `,
        );

        const localStorage = getNodeStorage(require);

        this.storageProvider = {
          getItem: (key: string) => localStorage.getItem(key),
          setItem: (key: string, value: string) => localStorage.setItem(key, value),
          removeItem: (key: string) => localStorage.removeItem(key),
          clear: () => localStorage.clear(),
          provider: localStorage,
        };

        this.client = new LitJsSdk.LitNodeClientNodeJs({
          litNetwork: this.network,
          storageProvider: this.storageProvider,
        });

        await this.client.connect();
      }
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
    this.storageProvider.clear();
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
    if (!this.client) {
      throw new Error('Lit client not initialized');
    }
    if (this.sessionSigs) {
      return;
    }

    const capacityDelegationAuthSig: AuthSig = this.dataAccess.getLitCapacityDelegationAuthSig
      ? await this.dataAccess.getLitCapacityDelegationAuthSig(walletAddress)
      : ({} as AuthSig);

    // Get the latest blockhash
    const latestBlockhash = await this.client?.getLatestBlockhash();

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
      const toSign = await createSiweMessageWithRecaps({
        uri: params.uri,
        expiration: params.expiration,
        resources: params.resourceAbilityRequests,
        walletAddress: walletAddress,
        nonce: latestBlockhash || '',
        litNodeClient: this.client,
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
      (await this.client?.getSessionSigs({
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

    const accessControlConditions = [];

    accessControlConditions.push({
      contractAddress: '',
      standardContractType: '' as AccsDefaultParams['standardContractType'],
      chain: this.chain as AccsDefaultParams['chain'],
      method: '',
      parameters: [':userAddress'],
      returnValueTest: {
        comparator: '=' as AccsDefaultParams['returnValueTest']['comparator'],
        value: encryptionParams[0].key,
      },
    });

    for (let i = 1; i < encryptionParams.length; i++) {
      accessControlConditions.push(
        { operator: 'or' },
        {
          contractAddress: '',
          standardContractType: '' as AccsDefaultParams['standardContractType'],
          chain: this.chain as AccsDefaultParams['chain'],
          method: '',
          parameters: [':userAddress'],
          returnValueTest: {
            comparator: '=' as AccsDefaultParams['returnValueTest']['comparator'],
            value: encryptionParams[i].key,
          },
        },
      );
    }

    return accessControlConditions;
  }

  /**
   * @function isEncryptionAvailable
   * @description Checks if encryption is available.
   * @returns {boolean} A boolean indicating if encryption is available.
   */
  public isEncryptionAvailable(): boolean {
    return this.client !== null;
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
    if (!this.client) {
      throw new Error('Lit client not initialized');
    }

    const stringifiedData = typeof data === 'string' ? data : JSON.stringify(data);

    const accessControlConditions = await this.getLitAccessControlConditions(
      options.encryptionParams,
    );

    return await encryptString(
      {
        accessControlConditions: accessControlConditions,
        dataToEncrypt: stringifiedData,
      },
      this.client,
    );
  }

  /**
   * @function isDecryptionAvailable
   * @description Checks if decryption is available.
   * @returns {boolean} A boolean indicating if decryption is available.
   */
  public isDecryptionAvailable(): boolean {
    return this.client !== null && this.sessionSigs !== null;
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
    if (!this.client) {
      throw new Error('Lit client not initialized');
    }

    if (!this.sessionSigs) {
      throw new Error('Session signatures are required to decrypt data');
    }

    const accessControlConditions = await this.getLitAccessControlConditions(
      options.encryptionParams,
    );

    const decryptedData = await decryptToString(
      {
        accessControlConditions: accessControlConditions,
        chain: this.chain,
        ciphertext: encryptedData.ciphertext,
        dataToEncryptHash: encryptedData.dataToEncryptHash,
        sessionSigs: this.sessionSigs,
      },
      this.client,
    );
    return decryptedData;
  }
}
