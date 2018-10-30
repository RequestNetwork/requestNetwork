import { expect } from 'chai';
import 'mocha';
const bigNumber: any = require('bn.js');

import * as RequestEnum from '../../src/enum';
import ECUtils from '../../src/utils/crypto/ECUtils';

const rawId = {
  address: '0x818B6337657A23F58581715Fc610577292e521D0',
  identity: {
    type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: '0x818B6337657A23F58581715Fc610577292e521D0',
  },
  privateKey: '0x4025da5692759add08f98f4b056c41c71916a671cedc7584a80d73adc7fb43c0',
  publicKey:
    'cf4a1d0bbef8bf0e3fa479a9def565af1b22ea6266294061bfb430701b54a83699e3d47bf52e9f0224dcc29a02721810f1f624f1f70ea3cc5f1fb752cfed379d',
};

/* tslint:disable:no-unused-expression */
describe('ECUtils', () => {
  it('can getAddressFromPrivateKey()', () => {
    const identity = ECUtils.getAddressFromPrivateKey(rawId.privateKey);
    expect(identity, 'getAddressFromPrivateKey() error').to.be.equal(rawId.address);
  });

  it('can sign()', () => {
    const signature = ECUtils.sign(
      rawId.privateKey,
      '0xfd6201dabdd4d7177f7c3baba47c5533b12f0a8127ab5d8c71d831fa4df2b19f',
    );
    expect(signature, 'sign() error').to.be.equal(
      '0xdf4d49c7c01e00a970378e5a400dd4168aed6c43a1c510b124026467c78a3566048549c6ab5e0f618e2939c518e9fbe52e07836d4cb07fa44186fa3ffe3b3b981b',
    );
  });

  it('can recover()', () => {
    const id = ECUtils.recover(
      '0xdf4d49c7c01e00a970378e5a400dd4168aed6c43a1c510b124026467c78a3566048549c6ab5e0f618e2939c518e9fbe52e07836d4cb07fa44186fa3ffe3b3b981b',
      '0xfd6201dabdd4d7177f7c3baba47c5533b12f0a8127ab5d8c71d831fa4df2b19f',
    );
    expect(id, 'recover() error').to.be.deep.equal(rawId.address);
  });
});
