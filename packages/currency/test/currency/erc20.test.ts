import { getSupportedERC20Tokens } from '../../src/erc20';
import * as metamaskContractMap from '@metamask/contract-metadata';
import { extraERC20Tokens } from '../../src/erc20/networks/mainnet';
import { utils } from 'ethers';

describe('erc20', () => {
  describe('does not redefine tokens', () => {
    Object.entries(extraERC20Tokens).map(([address, { symbol }]) => {
      it(`does not redefine ${symbol}`, () => {
        expect(metamaskContractMap[address]).not.toBeDefined();
      });
    });
  });
  describe('uses checksumed addresses', () => {
    getSupportedERC20Tokens().map(({ address, symbol }) => {
      it(`${symbol} is checksumed`, () => {
        expect(address).toEqual(utils.getAddress(address));
      });
    });
  });
});
