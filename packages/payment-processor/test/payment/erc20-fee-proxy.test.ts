/* eslint-disable spellcheck/spell-checker */
import 'mocha';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as spies from 'chai-spies';
import { Wallet } from 'ethers';
import { JsonRpcProvider } from 'ethers/providers';

import {
  ClientTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import {
  _getErc20FeePaymentUrl,
  approveErc20FeeProxy,
  hasErc20FeeProxyApproval,
  payErc20FeeProxyRequest,
} from '../../src/payment/erc20-fee-proxy';
import { getErc20Balance } from '../../src/payment/erc20-proxy';
import { getRequestPaymentValues } from '../../src/payment/utils';

// tslint:disable: no-magic-numbers
// tslint:disable: no-unused-expression
// tslint:disable: await-promise

const expect = chai.expect;
chai.use(chaiAsPromised);
chai.use(spies);
const sandbox = chai.spy.sandbox();

const erc20ContractAddress = '0x9FBDa871d559710256a2502A2517b794B482Db40';

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
const paymentAddress = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
const feeAddress = '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef';
const provider = new JsonRpcProvider('http://localhost:8545');
const wallet = Wallet.fromMnemonic(mnemonic).connect(provider);

const validRequest: ClientTypes.IRequestData = {
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

describe('erc20-fee-proxy', () => {
  describe('getRequestPaymentValues', () => {
    it('handles ERC20', () => {
      const values = getRequestPaymentValues(validRequest);
      expect(values.feeAddress).to.eq(feeAddress);
      expect(values.feeAmount).to.eq('2');
      expect(values.paymentAddress).to.eq(paymentAddress);
      expect(values.paymentReference).to.eq('86dfbccad783599a');
    });
  });

  describe('hasErc20FeeProxyApproval & approveErc20FeeProxy', () => {
    it('should consider override parameters', async () => {
      const spy = sandbox.on(wallet, 'sendTransaction', () => 0);
      await approveErc20FeeProxy(validRequest, wallet, {
        gasPrice: '20000000000',
      });
      expect(spy).to.have.been.called.with({
        data:
          '0x095ea7b300000000000000000000000075c35c980c0d37ef46df04d31a140b65503c0eedffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        gasPrice: '20000000000',
        to: '0x9FBDa871d559710256a2502A2517b794B482Db40',
        value: 0,
      });
      sandbox.restore();
    });
    it('can check and approve', async () => {
      // use another address so it doesn't mess with other tests.
      const otherWallet = new Wallet(
        '0x8d5366123cb560bb606379f90a0bfd4769eecc0557f1b362dcae9012b548b1e5',
      ).connect(provider);
      let hasApproval = await hasErc20FeeProxyApproval(validRequest, otherWallet.address, provider);
      // Warning: this test can run only once!
      expect(hasApproval, 'already has approval').to.be.false;
      await approveErc20FeeProxy(validRequest, otherWallet);
      hasApproval = await hasErc20FeeProxyApproval(validRequest, otherWallet.address, provider);
      expect(hasApproval, 'approval did not succeed').to.be.true;
    });
  });

  describe('payErc20FeeProxyRequest', () => {
    it('should throw an error if the request is not erc20', async () => {
      const request = Utils.deepCopy(validRequest) as ClientTypes.IRequestData;
      request.currencyInfo.type = RequestLogicTypes.CURRENCY.ETH;

      await expect(payErc20FeeProxyRequest(request, wallet)).to.eventually.be.rejectedWith(
        'request cannot be processed, or is not an pn-erc20-fee-proxy-contract request',
      );
    });

    it('should throw an error if the currencyInfo has no value', async () => {
      const request = Utils.deepCopy(validRequest);
      request.currencyInfo.value = '';
      await expect(payErc20FeeProxyRequest(request, wallet)).to.eventually.be.rejectedWith(
        'request cannot be processed, or is not an pn-erc20-fee-proxy-contract request',
      );
    });

    it('should throw an error if currencyInfo has no network', async () => {
      const request = Utils.deepCopy(validRequest);
      request.currencyInfo.network = '';
      await expect(payErc20FeeProxyRequest(request, wallet)).to.eventually.be.rejectedWith(
        'request cannot be processed, or is not an pn-erc20-fee-proxy-contract request',
      );
    });

    it('should throw an error if request has no extension', async () => {
      const request = Utils.deepCopy(validRequest);
      request.extensions = [] as any;

      await expect(payErc20FeeProxyRequest(request, wallet)).to.eventually.be.rejectedWith(
        'request cannot be processed, or is not an pn-erc20-fee-proxy-contract request',
      );
    });

    it('should consider override parameters', async () => {
      const spy = sandbox.on(wallet, 'sendTransaction', () => 0);
      await payErc20FeeProxyRequest(validRequest, wallet, undefined, undefined, {
        gasPrice: '20000000000',
      });
      expect(spy).to.have.been.called.with({
        data:
          '0xc219a14d0000000000000000000000009fbda871d559710256a2502a2517b794b482db40000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b732000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fef000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000',
        gasPrice: '20000000000',
        to: '0x4a5cd58b24e3BF04360B06bFEaF45A39aA8035b6',
        value: 0,
      });
      sandbox.restore();
    });

    it('should pay an ERC20 request with fees', async () => {
      // first approve the contract
      const approvalTx = await approveErc20FeeProxy(validRequest, wallet);
      await approvalTx.wait(1);

      // get the balance to compare after payment

      const balanceEthBefore = await wallet.getBalance();
      const balanceErc20Before = await getErc20Balance(validRequest, wallet.address, provider);
      const feeBalanceErc20Before = await getErc20Balance(validRequest, feeAddress, provider);

      const tx = await payErc20FeeProxyRequest(validRequest, wallet);
      const confirmedTx = await tx.wait(1);

      const balanceEthAfter = await wallet.getBalance();
      const balanceErc20After = await getErc20Balance(validRequest, wallet.address, provider);
      const feeBalanceErc20After = await getErc20Balance(validRequest, feeAddress, provider);

      expect(confirmedTx.status).to.eq(1);
      expect(tx.hash).not.to.be.undefined;

      chai.assert.isTrue(balanceEthAfter.lte(balanceEthBefore), 'ETH balance should be lower');

      chai.assert.isTrue(
        balanceErc20After.eq(balanceErc20Before.sub(102)),
        'ERC20 balance should be lower',
      );
      chai.assert.isTrue(
        feeBalanceErc20After.eq(feeBalanceErc20Before.add(2)),
        'fee ERC20 balance should be higher',
      );
    });
  });

  describe('getErc20FeePaymentUrl', () => {
    it('can get an ERC20 url', () => {
      expect(_getErc20FeePaymentUrl(validRequest)).to.eq(
        'ethereum:0x4a5cd58b24e3BF04360B06bFEaF45A39aA8035b6/transferFromWithReferenceAndFee?address=0x9FBDa871d559710256a2502A2517b794B482Db40&address=0xf17f52151EbEF6C7334FAD080c5704D77216b732&uint256=100&bytes=86dfbccad783599a&uint256=2&address=0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef',
      );
    });
  });
});
