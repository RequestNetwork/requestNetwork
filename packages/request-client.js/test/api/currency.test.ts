// tslint:disable:no-magic-numbers
import { RequestLogicTypes } from '@requestnetwork/types';
import {
  currencyToString,
  getAllSupportedCurrencies,
  getDecimalsForCurrency,
  stringToCurrency,
} from '../../src/api/currency';

describe('api/currency', () => {
  describe('getAllSupportedCurrencies', () => {
    it('returns ETH', () => {
      expect(getAllSupportedCurrencies().ETH[0]).toEqual({
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
      });
    });

    it('returns BTC', () => {
      expect(getAllSupportedCurrencies().BTC[0]).toEqual({
        decimals: 8,
        name: 'Bitcoin',
        symbol: 'BTC',
      });
    });

    it('returns SAI', () => {
      expect(getAllSupportedCurrencies().ERC20.find(({ symbol }) => symbol === 'SAI')).toEqual({
        address: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359',
        decimals: 18,
        name: 'Sai Stablecoin v1.0',
        symbol: 'SAI',
      });
    });

    it('returns CTBK', () => {
      expect(
        getAllSupportedCurrencies().ERC20.find(({ symbol }) => symbol === 'CTBK-rinkeby')
      ).toEqual({
        address: '0x995d6a8c21f24be1dd04e105dd0d83758343e258',
        decimals: 18,
        name: 'Central Bank Token',
        symbol: 'CTBK-rinkeby',
      });
    });

    it('returns EUR', () => {
      expect(getAllSupportedCurrencies().ISO4217.find(({ symbol }) => symbol === 'EUR')).toEqual({
        decimals: 2,
        name: 'Euro',
        symbol: 'EUR',
      });
    });
  });

  describe('getDecimalsForCurrency', () => {
    it('returns the correct number of decimals', () => {
      expect(getDecimalsForCurrency({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      })).toEqual(18);
    });

    it('throws for invalid currencies', () => {
      expect(() =>
        getDecimalsForCurrency({
          type: 'BANANA' as RequestLogicTypes.CURRENCY,
          value: 'SPLIT',
        } as RequestLogicTypes.ICurrency)).toThrow();
    });

    it('returns the correct number of decimals for a supported ERC20', () => {
      expect(getDecimalsForCurrency({
        network: 'mainnet',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359', // SAI
      })).toEqual(18);
    });

    it('throws for a non-supported ERC20', () => {
      expect(() =>
        getDecimalsForCurrency({
          network: 'private',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x9FBDa871d559710256a2502A2517b794B482Db40', // local ERC20 contract
        })).toThrow();
    });
  });

  describe('stringToCurrency', () => {
    it('return the correct currency for ETH string', () => {
      expect(stringToCurrency('ETH')).toEqual({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
    });

    it('return the correct currency for BTC string', () => {
      expect(stringToCurrency('BTC')).toEqual({
        type: RequestLogicTypes.CURRENCY.BTC,
        value: 'BTC',
      });
    });

    it('return the correct currency for SAI string', () => {
      expect(stringToCurrency('SAI')).toEqual({
        network: 'mainnet',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359',
      });
    });

    it('return the correct currency for REQ string', () => {
      expect(stringToCurrency('REQ')).toEqual({
        network: 'mainnet',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x8f8221aFbB33998d8584A2B05749bA73c37a938a',
      });
    });

    it('return the correct currency for CTBK-rinkeby string', () => {
      expect(stringToCurrency('CTBK-rinkeby')).toEqual({
        network: 'rinkeby',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x995d6a8c21f24be1dd04e105dd0d83758343e258',
      });
    });

    it('return the correct currency for USD and EUR strings', () => {
      expect(stringToCurrency('USD')).toEqual({
        type: RequestLogicTypes.CURRENCY.ISO4217,
        value: 'USD',
      });

      expect(stringToCurrency('EUR')).toEqual({
        type: RequestLogicTypes.CURRENCY.ISO4217,
        value: 'EUR',
      });
    });

    it('throws for SAI not on mainnet', () => {
      expect(() => stringToCurrency('SAI-rinkeby')).toThrow();
    });

    it('throws for an unsupported currency', () => {
      expect(() => stringToCurrency('XXXXXXX')).toThrow();
    });

    it('does not persist state between calls', () => {
      expect(stringToCurrency('ETH')).toEqual({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      expect(stringToCurrency('ETH-rinkeby')).toEqual({
        network: 'rinkeby',
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
      expect(stringToCurrency('ETH')).toEqual({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      });
    });
  });

  describe('currencyToString', () => {
    it('return "ETH" string for ETH currency', () => {
      expect(currencyToString({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      })).toEqual('ETH');
    });

    it('return "ETH-rinkeby" string for ETH on rinkeby currency', () => {
      expect(currencyToString({
        network: 'rinkeby',
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      })).toEqual('ETH-rinkeby');
    });

    it('return "BTC" string for BTC currency', () => {
      expect(currencyToString({
        type: RequestLogicTypes.CURRENCY.BTC,
        value: 'BTC',
      })).toEqual('BTC');
    });

    it('return "BTC-testnet" string for BTC currency on testnet', () => {
      expect(currencyToString({
        network: 'testnet',
        type: RequestLogicTypes.CURRENCY.BTC,
        value: 'BTC',
      })).toEqual('BTC-testnet');
    });

    it('return the "SAI" string for SAI currency', () => {
      expect(currencyToString({
        network: 'mainnet',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359',
      })).toEqual('SAI');
    });

    it('return the "REQ" string for REQ currency', () => {
      expect(currencyToString({
        network: 'mainnet',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x8f8221aFbB33998d8584A2B05749bA73c37a938a',
      })).toEqual('REQ');
    });

    it('return the "CTBK-rinkeby" string for CTBK currency', () => {
      expect(currencyToString({
        network: 'rinkeby',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x995d6a8c21f24be1dd04e105dd0d83758343e258',
      })).toEqual('CTBK-rinkeby');
    });

    it('return the correct strings for USD and EUR currency', () => {
      expect(currencyToString({
        type: RequestLogicTypes.CURRENCY.ISO4217,
        value: 'USD',
      })).toEqual('USD');

      expect(currencyToString({
        type: RequestLogicTypes.CURRENCY.ISO4217,
        value: 'EUR',
      })).toEqual('EUR');
    });

    it('return unknown for REQ not on mainnet', () => {
      expect(currencyToString({
        network: 'rinkeby',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x8f8221aFbB33998d8584A2B05749bA73c37a938a',
      })).toEqual('unknown');
    });

    it('return unknown unsupported currency', () => {
      expect(currencyToString({
        network: 'mainnet',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x1111111111111111111111111111111111111111',
      })).toEqual('unknown');
    });
  });
});
