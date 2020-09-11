/* eslint-disable spellcheck/spell-checker */

import {
  ClientTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { Wallet } from 'ethers';
import { JsonRpcProvider } from 'ethers/providers';
import {
  _getErc20PaymentUrl,
  approveErc20,
  getErc20Balance,
  hasErc20Approval,
} from '../../src/payment/erc20';

// tslint:disable: no-unused-expression

const erc20ContractAddress = '0x9FBDa871d559710256a2502A2517b794B482Db40';
const paymentAddress = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
const feeAddress = '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef';
const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
const provider = new JsonRpcProvider('http://localhost:8545');
const wallet = Wallet.fromMnemonic(mnemonic).connect(provider);

const erc20FeeProxyRequest: ClientTypes.IRequestData = {
  balance: {
    balance: '0',
    events: [],
  },
  contentData: {},
  creator: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: wallet.address,
  },
  currency: 'DAI',
  currencyInfo: {
    network: 'private',
    type: RequestLogicTypes.CURRENCY.ERC20,
    value: erc20ContractAddress,
  },

  events: [],
  expectedAmount: '100',
  extensions: {
    [PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT]: {
      events: [],
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        feeAddress,
        feeAmount: '2',
        paymentAddress,
        salt: 'salt',
      },
      version: '1.0',
    },
  },
  extensionsData: [],
  meta: {
    transactionManagerMeta: {},
  },
  pending: null,
  requestId: 'abcd',
  state: RequestLogicTypes.STATE.CREATED,
  timestamp: 0,
  version: '1.0',
};

const erc20ProxyRequest: ClientTypes.IRequestData = {
  balance: {
    balance: '0',
    events: [],
  },
  contentData: {},
  creator: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: wallet.address,
  },
  currency: 'DAI',
  currencyInfo: {
    network: 'private',
    type: RequestLogicTypes.CURRENCY.ERC20,
    value: erc20ContractAddress,
  },

  events: [],
  expectedAmount: '100',
  extensions: {
    [PaymentTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT]: {
      events: [],
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        paymentAddress,
        salt: 'salt',
      },
      version: '1.0',
    },
  },
  extensionsData: [],
  meta: {
    transactionManagerMeta: {},
  },
  pending: null,
  requestId: 'abcd',
  state: RequestLogicTypes.STATE.CREATED,
  timestamp: 0,
  version: '1.0',
};

describe('hasErc20approval & approveErc20', () => {
  describe('ERC20 fee proxy payment network', () => {
    it('should consider override parameters', async () => {
      const spy = jest.fn();
      const originalSendTransaction = wallet.sendTransaction.bind(wallet);
      wallet.sendTransaction = spy;
      await approveErc20(erc20FeeProxyRequest, wallet, {
        gasPrice: '20000000000',
      });
      expect(spy).toHaveBeenCalledWith({
        data:
          '0x095ea7b300000000000000000000000075c35c980c0d37ef46df04d31a140b65503c0eedffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        gasPrice: '20000000000',
        to: '0x9FBDa871d559710256a2502A2517b794B482Db40',
        value: 0,
      });
      wallet.sendTransaction = originalSendTransaction;
    });
    it('can check and approve', async () => {
      // use another address so it doesn't mess with other tests.
      const otherWallet = new Wallet(
        '0x8d5366123cb560bb606379f90a0bfd4769eecc0557f1b362dcae9012b548b1e5',
      ).connect(provider);
      let hasApproval = await hasErc20Approval(erc20FeeProxyRequest, otherWallet.address, provider);
      // Warning: this test can run only once!
      // 'already has approval'
      expect(hasApproval).toBe(false);
      await approveErc20(erc20FeeProxyRequest, otherWallet);
      hasApproval = await hasErc20Approval(erc20FeeProxyRequest, otherWallet.address, provider);
      // 'approval did not succeed'
      expect(hasApproval).toBe(true);
    });
  });

  describe('ERC20 fee proxy payment network', () => {
    it('should consider override parameters', async () => {
      const spy = jest.fn();
      const originalSendTransaction = wallet.sendTransaction.bind(wallet);
      wallet.sendTransaction = spy;
      await approveErc20(erc20ProxyRequest, wallet, {
        gasPrice: '20000000000',
      });
      expect(spy).toHaveBeenCalledWith({
        data:
          '0x095ea7b30000000000000000000000002c2b9c9a4a25e24b174f26114e8926a9f2128fe4ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        gasPrice: '20000000000',
        to: '0x9FBDa871d559710256a2502A2517b794B482Db40',
        value: 0,
      });
      wallet.sendTransaction = originalSendTransaction;
    });
    it('can check and approve', async () => {
      // use another address so it doesn't mess with other tests.
      const otherWallet = new Wallet(
        '0x8d5366123cb560bb606379f90a0bfd4769eecc0557f1b362dcae9012b548b1e5',
      ).connect(provider);
      let hasApproval = await hasErc20Approval(erc20ProxyRequest, otherWallet.address, provider);
      // Warning: this test can run only once!
      // 'already has approval'
      expect(hasApproval).toBe(false);
      await approveErc20(erc20ProxyRequest, otherWallet);
      hasApproval = await hasErc20Approval(erc20ProxyRequest, otherWallet.address, provider);
      // 'approval did not succeed'
      expect(hasApproval).toBe(true);
    });
  });
});

describe('getErc20Balance', () => {
  it('should read the balance for ERC20 Fee Proxy payment network', async () => {
    const balance = await getErc20Balance(erc20FeeProxyRequest, wallet.address, provider);
    expect(balance.gte('100')).toBeTruthy();
  });

  it('should read the balance for ERC20 Proxy payment network', async () => {
    const balance = await getErc20Balance(erc20ProxyRequest, wallet.address, provider);
    expect(balance.gte('100')).toBeTruthy();
  });
});

describe('getErc20PaymentUrl', () => {
  it('can get an ERC20 url for ERC20 Fee Proxy payment network', () => {
    expect(_getErc20PaymentUrl(erc20FeeProxyRequest)).toBe(
      'ethereum:0x75c35C980C0d37ef46DF04d31A140b65503c0eEd/transferFromWithReferenceAndFee?address=0x9FBDa871d559710256a2502A2517b794B482Db40&address=0xf17f52151EbEF6C7334FAD080c5704D77216b732&uint256=100&bytes=86dfbccad783599a&uint256=2&address=0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef',
    );
  });

  it('can get an ERC20 url for ERC20 Proxy payment network', () => {
    expect(_getErc20PaymentUrl(erc20ProxyRequest)).toBe(
      'ethereum:0x2c2b9c9a4a25e24b174f26114e8926a9f2128fe4/transferFromWithReference?address=0x9FBDa871d559710256a2502A2517b794B482Db40&address=0xf17f52151EbEF6C7334FAD080c5704D77216b732&uint256=100&bytes=86dfbccad783599a',
    );
  });
});
