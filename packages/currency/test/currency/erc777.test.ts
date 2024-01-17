import { getSupportedERC777Tokens } from '../../src/erc777';
import { getAddress } from 'viem';

describe('erc777', () => {
  describe('uses checksumed addresses', () => {
    getSupportedERC777Tokens().map(({ address, symbol }) => {
      it(`${symbol} is checksumed`, () => {
        expect(address).toEqual(getAddress(address));
      });
    });
  });
});
