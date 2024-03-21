import { getSupportedERC777Currencies } from '../../src/erc777';
import { utils } from 'ethers';

describe('erc777', () => {
  describe('uses checksumed addresses', () => {
    getSupportedERC777Currencies().map(({ address, symbol }) => {
      it(`${symbol} is checksumed`, () => {
        expect(address).toEqual(utils.getAddress(address));
      });
    });
  });
});
