import { RequestLogicTypes } from '@requestnetwork/types';
import { assert } from 'chai';
import 'mocha';
import { getDecimalsForCurrency, stringToCurrency } from '../../src/api/currency';

describe('api/currency', () => {
  describe('getDecimalsForCurrency', () => {
    it('returns the correct number of decimals', async () => {
      // tslint:disable-next-line:no-magic-numbers
      assert.equal(
        await getDecimalsForCurrency({
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        }),
        18,
      );
    });

    it('throws for invalid currencies', async () => {
      assert.isRejected(
        getDecimalsForCurrency({
          type: 'BANANA' as RequestLogicTypes.CURRENCY,
          value: 'SPLIT',
        } as RequestLogicTypes.ICurrency),
        'Currency BANANA not implemented',
      );
    });

    it('returns the correct number of decimals for ERC20', async () => {
      // tslint:disable-next-line:no-magic-numbers
      assert.equal(
        await getDecimalsForCurrency({
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359', // DAI
        }),
        18,
      );
    }).timeout(5000);
  });

  describe('stringToCurrency', () => {
    it('return the correct currency for ETH string', () => {
      assert.deepEqual(stringToCurrency('ETH'), {
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
    });

    it('return the correct currency for BTC string', () => {
      assert.deepEqual(stringToCurrency('BTC'), {
        type: RequestLogicTypes.CURRENCY.BTC,
        value: 'BTC',
      });
    });

    it('return the correct currency for DAI string', () => {
      assert.deepEqual(stringToCurrency('DAI'), {
        network: 'mainnet',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
      });
    });

    it('return the correct currency for USD and EUR strings', () => {
      assert.deepEqual(stringToCurrency('USD'), {
        type: RequestLogicTypes.CURRENCY.ISO4217,
        value: 'USD',
      });

      assert.deepEqual(stringToCurrency('EUR'), {
        type: RequestLogicTypes.CURRENCY.ISO4217,
        value: 'EUR',
      });
    });

    it('throws for DAI not on mainnet', () => {
      assert.throws(() => stringToCurrency('DAI-rinkeby'));
    });

    it('throws for an unsupported currency', () => {
      assert.throws(() => stringToCurrency('XXXXXXX'));
    });
  });
});
