import { RequestLogicTypes } from '@requestnetwork/types';
import { CurrencyManager } from '../src';
import { getPath } from '../src/chainlink-path-aggregators';

describe('chainlink-path-aggregators', () => {
  describe('getPath', () => {
    const currencyManager = new CurrencyManager([
      ...CurrencyManager.getDefaultList(),
      {
        type: RequestLogicTypes.CURRENCY.ERC20,
        symbol: 'privateDAI',
        network: 'private',
        address: '0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35',
        decimals: 18,
      },
      {
        type: RequestLogicTypes.CURRENCY.ERC20,
        symbol: 'LINK',
        network: 'fantom',
        address: '0xb3654dc3D10Ea7645f8319668E8F54d2574FBdC8',
        decimals: 18,
      },
      {
        type: RequestLogicTypes.CURRENCY.ERC20,
        symbol: 'USDT',
        network: 'fantom',
        address: '0x940F41F0ec9ba1A34CF001cc03347ac092F5F6B5',
        decimals: 6,
      },
    ]);
    const BTC = currencyManager.from('BTC')!;
    const USD = currencyManager.from('USD')!;
    const EUR = currencyManager.from('EUR')!;

    const privateDAI = currencyManager.from('privateDAI')!;
    const DAI = currencyManager.from('DAI')!;
    const DAImatic = currencyManager.from('DAI-matic')!;
    const MKR = currencyManager.from('MKR')!;
    const LINKfantom = currencyManager.from('LINK-fantom')!;
    const USDTfantom = currencyManager.from('USDT-fantom')!;

    describe('private network', () => {
      it('can get path from EUR to DAI', () => {
        expect(getPath(EUR, privateDAI, 'private')).toEqual([
          '0x17b4158805772ced11225e77339f90beb5aae968',
          '0x775eb53d00dd0acd3ec1696472105d579b9b386b',
          '0x38cf23c52bb4b13f051aec09580a2de845a7fa35',
        ]);
      });

      it('can get path from USD to DAI', () => {
        expect(getPath(USD, privateDAI, 'private')).toEqual([
          '0x775eb53d00dd0acd3ec1696472105d579b9b386b',
          '0x38cf23c52bb4b13f051aec09580a2de845a7fa35',
        ]);
      });

      it('cannot get path from USD to BTC', () => {
        expect(getPath(USD, BTC, 'private')).toBeNull();
      });

      it('cannot get path from invalid network', () => {
        expect(() => getPath(USD, privateDAI, 'unsupported-network')).toThrowError(
          'network unsupported-network not supported',
        );
      });
    });

    describe('mainnet', () => {
      it('can get path from EUR to DAI', () => {
        expect(getPath(EUR, DAI, 'mainnet')).toEqual([
          '0x17b4158805772ced11225e77339f90beb5aae968',
          '0x775eb53d00dd0acd3ec1696472105d579b9b386b',
          '0x6b175474e89094c44da98b954eedeac495271d0f',
        ]);
      });

      it('can get path from USD to DAI', () => {
        expect(getPath(USD, DAI, 'mainnet')).toEqual([
          '0x775eb53d00dd0acd3ec1696472105d579b9b386b',
          '0x6b175474e89094c44da98b954eedeac495271d0f',
        ]);
      });

      it('can get path from USD to MKR', () => {
        expect(getPath(USD, MKR, 'mainnet')).toEqual([
          // USD
          '0x775eb53d00dd0acd3ec1696472105d579b9b386b',
          // ETH
          '0xf5af88e117747e87fc5929f2ff87221b1447652e',
          // MKR
          '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
        ]);
      });
    });

    describe('matic', () => {
      it('cannot get path from USD to DAI on matic', () => {
        expect(getPath(USD, DAI, 'matic')).toBeNull();
      });
      it('can get path from USD to DAI-matic on matic', () => {
        expect(getPath(USD, DAImatic, 'matic')).toEqual([
          '0x775eb53d00dd0acd3ec1696472105d579b9b386b',
          '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
        ]);
      });
    });

    describe('fantom', () => {
      it('can get path from USD to Link-fantom on fantom', () => {
        expect(getPath(USD, LINKfantom, 'fantom')).toEqual([
          '0x775eb53d00dd0acd3ec1696472105d579b9b386b',
          '0xb3654dc3d10ea7645f8319668e8f54d2574fbdc8'
        ])
      })
      it('can get path from USD to USDT-fantom on fantom', () => {
        expect(getPath(USD, USDTfantom, 'fantom')).toEqual([
          '0x775eb53d00dd0acd3ec1696472105d579b9b386b',
          '0x940f41f0ec9ba1a34cf001cc03347ac092f5f6b5'
        ])
      })
      it('cannot get path from USD to DAI on fantom', () => {
        expect(getPath(USD, DAI, 'fantom')).toBeNull();
      })
    })
  });
});
