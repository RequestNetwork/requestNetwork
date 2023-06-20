import { maxBigNumber, minBigNumber } from '../src';

describe('min', () => {
  it('returns the min of 2 big numbers', () => {
    expect(minBigNumber(1, 2)).toBe(1n);
    expect(minBigNumber(2, 1)).toBe(1n);
  });

  it('supports 0', () => {
    expect(minBigNumber(1, 0)).toBe(0n);
    expect(minBigNumber(0, 1)).toBe(0n);
  });
});

describe('max', () => {
  it('returns the max of 2 big numbers', () => {
    expect(maxBigNumber(1, 2)).toBe(2n);
    expect(maxBigNumber(2, 1)).toBe(2n);
  });

  it('supports 0', () => {
    expect(maxBigNumber(1, 0)).toBe(1n);
    expect(maxBigNumber(0, 1)).toBe(1n);
  });
});
