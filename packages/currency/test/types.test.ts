import { RequestLogicTypes } from '@requestnetwork/types';
import { CurrencyManager } from '../src';

// NB: this file only tests types; the expects are here to mute warnings

describe('Currency types', () => {
  const currency = CurrencyManager.getDefault().fromId('DAI-mainnet');
  if (!currency) throw new Error();
  it('Network', () => {
    // @ts-expect-error network can be undefined
    const a: string = currency.network;
    // @ts-expect-error network can be defined
    const b: undefined = currency.network;
    expect(a).toBeDefined();
    expect(b).toBeDefined();

    if (currency.type === RequestLogicTypes.CURRENCY.ERC20) {
      // no error
      const a: string = currency.network;
      // @ts-expect-error cannot be undefined
      const b: undefined = currency.network;
      expect(a).toBeDefined();
      expect(b).toBeDefined();
    }
    if (currency.type === RequestLogicTypes.CURRENCY.ERC20) {
      // no error
      const a: string = currency.network;
      // @ts-expect-error cannot be undefined
      const b: undefined = currency.network;
      expect(a).toBeDefined();
      expect(b).toBeDefined();
    }
    // @ts-expect-error type cannot be ISO4217
    if (currency?.network && currency.type === RequestLogicTypes.CURRENCY.ISO4217) {
      fail('wrong!');
    }
  });

  it('Address', () => {
    // @ts-expect-error
    currency.address;

    if (currency.type === RequestLogicTypes.CURRENCY.ERC20) {
      currency.address;
    }
  });
});
