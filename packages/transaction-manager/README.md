# @requestnetwork/transaction-manager

`@requestnetwork/transaction-manager` is a typescript library part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).
It is the default implementation of the Transaction layer. It creates transactions to be sent to Data Access.
When privacy is implemented, this package will handle the encryption

## Installation

```bash
npm install @requestnetwork/transaction-manager
```

## Usage

### Persist a Transaction

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

### Get Transactions from channel id

```javascript
import { DataAccessTypes, SignatureTypes } from '@requestnetwork/types';
import { TransactionManager } from '@requestnetwork/transaction-manager';

const dataAccess: DataAccessTypes.IDataAccess; // A Data Access implementation, for example @requestnetwork/data-access

const transactionManager = new TransactionManager(dataAccess);

const channelId = 'myRequest';

const { result: {transactions} } = await transactionManager.getTransactionsByChannelId(channelId);
```

### Get Transactions from topic

```typescript
import { DataAccessTypes, SignatureTypes } from '@requestnetwork/types';
import { TransactionManager } from '@requestnetwork/transaction-manager';

const dataAccess: DataAccessTypes.IDataAccess; // A Data Access implementation, for example @requestnetwork/data-access

const transactionManager = new TransactionManager(dataAccess);

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
