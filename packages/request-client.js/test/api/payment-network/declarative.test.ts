import {
  AdvancedLogicTypes,
  ExtensionTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';

import Declarative from '../../../src/api/payment-network/declarative';

import * as Types from '../../../src/types';

import 'chai';
import 'mocha';

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
    type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
    value: '',
  },
  currency: RequestLogicTypes.CURRENCY.ETH,
  events: [],
  expectedAmount: {},
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
    declarative = new Declarative(mockAdvancedLogic);
  });

  it('can createExtensionsDataForCreation', async () => {
    const spy = sandbox.on(mockAdvancedLogic.extensions.declarative, 'createCreationAction');

    declarative.createExtensionsDataForCreation({
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
    requestMock.extensionsData = [
      {
        id: Types.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED,
      },
      {
        id: Types.PAYMENT_NETWORK_ID.TESTNET_BITCOIN_ADDRESS_BASED,
      },
      {
        action: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_SENT_PAYMENT,
        id: Types.PAYMENT_NETWORK_ID.DECLARATIVE,
      },
      {
        action: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_SENT_REFUND,
        id: Types.PAYMENT_NETWORK_ID.DECLARATIVE,
      },
      {
        action: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_PAYMENT,
        id: Types.PAYMENT_NETWORK_ID.DECLARATIVE,
        parameters: {
          amount: '1000',
          note: 'first payment',
        },
      },
      {
        action: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_PAYMENT,
        id: Types.PAYMENT_NETWORK_ID.DECLARATIVE,
        parameters: {
          amount: '500',
          note: 'second payment',
        },
      },
      {
        action: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_REFUND,
        id: Types.PAYMENT_NETWORK_ID.DECLARATIVE,
        parameters: {
          amount: '100',
          note: 'first refund',
        },
      },
      {
        action: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_REFUND,
        id: Types.PAYMENT_NETWORK_ID.DECLARATIVE,
        parameters: {
          amount: '200',
          note: 'second refund',
        },
      },
    ];

    const getBalanceReturn = await declarative.getBalance(requestMock);

    expect(getBalanceReturn).to.deep.equal({
      balance: '1200', // 1000 + 500 - 100 - 200
      events: [
        {
          name: Types.EVENTS_NAMES.PAYMENT,
          parameters: {
            amount: '1000',
            note: 'first payment',
          },
        },
        {
          name: Types.EVENTS_NAMES.PAYMENT,
          parameters: {
            amount: '500',
            note: 'second payment',
          },
        },
        {
          name: Types.EVENTS_NAMES.REFUND,
          parameters: {
            amount: '100',
            note: 'first refund',
          },
        },
        {
          name: Types.EVENTS_NAMES.REFUND,
          parameters: {
            amount: '200',
            note: 'second refund',
          },
        },
      ],
    });
  });
});
