import { expect } from 'chai';
import 'mocha';

import Random from '../src/random';

// Regex for "at least 16 hexadecimal numbers". Used to validate the salt
const eightHexRegex = /[0-9a-f]{16}/;

/* tslint:disable:no-unused-expression */
/* tslint:disable:no-magic-numbers */
describe('random/generate8randomBytes', () => {
  it('generates a 16 charaters long string', () => {
    // Do it 20 times because it's random. It's ok, it takes a few milliseconds
    for (let i = 0; i < 100; i++) {
      expect(Random.generate8randomBytes().length).to.be.equal(16);
    }
  });

  it('generates a 16 charater of hexademical number', () => {
    // Do it 20 times because it's random. It's ok, it takes a few milliseconds
    for (let i = 0; i < 100; i++) {
      expect(eightHexRegex.test(Random.generate8randomBytes())).to.be.true;
    }
  });

  it('generates unique strings', () => {
    const first = Random.generate8randomBytes();
    const second = Random.generate8randomBytes();
    expect(first).to.not.equal(second);
  });
});
