import { Wallet, providers, BigNumber } from 'ethers';

import {
  ClientTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';

// import Utils from '@requestnetwork/utils';

// import { approveEthForProxyConversionIfNeeded } from '../../src/payment/conversion-eth';
import { IPaymentSettings, payAnyToEthProxyRequest } from '../../src/payment/any-to-eth-proxy';
import { currencyManager } from './shared';

const alphaPaymentSettings: IPaymentSettings = {
  currencyManager,
  maxToSpend: BigNumber.from('10000000000000000000')
};

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
const paymentAddress = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
const feeAddress = '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef';
const provider = new providers.JsonRpcProvider('http://localhost:8545');
const wallet = Wallet.fromMnemonic(mnemonic).connect(provider);

const validEuroRequest: ClientTypes.IRequestData = {
  balance: {
    balance: '0',
    events: [],
  },
  contentData: {},
  creator: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: wallet.address,
  },
  currency: 'EUR',
  currencyInfo: {
    type: RequestLogicTypes.CURRENCY.ISO4217,
    value: 'EUR',
  },

  events: [],
  expectedAmount: '100',
  extensions: {
    [PaymentTypes.PAYMENT_NETWORK_ID.ANY_TO_ETH_PROXY]: {
      events: [],
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ETH_PROXY,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        feeAddress,
        feeAmount: '2',
        paymentAddress,
        salt: 'salt',
        network: 'private',
      },
      version: '0.1.0',
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

describe.only('any-to-eth-proxy', () => {
  describe('payment', () => {
    it('should convert and pay a request in EUR with ETH', async () => {
      // get the balances to compare after payment
      const fromOldBalance = await provider.getBalance(wallet.address);
      const toOldBalance = await provider.getBalance(paymentAddress);
      const feeOldBalance = await provider.getBalance(feeAddress);

      // convert and pay
      const tx = await payAnyToEthProxyRequest(
        validEuroRequest,
        wallet,
        alphaPaymentSettings
      );

      const confirmedTx = await tx.wait(1);

      expect(confirmedTx.status).toEqual(1);
      expect(tx.hash).toBeDefined();

      // Get the new balances
      const fromNewBalance = await provider.getBalance(wallet.address);
      const toNewBalance = await provider.getBalance(paymentAddress);
      const feeNewBalance = await provider.getBalance(feeAddress);
      const gasPrice = (await provider.getFeeData()).gasPrice || 0;

      // Check each balance
      expect(
        fromOldBalance.sub(fromNewBalance).sub(confirmedTx.gasUsed.mul(gasPrice)).toString()
        //   expectedAmount:        1.00
        //   feeAmount:          +   .02
        //                       =  1.02
        //   AggEurUsd.sol       x  1.20
        //   AggETHUsd.sol       /   500
        //                       =  0.002448 (over 18 decimals for this ETH)
      ).toEqual('2448000000000000');
      expect(
        toNewBalance.sub(toOldBalance).toString()
        //   expectedAmount:        1.00
        //   AggEurUsd.sol       x  1.20
        //   AggETHUsd.sol       /   500
        //                       =  0.0024 (over 18 decimals for this ETH)        
      ).toEqual('2400000000000000');
      expect(
        feeNewBalance.sub(feeOldBalance).toString()
        //   feeAmount:              .02
        //   AggEurUsd.sol       x  1.20
        //   AggETHUsd.sol       /   500
        //                       =  0.000048 (over 18 decimals for this ETH)        
      ).toEqual('48000000000000');
    });
  });
});
