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
    const defaultManager = CurrencyManager.getDefault();
    it('access a common token by its symbol', () => {
      expect(defaultManager.from('DAI')).toMatchObject({
        symbol: 'DAI',
        network: 'mainnet',
      });
      expect(defaultManager.fromSymbol('DAI')).toBeDefined();
    });

    it('access a chain-specific token by its symbol', () => {
      expect(defaultManager.from('CELO')).toMatchObject({
        network: 'celo',
      });
      expect(defaultManager.fromSymbol('CELO')).toMatchObject({
        network: 'celo',
      });
    });

    it('access a multichain token by its symbol and network', () => {
      expect(defaultManager.from('DAI-matic')).toMatchObject({
        symbol: 'DAI',
        network: 'matic',
      });

      expect(defaultManager.fromSymbol('DAI-matic')).toBeUndefined();

      expect(defaultManager.from('DAI', 'matic')).toMatchObject({
        symbol: 'DAI',
        network: 'matic',
      });
      expect(defaultManager.fromSymbol('DAI', 'matic')).toMatchObject({
        symbol: 'DAI',
        network: 'matic',
      });
    });

    it('access a mainnet token by its address with or without network', () => {
      expect(defaultManager.from('0x6B175474E89094C44Da98b954EedeAC495271d0F')).toMatchObject({
        symbol: 'DAI',
        network: 'mainnet',
      });
      expect(
        defaultManager.from('0x6B175474E89094C44Da98b954EedeAC495271d0F', 'mainnet'),
      ).toMatchObject({
        symbol: 'DAI',
        network: 'mainnet',
      });
      expect(
        defaultManager.fromAddress('0x6B175474E89094C44Da98b954EedeAC495271d0F'),
      ).toMatchObject({
        symbol: 'DAI',
        network: 'mainnet',
      });
      expect(
        defaultManager.fromAddress('0x6B175474E89094C44Da98b954EedeAC495271d0F', 'mainnet'),
      ).toMatchObject({
        symbol: 'DAI',
        network: 'mainnet',
      });
    });

    it('access a mainnet token by its address whatever the case', () => {
      expect(defaultManager.from('0x6b175474e89094c44da98b954eedeac495271d0f')).toMatchObject({
        symbol: 'DAI',
        network: 'mainnet',
      });
      expect(defaultManager.from('0x6B175474E89094C44DA98B954EEDEAC495271D0F')).toMatchObject({
        symbol: 'DAI',
        network: 'mainnet',
      });
    });

    it('access a token by its address and network', () => {
      expect(
        defaultManager.from('0xD3b71117E6C1558c1553305b44988cd944e97300', 'matic'),
      ).toMatchObject({
        symbol: 'YEL',
        network: 'matic',
      });
      expect(
        defaultManager.from('0xD3b71117E6C1558c1553305b44988cd944e97300', 'fantom'),
      ).toMatchObject({
        symbol: 'YEL',
        network: 'fantom',
      });

      expect(
        defaultManager.fromAddress('0xD3b71117E6C1558c1553305b44988cd944e97300', 'matic'),
      ).toMatchObject({
        symbol: 'YEL',
        network: 'matic',
      });
      expect(
        defaultManager.fromAddress('0xD3b71117E6C1558c1553305b44988cd944e97300', 'fantom'),
      ).toMatchObject({
        symbol: 'YEL',
        network: 'fantom',
      });
    });

    it('defaults to mainnet for native tokens with a mainnet equivalent', () => {
      expect(defaultManager.from('MATIC')).toMatchObject({
        symbol: 'MATIC',
        network: 'mainnet',
        type: RequestLogicTypes.CURRENCY.ERC20,
      });
      expect(defaultManager.from('MATIC-matic')).toMatchObject({
        symbol: 'MATIC',
        network: 'matic',
        type: RequestLogicTypes.CURRENCY.ETH,
      });
    });

    it('returns undefined for empty symbol', () => {
      expect(defaultManager.fromSymbol('')).toBeUndefined();
    });

    it('returns undefined and logs a warning on conflict', () => {
      const warnSpy = jest.spyOn(console, 'warn');
      expect(defaultManager.from('0xD3b71117E6C1558c1553305b44988cd944e97300')).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(
        '0xD3b71117E6C1558c1553305b44988cd944e97300 has several matches on matic, fantom. To avoid errors, specify a network.',
      );
    });

    it('returns undefined for a known address on another network', () => {
      expect(
        defaultManager.fromAddress('0xFab46E002BbF0b4509813474841E0716E6730136'),
      ).toBeDefined();
      expect(
        defaultManager.fromAddress('0xFab46E002BbF0b4509813474841E0716E6730136', 'rinkeby'),
      ).toBeDefined();
      expect(
        defaultManager.fromAddress('0xFab46E002BbF0b4509813474841E0716E6730136', 'mainnet'),
      ).not.toBeDefined();
    });

    describe('fromStorageCurrency', () => {
      it('can access a token from its storage format', () => {
        expect(
          defaultManager.fromStorageCurrency({
            type: RequestLogicTypes.CURRENCY.ERC20,
            value: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          }),
        ).toMatchObject({ id: 'DAI-mainnet' });
        expect(
          defaultManager.fromStorageCurrency({
            type: RequestLogicTypes.CURRENCY.ERC20,
            value: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            network: 'mainnet',
          }),
        ).toMatchObject({ id: 'DAI-mainnet' });
      });

      it('can access native tokens from storage format', () => {
        expect(
          defaultManager.fromStorageCurrency({
            type: RequestLogicTypes.CURRENCY.ETH,
            value: 'ETH',
          }),
        ).toMatchObject({ id: 'ETH-mainnet' });

        expect(
          defaultManager.fromStorageCurrency({
            type: RequestLogicTypes.CURRENCY.ETH,
            value: 'ETH',
          }),
        ).toMatchObject({ id: 'ETH-mainnet' });

        expect(
          defaultManager.fromStorageCurrency({
            type: RequestLogicTypes.CURRENCY.ETH,
            value: 'WRONG!',
            network: 'mainnet',
          }),
        ).toMatchObject({ id: 'ETH-mainnet' });
      });

      it('can access fiat currencies from storage format', () => {
        expect(
          defaultManager.fromStorageCurrency({
            type: RequestLogicTypes.CURRENCY.ISO4217,
            value: 'EUR',
          }),
        ).toMatchObject({ id: 'EUR' });
      });
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
      evm: {
        // defaults to mainnet tokens!
        MATIC: { symbol: 'MATIC', network: 'mainnet', type: RequestLogicTypes.CURRENCY.ERC20 },
        FTM: { symbol: 'FTM', network: 'mainnet', type: RequestLogicTypes.CURRENCY.ERC20 },
        FUSE: { symbol: 'FUSE', network: 'mainnet', type: RequestLogicTypes.CURRENCY.ERC20 },
        'MATIC-matic': { symbol: 'MATIC', network: 'matic', type: RequestLogicTypes.CURRENCY.ETH },
        'FTM-fantom': { symbol: 'FTM', network: 'fantom', type: RequestLogicTypes.CURRENCY.ETH },
        'FUSE-fuse': { symbol: 'FUSE', network: 'fuse', type: RequestLogicTypes.CURRENCY.ETH },
      },
      celo: {
        CELO: { symbol: 'CELO', network: 'celo' },
        cUSD: {
          address: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
          decimals: 18,
          symbol: 'cUSD',
          network: 'celo',
        },
        // different case
        CUSD: {
          address: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
          decimals: 18,
          symbol: 'cUSD',
          network: 'celo',
        },
        cGLD: {
          address: '0x471EcE3750Da237f93B8E339c536989b8978a438',
          decimals: 18,
          symbol: 'cGLD',
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
            expect(currencyManager.from(symbol)).toMatchObject(expected);
          });
        });
      });
    });
  });

  describe('Conflicting currencies', () => {
    const currencyManager = CurrencyManager.getDefault();
    it('TOP', () => {
      expect(currencyManager.from('TOP')).toMatchObject({
        type: RequestLogicTypes.CURRENCY.ISO4217,
      });
      expect(currencyManager.from('TOP', 'mainnet')).toMatchObject({
        type: RequestLogicTypes.CURRENCY.ERC20,
      });
    });
    it('BOB', () => {
      expect(currencyManager.from('BOB')).toMatchObject({
        type: RequestLogicTypes.CURRENCY.ISO4217,
      });
      expect(currencyManager.from('BOB', 'mainnet')).toMatchObject({
        type: RequestLogicTypes.CURRENCY.ERC20,
      });
    });
    it('MNT', () => {
      expect(currencyManager.from('MNT')).toMatchObject({
        type: RequestLogicTypes.CURRENCY.ISO4217,
      });
      expect(currencyManager.from('MNT', 'mainnet')).toMatchObject({
        type: RequestLogicTypes.CURRENCY.ERC20,
      });
    });
  });

  describe('Back & forth', () => {
    // exclude conflicting & native testnet
    const defaultList = CurrencyManager.getDefaultList().filter(
      (x) =>
        !['BOB', 'MNT', 'TOP'].includes(x.symbol) &&
        !(
          (x.type === RequestLogicTypes.CURRENCY.ETH ||
            x.type === RequestLogicTypes.CURRENCY.BTC) &&
          x.symbol.includes('-')
        ),
    );
    const defaultManager = new CurrencyManager(defaultList);
    defaultList.forEach((currency) => {
      it(currency.id, () => {
        const def = CurrencyManager.fromInput(currency);
        expect(def).toEqual(defaultManager.from(def.id));
        if ('network' in def) {
          expect(def).toEqual(defaultManager.from(def.symbol, def.network));
          expect(def).toEqual(defaultManager.fromSymbol(def.symbol, def.network));
        }
        expect(def).toEqual(
          defaultManager.fromStorageCurrency(CurrencyManager.toStorageCurrency(def)),
        );
      });
    });
  });
});
