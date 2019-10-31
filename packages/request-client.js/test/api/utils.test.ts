import { RequestLogicTypes } from '@requestnetwork/types';
import { assert } from 'chai';
import 'mocha';
import Utils from '../../src/api/utils';

describe('api/utils', () => {
  describe('getDecimalsForCurrency', () => {
    it('returns the correct number of decimals', async () => {
      // tslint:disable-next-line:no-magic-numbers
      assert.equal(
        await Utils.getDecimalsForCurrency({
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        }),
        18,
      );
    });

    it('throws for invalid currencies', async () => {
      assert.isRejected(
        Utils.getDecimalsForCurrency({
          type: 'BANANA' as RequestLogicTypes.CURRENCY,
          value: 'SPLIT',
        } as RequestLogicTypes.ICurrency),
        'Currency BANANA not implemented',
      );
    });

    it('returns the correct number of decimals for ERC20', async () => {
      // tslint:disable-next-line:no-magic-numbers
      assert.equal(
        await Utils.getDecimalsForCurrency({
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359', // DAI
        }),
        18,
      );
    }).timeout(5000);
  });
});
