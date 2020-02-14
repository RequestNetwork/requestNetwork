import { expect } from 'chai';
import { bigNumberify } from 'ethers/utils';

import { getAmountToPay } from '../../src/payment/utils';

describe('getAmountToPay', () => {
  it('returns the expectedAmount if balance is 0', () => {
    expect(
      getAmountToPay({
        balance: {
          balance: '0',
        },
        expectedAmount: '1000000',
      } as any),
    ).to.deep.eq(bigNumberify('1000000'));
  });

  it('returns the remaining amount if balance is not 0', () => {
    expect(
      getAmountToPay({
        balance: {
          balance: '400000',
        },
        expectedAmount: '1000000',
      } as any),
    ).to.deep.eq(bigNumberify('600000'));
  });

  it('returns the given amount if defined', () => {
    expect(
      getAmountToPay(
        {
          balance: {
            balance: '400000',
          },
          expectedAmount: '1000000',
        } as any,
        '3000',
      ),
    ).to.deep.eq(bigNumberify('3000'));
  });

  it('fails on a negative amount', () => {
    expect(() =>
      getAmountToPay(
        {
          balance: {
            balance: '400000',
          },
          expectedAmount: '1000000',
        } as any,
        '-3000',
      ),
    ).to.throw('cannot pay a negative amount');
  });

  it('fails on a negative remaining amount', () => {
    expect(() =>
      getAmountToPay({
        balance: {
          balance: '1400000',
        },
        expectedAmount: '1000000',
      } as any),
    ).to.throw('cannot pay a negative amount');
  });

  it('fails on a paid request', () => {
    expect(() =>
      getAmountToPay({
        balance: {
          balance: '1000000',
        },
        expectedAmount: '1000000',
      } as any),
    ).to.throw('cannot pay a null amount');
  });
});
