import { BigNumber } from '@ethersproject/bignumber';
import Utils from '../src';

describe('min', () => {
  it('returns the min of 2 big numbers', () => {
    expect(Utils.min(1, 2)).toMatchObject(BigNumber.from(1));
    expect(Utils.min(2, 1)).toMatchObject(BigNumber.from(1));
  });

  it('supports 0', () => {
    expect(Utils.min(1, 0)).toMatchObject(BigNumber.from(0));
    expect(Utils.min(0, 1)).toMatchObject(BigNumber.from(0));
  });
});

describe('max', () => {
  it('returns the max of 2 big numbers', () => {
    expect(Utils.max(1, 2)).toMatchObject(BigNumber.from(2));
    expect(Utils.max(2, 1)).toMatchObject(BigNumber.from(2));
  });

  it('supports 0', () => {
    expect(Utils.max(1, 0)).toMatchObject(BigNumber.from(1));
    expect(Utils.max(0, 1)).toMatchObject(BigNumber.from(1));
  });
});
