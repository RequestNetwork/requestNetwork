import {
  AdvancedLogicTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';

import Declarative from '../src/declarative';

let declarative: Declarative;

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions(): any {
    return;
  },
  extensions: {},
};

const requestMock: RequestLogicTypes.IRequest = {
  creator: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '',
  },
  currency: {
    type: RequestLogicTypes.CURRENCY.ETH,
    value: 'ETH',
  },
  events: [],
  expectedAmount: '',
  extensions: {},
  extensionsData: [],
  requestId: '',
  state: RequestLogicTypes.STATE.CREATED,
  timestamp: 0,
  version: '',
};

// Most of the tests are done as integration tests in ../index.test.ts
/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('api/declarative', () => {
  beforeEach(() => {
    declarative = new Declarative({ advancedLogic: mockAdvancedLogic });
  });

  it('getBalance get the correct balance', async () => {
    requestMock.extensions[PaymentTypes.PAYMENT_NETWORK_ID.DECLARATIVE] = {
      events: [
        {
          name: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_SENT_PAYMENT,
          parameters: {},
          timestamp: 10,
        },
        {
          name: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_SENT_REFUND,
          parameters: {},
          timestamp: 10,
        },
        {
          name: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_PAYMENT,
          parameters: {
            amount: '1000',
            note: 'first payment',
          },
          timestamp: 10,
        },
        {
          name: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_PAYMENT,
          parameters: {
            amount: '500',
            note: 'second payment',
          },
          timestamp: 15,
        },
        {
          name: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_REFUND,
          parameters: {
            amount: '100',
            note: 'first refund',
          },
          timestamp: 20,
        },
        {
          name: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_REFUND,
          parameters: {
            amount: '200',
            note: 'second refund',
          },
          timestamp: 25,
        },
      ],
    } as ExtensionTypes.IState;

    const getBalanceReturn = await declarative.getBalance(requestMock);

    expect(getBalanceReturn).toMatchObject({
      balance: '1200', // 1000 + 500 - 100 - 200
      events: [
        {
          amount: '1000',
          name: PaymentTypes.EVENTS_NAMES.PAYMENT,
          parameters: {
            note: 'first payment',
          },
          timestamp: 10,
        },
        {
          amount: '500',
          name: PaymentTypes.EVENTS_NAMES.PAYMENT,
          parameters: {
            note: 'second payment',
          },
          timestamp: 15,
        },
        {
          amount: '100',
          name: PaymentTypes.EVENTS_NAMES.REFUND,
          parameters: {
            note: 'first refund',
          },
          timestamp: 20,
        },
        {
          amount: '200',
          name: PaymentTypes.EVENTS_NAMES.REFUND,
          parameters: {
            note: 'second refund',
          },
          timestamp: 25,
        },
      ],
    });
  });
});
