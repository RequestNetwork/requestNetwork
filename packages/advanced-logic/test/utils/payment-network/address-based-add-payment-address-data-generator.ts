import * as TestDataCreate from './address-based-data-generator';

import * as TestData from '../test-data-generator';

import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';

export const arbitraryTimestamp = 1544426030;

const PAYMENT_NETWORK_TEST_GENERIC_ADDRESS_BASED = 'do-not-use!-pn-test-address-based' as ExtensionTypes.ID;
// ---------------------------------------------------------------------
// Mock addresses for testing generic address based payment networks
export const paymentAddress = 'This is the payment address';
export const refundAddress = 'This is my refund address';

// ---------------------------------------------------------------------
// actions
export const actionAddPaymentAddress = {
  action: ExtensionTypes.PnAddressBased.ACTION.ADD_PAYMENT_ADDRESS,
  id: PAYMENT_NETWORK_TEST_GENERIC_ADDRESS_BASED,
  parameters: {
    paymentAddress,
  },
};
export const actionAddRefundAddress = {
  action: ExtensionTypes.PnAddressBased.ACTION.ADD_REFUND_ADDRESS,
  id: PAYMENT_NETWORK_TEST_GENERIC_ADDRESS_BASED,
  parameters: {
    refundAddress,
  },
};

// ---------------------------------------------------------------------
// extensions states
export const extensionStateWithPaymentAfterCreation = {
  [PAYMENT_NETWORK_TEST_GENERIC_ADDRESS_BASED as string]: {
    events: [
      {
        name: ExtensionTypes.PnAddressBased.ACTION.CREATE,
        parameters: {},
        timestamp: arbitraryTimestamp,
      },
      {
        name: ExtensionTypes.PnAddressBased.ACTION.ADD_PAYMENT_ADDRESS,
        parameters: {
          paymentAddress,
        },
        timestamp: arbitraryTimestamp,
      },
    ],
    id: PAYMENT_NETWORK_TEST_GENERIC_ADDRESS_BASED,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      paymentAddress,
    },
    version: '0.1.0',
  },
};

export const extensionStateWithRefundAfterCreation = {
  [PAYMENT_NETWORK_TEST_GENERIC_ADDRESS_BASED as string]: {
    events: [
      {
        name: ExtensionTypes.PnAddressBased.ACTION.CREATE,
        parameters: {},
        timestamp: arbitraryTimestamp,
      },
      {
        name: ExtensionTypes.PnAddressBased.ACTION.ADD_REFUND_ADDRESS,
        parameters: {
          refundAddress,
        },
        timestamp: arbitraryTimestamp,
      },
    ],
    id: PAYMENT_NETWORK_TEST_GENERIC_ADDRESS_BASED,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      refundAddress,
    },
    version: '0.1.0',
  },
};

// ---------------------------------------------------------------------
// request states
export const requestStateCreatedEmptyThenAddPayment: RequestLogicTypes.IRequest = {
  creator: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: TestData.payeeRaw.address,
  },
  currency: {
    type: RequestLogicTypes.CURRENCY.ISO4217,
    value: 'EUR',
  },
  events: [
    {
      actionSigner: {
        type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        value: TestData.payeeRaw.address,
      },
      name: RequestLogicTypes.ACTION_NAME.CREATE,
      parameters: {
        expectedAmount: '123400000000000000',
        extensionsDataLength: 2,
        isSignedRequest: false,
      },
      timestamp: arbitraryTimestamp,
    },
  ],
  expectedAmount: TestData.arbitraryExpectedAmount,
  extensions: extensionStateWithPaymentAfterCreation,
  extensionsData: [TestDataCreate.actionCreationEmpty, actionAddPaymentAddress],
  payee: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: TestData.payeeRaw.address,
  },
  payer: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: TestData.payerRaw.address,
  },
  requestId: TestData.requestIdMock,
  state: RequestLogicTypes.STATE.CREATED,
  timestamp: TestData.arbitraryTimestamp,
  version: '0.1.0',
};

export const requestStateCreatedEmptyThenAddRefund: RequestLogicTypes.IRequest = {
  creator: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: TestData.payeeRaw.address,
  },
  currency: {
    type: RequestLogicTypes.CURRENCY.ISO4217,
    value: 'EUR',
  },
  events: [
    {
      actionSigner: {
        type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        value: TestData.payeeRaw.address,
      },
      name: RequestLogicTypes.ACTION_NAME.CREATE,
      parameters: {
        expectedAmount: '123400000000000000',
        extensionsDataLength: 2,
        isSignedRequest: false,
      },
      timestamp: arbitraryTimestamp,
    },
  ],
  expectedAmount: TestData.arbitraryExpectedAmount,
  extensions: extensionStateWithRefundAfterCreation,
  extensionsData: [TestDataCreate.actionCreationEmpty, actionAddRefundAddress],
  payee: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: TestData.payeeRaw.address,
  },
  payer: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: TestData.payerRaw.address,
  },
  requestId: TestData.requestIdMock,
  state: RequestLogicTypes.STATE.CREATED,
  timestamp: TestData.arbitraryTimestamp,
  version: '0.1.0',
};
