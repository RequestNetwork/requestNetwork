import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';
import { LitProtocolCipherProvider } from '@requestnetwork/lit-protocol-cipher';
import { RequestNetwork, Types, Utils } from '@requestnetwork/request-client.js';
import { ethers } from 'ethers';
import { LitNodeClient } from '@lit-protocol/lit-node-client';

jest.setTimeout(30000);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForConfirmation(request: any, maxAttempts = 10, delayMs = 1000): Promise<void> {
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      const data = await request.getData();
      if (data.state === Types.RequestLogic.STATE.CREATED) {
        console.log(`Request confirmed with state: ${data.state}`);
        return;
      }
      console.log(
        `Attempt ${attempts + 1}: Request not confirmed yet. Current state: ${data.state}`,
      );
    } catch (error) {
      console.log(`Attempt ${attempts + 1} failed:`, error);
    }
    await sleep(delayMs);
    attempts++;
  }
  throw new Error(`Request not confirmed after ${maxAttempts} attempts`);
}

describe('Lit Protocol Integration Tests', () => {
  let requestNetwork: RequestNetwork;
  let litProvider: LitProtocolCipherProvider;
  let epkSignatureProvider: EthereumPrivateKeySignatureProvider;
  let userWallet: ethers.Wallet;
  let litClient: LitNodeClient;

  const nodeConnectionConfig = {
    baseURL: 'http://localhost:3000',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  beforeAll(async () => {
    // Create wallet
    userWallet = new ethers.Wallet(
      '0x7b595b2bb732edddc4d4fe758ae528c7a748c40f0f6220f4494e214f15c5bfeb',
    );

    // Initialize signature provider
    epkSignatureProvider = new EthereumPrivateKeySignatureProvider({
      method: Types.Signature.METHOD.ECDSA,
      privateKey: userWallet.privateKey,
    });

    // Initialize Lit Protocol client
    litClient = new LitNodeClient({
      litNetwork: 'datil-dev',
      alertWhenUnauthorized: false,
      debug: false,
    });

    // Initialize Lit Protocol provider
    litProvider = new LitProtocolCipherProvider(litClient, nodeConnectionConfig);
    await litProvider.initializeClient();
    await litProvider.enableDecryption(true);
    await litProvider.getSessionSignatures(userWallet, userWallet.address);

    // Initialize Request Network client
    requestNetwork = new RequestNetwork({
      nodeConnectionConfig,
      signatureProvider: epkSignatureProvider,
      cipherProvider: litProvider,
    });
  }, 30000);

  afterAll(async () => {
    try {
      // Get all pending promises
      const promises = [];
      if (litProvider) {
        promises.push(litProvider.disconnectClient());
        promises.push(litProvider.disconnectWallet());
      }
      if (litClient) {
        promises.push(litClient.disconnect());
      }

      // Wait for all cleanup operations to complete
      await Promise.all(promises);
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  it('should encrypt and decrypt data directly', async () => {
    const testData = 'test encryption';
    const encryptionParams = [
      {
        key: userWallet.address,
        method: Types.Encryption.METHOD.KMS,
      },
    ];

    const encrypted = await litProvider.encrypt(testData, { encryptionParams });
    expect(encrypted).toBeDefined();
    expect(encrypted?.ciphertext).toBeDefined();
    expect(encrypted?.dataToEncryptHash).toBeDefined();

    const decrypted = await litProvider.decrypt(encrypted!, { encryptionParams });
    expect(decrypted).toBe(testData);
  });

  it('should create and encrypt a request', async () => {
    const requestParams = {
      requestInfo: {
        currency: {
          type: Types.RequestLogic.CURRENCY.ETH,
          value: '0x0000000000000000000000000000000000000000',
          network: 'sepolia',
        },
        expectedAmount: ethers.utils.parseEther('0.1').toString(),
        payee: {
          type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
          value: userWallet.address,
        },
        payer: {
          type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
          value: '0xb07D2398d2004378cad234DA0EF14f1c94A530e4',
        },
        timestamp: Utils.getCurrentTimestampInSecond(),
      },
      paymentNetwork: {
        id: Types.Extension.PAYMENT_NETWORK_ID.ETH_FEE_PROXY_CONTRACT,
        parameters: {
          paymentNetworkName: 'sepolia',
          paymentAddress: userWallet.address,
          feeAddress: '0x0000000000000000000000000000000000000000',
          feeAmount: '0',
          tokenAddress: '0x0000000000000000000000000000000000000000',
        },
      },
      contentData: {
        meta: {
          format: 'rnf_invoice',
          version: '0.0.3',
        },
        creationDate: new Date().toISOString(),
        invoiceNumber: 'INV-2023-001',
        invoiceItems: [
          {
            name: 'Test Service',
            quantity: 1,
            unitPrice: ethers.utils.parseEther('0.1').toString(),
            discount: '0',
            tax: {
              type: 'percentage',
              amount: '0',
            },
            currency: 'ETH',
          },
        ],
      },
      signer: {
        type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
        value: userWallet.address,
      },
    };

    const encryptionParams = [
      {
        key: userWallet.address,
        method: Types.Encryption.METHOD.KMS,
      },
    ];

    const encryptedRequest = await requestNetwork._createEncryptedRequest(
      requestParams as Types.ICreateRequestParameters,
      encryptionParams,
    );

    await waitForConfirmation(encryptedRequest, 15, 2000);

    const requestData = await encryptedRequest.getData();
    expect(requestData).toBeDefined();
    expect([Types.RequestLogic.STATE.CREATED]).toContain(requestData.state);
  });

  it('should handle encryption errors gracefully', async () => {
    const invalidEncryptionParams = [
      {
        key: '',
        method: Types.Encryption.METHOD.KMS,
      },
    ];

    await expect(
      litProvider.encrypt('test data', { encryptionParams: invalidEncryptionParams }),
    ).rejects.toThrow(/invalid.*key/i);
  });

  it('should handle decryption errors gracefully', async () => {
    const invalidEncryptedData = {
      ciphertext: 'invalid-ciphertext',
      dataToEncryptHash: 'invalid-hash',
    };

    await expect(
      litProvider.decrypt(invalidEncryptedData, {
        encryptionParams: [
          {
            key: userWallet.address,
            method: Types.Encryption.METHOD.KMS,
          },
        ],
      }),
    ).rejects.toThrow();
  });
});
