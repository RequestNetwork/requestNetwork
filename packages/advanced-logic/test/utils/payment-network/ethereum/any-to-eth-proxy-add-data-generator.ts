import * as TestDataCreate from './fee-proxy-contract-create-data-generator';

import * as TestData from '../../test-data-generator';

import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';

export const arbitraryTimestamp = 1544426030;

// ---------------------------------------------------------------------
// Mock addresses for testing generic address based payment networks
export const paymentAddress = '0x627306090abaB3A6e1400e9345bC60c78a8BEf57';
export const refundAddress = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
export const feeAddress = '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef';
export const feeAmount = '2000000000000000000';
export const invalidAddress = '0x not an address';
const network = 'mainnet';
const version = '0.1.0';
// ---------------------------------------------------------------------
export const salt = 'ea3bc7caf64110ca';
// actions
export const actionAddPaymentAddress = {
  action: ExtensionTypes.PnFeeReferenceBased.ACTION.ADD_PAYMENT_ADDRESS,
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ETH_PROXY,
  parameters: {
    paymentAddress,
  },
};
export const actionAddRefundAddress = {
  action: ExtensionTypes.PnFeeReferenceBased.ACTION.ADD_REFUND_ADDRESS,
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ETH_PROXY,
  parameters: {
    refundAddress,
  },
};
export const actionAddFee = {
  action: ExtensionTypes.PnFeeReferenceBased.ACTION.ADD_FEE,
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ETH_PROXY,
  parameters: {
    feeAddress,
    feeAmount,
  },
};
export const declareReceivedPayment = {
  action: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_PAYMENT,
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ETH_PROXY,
  parameters: {
    amount: '123400000000000000',
    note: 'this is your payment',
    txHash: 'somehash',
    network: 'matic'
  }
}

// ---------------------------------------------------------------------
// extensions states
export const extensionStateWithPaymentAfterCreation = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ETH_PROXY as string]: {
    events: [
      {
        name: ExtensionTypes.PnFeeReferenceBased.ACTION.CREATE,
        parameters: {
          network
        },
        timestamp: arbitraryTimestamp,
      },
      {
        name: ExtensionTypes.PnFeeReferenceBased.ACTION.ADD_PAYMENT_ADDRESS,
        parameters: {
          paymentAddress,
        },
        timestamp: arbitraryTimestamp,
      },
    ],
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ETH_PROXY,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      paymentAddress,
      network,
      receivedPaymentAmount: '0'
    },
    version,
  },
};

export const extensionStateWithRefundAfterCreation = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ETH_PROXY as string]: {
    events: [
      {
        name: ExtensionTypes.PnFeeReferenceBased.ACTION.CREATE,
        parameters: {
          network
        },
        timestamp: arbitraryTimestamp,
      },
      {
        name: ExtensionTypes.PnFeeReferenceBased.ACTION.ADD_REFUND_ADDRESS,
        parameters: {
          refundAddress,
        },
        timestamp: arbitraryTimestamp,
      },
    ],
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ETH_PROXY,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      refundAddress,
      network,
      receivedPaymentAmount: '0'
    },
    version,
  },
};

export const extensionStateWithFeeAfterCreation = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ETH_PROXY as string]: {
    events: [
      {
        name: ExtensionTypes.PnFeeReferenceBased.ACTION.CREATE,
        parameters: {
          network
        },
        timestamp: arbitraryTimestamp,
      },
      {
        name: ExtensionTypes.PnFeeReferenceBased.ACTION.ADD_FEE,
        parameters: {
          feeAddress,
          feeAmount,
        },
        timestamp: arbitraryTimestamp,
      },
    ],
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ETH_PROXY,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      feeAddress,
      feeAmount,
      network,
      receivedPaymentAmount: '0'
    },
    version,
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
  version,
};

export const requestStateCreatedEmptyThenAddFee: RequestLogicTypes.IRequest = {
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
  extensions: extensionStateWithFeeAfterCreation,
  extensionsData: [TestDataCreate.actionCreationEmpty, actionAddFee],
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
