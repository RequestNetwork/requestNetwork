import {
  AdvancedLogicTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';

import Declarative from '../src/declarative';

import 'chai';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const spies = require('chai-spies');
const expect = chai.expect;
chai.use(chaiAsPromised);
chai.use(spies);
const sandbox = chai.spy.sandbox();

let declarative: Declarative;

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions(): any {
    return;
  },
  extensions: {
    declarative: {
      createAddPaymentInstructionAction(): any {
        return;
      },
      createAddRefundInstructionAction(): any {
        return;
      },
      createCreationAction(): any {
        return;
      },
      createDeclareReceivedPaymentAction(): any {
        return;
      },
      createDeclareReceivedRefundAction(): any {
        return;
      },
      createDeclareSentPaymentAction(): any {
        return;
      },
      createDeclareSentRefundAction(): any {
        return;
      },
    },
  },
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
/* tslint:disable:no-unused-expression */
describe('api/declarative', () => {
  beforeEach(() => {
    sandbox.restore();
    declarative = new Declarative({ advancedLogic: mockAdvancedLogic });
  });

  it('can createExtensionsDataForCreation', async () => {
    const spy = sandbox.on(mockAdvancedLogic.extensions.declarative, 'createCreationAction');

    await declarative.createExtensionsDataForCreation({
      paymentInfo: 'payment instruction',
      refundInfo: 'refund instruction',
    });

    expect(spy).to.have.been.called.once;
  });

  it('can createExtensionsDataForAddPaymentInformation', async () => {
    const spy = sandbox.on(
      mockAdvancedLogic.extensions.declarative,
      'createAddPaymentInstructionAction',
    );

    declarative.createExtensionsDataForAddPaymentInformation({
      paymentInfo: 'payment instruction',
    });

    expect(spy).to.have.been.called.once;
  });

  it('can createExtensionsDataForAddRefundInformation', async () => {
    const spy = sandbox.on(
      mockAdvancedLogic.extensions.declarative,
      'createAddRefundInstructionAction',
    );

    declarative.createExtensionsDataForAddRefundInformation({ refundInfo: 'refund instruction' });

    expect(spy).to.have.been.called.once;
  });

  it('can createExtensionsDataForDeclareSentPayment', async () => {
    const spy = sandbox.on(
      mockAdvancedLogic.extensions.declarative,
      'createDeclareSentPaymentAction',
    );

    declarative.createExtensionsDataForDeclareSentPayment({ amount: '1000', note: 'payment sent' });

    expect(spy).to.have.been.called.once;
  });

  it('can createExtensionsDataForDeclareSentRefund', async () => {
    const spy = sandbox.on(
      mockAdvancedLogic.extensions.declarative,
      'createDeclareSentRefundAction',
    );

    declarative.createExtensionsDataForDeclareSentRefund({ amount: '1000', note: 'refund sent' });

    expect(spy).to.have.been.called.once;
  });

  it('can createExtensionsDataForDeclareReceivedPayment', async () => {
    const spy = sandbox.on(
      mockAdvancedLogic.extensions.declarative,
      'createDeclareReceivedPaymentAction',
    );

    declarative.createExtensionsDataForDeclareReceivedPayment({
      amount: '1000',
      note: 'payment received',
    });

    expect(spy).to.have.been.called.once;
  });

  it('can createExtensionsDataForDeclareReceivedRefund', async () => {
    const spy = sandbox.on(
      mockAdvancedLogic.extensions.declarative,
      'createDeclareReceivedRefundAction',
    );

    declarative.createExtensionsDataForDeclareReceivedRefund({
      amount: '1000',
      note: 'refund received',
    });

    expect(spy).to.have.been.called.once;
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

    expect(getBalanceReturn).to.deep.equal({
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
