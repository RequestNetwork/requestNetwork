import { RequestLogicTypes } from '@requestnetwork/types';
import { CurrencyInput, CurrencyDefinition, CurrencyManager } from '../src';
describe('CurrencyManager', () => {
  describe('Creating a CurrencyManager', () => {
    it('can get a default currency manager', () => {
      const currencyManager = CurrencyManager.getDefault();
      expect(currencyManager.from('DAI')).toBeDefined();
    });

    it('can get the default list of currencies', () => {
      const list = CurrencyManager.getDefaultList();
      expect(list.find((x) => x.symbol === 'DAI')).toBeDefined();
    });

    it('can instanciate a currency manager based on a currency list', () => {
      const list: CurrencyInput[] = [
        { type: RequestLogicTypes.CURRENCY.ETH, decimals: 18, network: 'anything', symbol: 'ANY' },
      ];
      const manager = new CurrencyManager(list);
      expect(manager.from('ANY')).toBeDefined();
    });
  });

  describe('Accessing currencies', () => {
    it('access a common token by its symbol', () => {
      const manager = CurrencyManager.getDefault();
      expect(manager.from('DAI')).toMatchObject({
        symbol: 'DAI',
        network: 'mainnet',
      });
      expect(manager.fromSymbol('DAI')).toBeDefined();
    });

    it('access a chain-specific token by its symbol', () => {
      const manager = CurrencyManager.getDefault();
      expect(manager.from('CELO')).toMatchObject({
        network: 'celo',
      });
      expect(manager.fromSymbol('CELO')).toMatchObject({
        network: 'celo',
      });
    });

    it('access a multichain token by its symbol and network', () => {
      const manager = CurrencyManager.getDefault();
      expect(manager.from('DAI-matic')).toMatchObject({
        symbol: 'DAI',
        network: 'matic',
      });

      expect(manager.fromSymbol('DAI-matic')).toBeUndefined();

      expect(manager.from('DAI', 'matic')).toMatchObject({
        symbol: 'DAI',
        network: 'matic',
      });
      expect(manager.fromSymbol('DAI', 'matic')).toMatchObject({
        symbol: 'DAI',
        network: 'matic',
      });
    });

    it('access a mainnet token by its address with or without network', () => {
      const manager = CurrencyManager.getDefault();
      expect(manager.from('0x6B175474E89094C44Da98b954EedeAC495271d0F')).toMatchObject({
        symbol: 'DAI',
        network: 'mainnet',
      });
      expect(manager.from('0x6B175474E89094C44Da98b954EedeAC495271d0F', 'mainnet')).toMatchObject({
        symbol: 'DAI',
        network: 'mainnet',
      });
    });

    it('access a token by its address and network', () => {
      const manager = CurrencyManager.getDefault();

      expect(manager.from('0xD3b71117E6C1558c1553305b44988cd944e97300', 'matic')).toMatchObject({
        symbol: 'YEL',
        network: 'matic',
      });
      expect(manager.from('0xD3b71117E6C1558c1553305b44988cd944e97300', 'fantom')).toMatchObject({
        symbol: 'YEL',
        network: 'fantom',
      });

      expect(
        manager.fromAddress('0xD3b71117E6C1558c1553305b44988cd944e97300', 'matic'),
      ).toMatchObject({
        symbol: 'YEL',
        network: 'matic',
      });
      expect(
        manager.fromAddress('0xD3b71117E6C1558c1553305b44988cd944e97300', 'fantom'),
      ).toMatchObject({
        symbol: 'YEL',
        network: 'fantom',
      });
    });

    it('returns undefined for empty symbol', () => {
      const manager = CurrencyManager.getDefault();
      expect(manager.fromSymbol('')).toBeUndefined();
    });

    it('returns undefined and logs a warning on conflict', () => {
      const manager = CurrencyManager.getDefault();
      const warnSpy = jest.spyOn(console, 'warn');
      expect(manager.from('0xD3b71117E6C1558c1553305b44988cd944e97300')).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(
        '0xD3b71117E6C1558c1553305b44988cd944e97300 has several matches on matic, fantom. To avoid errors, specify a network.',
      );
    });
  });

  describe('Extending currencies', () => {
    it('Can specify metadata type', () => {
      const currencyManager = new CurrencyManager([
        {
          type: RequestLogicTypes.CURRENCY.ETH,
          symbol: 'ABCD',
          decimals: 18,
          network: 'private',
          meta: {
            rate: 0.1,
          },
        },
      ]);

      expect(currencyManager.from('ABCD')?.meta?.rate).toBe(0.1);
    });
  });

  describe('Default currencies', () => {
    const currencyManager = CurrencyManager.getDefault();
    const testCasesPerNetwork: Record<string, Record<string, Partial<CurrencyDefinition>>> = {
      mainnet: {
        ETH: { symbol: 'ETH', network: 'mainnet' },
        SAI: {
          address: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359',
          decimals: 18,
          symbol: 'SAI',
          network: 'mainnet',
        },
        DAI: {
          address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          decimals: 18,
          symbol: 'DAI',
          network: 'mainnet',
        },
      },
      // matic: {
      //   MATIC: { symbol: 'MATIC', network: 'matic' },
      // },
      celo: {
        CELO: { symbol: 'CELO', network: 'celo' },
        cUSD: {
          address: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
          decimals: 18,
          symbol: 'cUSD',
          network: 'celo',
        },
      },
      rinkeby: {
        'ETH-rinkeby': { symbol: 'ETH-rinkeby', network: 'rinkeby' },
        CTBK: {
          address: '0x995d6A8C21F24be1Dd04E105DD0d83758343E258',
          decimals: 18,
          symbol: 'CTBK',
          network: 'rinkeby',
        },
        FAU: {
          address: '0xFab46E002BbF0b4509813474841E0716E6730136',
          decimals: 18,
          symbol: 'FAU',
          network: 'rinkeby',
        },
      },
      bitcoin: {
        BTC: { symbol: 'BTC' },
        'BTC-testnet': { symbol: 'BTC-testnet', network: 'testnet' },
      },
      other: {
        EUR: { decimals: 2, symbol: 'EUR' },
        USD: { decimals: 2, symbol: 'USD' },
      },
    };
    Object.entries(testCasesPerNetwork).forEach(([network, testCases]) => {
      describe(network, () => {
        Object.entries(testCases).forEach(([symbol, expected]) => {
          it(`Resolves ${symbol}`, () => {
            expect(currencyManager.fromSymbol(symbol)).toMatchObject(expected);
          });
        });
      });
    });
  });
});
