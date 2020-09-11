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
    // 'getRole("") error'
    expect(Role.getRole(TestData.payeeRaw.identity, obj)).toBe(RequestLogicTypes.ROLE.PAYEE);
    // 'getRole("") error'
    expect(Role.getRole(TestData.payerRaw.identity, obj)).toBe(RequestLogicTypes.ROLE.PAYER);
    // 'getRole("") error'
    expect(Role.getRole(TestData.otherIdRaw.identity, obj)).toBe(RequestLogicTypes.ROLE.THIRD_PARTY);
  });
});
