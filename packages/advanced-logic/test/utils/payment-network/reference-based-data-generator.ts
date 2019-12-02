import * as TestData from '../test-data-generator';

import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';

export const arbitraryTimestamp = 1544426030;

const PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED = 'do-not-use!-pn-test-reference-based' as ExtensionTypes.ID;
// ---------------------------------------------------------------------
// Mock addresses for testing generic address based payment networks
export const paymentAddress = '0x627306090abaB3A6e1400e9345bC60c78a8BEf57';
export const refundAddress = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';

export const salt = 'ea3bc7caf64110ca';

// This salt is not valid, it contains a 'z'
export const invalidSalt = 'ea3bc7czf64110ca';

// ---------------------------------------------------------------------
// actions
export const actionCreationWithPaymentAndRefund = {
  action: 'create',
  id: PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED,
  parameters: {
    paymentAddress,
    refundAddress,
    salt,
  },
  version: '0.1.0',
};
export const actionCreationOnlyPayment = {
  action: 'create',
  id: PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED,
  parameters: {
    paymentAddress,
    salt,
  },
  version: '0.1.0',
};
export const actionCreationOnlyRefund = {
  action: 'create',
  id: PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED,
  parameters: {
    refundAddress,
    salt,
  },
  version: '0.1.0',
};
export const actionCreationEmpty = {
  action: 'create',
  id: PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED,
  parameters: { salt },
  version: '0.1.0',
};

// ---------------------------------------------------------------------
// extensions states
export const extensionStateWithPaymentAndRefund = {
  [PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED as string]: {
    events: [
      {
        name: 'create',
        parameters: {
          paymentAddress,
          refundAddress,
          salt,
        },
        timestamp: arbitraryTimestamp,
      },
    ],
    id: PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      paymentAddress,
      refundAddress,
      salt,
    },
    version: '0.1.0',
  },
};
export const extensionStateCreatedEmpty = {
  [PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED as string]: {
    events: [
      {
        name: 'create',
        parameters: { salt },
        timestamp: arbitraryTimestamp,
      },
    ],
    id: PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: { salt },
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

export const requestStateCreatedWithPaymentAndRefund: RequestLogicTypes.IRequest = {
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
        extensionsDataLength: 1,
        isSignedRequest: false,
      },
      timestamp: arbitraryTimestamp,
    },
  ],
  expectedAmount: TestData.arbitraryExpectedAmount,
  extensions: extensionStateWithPaymentAndRefund,
  extensionsData: [actionCreationWithPaymentAndRefund],
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
