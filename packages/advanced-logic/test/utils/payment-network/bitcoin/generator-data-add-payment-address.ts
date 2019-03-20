import * as TestDataCreate from './generator-data-create';

import * as TestData from '../../test-data-generator';

import {
  Extension as ExtensionTypes,
  Identity as IdentityTypes,
  RequestLogic as Types,
} from '@requestnetwork/types';

export const arbitraryTimestamp = 1544426030;

// ---------------------------------------------------------------------
// BTC address
export const paymentBTCAddress = '16uyvigo8mMAfE3Ctr5Rwgab1aWNDPDMZD';
export const refundBTCAddress = '13etbjB89ZDMfmcctwT5qwMtrJdmWPBN8W';
export const paymentTestnetBTCAddress = 'mgPKDuVmuS9oeE2D9VPiCQriyU14wxWS1v';
export const refundTestnetBTCAddress = 'mfsSPZdcdXwSMVkPwCsiW39P5y6eYE1bDM';

// ---------------------------------------------------------------------
// actions
export const actionAddPaymentAddress = {
  action: ExtensionTypes.PnBitcoinAddressBased.ACTION.ADD_PAYMENT_ADDRESS,
  id: ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED,
  parameters: {
    paymentAddress: paymentBTCAddress,
  },
};
export const actionAddRefundAddress = {
  action: ExtensionTypes.PnBitcoinAddressBased.ACTION.ADD_REFUND_ADDRESS,
  id: ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED,
  parameters: {
    refundAddress: refundBTCAddress,
  },
};

// ---------------------------------------------------------------------
// extensions states
export const extensionStateWithPaymentAfterCreation = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED as string]: {
    events: [
      {
        name: ExtensionTypes.PnBitcoinAddressBased.ACTION.CREATE,
        parameters: {},
        timestamp: arbitraryTimestamp,
      },
      {
        name: ExtensionTypes.PnBitcoinAddressBased.ACTION.ADD_PAYMENT_ADDRESS,
        parameters: {
          paymentAddress: paymentBTCAddress,
        },
        timestamp: arbitraryTimestamp,
      },
    ],
    id: ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      paymentAddress: paymentBTCAddress,
    },
    version: '0.1.0',
  },
};

export const extensionStateWithRefundAfterCreation = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED as string]: {
    events: [
      {
        name: ExtensionTypes.PnBitcoinAddressBased.ACTION.CREATE,
        parameters: {},
        timestamp: arbitraryTimestamp,
      },
      {
        name: ExtensionTypes.PnBitcoinAddressBased.ACTION.ADD_REFUND_ADDRESS,
        parameters: {
          refundAddress: refundBTCAddress,
        },
        timestamp: arbitraryTimestamp,
      },
    ],
    id: ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      refundAddress: refundBTCAddress,
    },
    version: '0.1.0',
  },
};

// ---------------------------------------------------------------------
// request states
export const requestStateCreatedEmptyThenAddPayment: Types.IRequest = {
  creator: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: TestData.payeeRaw.address,
  },
  currency: Types.CURRENCY.BTC,
  events: [
    {
      actionSigner: {
        type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        value: TestData.payeeRaw.address,
      },
      name: Types.ACTION_NAME.CREATE,
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
  state: Types.STATE.CREATED,
  timestamp: TestData.arbitraryTimestamp,
  version: '0.1.0',
};

export const requestStateCreatedEmptyThenAddRefund: Types.IRequest = {
  creator: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: TestData.payeeRaw.address,
  },
  currency: Types.CURRENCY.BTC,
  events: [
    {
      actionSigner: {
        type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        value: TestData.payeeRaw.address,
      },
      name: Types.ACTION_NAME.CREATE,
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
  state: Types.STATE.CREATED,
  timestamp: TestData.arbitraryTimestamp,
  version: '0.1.0',
};
