# @requestnetwork/lit-protocol-cipher

Lit Protocol Provider for Request Network.

`@requestnetwork/lit-protocol-cipher` is a typescript library part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork) that provides encryption and decryption capabilities using the Lit Protocol.

## Installation

```bash
npm install @requestnetwork/lit-protocol-cipher
```

## Usage

The `LitProtocolProvider` class provides encryption and decryption capabilities using the Lit Protocol. Here's how to implement and use it:

```typescript
import { ethers } from 'ethers';
import { LitProtocolProvider } from '@requestnetwork/lit-protocol-cipher';
import { LIT_NETWORKS } from '@lit-protocol/types';
import { LitNodeClient } from '@lit-protocol/lit-node-client';

// Initialize the provider
const litProvider = new LitProtocolProvider(
  new LitNodeClient({
    litNetwork: LIT_NETWORKS.datil,
  }),
  {
    baseURL: 'https://your-request-network-node.com',
    headers: {
      'Content-Type': 'application/json',
    },
  }, // nodeConnectionConfig
);

// Initialize the client
await litProvider.initializeClient();

// Example usage with wallet connection
async function example() {
  try {
    // Connect wallet and get signer (example using ethers.js)
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const address = await signer.getAddress();

    // Get session signatures (required for decryption)
    await litProvider.getSessionSignatures(signer, address);

    // Example data to encrypt
    const sensitiveData = {
      message: 'Secret message',
      timestamp: Date.now(),
    };

    // Encryption parameters (defining who can access the data)
    const encryptionParams = [
      {
        key: '0x1234....', // Ethereum address that can decrypt
        type: 'address',
      },
    ];

    // Encrypt data
    const encryptedData = await litProvider.encrypt(sensitiveData, { encryptionParams });

    if (!encryptedData) {
      throw new Error('Encryption failed');
    }

    // Store the encrypted data somewhere...

    // Later, decrypt the data
    const decryptedData = await litProvider.decrypt(encryptedData, { encryptionParams });

    if (decryptedData) {
      // Parse the decrypted data if it was originally an object
      const parsedData = JSON.parse(decryptedData);
      console.log('Decrypted data:', parsedData);
    }

    // Disconnect wallet when done
    await litProvider.disconnectWallet();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Disconnect wallet when done
    await litProvider.disconnectWallet();
  }
}

// Multiple recipients example
async function multipleRecipientsExample() {
  const encryptionParams = [
    { key: '0x1234....', type: 'address' }, // First recipient
    { key: '0x5678....', type: 'address' }, // Second recipient
    { key: '0x90AB....', type: 'address' }, // Third recipient
  ];

  const encryptedData = await litProvider.encrypt('Secret message for multiple recipients', {
    encryptionParams,
  });
}
```

### Key Features

1. **Wallet Connection Management**

   - Connect and disconnect wallets seamlessly
   - Handles session signatures for secure encryption/decryption

2. **Flexible Encryption**

   - Encrypt both strings and objects
   - Support for multiple recipients through encryptionParams
   - Uses Lit Protocol's access control conditions

3. **Secure Decryption**
   - Requires valid session signatures
   - Supports the same access control conditions used in encryption

### Important Notes

- Always ensure you have valid session signatures before attempting decryption
- The provider works in both browser and Node.js environments
- Encrypted objects are automatically stringified during encryption and need to be parsed after decryption
- Make sure to properly handle the encrypted data storage and transmission in your application
- Remember to disconnect the wallet when it's no longer needed

### Error Handling

The provider includes built-in error handling for common scenarios:

- Invalid or missing session signatures
- Empty encryption parameters
- Connection failures
- Invalid client initialization

It's recommended to wrap your encryption/decryption operations in try-catch blocks to handle any potential errors gracefully.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
[Read the contributing guide](/CONTRIBUTING.md)

## License

[MIT](/LICENSE)
