import * as TestDataCreate from './generator-data-create';

import * as TestData from '../../test-data-generator';

import {
  Extension as ExtensionTypes,
  Identity as IdentityTypes,
  RequestLogic as Types,
} from '@requestnetwork/types';

// ---------------------------------------------------------------------
// BTC address
export const paymentBTCAddress = '16uyvigo8mMAfE3Ctr5Rwgab1aWNDPDMZD';
export const refundBTCAddress = '13etbjB89ZDMfmcctwT5qwMtrJdmWPBN8W';
export const paymentTestnetBTCAddress = 'mgPKDuVmuS9oeE2D9VPiCQriyU14wxWS1v';
export const refundTestnetBTCAddress = 'mfsSPZdcdXwSMVkPwCsiW39P5y6eYE1bDM';

// ---------------------------------------------------------------------
// actions
export const actionAddPaymentAddress = {
  action: ExtensionTypes.PnBitcoinAddressBased.PN_BTC_ADDRESS_BASED_ACTION.ADD_PAYMENT_ADDRESS,
  id: ExtensionTypes.EXTENSION_ID.PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED,
  parameters: {
    paymentAddress: paymentTestnetBTCAddress,
  },
};
export const actionAddRefundAddress = {
  action: ExtensionTypes.PnBitcoinAddressBased.PN_BTC_ADDRESS_BASED_ACTION.ADD_REFUND_ADDRESS,
  id: ExtensionTypes.EXTENSION_ID.PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED,
  parameters: {
    refundAddress: refundTestnetBTCAddress,
  },
};

// ---------------------------------------------------------------------
// extensions states
export const extensionStateWithPaymentAfterCreation = {
  [ExtensionTypes.EXTENSION_ID.PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED as string]: {
    events: [
      {
        name: ExtensionTypes.PnBitcoinAddressBased.PN_BTC_ADDRESS_BASED_ACTION.CREATE,
        parameters: {},
      },
      {
        name: ExtensionTypes.PnBitcoinAddressBased.PN_BTC_ADDRESS_BASED_ACTION.ADD_PAYMENT_ADDRESS,
        parameters: {
          paymentAddress: paymentTestnetBTCAddress,
        },
      },
    ],
    id: ExtensionTypes.EXTENSION_ID.PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED,
    type: ExtensionTypes.EXTENSION_TYPE.PAYMENT_NETWORK,
    values: {
      paymentAddress: paymentTestnetBTCAddress,
    },
    version: '0.1.0',
  },
};

export const extensionStateWithRefundAfterCreation = {
  [ExtensionTypes.EXTENSION_ID.PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED as string]: {
    events: [
      {
        name: ExtensionTypes.PnBitcoinAddressBased.PN_BTC_ADDRESS_BASED_ACTION.CREATE,
        parameters: {},
      },
      {
        name: ExtensionTypes.PnBitcoinAddressBased.PN_BTC_ADDRESS_BASED_ACTION.ADD_REFUND_ADDRESS,
        parameters: {
          refundAddress: refundTestnetBTCAddress,
        },
      },
    ],
    id: ExtensionTypes.EXTENSION_ID.PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED,
    type: ExtensionTypes.EXTENSION_TYPE.PAYMENT_NETWORK,
    values: {
      refundAddress: refundTestnetBTCAddress,
    },
    version: '0.1.0',
  },
};

// ---------------------------------------------------------------------
// request states
export const requestStateCreatedEmptyThenAddPayment: Types.IRequest = {
  creator: {
    type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: TestData.payeeRaw.address,
  },
  currency: Types.CURRENCY.BTC,
  events: [
    {
      actionSigner: {
        type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        value: TestData.payeeRaw.address,
      },
      name: Types.ACTION_NAME.CREATE,
      parameters: {
        expectedAmount: '123400000000000000',
        extensionsDataLength: 2,
        isSignedRequest: false,
      },
    },
  ],
  expectedAmount: TestData.arbitraryExpectedAmount,
  extensions: extensionStateWithPaymentAfterCreation,
  extensionsData: [TestDataCreate.actionCreationEmpty, actionAddPaymentAddress],
  payee: {
    type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: TestData.payeeRaw.address,
  },
  payer: {
    type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: TestData.payerRaw.address,
  },
  requestId: TestData.requestIdMock,
  state: Types.STATE.CREATED,
  timestamp: TestData.arbitraryTimestamp,
  version: '0.1.0',
};

export const requestStateCreatedEmptyThenAddRefund: Types.IRequest = {
  creator: {
    type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: TestData.payeeRaw.address,
  },
  currency: Types.CURRENCY.BTC,
  events: [
    {
      actionSigner: {
        type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        value: TestData.payeeRaw.address,
      },
      name: Types.ACTION_NAME.CREATE,
      parameters: {
        expectedAmount: '123400000000000000',
        extensionsDataLength: 2,
        isSignedRequest: false,
      },
    },
  ],
  expectedAmount: TestData.arbitraryExpectedAmount,
  extensions: extensionStateWithRefundAfterCreation,
  extensionsData: [TestDataCreate.actionCreationEmpty, actionAddRefundAddress],
  payee: {
    type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: TestData.payeeRaw.address,
  },
  payer: {
    type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: TestData.payerRaw.address,
  },
  requestId: TestData.requestIdMock,
  state: Types.STATE.CREATED,
  timestamp: TestData.arbitraryTimestamp,
  version: '0.1.0',
};
