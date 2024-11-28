import { jest } from '@jest/globals';
import { Signer } from 'ethers';
import LitProvider from '../src/lit-protocol-cipher-provider';
import * as LitJsSdk from '@lit-protocol/lit-node-client';
import { HttpDataAccess, NodeConnectionConfig } from '@requestnetwork/request-client.js';
import { disconnectWeb3 } from '@lit-protocol/auth-browser';
import { generateAuthSig } from '@lit-protocol/auth-helpers';
import { EncryptionTypes } from '@requestnetwork/types';
import { createSiweMessageWithRecaps } from '@lit-protocol/auth-helpers';
import { decryptToString, encryptString } from '@lit-protocol/encryption';

// Mock dependencies
jest.mock('@lit-protocol/lit-node-client');
jest.mock('@requestnetwork/request-client.js');
jest.mock('@lit-protocol/auth-browser');
jest.mock('@lit-protocol/auth-helpers');
jest.mock('@lit-protocol/encryption');

describe('LitProvider', () => {
  let litProvider: LitProvider;
  let mockLitClient: jest.Mocked<LitJsSdk.LitNodeClientNodeJs>; // Use Node.js client
  let mockSigner: jest.Mocked<Signer>;

  const mockChain = 'ethereum';
  const mockNetwork = 'datil-test';
  const mockNodeConnectionConfig: NodeConnectionConfig = {
    baseURL: 'http://localhost:3000',
    headers: {},
  };
  const mockWalletAddress = '0x1234567890abcdef';

  const mockEncryptionParams: EncryptionTypes.IEncryptionParameters[] = [
    {
      key: mockWalletAddress,
      method: EncryptionTypes.METHOD.KMS, // Use the enum
    },
  ];

  beforeEach(async () => {
    jest.clearAllMocks();

    mockLitClient = {
      connect: jest.fn().mockReturnValue(Promise.resolve()),
      disconnect: jest.fn().mockReturnValue(Promise.resolve()),
      getLatestBlockhash: jest.fn().mockReturnValue(Promise.resolve('mock-blockhash')),
      getSessionSigs: jest.fn().mockReturnValue(Promise.resolve({ 'mock-session': 'mock-sig' })),
    } as unknown as jest.Mocked<LitJsSdk.LitNodeClientNodeJs>;

    (LitJsSdk.LitNodeClientNodeJs as unknown as jest.Mock).mockImplementation(() => mockLitClient);

    mockSigner = {
      getAddress: jest.fn().mockReturnValue(Promise.resolve(mockWalletAddress)),
      signMessage: jest.fn().mockReturnValue(Promise.resolve('mock-signature')),
    } as unknown as jest.Mocked<Signer>;

    litProvider = new LitProvider(mockChain, mockNetwork, mockNodeConnectionConfig);
    await new Promise((resolve) => setTimeout(resolve, 100));
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

      // No specific assertion here since it just sets sessionSigs to null
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
      (encryptString as jest.Mock).mockReturnValue(Promise.resolve(mockEncryptResponse));
    });

    it('should encrypt string data successfully', async () => {
      const result = await litProvider.encrypt(mockData, {
        encryptionParams: mockEncryptionParams,
      });

      expect(result).toEqual(mockEncryptResponse);
      expect(encryptString).toHaveBeenCalledWith(
        expect.objectContaining({
          dataToEncrypt: mockData,
          accessControlConditions: expect.any(Array),
        }),
        expect.any(Object),
      );
    });

    // ... (rest of your encrypt tests with necessary adjustments)
  });

  describe('decrypt', () => {
    const mockEncryptedData = {
      ciphertext: 'encrypted-data',
      dataToEncryptHash: 'hash',
    };
    const mockDecryptedData = 'decrypted-data';

    beforeEach(async () => {
      (decryptToString as jest.Mock).mockReturnValue(Promise.resolve(mockDecryptedData));
      // Set session signatures
      await litProvider.getSessionSignatures(mockSigner, mockWalletAddress);
    });

    it('should decrypt data successfully', async () => {
      const result = await litProvider.decrypt(mockEncryptedData, {
        encryptionParams: mockEncryptionParams,
      });

      expect(result).toBe(mockDecryptedData);
      expect(decryptToString).toHaveBeenCalledWith(
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

    // ... (rest of your decrypt tests with necessary adjustments)
  });
});
