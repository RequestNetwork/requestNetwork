import { expect } from 'chai';
import { Wallet } from 'ethers';
import { BaseProvider } from 'ethers/providers';
import { bigNumberify } from 'ethers/utils';

import {
  getAmountToPay,
  getNetworkProvider,
  getProvider,
  getSigner,
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
    ).to.deep.eq(bigNumberify('1000000'));
  });

  it('returns the remaining amount if balance is not 0', () => {
    expect(
      getAmountToPay({
        balance: {
          balance: '400000',
        },
        expectedAmount: '1000000',
      } as any),
    ).to.deep.eq(bigNumberify('600000'));
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
    ).to.deep.eq(bigNumberify('3000'));
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
    ).to.throw('cannot pay a negative amount');
  });

  it('fails on a negative remaining amount', () => {
    expect(() =>
      getAmountToPay({
        balance: {
          balance: '1400000',
        },
        expectedAmount: '1000000',
      } as any),
    ).to.throw('cannot pay a negative amount');
  });

  it('fails on a paid request', () => {
    expect(() =>
      getAmountToPay({
        balance: {
          balance: '1000000',
        },
        expectedAmount: '1000000',
      } as any),
    ).to.throw('cannot pay a null amount');
  });
});

describe('getProvider', () => {
  it('fails if ethereum not defined', () => {
    expect(() => getProvider()).to.throw(
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
    expect(getNetworkProvider(request)).to.be.instanceOf(BaseProvider);
  });

  it('returns a provider for rinkeby', () => {
    const request: any = {
      currencyInfo: {
        network: 'rinkeby',
      },
    };
    expect(getNetworkProvider(request)).to.be.instanceOf(BaseProvider);
  });

  it('fails for other network', () => {
    const request: any = {
      currencyInfo: {
        network: 'ropsten',
      },
    };
    expect(() => getNetworkProvider(request)).to.throw('unsupported network');
  });
});

describe('getSigner', () => {
  it('should return the instance if signer is passed', () => {
    const wallet = Wallet.createRandom();
    expect(getSigner(wallet)).to.eq(wallet);
  });

  it('should throw an error if the provider is not supported', () => {
    expect(() => getSigner({} as any)).to.throw('cannot get signer');
  });
});
