/* eslint-disable spellcheck/spell-checker */
import { Wallet } from 'ethers';

import {
  ClientTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';

import { getBtcPaymentUrl } from '../../src/payment/btc-address-based';
// tslint:disable: no-unused-expression
// tslint:disable: await-promise

const wallet = Wallet.createRandom();
const paymentAddress = '1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX';

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
  currency: 'BTC',
  currencyInfo: {
    network: 'private',
    type: RequestLogicTypes.CURRENCY.BTC,
    value: '',
  },
  events: [],
  expectedAmount: '10000000',
  extensions: {
    [PaymentTypes.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED]: {
      events: [],
      id: ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED,
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

describe('getBtcPaymentUrl', () => {
  it('can get a BTC url', () => {
    expect(getBtcPaymentUrl(validRequest)).toBe(
      'bitcoin:1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX?amount=0.1',
    );
  });
});
