import { isValidNearAddress } from '../../src/currency-utils';

const validNearAccount = 'testaccount.near';
const validNearTgAccount = 'testaccount.tg';
const validNearHexAccount = 'f336b7833496cdcae230463c3daff7b2fe187a93be8df5b1326ce7a595033163';
const badNearHexAccount = 'f336b7833496cdcae230463c3daff7b2fe187a93be8df5b1326ce7a595033163';
const badNearAccount = 'testaccount.badnear';
const badNearFormat = 'f336b7833496cdcae230463c3daff7b2fe187a93be8df5b1326ce7a595033163.badnear';

describe('Near address validation', () => {
  it('Should accepts hexadecimal format', () => {
    expect(isValidNearAddress(validNearHexAccount)).toBeTruthy;
  });

  it('Should accepts specfic near format', () => {
    expect(isValidNearAddress(validNearAccount)).toBeTruthy;
    expect(isValidNearAddress(validNearTgAccount)).toBeTruthy;
  });

  it('Should not accept accepts other format', () => {
    expect(!isValidNearAddress(badNearHexAccount)).toBeTruthy;
    expect(!isValidNearAddress(badNearAccount)).toBeTruthy;
    expect(!isValidNearAddress(badNearFormat)).toBeTruthy;
  });
});
