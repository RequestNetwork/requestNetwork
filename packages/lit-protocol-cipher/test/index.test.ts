import { jest } from '@jest/globals';
import { Signer } from 'ethers';
import LitProvider from '../src/lit-protocol-cipher-provider';
import { disconnectWeb3, LitNodeClientNodeJs } from '@lit-protocol/lit-node-client';
import { HttpDataAccess, NodeConnectionConfig } from '@requestnetwork/request-client.js';
import { generateAuthSig } from '@lit-protocol/auth-helpers';
import { EncryptionTypes } from '@requestnetwork/types';
import { createSiweMessageWithRecaps } from '@lit-protocol/auth-helpers';

// Mock dependencies
jest.mock('@lit-protocol/lit-node-client');
jest.mock('@requestnetwork/request-client.js');
jest.mock('@lit-protocol/auth-helpers');
jest.mock('@lit-protocol/encryption');

describe('LitProvider', () => {
  let litProvider: LitProvider;
  let mockLitClient: jest.Mocked<LitNodeClientNodeJs>;
  let mockSigner: jest.Mocked<Signer>;

  const mockNodeConnectionConfig: NodeConnectionConfig = {
    baseURL: 'http://localhost:3000',
    headers: {},
  };
  const mockWalletAddress = '0x1234567890abcdef';
  const mockChain = 'ethereum';

  const mockEncryptionParams: EncryptionTypes.IEncryptionParameters[] = [
    {
      key: mockWalletAddress,
      method: EncryptionTypes.METHOD.KMS,
    },
  ];

  beforeEach(async () => {
    jest.clearAllMocks();

    mockLitClient = {
      connect: jest.fn().mockReturnValue(Promise.resolve()),
      disconnect: jest.fn().mockReturnValue(Promise.resolve()),
      getLatestBlockhash: jest.fn().mockReturnValue(Promise.resolve('mock-blockhash')),
      getSessionSigs: jest.fn().mockReturnValue(Promise.resolve({ 'mock-session': 'mock-sig' })),
      encrypt: jest.fn().mockReturnValue(
        Promise.resolve({
          ciphertext: 'mock-encrypted-data',
          dataToEncryptHash: 'mock-hash',
        }),
      ),
      decrypt: jest.fn().mockReturnValue(
        Promise.resolve({
          decryptedData: new TextEncoder().encode('mock-decrypted-data'),
        }),
      ),
    } as unknown as jest.Mocked<LitNodeClientNodeJs>;

    (LitNodeClientNodeJs as unknown as jest.Mock).mockImplementation(() => mockLitClient);

    mockSigner = {
      getAddress: jest.fn().mockReturnValue(Promise.resolve(mockWalletAddress)),
      signMessage: jest.fn().mockReturnValue(Promise.resolve('mock-signature')),
    } as unknown as jest.Mocked<Signer>;

    litProvider = new LitProvider(mockLitClient, mockNodeConnectionConfig, mockChain);
    await litProvider.initializeClient();
  });

  describe('constructor', () => {
    it('should initialize with correct parameters', () => {
      expect(litProvider).toBeDefined();
      expect(HttpDataAccess).toHaveBeenCalledWith({
        nodeConnectionConfig: mockNodeConnectionConfig,
      });
    });

    it('should use default chain if not provided', () => {
      const providerWithDefaultChain = new LitProvider(mockLitClient, mockNodeConnectionConfig);
      expect(providerWithDefaultChain['chain']).toBe('ethereum');
    });
  });

  describe('disconnectWallet', () => {
    it('should disconnect wallet in browser environment', async () => {
      // Mock browser environment
      global.window = {} as any;

      await litProvider.disconnectWallet();

      expect(disconnectWeb3).toHaveBeenCalled();
      expect(litProvider['sessionSigs']).toBeNull();
    });

    it('should handle disconnection in Node.js environment', async () => {
      // Mock Node.js environment
      global.window = undefined as any;

      await litProvider.disconnectWallet();

      // No specific assertion here since it just sets sessionSigs to null
    });
  });

  describe('encryption and decryption state', () => {
    it('should manage decryption state correctly', () => {
      expect(litProvider.isDecryptionEnabled()).toBe(false);

      litProvider.enableDecryption(true);
      expect(litProvider.isDecryptionEnabled()).toBe(true);

      litProvider.enableDecryption(false);
      expect(litProvider.isDecryptionEnabled()).toBe(false);
    });

    it('should check encryption availability', () => {
      // Test with valid client
      expect(litProvider.isEncryptionAvailable()).toBe(true);

      // Test with no client
      litProvider['litClient'] = undefined as unknown as LitNodeClientNodeJs;
      expect(litProvider.isEncryptionAvailable()).toBe(false);

      // Restore client for other tests
      litProvider['litClient'] = mockLitClient;
    });

    it('should check decryption availability', () => {
      litProvider.enableDecryption(true);
      litProvider['sessionSigs'] = {
        'mock-session': {
          sig: 'mock-sig',
          derivedVia: 'mock',
          signedMessage: 'mock',
          address: 'mock-address',
        },
      };
      expect(litProvider.isDecryptionAvailable()).toBe(true);

      litProvider.enableDecryption(false);
      expect(litProvider.isDecryptionAvailable()).toBe(false);

      litProvider.enableDecryption(true);
      litProvider['sessionSigs'] = null;
      expect(litProvider.isDecryptionAvailable()).toBe(false);

      litProvider['litClient'];
      expect(litProvider.isDecryptionAvailable()).toBe(false);
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
      (generateAuthSig as jest.Mock).mockReturnValue(Promise.resolve(mockAuthSig));
      (createSiweMessageWithRecaps as jest.Mock).mockReturnValue(
        Promise.resolve('mock-siwe-message'),
      );

      await litProvider.getSessionSignatures(mockSigner, mockWalletAddress);

      expect(mockLitClient.connect).toHaveBeenCalled();
      expect(mockLitClient.getLatestBlockhash).toHaveBeenCalled();
      expect(mockLitClient.getSessionSigs).toHaveBeenCalled();
    });

    it('should not get new signatures if they already exist', async () => {
      // Set session signatures
      await litProvider.getSessionSignatures(mockSigner, mockWalletAddress);

      // Reset mocks
      jest.clearAllMocks();

      // Call again, should not call Lit SDK methods
      await litProvider.getSessionSignatures(mockSigner, mockWalletAddress);

      expect(mockLitClient.connect).not.toHaveBeenCalled();
      expect(mockLitClient.getLatestBlockhash).not.toHaveBeenCalled();
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
      (mockLitClient.encrypt as jest.Mock).mockReturnValue(Promise.resolve(mockEncryptResponse));
    });

    it('should encrypt string data successfully', async () => {
      const result = await litProvider.encrypt(mockData, {
        encryptionParams: mockEncryptionParams,
      });

      expect(result).toEqual(mockEncryptResponse);
      expect(mockLitClient.encrypt).toHaveBeenCalledWith(
        expect.objectContaining({
          dataToEncrypt: new TextEncoder().encode(mockData),
          accessControlConditions: expect.any(Array),
        }),
      );
    });

    it('should encrypt object data successfully', async () => {
      const objectData = { test: 'data' };
      const result = await litProvider.encrypt(objectData, {
        encryptionParams: mockEncryptionParams,
      });

      expect(result).toEqual(mockEncryptResponse);
      expect(mockLitClient.encrypt).toHaveBeenCalledWith(
        expect.objectContaining({
          dataToEncrypt: new TextEncoder().encode(JSON.stringify(objectData)),
          accessControlConditions: expect.any(Array),
        }),
      );
    });

    it('should throw error if client is not initialized', async () => {
      litProvider['litClient'] = undefined as unknown as LitNodeClientNodeJs;
      await expect(
        litProvider.encrypt(mockData, { encryptionParams: mockEncryptionParams }),
      ).rejects.toThrow('Lit client not initialized');
    });
  });

  describe('decrypt', () => {
    const mockEncryptedData = {
      ciphertext: 'encrypted-data',
      dataToEncryptHash: 'hash',
    };
    const mockDecryptedData = 'decrypted-data';

    beforeEach(async () => {
      // Mock the decrypt response with the correct structure
      // The decryptedData should be a Uint8Array since it will be decoded by TextDecoder
      (mockLitClient.decrypt as jest.Mock).mockReturnValue(
        Promise.resolve({
          decryptedData: new TextEncoder().encode(mockDecryptedData),
        }),
      );

      // Set session signatures
      await litProvider.getSessionSignatures(mockSigner, mockWalletAddress);
    });

    it('should decrypt data successfully', async () => {
      const result = await litProvider.decrypt(mockEncryptedData, {
        encryptionParams: mockEncryptionParams,
      });

      expect(result).toBe(mockDecryptedData);
      expect(mockLitClient.decrypt).toHaveBeenCalledWith(
        expect.objectContaining({
          ciphertext: mockEncryptedData.ciphertext,
          dataToEncryptHash: mockEncryptedData.dataToEncryptHash,
          chain: mockChain,
          accessControlConditions: expect.any(Array),
          sessionSigs: expect.any(Object),
        }),
      );
    });
  });
});
