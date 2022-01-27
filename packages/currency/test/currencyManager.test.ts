import { RequestLogicTypes } from '@requestnetwork/types';
import { CurrencyInput, CurrencyDefinition, CurrencyManager, ERC20Currency } from '../src';

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

describe('CurrencyManager', () => {
  let currencyManager: CurrencyManager;
  beforeEach(() => {
    currencyManager = CurrencyManager.getDefault();
  });

  describe('Creating a CurrencyManager', () => {
    it('can get a default currency manager', () => {
      expect(currencyManager.from('DAI')).toBeDefined();
    });

    it('can get the default list of currencies', () => {
      const list = CurrencyManager.getDefaultList();
      expect(list.find((x) => x.symbol === 'DAI')).toBeDefined();
    });

    it('can instantiate a currency manager based on a currency list', () => {
      const list: CurrencyInput[] = [
        { type: RequestLogicTypes.CURRENCY.ETH, decimals: 18, network: 'anything', symbol: 'ANY' },
      ];
      currencyManager = new CurrencyManager(list);
      expect(currencyManager.from('ANY')).toBeDefined();
    });

    it('fails if there is a duplicate token in the list', () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const dai = CurrencyManager.getDefaultList().find((x) => x.id === 'DAI-mainnet')!;
      const list: CurrencyInput[] = [dai, dai, dai, dai];
      expect(() => new CurrencyManager(list)).toThrowError('Duplicate found: DAI-mainnet');
    });

    it('fixes wrong ERC20 address case', () => {
      const currencyManager = new CurrencyManager([
        {
          type: RequestLogicTypes.CURRENCY.ERC20,
          symbol: 'FAKE',
          address: '0x38cf23c52bb4b13f051aec09580a2de845a7fa35',
          decimals: 18,
          network: 'private',
        },
      ]);
      const fake = currencyManager.from('FAKE') as ERC20Currency;
      // right case
      expect(fake.address).toBe('0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35');

      // it can match it from right case or wrong

      expect(currencyManager.fromAddress('0x38cf23c52bb4b13f051aec09580a2de845a7fa35')?.id).toBe(
        'FAKE-private',
      );
      expect(currencyManager.fromAddress('0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35')?.id).toBe(
        'FAKE-private',
      );
    });
  });

  describe('Accessing currencies', () => {
    it('access a common token by its symbol', () => {
      expect(currencyManager.from('DAI')).toMatchObject({
        symbol: 'DAI',
        network: 'mainnet',
      });
      expect(currencyManager.fromSymbol('DAI')).toBeDefined();
    });

    it('access a chain-specific token by its symbol', () => {
      expect(currencyManager.from('CELO')).toMatchObject({
        network: 'celo',
      });
      expect(currencyManager.fromSymbol('CELO')).toMatchObject({
        network: 'celo',
      });
    });

    it('access a multichain token by its symbol and network', () => {
      expect(currencyManager.from('DAI-matic')).toMatchObject({
        symbol: 'DAI',
        network: 'matic',
      });

      expect(currencyManager.fromSymbol('DAI-matic')).toBeUndefined();

      expect(currencyManager.from('DAI', 'matic')).toMatchObject({
        symbol: 'DAI',
        network: 'matic',
      });
      expect(currencyManager.fromSymbol('DAI', 'matic')).toMatchObject({
        symbol: 'DAI',
        network: 'matic',
      });
    });

    it('access a currency by its id', () => {
      expect(currencyManager.from('ETH-rinkeby-rinkeby')).toMatchObject({
        symbol: 'ETH-rinkeby',
        network: 'rinkeby',
      });
    });

    it('access a mainnet token by its address with or without network', () => {
      expect(currencyManager.from('0x6B175474E89094C44Da98b954EedeAC495271d0F')).toMatchObject({
        symbol: 'DAI',
        network: 'mainnet',
      });
      expect(
        currencyManager.from('0x6B175474E89094C44Da98b954EedeAC495271d0F', 'mainnet'),
      ).toMatchObject({
        symbol: 'DAI',
        network: 'mainnet',
      });
      expect(
        currencyManager.fromAddress('0x6B175474E89094C44Da98b954EedeAC495271d0F'),
      ).toMatchObject({
        symbol: 'DAI',
        network: 'mainnet',
      });
      expect(
        currencyManager.fromAddress('0x6B175474E89094C44Da98b954EedeAC495271d0F', 'mainnet'),
      ).toMatchObject({
        symbol: 'DAI',
        network: 'mainnet',
      });
    });

    it('access a mainnet token by its address whatever the case', () => {
      expect(currencyManager.from('0x6b175474e89094c44da98b954eedeac495271d0f')).toMatchObject({
        symbol: 'DAI',
        network: 'mainnet',
      });
      expect(currencyManager.from('0x6B175474E89094C44DA98B954EEDEAC495271D0F')).toMatchObject({
        symbol: 'DAI',
        network: 'mainnet',
      });
    });

    it('access a token by its address and network', () => {
      expect(
        currencyManager.from('0xD3b71117E6C1558c1553305b44988cd944e97300', 'matic'),
      ).toMatchObject({
        symbol: 'YEL',
        network: 'matic',
      });
      expect(
        currencyManager.from('0xD3b71117E6C1558c1553305b44988cd944e97300', 'fantom'),
      ).toMatchObject({
        symbol: 'YEL',
        network: 'fantom',
      });

      expect(
        currencyManager.fromAddress('0xD3b71117E6C1558c1553305b44988cd944e97300', 'matic'),
      ).toMatchObject({
        symbol: 'YEL',
        network: 'matic',
      });
      expect(
        currencyManager.fromAddress('0xD3b71117E6C1558c1553305b44988cd944e97300', 'fantom'),
      ).toMatchObject({
        symbol: 'YEL',
        network: 'fantom',
      });
    });

    it('defaults to mainnet for native tokens with a mainnet equivalent', () => {
      expect(currencyManager.from('MATIC')).toMatchObject({
        symbol: 'MATIC',
        network: 'mainnet',
        type: RequestLogicTypes.CURRENCY.ERC20,
      });
      expect(currencyManager.from('MATIC-matic')).toMatchObject({
        symbol: 'MATIC',
        network: 'matic',
        type: RequestLogicTypes.CURRENCY.ETH,
      });
    });

    it('returns undefined for empty symbol', () => {
      expect(currencyManager.fromSymbol('')).toBeUndefined();
    });

    it('returns undefined and logs a warning on conflict', () => {
      const warnSpy = jest.spyOn(console, 'warn');
      expect(currencyManager.from('0xD3b71117E6C1558c1553305b44988cd944e97300')).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(
        '0xD3b71117E6C1558c1553305b44988cd944e97300 has several matches on matic, fantom. To avoid errors, specify a network.',
      );
    });

    it('returns undefined for a known address on another network', () => {
      expect(
        currencyManager.fromAddress('0xFab46E002BbF0b4509813474841E0716E6730136'),
      ).toBeDefined();
      expect(
        currencyManager.fromAddress('0xFab46E002BbF0b4509813474841E0716E6730136', 'rinkeby'),
      ).toBeDefined();
      expect(
        currencyManager.fromAddress('0xFab46E002BbF0b4509813474841E0716E6730136', 'mainnet'),
      ).not.toBeDefined();
    });

    it('returns undefined for undefined or empty string', () => {
      expect(currencyManager.from(undefined)).toBeUndefined();
      expect(currencyManager.from('')).toBeUndefined();
    });

    describe('fromStorageCurrency', () => {
      it('can access a token from its storage format', () => {
        expect(
          currencyManager.fromStorageCurrency({
            type: RequestLogicTypes.CURRENCY.ERC20,
            value: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          }),
        ).toMatchObject({ id: 'DAI-mainnet' });
        expect(
          currencyManager.fromStorageCurrency({
            type: RequestLogicTypes.CURRENCY.ERC20,
            value: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            network: 'mainnet',
          }),
        ).toMatchObject({ id: 'DAI-mainnet' });
      });

      it('can access native tokens from storage format', () => {
        expect(
          currencyManager.fromStorageCurrency({
            type: RequestLogicTypes.CURRENCY.ETH,
            value: 'ETH',
          }),
        ).toMatchObject({ id: 'ETH-mainnet' });

        expect(
          currencyManager.fromStorageCurrency({
            type: RequestLogicTypes.CURRENCY.ETH,
            value: 'ETH',
          }),
        ).toMatchObject({ id: 'ETH-mainnet' });

        expect(
          currencyManager.fromStorageCurrency({
            type: RequestLogicTypes.CURRENCY.ETH,
            value: 'WRONG!',
            network: 'mainnet',
          }),
        ).toMatchObject({ id: 'ETH-mainnet' });

        expect(
          currencyManager.fromStorageCurrency({
            type: RequestLogicTypes.CURRENCY.ETH,
            value: 'ETH-rinkeby',
            network: 'rinkeby',
          }),
        ).toMatchObject({ id: 'ETH-rinkeby-rinkeby' });

        expect(
          currencyManager.fromStorageCurrency({
            type: RequestLogicTypes.CURRENCY.ETH,
            value: 'ETH',
            network: 'rinkeby',
          }),
        ).toMatchObject({ id: 'ETH-rinkeby-rinkeby' });
      });

      it('can access fiat currencies from storage format', () => {
        expect(
          currencyManager.fromStorageCurrency({
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
        expect(def).toBeDefined();
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

  describe('Validate addresses', () => {
    const bitcoinAddresses: Record<string, string> = {
      mainnet: '1JwZzh9HLK5M4VZ98yBQLeFiGuL97vQvL3',
      testnet: 'n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF',
    };

    const nearAddresses: Record<string, string> = {
      aurora: 'requestnetwork.near',
      'aurora-testnet': 'requestnetwork.testnet',
    };

    const eip55Addresses: string[] = [
      // All Caps
      '0x52908400098527886E0F7030069857D2E4169EE7',
      '0x8617E340B3D01FA5F11F306F4090FD50E238070D',
      // All Lower
      '0xde709f2102306220921060314715629080e2fb77',
      '0x27b1fdb04752bbc536007a920d24acb045561c26',
      // Normal
      '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
      '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
      '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB',
      '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb',
    ];

    const extendedTestCasesPerNetwork: Record<
      string,
      Record<string, Partial<CurrencyDefinition>>
    > = {
      ...testCasesPerNetwork,
      aurora: {
        NEAR: {
          type: RequestLogicTypes.CURRENCY.ETH,
          symbol: 'NEAR',
          network: 'aurora',
        },
        'NEAR-testnet': {
          type: RequestLogicTypes.CURRENCY.ETH,
          symbol: 'NEAR-testnet',
          network: 'aurora-testnet',
        },
      },
    };

    const testValidateAddressForCurrency = (
      address: string,
      currency: CurrencyDefinition | undefined,
      expectedResult = true,
    ) => {
      if (!currency) {
        throw new Error('currency is undefined');
      }
      const result = CurrencyManager.validateAddress(address, currency);
      expect(result).toBe(expectedResult);
    };

    describe(`valid cases`, () => {
      Object.entries(extendedTestCasesPerNetwork).forEach(([network, testCases]) => {
        if (network === 'other') {
          return;
        }
        describe(`valid cases for ${network}`, () => {
          Object.entries(testCases).forEach(([, currencyTemplate]) => {
            it(`should validate ${network}.${currencyTemplate.symbol}`, () => {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              const currency = currencyManager.fromSymbol(currencyTemplate.symbol!)!;
              switch (currency.type) {
                case RequestLogicTypes.CURRENCY.ETH:
                case RequestLogicTypes.CURRENCY.ERC20:
                  switch (currency.symbol) {
                    case 'NEAR':
                    case 'NEAR-testnet':
                      testValidateAddressForCurrency(nearAddresses[currency.network], currency);
                      break;
                    default:
                      eip55Addresses.forEach((address) =>
                        testValidateAddressForCurrency(address, currency),
                      );
                  }
                  break;
                case RequestLogicTypes.CURRENCY.BTC:
                  testValidateAddressForCurrency(bitcoinAddresses[currency.network], currency);
                  break;
                default:
                  throw new Error(`Could not generate a valid address for an unknown type`);
              }
            });
          });
        });
      });
    });

    describe(`invalid cases`, () => {
      it('should not validate bitcoin addresses on ethereum network', () => {
        const currency = currencyManager.from('ETH', 'mainnet');
        testValidateAddressForCurrency(bitcoinAddresses.mainnet, currency, false);
      });
      it('should not validate bitcoin mainnet addresses on bitcoin testnet network', () => {
        const currency = currencyManager.from('BTC-testnet', 'testnet');
        testValidateAddressForCurrency(bitcoinAddresses.mainnet, currency, false);
      });
      it('should not validate bitcoin testnet addresses on bitcoin mainnet network', () => {
        const currency = currencyManager.from('BTC-testnet', 'mainnet');
        testValidateAddressForCurrency(bitcoinAddresses.testnet, currency, false);
      });
      it('should not validate ethereum addresses on bitcoin network', () => {
        const currency = currencyManager.from('BTC', 'mainnet');
        testValidateAddressForCurrency(eip55Addresses[0], currency, false);
      });
      describe(`ISO4217 currencies`, () => {
        Object.entries(testCasesPerNetwork.other).forEach(([, currencyTemplate]) => {
          it(`should throw for ${currencyTemplate.symbol} currency`, () => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const currency = currencyManager.from(currencyTemplate.symbol)!;
            expect(() => CurrencyManager.validateAddress('anyAddress', currency)).toThrow();
          });
        });
      });
    });
  });

  describe('Conversion paths', () => {
    let eur: CurrencyDefinition, usd: CurrencyDefinition, dai: CurrencyDefinition;
    beforeEach(() => {
      eur = currencyManager.from('EUR')!;
      usd = currencyManager.from('USD')!;
      dai = currencyManager.from('DAI')!;
    });

    it('has a default conversion path', () => {
      const path = currencyManager.getConversionPath(eur, dai, 'mainnet');
      expect(path).toMatchObject([eur.hash, usd.hash, dai.hash.toLowerCase()]);
    });

    it('can override the default conversion path', () => {
      const manager = new CurrencyManager(CurrencyManager.getDefaultList(), undefined, {
        mainnet: { [eur.hash]: { [dai.hash.toLocaleLowerCase()]: 1 } },
      });
      const path = manager.getConversionPath(eur, dai, 'mainnet');
      expect(path).toMatchObject([eur.hash, dai.hash.toLowerCase()]);
    });
  });
});
