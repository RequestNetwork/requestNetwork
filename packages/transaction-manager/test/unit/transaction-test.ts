import 'mocha';

import { expect } from 'chai';

import TransactionCore from '../../src/transaction';

/* tslint:disable:no-unused-expression */
describe('index', () => {
  it('can create transaction', () => {
    const data = '{ what: "ever", it: "is,", this: "must", work: true }';

    const tx = TransactionCore.createTransaction(data);

    expect(tx, 'transaction not right').to.deep.equal({ data });
  });
});
