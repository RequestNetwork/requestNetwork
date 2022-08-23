import * as TestData from '../../test-data-generator';

import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';

export const arbitraryTimestamp = 1544426030;

// ---------------------------------------------------------------------
// Mock addresses for testing ETH payment networks
export const paymentAddress = '0x627306090abaB3A6e1400e9345bC60c78a8BEf57';
export const refundAddress = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
export const expectedFlowRate = '381944444444442';
export const expectedStartDate = '1643041225';
export const invalidAddress = '0x not and address';
export const originalRequestId = 'abcd';
export const previousRequestId = 'efgh';
export const recurrenceNumber = 2;

const version = '0.1.0';
const fDAIx = '0x745861aed1eee363b4aaa5f1994be40b1e05ff90';
const network = 'rinkeby';

// ---------------------------------------------------------------------
export const salt = 'ea3bc7caf64110ca';
// actions
export const actionCreationFull = {
  action: RequestLogicTypes.ACTION_NAME.CREATE,
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM,
  parameters: {
    expectedFlowRate,
    expectedStartDate,
    paymentAddress,
    refundAddress,
    salt,
  },
  version,
};
export const actionCreationFullSubsequent = {
  action: RequestLogicTypes.ACTION_NAME.CREATE,
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM,
  parameters: {
    originalRequestId,
    previousRequestId,
    recurrenceNumber,
  },
  version,
};
export const actionCreationOnlyPayment = {
  action: RequestLogicTypes.ACTION_NAME.CREATE,
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM,
  parameters: {
    paymentAddress,
  },
  version,
};
export const actionCreationEmpty = {
  action: RequestLogicTypes.ACTION_NAME.CREATE,
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM,
  parameters: {},
  version,
};

export const extensionFullStateSubsequent: RequestLogicTypes.IExtensionStates = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM as string]: {
    events: [
      {
        name: RequestLogicTypes.ACTION_NAME.CREATE,
        parameters: {
          originalRequestId,
          previousRequestId,
          recurrenceNumber,
        },
        timestamp: arbitraryTimestamp,
      },
    ],
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      originalRequestId,
      previousRequestId,
      recurrenceNumber,
    },
    version,
  },
};
// ---------------------------------------------------------------------
// extensions states
export const extensionFullState: RequestLogicTypes.IExtensionStates = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM as string]: {
    events: [
      {
        name: RequestLogicTypes.ACTION_NAME.CREATE,
        parameters: {
          expectedFlowRate,
          expectedStartDate,
          paymentAddress,
          refundAddress,
          salt,
        },
        timestamp: arbitraryTimestamp,
      },
    ],
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      expectedFlowRate,
      expectedStartDate,
      paymentAddress,
      refundAddress,
      salt,
      payeeDelegate: undefined,
      payerDelegate: undefined,
      paymentInfo: undefined,
      receivedPaymentAmount: '0',
      receivedRefundAmount: '0',
      refundInfo: undefined,
      sentPaymentAmount: '0',
      sentRefundAmount: '0',
    },
    version,
  },
};
export const extensionStateCreatedEmpty = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM as string]: {
    events: [
      {
        name: RequestLogicTypes.ACTION_NAME.CREATE,
        parameters: {},
        timestamp: arbitraryTimestamp,
      },
    ],
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {},
    version,
  },
};

// ---------------------------------------------------------------------
// request states
const baseRequestState = {
  creator: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: TestData.payeeRaw.address,
  },
  currency: {
    network: network,
    type: RequestLogicTypes.CURRENCY.ERC777,
    value: fDAIx,
  },
  payee: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: TestData.payeeRaw.address,
  },
  payer: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: TestData.payerRaw.address,
  },
  expectedAmount: TestData.arbitraryExpectedAmount,
  requestId: TestData.requestIdMock,
  state: RequestLogicTypes.STATE.CREATED,
  timestamp: TestData.arbitraryTimestamp,
  version,
};

const baseRequestEvent = {
  actionSigner: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: TestData.payeeRaw.address,
  },
  name: RequestLogicTypes.ACTION_NAME.CREATE,
  parameters: {
    expectedAmount: '123400000000000000',
    extensionsDataLength: 0,
    isSignedRequest: false,
  },
  timestamp: arbitraryTimestamp,
};

export const requestStateNoExtensions: RequestLogicTypes.IRequest = {
  ...baseRequestState,
  events: [
    {
      ...baseRequestEvent,
    },
  ],
  extensions: {},
  extensionsData: [],
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
  version,
};

export const requestFullStateCreated: RequestLogicTypes.IRequest = {
  creator: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: TestData.payeeRaw.address,
  },
  currency: {
    network: network,
    type: RequestLogicTypes.CURRENCY.ERC777,
    value: fDAIx,
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
        extensionsDataLength: 1,
        isSignedRequest: false,
      },
      timestamp: arbitraryTimestamp,
    },
  ],
  expectedAmount: TestData.arbitraryExpectedAmount,
  extensions: extensionFullState,
  extensionsData: [actionCreationFull],
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
  version,
};

export const requestStateCreatedEmpty: RequestLogicTypes.IRequest = {
  ...baseRequestState,
  events: [
    {
      ...baseRequestEvent,
      parameters: {
        ...baseRequestEvent.parameters,
        extensionsDataLength: 1,
      },
    },
  ],
  extensions: extensionStateCreatedEmpty,
  extensionsData: [actionCreationEmpty],
};
