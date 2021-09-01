import { CurrencyManager } from '@requestnetwork/currency';
import { padAmountForChainlink, unpadAmountFromChainlink } from '../src';

describe('conversion: padding amounts for Chainlink', () => {
  const currencyManager = CurrencyManager.getDefault();
  it('should throw on currencies not implemented in the library', () => {
    const requestCurrency = currencyManager.fromSymbol('BTC')!;
    const twentyBtc = '2000000000';
    expect(() => padAmountForChainlink(twentyBtc, requestCurrency)).toThrowError(
      'Unsupported request currency for conversion with Chainlink. The request currency has to be fiat, ETH or ERC20.',
    );
  });
  it('should pad fiat amounts', () => {
    const requestCurrency = currencyManager.fromSymbol('EUR')!;
    const twentyEur = '2000';
    expect(padAmountForChainlink(twentyEur, requestCurrency.decimals).toString()).toBe(
      '2000000000',
    );
  });
  it('should unpad fiat amounts', () => {
    const requestCurrency = currencyManager.fromSymbol('EUR');
    expect(unpadAmountFromChainlink('2000000000', requestCurrency.decimals).toString()).toBe(
      '2000',
    );
  });
  it('should not pad crypto amounts (ETH)', () => {
    const requestCurrency = currencyManager.fromSymbol('ETH')!;
    const twentyEth = '20000000000000000000';
    expect(padAmountForChainlink(twentyEth, requestCurrency.decimals).toString()).toBe(twentyEth);
  });
  it('should not unpad fiat amounts (ETH)', () => {
    const requestCurrency = currencyManager.fromSymbol('ETH')!;
    const twentyEth = '20000000000000000000';
    expect(unpadAmountFromChainlink(twentyEth, requestCurrency.decimals).toString()).toBe(
      twentyEth,
    );
  });
  it('should not pad crypto amounts (DAI)', () => {
    const requestCurrency = currencyManager.fromSymbol('DAI')!;
    const twentyDai = '20000000000000000000';
    expect(padAmountForChainlink(twentyDai, requestCurrency.decimals).toString()).toBe(twentyDai);
  });
  it('should not unpad crypto amounts (DAI)', () => {
    const requestCurrency = currencyManager.fromSymbol('DAI')!;
    const twentyDai = '20000000000000000000';
    expect(unpadAmountFromChainlink(twentyDai, requestCurrency.decimals).toString()).toBe(
      twentyDai,
    );
  });
  it('should not pad crypto amounts (USDC)', () => {
    const requestCurrency = currencyManager.fromSymbol('USDC')!;
    const twentyUsdc = '20000000';
    expect(padAmountForChainlink(twentyUsdc, requestCurrency.decimals).toString()).toBe(twentyUsdc);
  });
});
