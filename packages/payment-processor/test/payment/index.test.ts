import { Wallet, providers, BigNumber } from 'ethers';

import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';

import {
  _getPaymentUrl,
  hasSufficientFunds,
  payRequest,
  swapToPayRequest,
  isSolvent,
} from '../../src/payment';
import { payNearInputDataRequest } from '../../src/payment/near-input-data';
import * as btcModule from '../../src/payment/btc-address-based';
import * as erc777Module from '../../src/payment/erc777-stream';
import * as erc20Module from '../../src/payment/erc20';
import * as ethModule from '../../src/payment/eth-input-data';
import * as nearUtils from '../../src/payment/utils-near';

/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/await-thenable */

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
const provider = new providers.JsonRpcProvider('http://localhost:8545');
const wallet = Wallet.fromMnemonic(mnemonic).connect(provider);
const fakeErc20: RequestLogicTypes.ICurrency = {
  type: RequestLogicTypes.CURRENCY.ERC20,
  value: 'any',
  network: 'mainnet',
};
const nearCurrency: RequestLogicTypes.ICurrency = {
  type: RequestLogicTypes.CURRENCY.ETH,
  network: 'aurora',
  value: 'near',
};

describe('payRequest', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('cannot pay a declarative request', async () => {
    const request: any = {
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE]: {
          events: [],
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {},
          version: '1.0',
        },
      },
    };
    await expect(payRequest(request, wallet)).rejects.toThrowError(
      'Payment network pn-any-declarative is not supported',
    );
  });

  it('cannot pay a BTC request', async () => {
    const request: any = {
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED]: {
          events: [],
          id: ExtensionTypes.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {},
          version: '1.0',
        },
      },
    };
    await expect(payRequest(request, wallet)).rejects.toThrowError(
      'Payment network pn-bitcoin-address-based is not supported',
    );
  });

  it('should call the ETH payment method', async () => {
    const mock = jest.fn();
    (ethModule as any).payEthInputDataRequest = mock;
    const request: any = {
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA]: {
          events: [],
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {},
          version: '1.0',
        },
      },
    };
    await payRequest(request, wallet);
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it('should call the ERC20 payment method', async () => {
    const spy = jest.fn();
    (erc20Module as any).payErc20Request = spy;
    const request: any = {
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT]: {
          events: [],
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {},
          version: '1.0',
        },
      },
    };
    await payRequest(request, wallet);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should call the ERC777 payment method', async () => {
    const spy = jest.fn();
    (erc777Module as any).payErc777StreamRequest = spy;
    const request: any = {
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.ERC777_STREAM]: {
          events: [],
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC777_STREAM,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {},
          version: '1.0',
        },
      },
    };
    await payRequest(request, wallet);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('cannot pay if the currency network is not implemented with web3', async () => {
    const request: any = {
      currencyInfo: {
        network: 'aurora',
      },
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA]: {
          events: [],
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {},
          version: '1.0',
        },
      },
    };

    await expect(payRequest(request, wallet)).rejects.toThrowError(
      'Payment currency network aurora is not supported',
    );
  });
});

describe('payNearInputDataRequest', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it('pays a NEAR request with NEAR payment method (with mock)', async () => {
    // A mock is used to bypass Near wallet connection for address validation and contract interaction
    const paymentSpy = jest
      .spyOn(nearUtils, 'processNearPayment')
      .mockReturnValue(Promise.resolve());
    const mockedNearWalletConnection = {
      account: () => ({
        functionCall: () => true,
        state: () => Promise.resolve({ amount: 100 }),
      }),
    } as any;
    const request: any = {
      requestId: '0x123',
      currencyInfo: nearCurrency,
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.NATIVE_TOKEN]: {
          events: [],
          id: ExtensionTypes.PAYMENT_NETWORK_ID.NATIVE_TOKEN,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {
            salt: '0x456',
            paymentAddress: '0x789',
          },
          version: '0.2.0',
        },
      },
    };

    await payNearInputDataRequest(request, mockedNearWalletConnection, '1', {
      callbackUrl: 'https://some.callback.url',
      meta: 'param',
    });
    expect(paymentSpy).toHaveBeenCalledWith(
      expect.anything(),
      'aurora',
      '1',
      '0x789',
      '700912030bd973e3',
      '0.2.0',
      { callbackUrl: 'https://some.callback.url', meta: 'param' },
    );
  });
  it('throws when trying to pay another payment extension', async () => {
    // A mock is used to bypass Near wallet connection for address validation and contract interaction
    const paymentSpy = jest
      .spyOn(nearUtils, 'processNearPayment')
      .mockReturnValue(Promise.resolve());
    const mockedNearWalletConnection = {
      account: () => ({
        functionCall: () => true,
        state: () => Promise.resolve({ amount: 100 }),
      }),
    } as any;
    const request: any = {
      requestId: '0x123',
      currencyInfo: nearCurrency,
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA]: {
          events: [],
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {
            salt: '0x456',
            paymentAddress: '0x789',
          },
          version: '0.2.0',
        },
      },
    };

    await expect(
      payNearInputDataRequest(request, mockedNearWalletConnection, '1'),
    ).rejects.toThrowError('request cannot be processed, or is not an pn-native-token request');
    expect(paymentSpy).not.toHaveBeenCalled();
  });
});

describe('swapToPayRequest', () => {
  const swapSettings = {
    // eslint-disable-next-line no-magic-numbers
    deadline: Date.now() + 1000,
    maxInputAmount: BigNumber.from('204'),

    path: ['0xany', '0xanyother'],
  };

  it('cannot pay a declarative request', async () => {
    const request: any = {
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE]: {
          events: [],
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {},
          version: '1.0',
        },
      },
    };
    await expect(swapToPayRequest(request, swapSettings, wallet)).rejects.toThrowError(
      'Payment network pn-any-declarative is not supported',
    );
  });

  it('cannot pay a BTC request', async () => {
    const request: any = {
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED]: {
          events: [],
          id: ExtensionTypes.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {},
          version: '1.0',
        },
      },
    };
    await expect(swapToPayRequest(request, swapSettings, wallet)).rejects.toThrowError(
      'Payment network pn-bitcoin-address-based is not supported',
    );
  });

  it('cannot swap to pay an ETH request', async () => {
    const request: any = {
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA]: {
          events: [],
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {},
          version: '1.0',
        },
      },
    };
    await expect(swapToPayRequest(request, swapSettings, wallet)).rejects.toThrowError(
      'Payment network pn-eth-input-data is not supported',
    );
  });

  it('cannot swap to pay a non-EVM request currency', async () => {
    const request: any = {
      currencyInfo: {
        network: 'aurora',
      },
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA]: {
          events: [],
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {},
          version: '1.0',
        },
      },
    };
    await expect(swapToPayRequest(request, swapSettings, wallet)).rejects.toThrowError(
      'Payment currency network aurora is not supported',
    );
  });

  it('should call the ERC20 payment method', async () => {
    const spy = jest.fn();
    (erc20Module as any).payErc20Request = spy;
    const request: any = {
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT]: {
          events: [],
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {},
          version: '1.0',
        },
      },
    };
    await swapToPayRequest(request, swapSettings, wallet);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('hasSufficientFunds', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should throw an error on unsupported network', async () => {
    const request: any = {
      currencyInfo: {
        network: 'testnet',
      },
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED]: {
          events: [],
          id: ExtensionTypes.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {},
          version: '1.0',
        },
      },
    };
    await expect(hasSufficientFunds(request, '')).rejects.toThrowError(
      'Payment network pn-bitcoin-address-based is not supported',
    );
  });

  it('should call the ETH getBalance method', async () => {
    const fakeProvider: any = {
      getBalance: jest.fn().mockReturnValue(Promise.resolve(BigNumber.from('200'))),
    };
    const request: any = {
      balance: {
        balance: '0',
      },
      currencyInfo: {
        network: 'rinkeby',
        type: RequestLogicTypes.CURRENCY.ETH,
      },
      expectedAmount: '100',
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA]: {
          events: [],
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {},
          version: '1.0',
        },
      },
    };
    await hasSufficientFunds(request, 'abcd', { provider: fakeProvider });
    expect(fakeProvider.getBalance).toHaveBeenCalledTimes(1);
  });

  it('should call the ERC20 getBalance method', async () => {
    const spy = jest
      .spyOn(erc20Module, 'getAnyErc20Balance')
      .mockReturnValue(Promise.resolve(BigNumber.from('200')));
    const fakeProvider: any = {
      getBalance: () => Promise.resolve(BigNumber.from('200')),
    };
    const request: any = {
      balance: {
        balance: '0',
      },
      currencyInfo: {
        network: 'rinkeby',
        type: RequestLogicTypes.CURRENCY.ERC20,

        value: '0xany',
      },
      expectedAmount: '100',
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT]: {
          events: [],
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {},
          version: '1.0',
        },
      },
    };
    await hasSufficientFunds(request, 'abcd', { provider: fakeProvider });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should call the ERC20 getBalance method for ERC777 requests', async () => {
    const spy = jest
      .spyOn(erc20Module, 'getAnyErc20Balance')
      .mockReturnValue(Promise.resolve(BigNumber.from('200')));
    const fakeProvider: any = {
      getBalance: () => Promise.resolve(BigNumber.from('200')),
    };
    const request: any = {
      balance: {
        balance: '0',
      },
      currencyInfo: {
        network: 'rinkeby',
        type: RequestLogicTypes.CURRENCY.ERC777,

        value: '0xany',
      },
      expectedAmount: '100',
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.ERC777_STREAM]: {
          events: [],
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC777_STREAM,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {},
          version: '1.0',
        },
      },
    };
    await hasSufficientFunds(request, 'abcd', { provider: fakeProvider });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should skip ETH balance checks for smart contract wallets', async () => {
    const walletConnectProvider = {
      ...provider,
      getBalance: jest.fn().mockReturnValue(Promise.resolve(BigNumber.from('0'))),

      provider: {
        wc: {
          _peerMeta: {
            name: 'Gnosis Safe Multisig',
          },
        },
      },
    };

    const mock = jest
      .spyOn(erc20Module, 'getAnyErc20Balance')
      .mockReturnValue(Promise.resolve(BigNumber.from('200')));
    // eslint-disable-next-line no-magic-numbers
    const solvency = await isSolvent('any', fakeErc20, 100, {
      provider: walletConnectProvider as any,
    });
    expect(solvency).toBeTruthy();
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it('should check ETH balance checks for non-smart contract wallets', async () => {
    const walletConnectProvider = {
      ...provider,
      getBalance: jest.fn().mockReturnValue(Promise.resolve(BigNumber.from('0'))),

      provider: {
        wc: {
          _peerMeta: {
            name: 'Definitely not a smart contract wallet',
          },
        },
      },
    };

    const mock = jest
      .spyOn(erc20Module, 'getAnyErc20Balance')
      .mockReturnValue(Promise.resolve(BigNumber.from('200')));
    // eslint-disable-next-line no-magic-numbers
    const solvency = await isSolvent('any', fakeErc20, 100, {
      provider: walletConnectProvider as any,
    });
    expect(solvency).toBeFalsy();
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it('should check NEAR solvency with NEAR methods', async () => {
    const mockedNearWalletConnection = {
      account: () => ({
        state: jest.fn().mockReturnValue(Promise.resolve({ amount: 100 })),
      }),
    } as any;

    const solvency = await isSolvent('any', nearCurrency, 100, {
      nearWalletConnection: mockedNearWalletConnection,
    });
    expect(solvency).toBeTruthy();
  });

  it('should check NEAR non-solvency with NEAR methods', async () => {
    const nearWalletConnection = {
      account: () => ({
        state: jest.fn().mockReturnValue(Promise.resolve({ amount: 99 })),
      }),
    } as any;

    const solvency = await isSolvent('any', nearCurrency, 100, { nearWalletConnection });
    expect(solvency).toBeFalsy();
  });
});

describe('_getPaymentUrl', () => {
  it('should throw an error on unsupported network', () => {
    const request: any = {
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE]: {
          events: [],
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {},
          version: '1.0',
        },
      },
    };
    expect(() => _getPaymentUrl(request)).toThrowError(
      'Payment network pn-any-declarative is not supported',
    );
  });

  it('should call the BTC payment url method', async () => {
    const mock = jest.fn();
    (btcModule as any).getBtcPaymentUrl = mock;
    const request: any = {
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED]: {
          events: [],
          id: ExtensionTypes.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {},
          version: '1.0',
        },
      },
    };
    _getPaymentUrl(request);
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it('should call the ETH payment url method', async () => {
    const spy = jest.fn();
    (ethModule as any)._getEthPaymentUrl = spy;
    const request: any = {
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA]: {
          events: [],
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {},
          version: '1.0',
        },
      },
    };
    _getPaymentUrl(request);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should call the ERC20 payment url method', async () => {
    const spy = jest.fn();
    (erc20Module as any)._getErc20PaymentUrl = spy;
    const request: any = {
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT]: {
          events: [],
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {},
          version: '1.0',
        },
      },
    };
    _getPaymentUrl(request);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
