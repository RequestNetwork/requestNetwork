import { expect } from 'chai';
import 'mocha';

import multiFormat from '../src/multi-format';

/* tslint:disable:no-unused-expression */
describe('Utils.multiFormat', () => {
  it('can formatKeccak256Hash', () => {
    const arbitraryObject = '0xaf91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907';
    expect(
      multiFormat.formatKeccak256Hash(arbitraryObject),
      'formatKeccak256Hash(arbitraryObject) error',
    ).to.be.equal('01af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907');
  });
  it('cannot formatKeccak256Hash a hash with wrong length', () => {
    const arbitraryObject = '0xaf91330fe78';
    expect(() => {
      multiFormat.formatKeccak256Hash(arbitraryObject);
    }, 'formatKeccak256Hash(arbitraryObject) error').to.throw('Hash must be a Keccak256 Hash');
  });

  it('should return true if a right formatted hash is given to isKeccak256Hash', () => {
    expect(
      multiFormat.isKeccak256Hash(
        '01af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
      ),
      'isKeccak256Hash() error',
    ).to.be.true;
  });

  it('should return false if a wrong formatted hash is given to isKeccak256Hash', () => {
    expect(
      multiFormat.isKeccak256Hash(
        '00af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907',
      ),
      'should be false with a wrong prefix',
    ).to.be.false;

    expect(
      multiFormat.isKeccak256Hash(
        '01af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f9',
      ),
      'should be false with a shorter size',
    ).to.be.false;

    expect(
      multiFormat.isKeccak256Hash(
        '01af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f90799',
      ),
      'should be false with a shorted size',
    ).to.be.false;
  });

  it('can formatPlainText', () => {
    const arbitraryString = 'arbitrary string';
    expect(
      multiFormat.formatPlainText(arbitraryString),
      'formatPlainText(arbitraryString) error',
    ).to.be.equal('00arbitrary string');
  });

  it('should return true if a right formatted hash is given to isPlainText', () => {
    expect(multiFormat.isPlainText('00 arbitrary text'), 'isPlainText() error').to.be.true;
  });

  it('should return false if a wrong formatted hash is given to isPlainText', () => {
    expect(
      multiFormat.isPlainText('01af91330fe78ccde898f10a39d6088568e24275a6cfbe9e80f4c2f42a4308f907'),
      'should be false with a wrong prefix',
    ).to.be.false;
  });
});
