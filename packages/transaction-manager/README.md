# @requestnetwork/transaction-manager

`@requestnetwork/transaction-manager` is a typescript library part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).
It is the default implementation of the Transaction layer. It creates transactions to be sent to Data Access.
When privacy is implemented, this package will handle the encryption

## Installation

```bash
npm install @requestnetwork/transaction-manager
```

## Usage

### Note on the decryption provider

In order to decrypt encrypted transactions, you must provide a decryption provider.
You can see the specification of decryption provider [here](./specs/decryption-provider.md).

An example of implementation of a decryption provider is available in the package: [epk-decryption](../../epk-decryption)

```javascript
import EthereumPrivateKeyDecryptionProvider from '@requestnetwork/epk-decryption';
import { TransactionManager } from '@requestnetwork/transaction-manager';

// Decryption provider setup
const decryptionProvider = new EthereumPrivateKeyDecryptionProvider({
  key: '0x04674d2e53e0e14653487d7323cc5f0a7959c83067f5654cafe4094bde90fa8a',
  method: EncryptionTypes.METHOD.ECIES,
});

// Potentially add another decryption key
decryptionProvider.addDecryptionParameters({
  key: '0x0906ff14227cead2b25811514302d57706e7d5013fcc40eca5985b216baeb998',
  method: EncryptionTypes.METHOD.ECIES,
});

const transactionManager = new TransactionManager(dataAccess, decryptionProvider);
```

### Persist a clear transaction

```javascript
import { DataAccessTypes, SignatureTypes } from '@requestnetwork/types';
import { TransactionManager } from '@requestnetwork/transaction-manager';

const dataAccess: DataAccessTypes.IDataAccess; // A Data Access implementation, for example @requestnetwork/data-access

const transactionManager = new TransactionManager(dataAccess);

const data = '{ what: "ever", it: "is,", this: "must", work: true }';
const channelId = 'myRequest';
const channelTopics = ['stakeholder1','stakeholder2'];

const { result } = await transactionManager.persistTransaction(data, channelId, channelTopics);
```

### Persist an encrypted transaction

```javascript
import { DataAccessTypes, SignatureTypes } from '@requestnetwork/types';
import { TransactionManager } from '@requestnetwork/transaction-manager';

const dataAccess: DataAccessTypes.IDataAccess; // A Data Access implementation, for example @requestnetwork/data-access

const transactionManager = new TransactionManager(dataAccess, decryptionProvider);

const data = '{ what: "ever", it: "is,", this: "must", work: true }';
const channelId = 'myRequest';
const channelTopics = ['stakeholder1','stakeholder2'];
const encryptionParameters: EncryptionTypes.IEncryptionParameters[] = [
  {
    key:
      '299708c07399c9b28e9870c4e643742f65c94683f35d1b3fc05d0478344ee0cc5a6a5e23f78b5ff8c93a04254232b32350c8672d2873677060d5095184dad422',
    method: EncryptionTypes.METHOD.ECIES,
  },
  {
    key:
      '9008306d319755055226827c22f4b95552c799bae7af0e99780cf1b5500d9d1ecbdbcf6f27cdecc72c97fef3703c54b717bca613894212e0b2525cbb2d1161b9',
    method: EncryptionTypes.METHOD.ECIES,
  }
]);

const { result } = await transactionManager.persistTransaction(data, channelId, channelTopics, encryptionParameters);
```

### Get Transactions from channel id

```javascript
import EthereumPrivateKeyDecryptionProvider from '@requestnetwork/epk-decryption';
import { DataAccessTypes, SignatureTypes } from '@requestnetwork/types';
import { TransactionManager } from '@requestnetwork/transaction-manager';

const dataAccess: DataAccessTypes.IDataAccess; // A Data Access implementation, for example @requestnetwork/data-access

// Decryption provider setup if needed
const decryptionProvider = new EthereumPrivateKeyDecryptionProvider({
  key: '0x04674d2e53e0e14653487d7323cc5f0a7959c83067f5654cafe4094bde90fa8a',
  method: EncryptionTypes.METHOD.ECIES,
});

const transactionManager = new TransactionManager(dataAccess, decryptionProvider);

const channelId = 'myRequest';

const { result: {transactions} } = await transactionManager.getTransactionsByChannelId(channelId);
```

### Get Transactions from topic

```typescript
import EthereumPrivateKeyDecryptionProvider from '@requestnetwork/epk-decryption';
import { DataAccessTypes, SignatureTypes } from '@requestnetwork/types';
import { TransactionManager } from '@requestnetwork/transaction-manager';

const dataAccess: DataAccessTypes.IDataAccess; // A Data Access implementation, for example @requestnetwork/data-access

// Decryption provider setup if needed
const decryptionProvider = new EthereumPrivateKeyDecryptionProvider({
  key: '0x04674d2e53e0e14653487d7323cc5f0a7959c83067f5654cafe4094bde90fa8a',
  method: EncryptionTypes.METHOD.ECIES,
});

const transactionManager = new TransactionManager(dataAccess, decryptionProvider);

const channelTopic = 'stakeholder1';

const {
  result: { transactions },
} = await transactionManager.getTransactionsByTopic(channelTopic);
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
[Read the contributing guide](/CONTRIBUTING.md)

## License

[MIT](/LICENSE)
