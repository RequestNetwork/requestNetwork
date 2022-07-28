import { getSupportedERC777Tokens } from '../../src/erc777';
import { utils } from 'ethers';

describe('erc777', () => {
  describe('uses checksumed addresses', () => {
    getSupportedERC777Tokens().map(({ address, symbol }) => {
      it(`${symbol} is checksumed`, () => {
        expect(address).toEqual(utils.getAddress(address));
      });
    });
  });
});
