import { expect } from 'chai';

import { RequestLogicTypes } from '@requestnetwork/types';
import Role from '../../src/role';

import * as TestData from './utils/test-data-generator';

/* tslint:disable:no-unused-expression */
describe('Role', () => {
  it('can getRole() from object with payee and payer', () => {
    const obj = {
      payee: TestData.payeeRaw.identity,
      payer: TestData.payerRaw.identity,
    };
    expect(Role.getRole(TestData.payeeRaw.identity, obj), 'getRole("") error').to.be.equal(
      RequestLogicTypes.ROLE.PAYEE,
    );
    expect(Role.getRole(TestData.payerRaw.identity, obj), 'getRole("") error').to.be.equal(
      RequestLogicTypes.ROLE.PAYER,
    );
    expect(Role.getRole(TestData.otherIdRaw.identity, obj), 'getRole("") error').to.be.equal(
      RequestLogicTypes.ROLE.THIRD_PARTY,
    );
  });
});
