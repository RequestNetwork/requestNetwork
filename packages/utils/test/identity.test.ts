import { expect } from 'chai';
import 'mocha';

import { Identity as IdentityTypes } from '@requestnetwork/types';
import Identity from '../src/identity';

/* tslint:disable:no-unused-expression */
describe('Identity', () => {
  it('can normalizeIdentityValue()', () => {
    expect(
      Identity.normalizeIdentityValue('0xe241d3757DAd0Ef86D0FCc5fE90e20f955743eD5'),
      'normalizeIdentityValue("") error',
    ).to.be.equal('0xe241d3757dad0ef86d0fcc5fe90e20f955743ed5');
  });

  it('can areEqual() two identities', () => {
    const id1 = {
      type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      value: '0xe241d3757DAd0Ef86D0FCc5fE90e20f955743eD5',
    };
    const id2 = {
      type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      value: '0xe241d3757DAd0Ef86D0FCc5fE90e20f955743eD5',
    };
    expect(Identity.areEqual(id1, id2), 'areEqual() error').to.be.true;
  });

  it('can areEqual() two identities with different cases', () => {
    const id1 = {
      type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      value: '0xe241d3757DAd0Ef86D0FCc5fE90e20f955743eD5',
    };
    const id2 = {
      type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      value: '0xe241d3757dad0ef86d0fcc5fe90e20f955743ed5',
    };
    expect(Identity.areEqual(id1, id2), 'areEqual() error').to.be.true;
  });

  it('cannot areEqual() two identities with differents values', () => {
    const id1 = {
      type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      value: '0xe241d3757DAd0Ef86D0FCc5fE90e20f955743eD5',
    };
    const id2 = {
      type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      value: '0xFFFFFFFFFFFFFFf86D0FCc5fE90e20f955743eD5',
    };
    expect(Identity.areEqual(id1, id2), 'areEqual() error').to.be.false;
  });
});
