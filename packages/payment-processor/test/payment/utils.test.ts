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

  it('returns the givent amount if defined', () => {
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
});
