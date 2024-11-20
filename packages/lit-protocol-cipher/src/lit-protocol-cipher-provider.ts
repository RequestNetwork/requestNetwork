import * as LitJsSdk from '@lit-protocol/lit-node-client';
import { CipherProviderTypes, DataAccessTypes, EncryptionTypes } from '@requestnetwork/types';
import HttpDataAccess, {
  NodeConnectionConfig,
} from '@requestnetwork/request-client.js/src/http-data-access';

import {
  SessionSigsMap,
  AccessControlConditions,
  EncryptResponse,
  AccsDefaultParams,
  AuthSig,
  LIT_NETWORKS_KEYS,
} from '@lit-protocol/types';
import {
  LitAccessControlConditionResource,
  LitAbility,
  createSiweMessageWithRecaps,
  generateAuthSig,
} from '@lit-protocol/auth-helpers';
import { disconnectWeb3 } from '@lit-protocol/auth-browser';

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
  }

  /**
   * @function initializeClient
   * @description Initializes the Lit client based on the environment.
   * @returns {LitNodeClient|LitNodeClientNodeJs} A Lit Protocol client instance.
   * @throws {Error} Throws an error if the environment is not supported.
   * @private
   */
  private initializeClient(): LitJsSdk.LitNodeClient | LitJsSdk.LitNodeClientNodeJs {
    const isBrowser = new Function('try {return this===window;}catch(e){ return false;}');

    if (isBrowser()) {
      return new LitJsSdk.LitNodeClient({
        litNetwork: this.network,
      });
    } else {
      return new LitJsSdk.LitNodeClientNodeJs({
        litNetwork: this.network,
      });
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
   * @function getSessionSignatures
   * @description Gets the session signatures required for encryption and decryption.
   * @param {any} signer - The signer object to use for generating the auth sig.
   * @param {string} walletAddress - The wallet address to use for generating the auth sig.
   * @returns {Promise<void>}
   */
  public async getSessionSignatures(signer: any, walletAddress: string): Promise<void> {
    if (this.sessionSigs) {
      return;
    }

    let client!: LitJsSdk.LitNodeClient | LitJsSdk.LitNodeClientNodeJs;

    try {
      client = this.initializeClient();
      await client.connect();

      const capacityDelegationAuthSig: AuthSig =
        (await this.dataAccess.getLitCapacityDelegationAuthSig?.(walletAddress)) || ({} as AuthSig);

      // Get the latest blockhash
      const latestBlockhash = await client.getLatestBlockhash();

      // Define the authNeededCallback function
      const authNeededCallback = async (params: any) => {
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
          nonce: latestBlockhash,
          litNodeClient: client,
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
      this.sessionSigs = await client.getSessionSigs({
        chain: this.chain,
        capabilityAuthSigs: [capacityDelegationAuthSig],
        resourceAbilityRequests: [
          {
            resource: litResource,
            ability: LitAbility.AccessControlConditionDecryption,
          },
        ],
        authNeededCallback,
      });
    } finally {
      await client.disconnect();
    }
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
    let client!: LitJsSdk.LitNodeClient | LitJsSdk.LitNodeClientNodeJs;

    try {
      client = this.initializeClient();

      await client.connect();
      const stringifiedData = typeof data === 'string' ? data : JSON.stringify(data);

      const accessControlConditions = await this.getLitAccessControlConditions(
        options.encryptionParams,
      );

      return await LitJsSdk.encryptString(
        {
          accessControlConditions: accessControlConditions,
          dataToEncrypt: stringifiedData,
        },
        client,
      );
    } finally {
      await client.disconnect();
    }
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
    let client!: LitJsSdk.LitNodeClient | LitJsSdk.LitNodeClientNodeJs;

    try {
      if (!this.sessionSigs) {
        throw new Error('Session signatures are required to decrypt data');
      }
      client = this.initializeClient();
      await client.connect();

      const accessControlConditions = await this.getLitAccessControlConditions(
        options.encryptionParams,
      );

      const decryptedData = await LitJsSdk.decryptToString(
        {
          accessControlConditions: accessControlConditions,
          chain: this.chain,
          ciphertext: encryptedData.ciphertext,
          dataToEncryptHash: encryptedData.dataToEncryptHash,
          sessionSigs: this.sessionSigs,
        },
        client,
      );
      return decryptedData;
    } finally {
      await client.disconnect();
    }
  }
}
