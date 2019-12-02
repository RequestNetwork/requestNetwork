import * as TestDataCreate from './reference-based-data-generator';

import * as TestData from '../test-data-generator';

import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';

export const arbitraryTimestamp = 1544426030;

const PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED = 'do-not-use!-pn-test-reference-based' as ExtensionTypes.ID;
// ---------------------------------------------------------------------
// Mock addresses for testing generic address based payment networks
export const paymentAddress = '0x627306090abaB3A6e1400e9345bC60c78a8BEf57';
export const refundAddress = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';

export const salt = 'ea3bc7caf64110ca';

// ---------------------------------------------------------------------
// actions
export const actionAddPaymentAddress = {
  action: ExtensionTypes.PnReferenceBased.ACTION.ADD_PAYMENT_ADDRESS,
  id: PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED,
  parameters: {
    paymentAddress,
  },
};
export const actionAddRefundAddress = {
  action: ExtensionTypes.PnReferenceBased.ACTION.ADD_REFUND_ADDRESS,
  id: PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED,
  parameters: {
    refundAddress,
  },
};

// ---------------------------------------------------------------------
// extensions states
export const extensionStateWithPaymentAfterCreation = {
  [PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED as string]: {
    events: [
      {
        name: ExtensionTypes.PnReferenceBased.ACTION.CREATE,
        parameters: { salt },
        timestamp: arbitraryTimestamp,
      },
      {
        name: ExtensionTypes.PnReferenceBased.ACTION.ADD_PAYMENT_ADDRESS,
        parameters: {
          paymentAddress,
        },
        timestamp: arbitraryTimestamp,
      },
    ],
    id: PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      paymentAddress,
      salt,
    },
    version: '0.1.0',
  },
};

export const extensionStateWithRefundAfterCreation = {
  [PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED as string]: {
    events: [
      {
        name: ExtensionTypes.PnReferenceBased.ACTION.CREATE,
        parameters: { salt },
        timestamp: arbitraryTimestamp,
      },
      {
        name: ExtensionTypes.PnReferenceBased.ACTION.ADD_REFUND_ADDRESS,
        parameters: {
          refundAddress,
        },
        timestamp: arbitraryTimestamp,
      },
    ],
    id: PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      refundAddress,
      salt,
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
