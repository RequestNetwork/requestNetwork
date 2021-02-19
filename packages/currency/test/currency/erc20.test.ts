import { RequestLogicTypes } from '@requestnetwork/types';
import {
  getErc20Symbol,
} from '../../src/erc20';

describe('erc20', () => {
  describe('getErc20Symbol', () => {
    it('get the symbol for SAI currency', () => {
      expect(getErc20Symbol({
        network: 'mainnet',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359', // SAI
      })).toEqual('SAI');
    });
    it('get the symbol for CTBK currency', () => {
      expect(getErc20Symbol({
        network: 'rinkeby',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x995d6a8c21f24be1dd04e105dd0d83758343e258',
      })).toEqual('CTBK');
    });
    it('get the symbol for CUSD currency (Celo network)', () => {
      expect(
        getErc20Symbol({
          network: 'celo',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
        }),
      ).toEqual('CUSD');
    });
    it('cannot get the symbol for not ERC20 type', () => {
      expect(
        () => getErc20Symbol({
          type: RequestLogicTypes.CURRENCY.ETH,
          value: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
        }),
      ).toThrow('Can only get symbol for ERC20 currencies');
    });
    it('cannot get the symbol for unknown ERC20', () => {
      expect(
        getErc20Symbol({
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x1111111111111111111111111111111111111111',
        }),
      ).toEqual(null);
    });
    it('cannot get the symbol for unknown network', () => {
      expect(
        getErc20Symbol({
          network: 'unknown',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x1111111111111111111111111111111111111111',
        }),
      ).toEqual(null);
    });
  });
});
