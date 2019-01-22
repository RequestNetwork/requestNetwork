import 'mocha';

const chai = require('chai');
const spies = require('chai-spies');
const expect = chai.expect;
chai.use(spies);

import { DataAccess as DataAccessTypes, Signature as SignatureTypes } from '@requestnetwork/types';

import { TransactionManager } from '../src/index';
import TransactionCore from '../src/transaction';

const extraTopics = ['topic1', 'topic2'];
const fakeTxHash = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const data = '{ what: "ever", it: "is,", this: "must", work: true }';
const data2 = '{or: "can", be:false}';

const signature: SignatureTypes.ISignature = {
  method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
  value: 'Oxabcde',
};
const signature2: SignatureTypes.ISignature = {
  method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
  value: 'Oxabcdef',
};
const tx = { data, signature };
const tx2 = { data: data2, signature: signature2 };

const fakeMetaDataAccessPersistReturn: DataAccessTypes.IRequestDataReturnPersistTransaction = {
  meta: { transactionStorageLocation: 'fakeDataId', topics: extraTopics },
  result: { topics: [fakeTxHash] },
};

const fakeMetaDataAccessGetReturn: DataAccessTypes.IRequestDataReturnGetTransactionsByTopic = {
  meta: { transactionsStorageLocation: ['fakeDataId1', 'fakeDataId2'] },
  result: { transactions: [tx, tx2] },
};

const fakeDataAccess: DataAccessTypes.IDataAccess = {
  getTransactionsByTopic: chai.spy.returns(fakeMetaDataAccessGetReturn),
  initialize: chai.spy(),
  persistTransaction: chai.spy.returns(fakeMetaDataAccessPersistReturn),
};

const signatureParams1: SignatureTypes.ISignatureParameters = {
  method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
  privateKey: '0x04674d2e53e0e14653487d7323cc5f0a7959c83067f5654cafe4094bde90fa8a',
};
/* tslint:disable:no-unused-expression */
describe('index', () => {
  it('can persist a transaction', async () => {
    const transactionManager = new TransactionManager(fakeDataAccess);

    const ret = await transactionManager.persistTransaction(data, signatureParams1, extraTopics);

    expect(ret.result, 'ret.result is wrong').to.be.deep.equal({});
    expect(ret.meta, 'ret.meta is wrong').to.be.deep.equal({
      dataAccessMeta: fakeMetaDataAccessPersistReturn.meta,
    });
    expect(fakeDataAccess.persistTransaction).to.have.been.called.with(
      TransactionCore.createTransaction(data, signatureParams1),
      extraTopics,
    );
  });

  it('can get transactions indexed by topics', async () => {
    const transactionManager = new TransactionManager(fakeDataAccess);

    const ret = await transactionManager.getTransactionsByTopic(extraTopics[0]);

    expect(ret.result, 'ret.result is wrong').to.be.deep.equal(fakeMetaDataAccessGetReturn.result);
    expect(ret.meta, 'ret.meta is wrong').to.be.deep.equal({
      dataAccessMeta: fakeMetaDataAccessGetReturn.meta,
    });
    expect(fakeDataAccess.getTransactionsByTopic).to.have.been.called.with(extraTopics[0]);
  });
});
