import { RequestLogicTypes } from '@requestnetwork/types';
import { getPath } from '../src/chainlink-path-aggregators';

describe('chainlink-path-aggregators', () => {
  describe('getPath', () => {
    const BTC: RequestLogicTypes.ICurrency = {type: RequestLogicTypes.CURRENCY.BTC, value:'btc'};

    const USD: RequestLogicTypes.ICurrency = {type: RequestLogicTypes.CURRENCY.ISO4217, value: 'USD' };
    const EUR: RequestLogicTypes.ICurrency = {type: RequestLogicTypes.CURRENCY.ISO4217, value: 'EUR' };

    const DAI: RequestLogicTypes.ICurrency = {type: RequestLogicTypes.CURRENCY.ERC20, value:'0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35'};

    describe('private network', () => {
      it('can get path from EUR to DAI', () => {
        expect(getPath(EUR, DAI, 'private')).toEqual([ '0x17b4158805772ced11225e77339f90beb5aae968',
        '0x775eb53d00dd0acd3ec1696472105d579b9b386b',
        '0x38cf23c52bb4b13f051aec09580a2de845a7fa35' ] );
      });

      it('can get path from USD to DAI', () => {
        expect(getPath(USD, DAI, 'private')).toEqual([ '0x775eb53d00dd0acd3ec1696472105d579b9b386b',
        '0x38cf23c52bb4b13f051aec09580a2de845a7fa35' ] );
      });

      it('cannot get path from USD to BTC', () => {
        expect(getPath(USD, BTC, 'private')).toBeNull();
      });

      it('cannot get path from invalid network', () => {
        expect(() => getPath(USD, DAI, 'unsupported-network')).toThrowError('network not supported');
      });
    });
  });
});
