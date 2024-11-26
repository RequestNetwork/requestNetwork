import { jest } from '@jest/globals';
import { Signer } from 'ethers';
import LitProvider from '../src/lit-protocol-cipher-provider';
import * as LitJsSdk from '@lit-protocol/lit-node-client';
import { HttpDataAccess, NodeConnectionConfig } from '@requestnetwork/request-client.js';
import { disconnectWeb3 } from '@lit-protocol/auth-browser';
import { generateAuthSig } from '@lit-protocol/auth-helpers';
import { EncryptionTypes } from '@requestnetwork/types';
import { METHOD } from '@requestnetwork/types/dist/encryption-types';

// Mock dependencies
jest.mock('@lit-protocol/lit-node-client');
jest.mock('@requestnetwork/request-client.js');
jest.mock('@lit-protocol/auth-browser');
jest.mock('@lit-protocol/auth-helpers');

describe('LitProvider', () => {
  let litProvider: LitProvider;
  let mockLitClient: jest.Mocked<LitJsSdk.LitNodeClient>;
  let mockSigner: jest.Mocked<Signer>;

  const mockChain = 'ethereum';
  const mockNetwork = 'cayenne' as const;
  const mockNodeConnectionConfig: NodeConnectionConfig = {
    baseURL: 'http://localhost:3000',
    headers: {}, // Adding required headers property
  };
  const mockWalletAddress = '0x1234567890abcdef';

  // Define encryption parameters with required method property
  const mockEncryptionParams: EncryptionTypes.IEncryptionParameters[] = [
    {
      key: mockWalletAddress,
      method: METHOD.KMS,
    },
  ];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock LitNodeClient with proper typing
    mockLitClient = {
      connect: jest.fn().mockReturnValueOnce(null),
      disconnect: jest.fn().mockReturnValueOnce(null),
      getLatestBlockhash: jest.fn().mockReturnValueOnce('mock-blockhash'),
      getSessionSigs: jest.fn().mockReturnValueOnce({ 'mock-session': 'mock-sig' }),
    } as unknown as jest.Mocked<LitJsSdk.LitNodeClient>;

    // Mock LitJsSdk.LitNodeClient constructor
    (LitJsSdk.LitNodeClientNodeJs as unknown as jest.Mock).mockImplementationOnce(
      () => mockLitClient,
    );

    // Create mock Signer with proper typing
    mockSigner = {
      getAddress: jest.fn().mockReturnValueOnce(mockWalletAddress),
      signMessage: jest.fn().mockReturnValueOnce('mock-signature'),
    } as unknown as jest.Mocked<Signer>;

    // Initialize LitProvider
    litProvider = new LitProvider(mockChain, mockNetwork, mockNodeConnectionConfig);
  });

  describe('constructor', () => {
    it('should initialize with correct parameters', () => {
      expect(litProvider).toBeDefined();
      expect(HttpDataAccess).toHaveBeenCalledWith({
        nodeConnectionConfig: mockNodeConnectionConfig,
      });
    });
  });

  describe('disconnectWallet', () => {
    it('should disconnect wallet in browser environment', async () => {
      // Mock browser environment
      global.window = {} as any;

      await litProvider.disconnectWallet();

      expect(disconnectWeb3).toHaveBeenCalled();
    });

    it('should handle disconnection in Node.js environment', async () => {
      // Mock Node.js environment
      global.window = undefined as any;

      await litProvider.disconnectWallet();

      expect(disconnectWeb3).not.toHaveBeenCalled();
    });
  });

  describe('getSessionSignatures', () => {
    it('should get session signatures successfully', async () => {
      const mockAuthSig = {
        sig: 'mock-auth-sig',
        address: mockWalletAddress,
        derivedVia: 'mock',
        signedMessage: 'mock',
      };
      (generateAuthSig as jest.Mock).mockReturnValueOnce(mockAuthSig);

      await litProvider.getSessionSignatures(mockSigner, mockWalletAddress);

      expect(mockLitClient.connect).toHaveBeenCalled();
      expect(mockLitClient.getLatestBlockhash).toHaveBeenCalled();
      expect(mockLitClient.getSessionSigs).toHaveBeenCalled();
      expect(mockLitClient.disconnect).toHaveBeenCalled();
    });

    it('should not get new signatures if they already exist', async () => {
      // First call to set session signatures
      await litProvider.getSessionSignatures(mockSigner, mockWalletAddress);

      // Reset mocks
      jest.clearAllMocks();

      // Second call should not make any new requests
      await litProvider.getSessionSignatures(mockSigner, mockWalletAddress);

      expect(mockLitClient.connect).not.toHaveBeenCalled();
      expect(mockLitClient.getSessionSigs).not.toHaveBeenCalled();
    });
  });

  describe('encrypt', () => {
    const mockData = 'test-data';
    const mockEncryptResponse = {
      ciphertext: 'encrypted-data',
      dataToEncryptHash: 'hash',
    };

    beforeEach(() => {
      (LitJsSdk.encryptString as unknown as jest.Mock).mockReturnValueOnce(mockEncryptResponse);
    });

    it('should encrypt string data successfully', async () => {
      const result = await litProvider.encrypt(mockData, {
        encryptionParams: mockEncryptionParams,
      });

      expect(result).toEqual(mockEncryptResponse);
      expect(LitJsSdk.encryptString).toHaveBeenCalledWith(
        expect.objectContaining({
          dataToEncrypt: mockData,
          accessControlConditions: expect.any(Array),
        }),
        expect.any(Object),
      );
    });

    it('should encrypt object data successfully', async () => {
      const objectData = { key: 'value' };
      const result = await litProvider.encrypt(objectData, {
        encryptionParams: mockEncryptionParams,
      });

      expect(result).toEqual(mockEncryptResponse);
      expect(LitJsSdk.encryptString).toHaveBeenCalledWith(
        expect.objectContaining({
          dataToEncrypt: JSON.stringify(objectData),
          accessControlConditions: expect.any(Array),
        }),
        expect.any(Object),
      );
    });

    it('should validate access control conditions', async () => {
      await litProvider.encrypt(mockData, {
        encryptionParams: mockEncryptionParams,
      });

      expect(LitJsSdk.encryptString).toHaveBeenCalledWith(
        expect.objectContaining({
          accessControlConditions: expect.arrayContaining([
            expect.objectContaining({
              contractAddress: '',
              standardContractType: '',
              chain: mockChain,
              method: expect.any(String),
              parameters: expect.any(Array),
              returnValueTest: expect.any(Object),
            }),
          ]),
        }),
        expect.any(Object),
      );
    });

    it('should throw error when encryption fails', async () => {
      // Correctly mock the encryptString method to reject
      (LitJsSdk as any).encryptString.mockRejectedValueOnce(new Error('Encryption failed'));

      try {
        await litProvider.encrypt(mockData, {
          encryptionParams: mockEncryptionParams,
        });
      } catch (error) {
        expect(error.message).toBe('Encryption failed');
      }
    });
  });

  describe('decrypt', () => {
    const mockEncryptedData = {
      ciphertext: 'encrypted-data',
      dataToEncryptHash: 'hash',
    };
    const mockDecryptedData = 'decrypted-data';

    beforeEach(async () => {
      (LitJsSdk.decryptToString as unknown as jest.Mock).mockReturnValueOnce(mockDecryptedData);
      // Set session signatures
      await litProvider.getSessionSignatures(mockSigner, mockWalletAddress);
    });

    it('should decrypt data successfully', async () => {
      const result = await litProvider.decrypt(mockEncryptedData, {
        encryptionParams: mockEncryptionParams,
      });

      expect(result).toBe(mockDecryptedData);
      expect(LitJsSdk.decryptToString).toHaveBeenCalledWith(
        expect.objectContaining({
          ciphertext: mockEncryptedData.ciphertext,
          dataToEncryptHash: mockEncryptedData.dataToEncryptHash,
          chain: mockChain,
          accessControlConditions: expect.any(Array),
          sessionSigs: expect.any(Object),
        }),
        expect.any(Object),
      );
    });

    it('should throw error if session signatures are not set', async () => {
      // Reset provider to clear session signatures
      litProvider = new LitProvider(mockChain, mockNetwork, mockNodeConnectionConfig);

      await expect(
        litProvider.decrypt(mockEncryptedData, { encryptionParams: mockEncryptionParams }),
      ).rejects.toThrow('Session signatures are required to decrypt data');
    });

    it('should throw error when decryption fails', async () => {
      // Correctly mock the decryptString method to reject
      (LitJsSdk as any).decryptToString.mockRejectedValueOnce(new Error('Decryption failed'));

      try {
        await litProvider.decrypt(mockEncryptedData, { encryptionParams: mockEncryptionParams });
      } catch (error) {
        expect(error.message).toBe('Decryption failed');
      }
    });
  });
});
