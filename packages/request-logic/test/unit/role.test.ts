import { expect } from 'chai';
import 'mocha';
const bigNumber: any = require('bn.js');

import * as RequestEnum from '../../src/enum';
import Role from '../../src/role';

const payee = {
  type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
  value: '0xe241d3757DAd0Ef86D0FCc5fE90e20f955743eD5',
};
const payer = {
  type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
  value: '0x8f7E6D3AA090D5Ed7eF4882B4E59F724377f6bFF',
};
const otherId = {
  type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
  value: '0x212D95FcCdF0366343350f486bda1ceAfC0C2d63',
};
/* tslint:disable:no-unused-expression */
describe('Role', () => {
  it('can getRole() from object with payee and payer', () => {
    const obj = {
      payee,
      payer,
    };
    expect(Role.getRole(obj, payee), 'getRole("") error').to.be.equal(
      RequestEnum.REQUEST_LOGIC_ROLE.PAYEE,
    );
    expect(Role.getRole(obj, payer), 'getRole("") error').to.be.equal(
      RequestEnum.REQUEST_LOGIC_ROLE.PAYER,
    );
    expect(Role.getRole(obj, otherId), 'getRole("") error').to.be.equal(
      RequestEnum.REQUEST_LOGIC_ROLE.THIRD_PARTY,
    );
  });
});
