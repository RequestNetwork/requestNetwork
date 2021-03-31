/* eslint-disable no-magic-numbers */
import { RequestLogicTypes } from '@requestnetwork/types';
import {
  currencyToString,
  getAllSupportedCurrencies,
  getCurrencyHash,
  getDecimalsForCurrency,
  stringToCurrency,
} from '../src';

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

    it('returns Celo CUSD', () => {
      expect(
        getAllSupportedCurrencies().ERC20.find(({ symbol }) => symbol === 'CUSD-celo'),
      ).toEqual({
        address: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
        decimals: 18,
        name: 'Celo Dollar',
        symbol: 'CUSD-celo',
      });
    });

    it('returns INDA', () => {
      expect(getAllSupportedCurrencies().ERC20.find(({ symbol }) => symbol === 'INDA')).toEqual({
        address: '0x433d86336dB759855A66cCAbe4338313a8A7fc77',
        decimals: 2,
        name: 'Indacoin',
        symbol: 'INDA',
      });
    });

    it('returns CTBK', () => {
      expect(
        getAllSupportedCurrencies().ERC20.find(({ symbol }) => symbol === 'CTBK-rinkeby'),
      ).toEqual({
        address: '0x995d6A8C21F24be1Dd04E105DD0d83758343E258',
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
      expect(
        getDecimalsForCurrency({
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        }),
      ).toEqual(18);
    });

    it('throws for invalid currencies', () => {
      expect(() =>
        getDecimalsForCurrency({
          type: 'BANANA' as RequestLogicTypes.CURRENCY,
          value: 'SPLIT',
        } as RequestLogicTypes.ICurrency),
      ).toThrow();
    });

    it('returns the correct number of decimals for a supported ERC20', () => {
      expect(
        getDecimalsForCurrency({
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359', // SAI
        }),
      ).toEqual(18);
    });

    it('throws for a non-supported ERC20', () => {
      expect(() =>
        getDecimalsForCurrency({
          network: 'private',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x9FBDa871d559710256a2502A2517b794B482Db40', // local ERC20 contract
        }),
      ).toThrow();
    });

    it('returns the correct number of decimals for a a celo ERC20', () => {
      expect(
        getDecimalsForCurrency({
          network: 'celo',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x765DE816845861e75A25fCA122bb6898B8B1282a', // Celo Dollar
        }),
      ).toEqual(18);
    });

    it('return the correct currency for USD and EUR strings', () => {
      expect(
        getDecimalsForCurrency({
          type: RequestLogicTypes.CURRENCY.ISO4217,
          value: 'USD',
        }),
      ).toEqual(2);

      expect(
        getDecimalsForCurrency({
          type: RequestLogicTypes.CURRENCY.ISO4217,
          value: 'EUR',
        }),
      ).toEqual(2);
    });

    it('throws for unknown ISO4217 currency', () => {
      expect(() =>
        getDecimalsForCurrency({
          type: RequestLogicTypes.CURRENCY.ISO4217,
          value: 'YOYO',
        }),
      ).toThrow(`Unsupported ISO currency YOYO`);
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

    it('return the correct currency for CUSD-celo string', () => {
      expect(stringToCurrency('CUSD-celo')).toEqual({
        network: 'celo',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
      });
    });

    it('return the correct currency for CTBK-rinkeby string', () => {
      expect(stringToCurrency('CTBK-rinkeby')).toEqual({
        network: 'rinkeby',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x995d6A8C21F24be1Dd04E105DD0d83758343E258',
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

    it('throws for empty string', () => {
      expect(() => stringToCurrency('')).toThrow(`Currency string can't be empty.`);
    });
  });

  describe('currencyToString', () => {
    it('return "ETH" string for ETH currency', () => {
      expect(
        currencyToString({
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        }),
      ).toEqual('ETH');
    });

    it('return "ETH-rinkeby" string for ETH on rinkeby currency', () => {
      expect(
        currencyToString({
          network: 'rinkeby',
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        }),
      ).toEqual('ETH-rinkeby');
    });

    it('return "BTC" string for BTC currency', () => {
      expect(
        currencyToString({
          type: RequestLogicTypes.CURRENCY.BTC,
          value: 'BTC',
        }),
      ).toEqual('BTC');
    });

    it('return "BTC-testnet" string for BTC currency on testnet', () => {
      expect(
        currencyToString({
          network: 'testnet',
          type: RequestLogicTypes.CURRENCY.BTC,
          value: 'BTC',
        }),
      ).toEqual('BTC-testnet');
    });

    it('return the "SAI" string for SAI currency', () => {
      expect(
        currencyToString({
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359',
        }),
      ).toEqual('SAI');
    });

    it('return the "REQ" string for REQ currency', () => {
      expect(
        currencyToString({
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x8f8221aFbB33998d8584A2B05749bA73c37a938a',
        }),
      ).toEqual('REQ');
    });

    it('return the "CUSD-celo" string for Celo CUSD currency', () => {
      expect(
        currencyToString({
          network: 'celo',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
        }),
      ).toEqual('CUSD-celo');
    });

    it('return the "CTBK-rinkeby" string for CTBK currency', () => {
      expect(
        currencyToString({
          network: 'rinkeby',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x995d6A8C21F24be1Dd04E105DD0d83758343E258',
        }),
      ).toEqual('CTBK-rinkeby');
    });

    it('return the correct strings for USD and EUR currency', () => {
      expect(
        currencyToString({
          type: RequestLogicTypes.CURRENCY.ISO4217,
          value: 'USD',
        }),
      ).toEqual('USD');

      expect(
        currencyToString({
          type: RequestLogicTypes.CURRENCY.ISO4217,
          value: 'EUR',
        }),
      ).toEqual('EUR');
    });

    it('return unknown for REQ not on mainnet', () => {
      expect(
        currencyToString({
          network: 'rinkeby',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x8f8221aFbB33998d8584A2B05749bA73c37a938a',
        }),
      ).toEqual('unknown');
    });

    it('return unknown unsupported currency', () => {
      expect(
        currencyToString({
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x1111111111111111111111111111111111111111',
        }),
      ).toEqual('unknown');
    });

    it('return unknown for Celo CUSD on mainnet', () => {
      expect(
        currencyToString({
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
        }),
      ).toEqual('unknown');
    });

    it('return default if type unkown', () => {
      expect(
        currencyToString({
          type: 'unknown' as RequestLogicTypes.CURRENCY,
          value: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
        }),
      ).toEqual('unknown');
    });
  });

  describe('getCurrencyHash', () => {
    const ethDefault: RequestLogicTypes.ICurrency = {
      type: RequestLogicTypes.CURRENCY.ETH,
      value: 'eth',
    };
    const ethMainnet: RequestLogicTypes.ICurrency = {
      type: RequestLogicTypes.CURRENCY.ETH,
      value: 'eth',
      network: 'mainnet',
    };
    const ethRinkeby: RequestLogicTypes.ICurrency = {
      type: RequestLogicTypes.CURRENCY.ETH,
      value: 'eth',
      network: 'rinkeby',
    };

    const btcDefault: RequestLogicTypes.ICurrency = {
      type: RequestLogicTypes.CURRENCY.BTC,
      value: 'btc',
    };
    const btcMainnet: RequestLogicTypes.ICurrency = {
      type: RequestLogicTypes.CURRENCY.BTC,
      value: 'btc',
      network: 'mainnet',
    };
    const btcRinkeby: RequestLogicTypes.ICurrency = {
      type: RequestLogicTypes.CURRENCY.BTC,
      value: 'btc',
      network: 'testnet',
    };

    const USD: RequestLogicTypes.ICurrency = {
      type: RequestLogicTypes.CURRENCY.ISO4217,
      value: 'USD',
    };
    const EUR: RequestLogicTypes.ICurrency = {
      type: RequestLogicTypes.CURRENCY.ISO4217,
      value: 'EUR',
    };

    const DAI: RequestLogicTypes.ICurrency = {
      type: RequestLogicTypes.CURRENCY.ERC20,
      value: '0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35',
    };

    describe('ETH currency hash', () => {
      it('can get currency hash of eth', () => {
        const ethAddressHash = '0xf5af88e117747e87fc5929f2ff87221b1447652e';

        expect(getCurrencyHash(ethDefault)).toBe(ethAddressHash);
        expect(getCurrencyHash(ethMainnet)).toBe(ethAddressHash);
        expect(getCurrencyHash(ethRinkeby)).toBe(ethAddressHash);
      });
    });

    describe('BTC currency hash', () => {
      it('can get currency hash of BTC', () => {
        const btcAddressHash = '0x03049758a18d1589388d7a74fb71c3fcce11d286';

        expect(getCurrencyHash(btcDefault)).toBe(btcAddressHash);
        expect(getCurrencyHash(btcMainnet)).toBe(btcAddressHash);
        expect(getCurrencyHash(btcRinkeby)).toBe(btcAddressHash);
      });
    });

    describe('FIAT currency hash', () => {
      it('can get currency hash of USD', () => {
        expect(getCurrencyHash(USD)).toBe('0x775eb53d00dd0acd3ec1696472105d579b9b386b');
      });
      it('can get currency hash of EUR', () => {
        expect(getCurrencyHash(EUR)).toBe('0x17b4158805772ced11225e77339f90beb5aae968');
      });
    });

    describe('ERC20 currency hash', () => {
      it('can get currency hash of ERC20', () => {
        expect(getCurrencyHash(DAI)).toBe('0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35');
      });
    });
  });
});
