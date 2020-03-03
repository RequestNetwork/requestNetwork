import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { Wallet } from 'ethers';
import { JsonRpcProvider } from 'ethers/providers';
import { bigNumberify } from 'ethers/utils';
import { stub } from 'sinon';

import { ExtensionTypes, PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';

import { _getPaymentUrl, hasSufficientFunds, payRequest } from '../../src/payment';
import * as btcModule from '../../src/payment/btc-address-based';
import * as erc20Module from '../../src/payment/erc20-proxy';
import * as ethModule from '../../src/payment/eth-input-data';

// tslint:disable: no-unused-expression
// tslint:disable: await-promise

const expect = chai.expect;
chai.use(chaiAsPromised);

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
const provider = new JsonRpcProvider('http://localhost:8545');
const wallet = Wallet.fromMnemonic(mnemonic).connect(provider);

describe('payRequest', () => {
  it('paying a declarative request should fail', async () => {
    const request: any = {
      extensions: {
        [PaymentTypes.PAYMENT_NETWORK_ID.DECLARATIVE]: {
          events: [],
          id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {},
          version: '1.0',
        },
      },
    };
    await expect(payRequest(request, wallet)).to.be.rejectedWith(
      'Payment network pn-any-declarative is not supported',
    );
  });

  it('paying a BTC request should fail', async () => {
    const request: any = {
      extensions: {
        [PaymentTypes.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED]: {
          events: [],
          id: ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {},
          version: '1.0',
        },
      },
    };
    await expect(payRequest(request, wallet)).to.be.rejectedWith(
      'Payment network pn-bitcoin-address-based is not supported',
    );
  });

  it('should call the ETH payment method', async () => {
    const spy = stub(ethModule, 'payEthInputDataRequest');
    const request: any = {
      extensions: {
        [PaymentTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA]: {
          events: [],
          id: ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {},
          version: '1.0',
        },
      },
    };
    await payRequest(request, wallet);
    expect(spy.calledOnce).to.be.true;
  });

  it('should call the ERC20 payment method', async () => {
    const spy = stub(erc20Module, 'payErc20ProxyRequest');
    const request: any = {
      extensions: {
        [PaymentTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT]: {
          events: [],
          id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {},
          version: '1.0',
        },
      },
    };
    await payRequest(request, wallet);
    expect(spy.calledOnce).to.be.true;
  });
});

describe('hasSufficientFunds', () => {
  it('should throw an error on unsupported network', () => {
    const request: any = {
      currencyInfo: {
        network: 'testnet',
      },
      extensions: {
        [PaymentTypes.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED]: {
          events: [],
          id: ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {},
          version: '1.0',
        },
      },
    };
    expect(hasSufficientFunds(request, '')).to.be.rejectedWith(
      'Payment network pn-any-declarative is not supported',
    );
  });

  it('should call the ETH payment method', async () => {
    const fakeProvider: any = {
      getBalance: stub().returns(Promise.resolve(bigNumberify('200'))),
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
        [PaymentTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA]: {
          events: [],
          id: ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {},
          version: '1.0',
        },
      },
    };
    await hasSufficientFunds(request, 'abcd', fakeProvider);
    expect(fakeProvider.getBalance.calledOnce).to.be.true;
  });

  it('should call the ERC20 payment method', async () => {
    const spy = stub(erc20Module, 'getErc20Balance').returns(Promise.resolve(bigNumberify('200')));
    const fakeProvider: any = {
      getBalance: () => Promise.resolve(bigNumberify('200')),
    };
    const request: any = {
      balance: {
        balance: '0',
      },
      currencyInfo: {
        network: 'rinkeby',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: 'efgh',
      },
      expectedAmount: '100',
      extensions: {
        [PaymentTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT]: {
          events: [],
          id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {},
          version: '1.0',
        },
      },
    };
    await hasSufficientFunds(request, 'abcd', fakeProvider);
    expect(spy.calledOnce).to.be.true;
  });
});

describe('_getPaymentUrl', () => {
  it('should throw an error on unsupported network', () => {
    const request: any = {
      extensions: {
        [PaymentTypes.PAYMENT_NETWORK_ID.DECLARATIVE]: {
          events: [],
          id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {},
          version: '1.0',
        },
      },
    };
    expect(() => _getPaymentUrl(request)).to.throw(
      'Payment network pn-any-declarative is not supported',
    );
  });

  it('should call the BTC payment url method', async () => {
    const spy = stub(btcModule, 'getBtcPaymentUrl');
    const request: any = {
      extensions: {
        [PaymentTypes.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED]: {
          events: [],
          id: ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {},
          version: '1.0',
        },
      },
    };
    _getPaymentUrl(request);
    expect(spy.calledOnce).to.be.true;
  });

  it('should call the ETH payment url method', async () => {
    const spy = stub(ethModule, '_getEthPaymentUrl');
    const request: any = {
      extensions: {
        [PaymentTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA]: {
          events: [],
          id: ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {},
          version: '1.0',
        },
      },
    };
    _getPaymentUrl(request);
    expect(spy.calledOnce).to.be.true;
  });

  it('should call the ERC20 payment url method', async () => {
    const spy = stub(erc20Module, '_getErc20PaymentUrl');
    const request: any = {
      extensions: {
        [PaymentTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT]: {
          events: [],
          id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {},
          version: '1.0',
        },
      },
    };
    _getPaymentUrl(request);
    expect(spy.calledOnce).to.be.true;
  });
});
