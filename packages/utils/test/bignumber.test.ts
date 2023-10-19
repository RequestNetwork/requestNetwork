import { BigNumber } from '@ethersproject/bignumber';
import { maxBigNumber, minBigNumber } from '../src.js';

describe('min', () => {
  it('returns the min of 2 big numbers', () => {
    expect(minBigNumber(1, 2)).toMatchObject(BigNumber.from(1));
    expect(minBigNumber(2, 1)).toMatchObject(BigNumber.from(1));
  });

  it('supports 0', () => {
    expect(minBigNumber(1, 0)).toMatchObject(BigNumber.from(0));
    expect(minBigNumber(0, 1)).toMatchObject(BigNumber.from(0));
  });
});

describe('max', () => {
  it('returns the max of 2 big numbers', () => {
    expect(maxBigNumber(1, 2)).toMatchObject(BigNumber.from(2));
    expect(maxBigNumber(2, 1)).toMatchObject(BigNumber.from(2));
  });

  it('supports 0', () => {
    expect(maxBigNumber(1, 0)).toMatchObject(BigNumber.from(1));
    expect(maxBigNumber(0, 1)).toMatchObject(BigNumber.from(1));
  });
});
