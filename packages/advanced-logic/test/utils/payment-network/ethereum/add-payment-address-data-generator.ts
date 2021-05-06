import * as TestDataCreate from './create-data-generator';

import * as TestData from '../../test-data-generator';

import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';

export const arbitraryTimestamp = 1544426030;

// ---------------------------------------------------------------------
// Mock addresses for testing generic address based payment networks
export const paymentAddress = '0x627306090abaB3A6e1400e9345bC60c78a8BEf57';
export const refundAddress = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
export const invalidAddress = '0xnotandaddress';
// ---------------------------------------------------------------------
export const salt = 'ea3bc7caf64110ca';
// actions
export const actionAddPaymentAddress = {
  action: ExtensionTypes.PnReferenceBased.ACTION.ADD_PAYMENT_ADDRESS,
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA,
  parameters: {
    paymentAddress,
  },
};
export const actionAddRefundAddress = {
  action: ExtensionTypes.PnReferenceBased.ACTION.ADD_REFUND_ADDRESS,
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA,
  parameters: {
    refundAddress,
  },
};

// ---------------------------------------------------------------------
// extensions states
export const extensionStateWithPaymentAfterCreation = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA as string]: {
    events: [
      {
        name: ExtensionTypes.PnReferenceBased.ACTION.CREATE,
        parameters: {},
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
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      paymentAddress,
    },
    version: '0.2.0',
  },
};

export const extensionStateWithRefundAfterCreation = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA as string]: {
    events: [
      {
        name: ExtensionTypes.PnReferenceBased.ACTION.CREATE,
        parameters: {},
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
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      refundAddress,
    },
    version: '0.2.0',
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
    network: 'mainnet',
    type: RequestLogicTypes.CURRENCY.ETH,
    value: 'ETH',
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
  version: '0.2.0',
};

export const requestStateCreatedEmptyThenAddRefund: RequestLogicTypes.IRequest = {
  creator: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: TestData.payeeRaw.address,
  },
  currency: {
    network: 'mainnet',
    type: RequestLogicTypes.CURRENCY.ETH,
    value: 'ETH',
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
  version: '0.2.0',
};
