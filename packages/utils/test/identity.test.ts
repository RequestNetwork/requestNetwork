import { IdentityTypes } from '@requestnetwork/types';
import Identity from '../src/identity';

/* tslint:disable:no-unused-expression */
describe('Identity', () => {
  it('can normalizeIdentityValue()', () => {
    // 'normalizeIdentityValue("") error'
    expect(
      Identity.normalizeIdentityValue('0xe241d3757DAd0Ef86D0FCc5fE90e20f955743eD5')
    ).toBe('0xe241d3757dad0ef86d0fcc5fe90e20f955743ed5');
  });

  it('can areEqual() two identities', () => {
    const id1 = {
      type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      value: '0xe241d3757DAd0Ef86D0FCc5fE90e20f955743eD5',
    };
    const id2 = {
      type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      value: '0xe241d3757DAd0Ef86D0FCc5fE90e20f955743eD5',
    };
    // 'areEqual() error'
    expect(Identity.areEqual(id1, id2)).toBe(true);
  });

  it('can areEqual() two identities with different cases', () => {
    const id1 = {
      type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      value: '0xe241d3757DAd0Ef86D0FCc5fE90e20f955743eD5',
    };
    const id2 = {
      type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      value: '0xe241d3757dad0ef86d0fcc5fe90e20f955743ed5',
    };
    // 'areEqual() error'
    expect(Identity.areEqual(id1, id2)).toBe(true);
  });

  it('cannot areEqual() two identities with differents values', () => {
    const id1 = {
      type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      value: '0xe241d3757DAd0Ef86D0FCc5fE90e20f955743eD5',
    };
    const id2 = {
      type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      value: '0xFFFFFFFFFFFFFFf86D0FCc5fE90e20f955743eD5',
    };
    // 'areEqual() error'
    expect(Identity.areEqual(id1, id2)).toBe(false);
  });
});
