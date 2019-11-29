// tslint:disable:no-magic-numbers
import { RequestLogicTypes } from '@requestnetwork/types';
import { assert } from 'chai';
import 'mocha';
import {
  currencyToString,
  getAllSupportedCurrencies,
  getDecimalsForCurrency,
  stringToCurrency,
} from '../../src/api/currency';

describe('api/currency', () => {
  describe('getAllSupportedCurrencies', () => {
    it('returns ETH', () => {
      assert.deepEqual(getAllSupportedCurrencies().ETH[0], {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
      });
    });

    it('returns BTC', () => {
      assert.deepEqual(getAllSupportedCurrencies().BTC[0], {
        decimals: 8,
        name: 'Bitcoin',
        symbol: 'BTC',
      });
    });

    it('returns SAI', () => {
      assert.deepEqual(getAllSupportedCurrencies().ERC20.find(({ symbol }) => symbol === 'SAI'), {
        address: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359',
        decimals: 18,
        name: 'Sai Stablecoin v1.0',
        symbol: 'SAI',
      });
    });

    it('returns CTBK', () => {
      assert.deepEqual(
        getAllSupportedCurrencies().ERC20.find(({ symbol }) => symbol === 'CTBK-rinkeby'),
        {
          address: '0x995d6a8c21f24be1dd04e105dd0d83758343e258',
          decimals: 18,
          name: 'Central Bank Token',
          symbol: 'CTBK-rinkeby',
        },
      );
    });

    it('returns EUR', () => {
      assert.deepEqual(getAllSupportedCurrencies().ISO4217.find(({ symbol }) => symbol === 'EUR'), {
        decimals: 2,
        name: 'Euro',
        symbol: 'EUR',
      });
    });
  });

  describe('getDecimalsForCurrency', () => {
    it('returns the correct number of decimals', async () => {
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

    it('returns the correct number of decimals for a supported ERC20', async () => {
      assert.equal(
        await getDecimalsForCurrency({
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359', // SAI
        }),
        18,
      );
    });

    it('returns the correct number of decimals for a non-supported ERC20', async () => {
      assert.equal(
        await getDecimalsForCurrency({
          network: 'private',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x9FBDa871d559710256a2502A2517b794B482Db40', // local ERC20 contract
        }),
        18,
      );
    });
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

    it('return the correct currency for SAI string', () => {
      assert.deepEqual(stringToCurrency('SAI'), {
        network: 'mainnet',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359',
      });
    });

    it('return the correct currency for REQ string', () => {
      assert.deepEqual(stringToCurrency('REQ'), {
        network: 'mainnet',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x8f8221aFbB33998d8584A2B05749bA73c37a938a',
      });
    });

    it('return the correct currency for CTBK-rinkeby string', () => {
      assert.deepEqual(stringToCurrency('CTBK-rinkeby'), {
        network: 'rinkeby',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x995d6a8c21f24be1dd04e105dd0d83758343e258',
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

    it('throws for SAI not on mainnet', () => {
      assert.throws(() => stringToCurrency('SAI-rinkeby'));
    });

    it('throws for an unsupported currency', () => {
      assert.throws(() => stringToCurrency('XXXXXXX'));
    });
  });

  describe('currencyToString', () => {
    it('return "ETH" string for ETH currency', () => {
      assert.deepEqual(
        currencyToString({
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        }),
        'ETH',
      );
    });

    it('return "ETH-rinkeby" string for ETH on rinkeby currency', () => {
      assert.deepEqual(
        currencyToString({
          network: 'rinkeby',
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        }),
        'ETH-rinkeby',
      );
    });

    it('return "BTC" string for BTC currency', () => {
      assert.deepEqual(
        currencyToString({
          type: RequestLogicTypes.CURRENCY.BTC,
          value: 'BTC',
        }),
        'BTC',
      );
    });

    it('return "BTC-testnet" string for BTC currency on testnet', () => {
      assert.deepEqual(
        currencyToString({
          network: 'testnet',
          type: RequestLogicTypes.CURRENCY.BTC,
          value: 'BTC',
        }),
        'BTC-testnet',
      );
    });

    it('return the "SAI" string for SAI currency', () => {
      assert.deepEqual(
        currencyToString({
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359',
        }),
        'SAI',
      );
    });

    it('return the "REQ" string for REQ currency', () => {
      assert.deepEqual(
        currencyToString({
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x8f8221aFbB33998d8584A2B05749bA73c37a938a',
        }),
        'REQ',
      );
    });

    it('return the "CTBK-rinkeby" string for CTBK currency', () => {
      assert.deepEqual(
        currencyToString({
          network: 'rinkeby',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x995d6a8c21f24be1dd04e105dd0d83758343e258',
        }),
        'CTBK-rinkeby',
      );
    });

    it('return the correct strings for USD and EUR currency', () => {
      assert.deepEqual(
        currencyToString({
          type: RequestLogicTypes.CURRENCY.ISO4217,
          value: 'USD',
        }),
        'USD',
      );

      assert.deepEqual(
        currencyToString({
          type: RequestLogicTypes.CURRENCY.ISO4217,
          value: 'EUR',
        }),
        'EUR',
      );
    });

    it('return unknown for REQ not on mainnet', () => {
      assert.equal(
        currencyToString({
          network: 'rinkeby',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x8f8221aFbB33998d8584A2B05749bA73c37a938a',
        }),
        'unknown',
      );
    });

    it('return unknown unsupported currency', () => {
      assert.equal(
        currencyToString({
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x1111111111111111111111111111111111111111',
        }),
        'unknown',
      );
    });
  });
});
