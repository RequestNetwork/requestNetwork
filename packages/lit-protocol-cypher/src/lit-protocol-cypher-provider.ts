import * as LitJsSdk from '@lit-protocol/lit-node-client';
import { DataAccessTypes, EncryptionTypes } from 'types/dist';
import { CypherProviderTypes } from '@requestnetwork/types';
import {
  SessionSigsMap,
  AccessControlConditions,
  EncryptResponse,
  AccsDefaultParams,
} from '@lit-protocol/types';

import {
  LitAccessControlConditionResource,
  LitAbility,
  createSiweMessageWithRecaps,
  generateAuthSig,
} from '@lit-protocol/auth-helpers';

/**
 * @class LitProvider
 * @description A provider class that simplifies the usage of Lit Protocol for encryption and decryption.
 * This class can be used with both client-side and Node.js Lit clients.
 * It implements the `IKmsProvider` interface for a standardized KMS provider structure.
 */
export default class LitProvider implements CypherProviderTypes.ICypherProvider {
  /**
   * @property {LitNodeClient|LitNodeClientNodeJs} client - The Lit Protocol client instance.
   */
  private chain: string;
  private client: LitJsSdk.LitNodeClient | LitJsSdk.LitNodeClientNodeJs;

  /**
   * @property {DataAccessTypes.IDataAccess} dataAccess - The data access layer for Request Network.
   */
  private dataAccess: DataAccessTypes.IDataAccess;

  /**
   * @constructor
   * @param {LitNodeClient|LitNodeClientNodeJs} litClient - An instance of a Lit Protocol client (either client-side or Node.js).
   * @throws {Error} Throws an error if the provided Lit client is invalid.
   */
  constructor(
    litClient: LitJsSdk.LitNodeClient | LitJsSdk.LitNodeClientNodeJs,
    chain: string,
    dataAccess: DataAccessTypes.IDataAccess,
  ) {
    this.client = litClient;
    this.chain = chain;
    this.dataAccess = dataAccess;
  }

  /**
   * @async
   * @function connect
   * @description Connects to the Lit network if the client is not already connected.
   */
  public async connect(): Promise<void> {
    await this.client.connect();
  }

  private async getSessionSignatures(signer: any): Promise<SessionSigsMap> {
    const walletAddress = await signer.getAddress();

    const capacityDelegationAuthSig =
      await this.dataAccess.getLitCapacityDelegationAuthSig?.(walletAddress);

    // Get the latest blockhash
    const latestBlockhash = await this.client.getLatestBlockhash();

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
    const sessionSigs = await this.client.getSessionSigs({
      chain: this.chain,
      resourceAbilityRequests: [
        {
          resource: litResource,
          ability: LitAbility.AccessControlConditionDecryption,
        },
      ],
      authNeededCallback,
      capacityDelegationAuthSig,
    });
    return sessionSigs;
  }

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
   * @returns {Promise<{encryptedData: string, metadata: any}>} An object containing the encrypted data and metadata, including the encrypted symmetric key.
   */
  public async encrypt(
    data: string | { [key: string]: any },
    options: {
      encryptionParams: EncryptionTypes.IEncryptionParameters[];
    },
  ): Promise<EncryptResponse> {
    await this.connect();

    const stringifiedData = typeof data === 'string' ? data : JSON.stringify(data);

    const accessControlConditions = await this.getLitAccessControlConditions(
      options.encryptionParams,
    );

    return await LitJsSdk.encryptString(
      {
        accessControlConditions: accessControlConditions,
        dataToEncrypt: stringifiedData,
      },
      this.client,
    );
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
      signer: any;
      encryptionParams: EncryptionTypes.IEncryptionParameters[];
    },
  ): Promise<string> {
    await this.connect();

    const sessionSigs = await this.getSessionSignatures(options.signer);
    const accessControlConditions = await this.getLitAccessControlConditions(
      options.encryptionParams,
    );

    // Decrypt the message
    return await LitJsSdk.decryptToString(
      {
        accessControlConditions: accessControlConditions,
        chain: this.chain,
        ciphertext: encryptedData.ciphertext,
        dataToEncryptHash: encryptedData.dataToEncryptHash,
        sessionSigs,
      },
      this.client,
    );
  }
}
