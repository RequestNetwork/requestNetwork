import { RequestLogicTypes } from '@requestnetwork/types';
import { getPath } from '../src/chainlink-path-aggregators';

describe('chainlink-path-aggregators', () => {
  describe('getPath', () => {
    const BTC: RequestLogicTypes.ICurrency = { type: RequestLogicTypes.CURRENCY.BTC, value: 'btc' };

    const USD: RequestLogicTypes.ICurrency = {
      type: RequestLogicTypes.CURRENCY.ISO4217,
      value: 'USD',
    };
    const EUR: RequestLogicTypes.ICurrency = {
      type: RequestLogicTypes.CURRENCY.ISO4217,
      value: 'EUR',
    };

    const privateDAI: RequestLogicTypes.ICurrency = {
      type: RequestLogicTypes.CURRENCY.ERC20,
      value: '0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35',
    };

    const DAI: RequestLogicTypes.ICurrency = {
      type: RequestLogicTypes.CURRENCY.ERC20,
      value: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    };

    const MKR: RequestLogicTypes.ICurrency = {
      type: RequestLogicTypes.CURRENCY.ERC20,
      value: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
    };

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
  });
});
