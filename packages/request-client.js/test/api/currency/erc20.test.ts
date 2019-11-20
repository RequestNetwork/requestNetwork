import { RequestLogicTypes } from '@requestnetwork/types';
import { assert } from 'chai';
import 'mocha';
import {
  getErc20FromSymbol,
  getErc20Symbol,
  getMainnetErc20FromAddress,
  validERC20Address,
} from '../../../src/api/currency/erc20';

describe('api/currency/erc20', () => {
  describe('validERC20Address', () => {
    it('returns true for a correct checksum address', async () => {
      assert.isTrue(validERC20Address('0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359'));
    });

    it('returns false for a non-checksum address', async () => {
      assert.isFalse(validERC20Address('0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359'));
    });

    it('returns false for a wrong', async () => {
      assert.isFalse(validERC20Address('0x0000006b4ccb1b6faa2625fe562bdd9a23260359'));
    });
  });

  describe('getErc20FromSymbol', () => {
    it('get TokenDescription object from SAI string', async () => {
      assert.deepEqual(getErc20FromSymbol('SAI'), {
        address: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359',
        decimals: 18,
        erc20: true,
        logo: 'sai.svg',
        name: 'Sai Stablecoin v1.0',
        symbol: 'SAI',
      });
    });
  });

  describe('getErc20FromAddress', () => {
    it('get TokenDescription object from SAI address', async () => {
      assert.deepEqual(getMainnetErc20FromAddress('0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359'), {
        address: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359',
        decimals: 18,
        erc20: true,
        logo: 'sai.svg',
        name: 'Sai Stablecoin v1.0',
        symbol: 'SAI',
      });
    });
  });

  describe('getErc20Symbol', () => {
    it('get the symbol for SAI currency', () => {
      assert.equal(
        getErc20Symbol({
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359', // SAI
        }),
        'SAI',
      );
    });
    it('get the symbol for CTBK currency', () => {
      assert.equal(
        getErc20Symbol({
          network: 'rinkeby',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x995d6a8c21f24be1dd04e105dd0d83758343e258',
        }),
        'CTBK',
      );
    });
  });
});
