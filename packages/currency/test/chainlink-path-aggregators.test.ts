/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CurrencyPairs, getPath } from '../src/chainlink-path-aggregators';
import { CurrencyManager } from '../src';
const currencyManager = CurrencyManager.getDefault();
const USD = currencyManager.from('USD')!;
const EUR = currencyManager.from('EUR')!;

const fakeDAI = { hash: '0x38cf23c52bb4b13f051aec09580a2de845a7fa35' };

describe('getPath', () => {
  const mockAggregatorPaths: Record<string, CurrencyPairs> = {
    private: {
      [fakeDAI.hash]: {
        [USD.hash]: 1,
      },
      [USD.hash]: {
        [fakeDAI.hash]: 1,
        [EUR.hash]: 1,
      },
      [EUR.hash]: {
        [USD.hash]: 1,
      },
    },
  };
  it('can get a path between 2 currencies with no aggregator', () => {
    const path = getPath(EUR, fakeDAI, 'private', mockAggregatorPaths);

    expect(path).not.toBeNull();
    expect(path).toMatchObject([EUR.hash, USD.hash, fakeDAI.hash]);
  });
});
