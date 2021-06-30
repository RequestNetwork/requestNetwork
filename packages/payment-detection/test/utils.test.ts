import { Currency } from '@requestnetwork/currency';
import { padAmountForChainlink, unpadAmountFromChainlink } from '../src';

describe('conversion: padding amounts for Chainlink', () => {
  it('should throw on currencies not implemented in the library', () => {
    const requestCurrency = Currency.fromSymbol('BTC');
    const twentyBtc = '2000000000';
    expect(() => padAmountForChainlink(twentyBtc, requestCurrency)).toThrowError(
      'Unsupported request currency for conversion with Chainlink. The request currency has to be fiat, ETH or ERC20.',
    );
  });
  it('should pad fiat amounts', () => {
    const requestCurrency = Currency.fromSymbol('EUR');
    const twentyEur = '2000';
    expect(padAmountForChainlink(twentyEur, requestCurrency).toString()).toBe('2000000000');
  });
  it('should unpad fiat amounts', () => {
    const requestCurrency = Currency.fromSymbol('EUR');
    expect(unpadAmountFromChainlink('2000000000', requestCurrency).toString()).toBe('2000');
  });
  it('should not pad crypto amounts (ETH)', () => {
    const requestCurrency = Currency.fromSymbol('ETH');
    const twentyEth = '20000000000000000000';
    expect(padAmountForChainlink(twentyEth, requestCurrency).toString()).toBe(twentyEth);
  });
  it('should not unpad fiat amounts (ETH)', () => {
    const requestCurrency = Currency.fromSymbol('ETH');
    const twentyEth = '20000000000000000000';
    expect(unpadAmountFromChainlink(twentyEth, requestCurrency).toString()).toBe(twentyEth);
  });
  it('should not pad crypto amounts (DAI)', () => {
    const requestCurrency = Currency.fromSymbol('DAI');
    const twentyDai = '20000000000000000000';
    expect(padAmountForChainlink(twentyDai, requestCurrency).toString()).toBe(twentyDai);
  });
  it('should not unpad crypto amounts (DAI)', () => {
    const requestCurrency = Currency.fromSymbol('DAI');
    const twentyDai = '20000000000000000000';
    expect(unpadAmountFromChainlink(twentyDai, requestCurrency).toString()).toBe(twentyDai);
  });
  it('should not pad crypto amounts (USDC)', () => {
    const requestCurrency = Currency.fromSymbol('USDC');
    const twentyUsdc = '20000000';
    expect(padAmountForChainlink(twentyUsdc, requestCurrency).toString()).toBe(twentyUsdc);
  });
});
