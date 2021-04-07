import { RequestLogicTypes } from '@requestnetwork/types';
import { getErc20Decimals, getErc20Symbol } from '../../src/erc20';

describe('erc20', () => {
  describe('getErc20Symbol', () => {
    it('get the symbol for SAI currency', () => {
      expect(
        getErc20Symbol({
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359', // SAI
        }),
      ).toEqual('SAI');
    });
    it('get the symbol for CTBK currency', () => {
      expect(
        getErc20Symbol({
          network: 'rinkeby',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x995d6A8C21F24be1Dd04E105DD0d83758343E258',
        }),
      ).toEqual('CTBK');
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

    it('can get the symbol for different address case', () => {
      // upper case
      expect(
        getErc20Symbol({
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0X8888801AF4D980682E47F1A9036E589479E835C5', // MPH
        }),
      ).toEqual('MPH');

      // lower case
      expect(
        getErc20Symbol({
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x8888801af4d980682e47f1a9036e589479e835c5', // MPH
        }),
      ).toEqual('MPH');

      // checksum
      expect(
        getErc20Symbol({
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x8888801aF4d980682e47f1A9036e589479e835C5', // MPH
        }),
      ).toEqual('MPH');
    });

    it('cannot get the symbol for not ERC20 type', () => {
      expect(() =>
        getErc20Symbol({
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
  describe('getErc20Decimals', () => {
    it('can get the decimals for SAI', () => {
      expect(
        getErc20Decimals({
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359', // SAI
        }),
      ).toEqual(18);
    });

    it('can get the symbol for different address case', () => {
      // upper case
      expect(
        getErc20Decimals({
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0X8888801AF4D980682E47F1A9036E589479E835C5', // MPH
        }),
      ).toEqual(18);

      // lower case
      expect(
        getErc20Decimals({
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x8888801af4d980682e47f1a9036e589479e835c5', // MPH
        }),
      ).toEqual(18);

      // checksum
      expect(
        getErc20Decimals({
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x8888801aF4d980682e47f1A9036e589479e835C5', // MPH
        }),
      ).toEqual(18);
    });
  });
});
