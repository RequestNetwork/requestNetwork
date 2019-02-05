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
import { DataAccess as DataAccessTypes, Signature as SignatureTypes } from '@requestnetwork/types';
import { TransactionManager } from '@requestnetwork/transaction-manager';

const dataAccess: DataAccessTypes.IDataAccess; // A Data Access implementation, for example @requestnetwork/data-access

const transactionManager = new TransactionManager(dataAccess);

const data = '{ what: "ever", it: "is,", this: "must", work: true }';
const transactionTopic = 'myRequest';

const { result } = await transactionManager.persistTransaction(data, transactionTopic);
```

### Get a Transaction

```javascript
import { DataAccess as DataAccessTypes, Signature as SignatureTypes } from '@requestnetwork/types';
import { TransactionManager } from '@requestnetwork/transaction-manager';

const dataAccess: DataAccessTypes.IDataAccess; // A Data Access implementation, for example @requestnetwork/data-access

const transactionManager = new TransactionManager(dataAccess);

const transactionTopic = 'myRequest';

const { result } = await transactionManager.getTransactionsByTopic(transactionTopic);
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
[Read the contributing guide](https://github.com/RequestNetwork/requestNetwork/blob/master/CONTRIBUTING.md)

## License

[MIT](https://github.com/RequestNetwork/requestNetwork/blob/develop-v2/LICENSE)
