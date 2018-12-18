import { RequestLogic as RequestLogicTypes } from '@requestnetwork/types';
import { assert } from 'chai';
import 'mocha';
import Utils from '../../src/api/utils';

describe('api/utils', () => {
  describe('getDecimalsForCurrency', () => {
    it('returns the correct number of decimals', async () => {
      assert.equal(Utils.getDecimalsForCurrency(RequestLogicTypes.REQUEST_LOGIC_CURRENCY.ETH), 18);
    });

    it('throws for invalid currencies', async () => {
      assert.throws(() =>
        Utils.getDecimalsForCurrency('BANANA' as RequestLogicTypes.REQUEST_LOGIC_CURRENCY),
      );
    });
  });
});
