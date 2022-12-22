import { BigNumber } from '@ethersproject/bignumber';
import { max, min } from '../src';

describe('min', () => {
  it('returns the min of 2 big numbers', () => {
    expect(min(1, 2)).toMatchObject(BigNumber.from(1));
    expect(min(2, 1)).toMatchObject(BigNumber.from(1));
  });

  it('supports 0', () => {
    expect(min(1, 0)).toMatchObject(BigNumber.from(0));
    expect(min(0, 1)).toMatchObject(BigNumber.from(0));
  });
});

describe('max', () => {
  it('returns the max of 2 big numbers', () => {
    expect(max(1, 2)).toMatchObject(BigNumber.from(2));
    expect(max(2, 1)).toMatchObject(BigNumber.from(2));
  });

  it('supports 0', () => {
    expect(max(1, 0)).toMatchObject(BigNumber.from(1));
    expect(max(0, 1)).toMatchObject(BigNumber.from(1));
  });
});
