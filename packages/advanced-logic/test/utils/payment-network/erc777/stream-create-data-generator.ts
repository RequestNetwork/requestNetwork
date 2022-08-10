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
export const masterRequestId = 'abcd';
export const previousRequestId = 'efgh';
export const recurrenceNumber = '2';

// ---------------------------------------------------------------------
export const salt = 'ea3bc7caf64110ca';
// actions
export const actionCreationFull = {
  action: 'create',
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM,
  parameters: {
    expectedFlowRate,
    expectedStartDate,
    paymentAddress,
    refundAddress,
    salt,
  },
  version: '0.1.0',
};
export const actionCreationFullSubsequent = {
  action: 'create',
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM,
  parameters: {
    masterRequestId,
    previousRequestId,
    recurrenceNumber,
  },
  version: '0.1.0',
};
export const actionCreationOnlyPayment = {
  action: 'create',
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM,
  parameters: {
    paymentAddress,
  },
  version: '0.1.0',
};
export const actionCreationOnlyRefund = {
  action: 'create',
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM,
  parameters: {
    refundAddress,
  },
  version: '0.1.0',
};
export const actionCreationOnlyFlow = {
  action: 'create',
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM,
  parameters: {
    expectedFlowRate,
    expectedStartDate,
  },
  version: '0.1.0',
};
export const actionCreationEmpty = {
  action: 'create',
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM,
  parameters: {},
  version: '0.1.0',
};

// ---------------------------------------------------------------------
// extensions states
export const extensionFullState = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM as string]: {
    events: [
      {
        name: 'create',
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
    version: '0.1.0',
  },
};
export const extensionFullStateSubsequent = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM as string]: {
    events: [
      {
        name: 'create',
        parameters: {
          masterRequestId,
          previousRequestId,
          recurrenceNumber,
        },
        timestamp: arbitraryTimestamp,
      },
    ],
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      masterRequestId,
      previousRequestId,
      recurrenceNumber,
    },
    version: '0.1.0',
  },
};
export const extensionStateCreatedEmpty = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM as string]: {
    events: [
      {
        name: 'create',
        parameters: {},
        timestamp: arbitraryTimestamp,
      },
    ],
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {},
    version: '0.1.0',
  },
};

// ---------------------------------------------------------------------
// request states
export const requestStateNoExtensions: RequestLogicTypes.IRequest = {
  creator: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: TestData.payeeRaw.address,
  },
  currency: {
    network: 'rinkeby',
    type: RequestLogicTypes.CURRENCY.ERC777,
    value: '0x745861aed1eee363b4aaa5f1994be40b1e05ff90', //fDAIx
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
        extensionsDataLength: 0,
        isSignedRequest: false,
      },
      timestamp: arbitraryTimestamp,
    },
  ],
  expectedAmount: TestData.arbitraryExpectedAmount,
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
  version: '0.1.0',
};

export const requestFullStateCreated: RequestLogicTypes.IRequest = {
  creator: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: TestData.payeeRaw.address,
  },
  currency: {
    network: 'rinkeby',
    type: RequestLogicTypes.CURRENCY.ERC777,
    value: '0x745861aed1eee363b4aaa5f1994be40b1e05ff90', //fDAIx
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
  version: '0.1.0',
};

export const subsequentRequestFullStateCreated: RequestLogicTypes.IRequest = {
  creator: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: TestData.payeeRaw.address,
  },
  currency: {
    network: 'rinkeby',
    type: RequestLogicTypes.CURRENCY.ERC777,
    value: '0x745861aed1eee363b4aaa5f1994be40b1e05ff90', //fDAIx
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
  extensions: extensionFullStateSubsequent,
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
  version: '0.1.0',
};

export const requestStateCreatedEmpty: RequestLogicTypes.IRequest = {
  creator: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: TestData.payeeRaw.address,
  },
  currency: {
    network: 'rinkeby',
    type: RequestLogicTypes.CURRENCY.ERC777,
    value: '0x745861aed1eee363b4aaa5f1994be40b1e05ff90', //fDAIx
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
  extensions: extensionStateCreatedEmpty,
  extensionsData: [actionCreationEmpty],
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
