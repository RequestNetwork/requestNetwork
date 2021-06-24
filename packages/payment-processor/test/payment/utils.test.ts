import { Wallet, providers, BigNumber } from 'ethers';

import { Currency } from '@requestnetwork/currency';
import {
  getAmountToPay,
  getNetworkProvider,
  getProvider,
  getSigner,
  padAmountForChainlink,
} from '../../src/payment/utils';

describe('getAmountToPay', () => {
  it('returns the expectedAmount if balance is 0', () => {
    expect(
      getAmountToPay({
        balance: {
          balance: '0',
        },
        expectedAmount: '1000000',
      } as any),
    ).toEqual(BigNumber.from('1000000'));
  });

  it('returns the remaining amount if balance is not 0', () => {
    expect(
      getAmountToPay({
        balance: {
          balance: '400000',
        },
        expectedAmount: '1000000',
      } as any),
    ).toEqual(BigNumber.from('600000'));
  });

  it('returns the given amount if defined', () => {
    expect(
      getAmountToPay(
        {
          balance: {
            balance: '400000',
          },
          expectedAmount: '1000000',
        } as any,
        '3000',
      ),
    ).toEqual(BigNumber.from('3000'));
  });

  it('fails on a negative amount', () => {
    expect(() =>
      getAmountToPay(
        {
          balance: {
            balance: '400000',
          },
          expectedAmount: '1000000',
        } as any,
        '-3000',
      ),
    ).toThrowError('cannot pay a negative amount');
  });

  it('fails on a negative remaining amount', () => {
    expect(() =>
      getAmountToPay({
        balance: {
          balance: '1400000',
        },
        expectedAmount: '1000000',
      } as any),
    ).toThrowError('cannot pay a negative amount');
  });

  it('fails on a paid request', () => {
    expect(() =>
      getAmountToPay({
        balance: {
          balance: '1000000',
        },
        expectedAmount: '1000000',
      } as any),
    ).toThrowError('cannot pay a null amount');
  });
});

describe('getProvider', () => {
  it('fails if ethereum not defined', () => {
    expect(() => getProvider()).toThrowError(
      'ethereum not found, you must pass your own web3 provider',
    );
  });
});

describe('getNetworkProvider', () => {
  it('returns a provider for mainnet', () => {
    const request: any = {
      currencyInfo: {
        network: 'mainnet',
      },
    };
    expect(getNetworkProvider(request)).toBeInstanceOf(providers.BaseProvider);
  });

  it('returns a provider for rinkeby', () => {
    const request: any = {
      currencyInfo: {
        network: 'rinkeby',
      },
    };
    expect(getNetworkProvider(request)).toBeInstanceOf(providers.BaseProvider);
  });

  it('fails for other network', () => {
    const request: any = {
      currencyInfo: {
        network: 'bitcoin',
      },
    };
    expect(() => getNetworkProvider(request)).toThrowError(
      'unsupported getDefaultProvider network',
    );
  });
});

describe('getSigner', () => {
  it('should return the instance if signer is passed', () => {
    const wallet = Wallet.createRandom();
    expect(getSigner(wallet)).toBe(wallet);
  });

  it('should throw an error if the provider is not supported', () => {
    expect(() => getSigner({} as any)).toThrowError('cannot get signer');
  });
});

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
  it('should not pad crypto amounts (ETH)', () => {
    const requestCurrency = Currency.fromSymbol('ETH');
    const twentyEth = '20000000000000000000';
    expect(padAmountForChainlink(twentyEth, requestCurrency).toString()).toBe(twentyEth);
  });
  it('should not pad crypto amounts (DAI)', () => {
    const requestCurrency = Currency.fromSymbol('DAI');
    const twentyDai = '20000000000000000000';
    expect(padAmountForChainlink(twentyDai, requestCurrency).toString()).toBe(twentyDai);
  });
  it('should not pad crypto amounts (USDC)', () => {
    const requestCurrency = Currency.fromSymbol('USDC');
    const twentyUsdc = '20000000';
    expect(padAmountForChainlink(twentyUsdc, requestCurrency).toString()).toBe(twentyUsdc);
  });
});
