import * as TestDataCreate from './stream-create-data-generator';

import * as TestData from '../../test-data-generator';

import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';

export const arbitraryTimestamp = 1544426030;

// ---------------------------------------------------------------------
// Mock addresses for testing generic address based payment networks
export const paymentAddress = '0x627306090abaB3A6e1400e9345bC60c78a8BEf57';
export const refundAddress = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
export const expectedFlowRate = '381944444444442';
export const expectedStartDate = '1643041225';
export const invalidAddress = '0x not and address';
// ---------------------------------------------------------------------
export const salt = 'ea3bc7caf64110ca';
// actions
export const actionAddPaymentAddress = {
  action: ExtensionTypes.PnStreamReferenceBased.ACTION.ADD_PAYMENT_ADDRESS,
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM,
  parameters: {
    paymentAddress,
  },
};
export const actionAddRefundAddress = {
  action: ExtensionTypes.PnStreamReferenceBased.ACTION.ADD_REFUND_ADDRESS,
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM,
  parameters: {
    refundAddress,
  },
};
// TODO: Fee will be added later
// export const actionAddFee = {
//   action: ExtensionTypes.PnStreamReferenceBased.ACTION.ADD_FEE,
//   id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM,
//   parameters: {
//     expectedFlowRate,
//     expectedStartDate,
//   },
// };

// ---------------------------------------------------------------------
// extensions states
export const extensionStateWithPaymentAfterCreation = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM as string]: {
    events: [
      {
        name: ExtensionTypes.PnStreamReferenceBased.ACTION.CREATE,
        parameters: {},
        timestamp: arbitraryTimestamp,
      },
      {
        name: ExtensionTypes.PnStreamReferenceBased.ACTION.ADD_PAYMENT_ADDRESS,
        parameters: {
          paymentAddress,
        },
        timestamp: arbitraryTimestamp,
      },
    ],
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      paymentAddress,
    },
    version: '0.1.0',
  },
};

export const extensionStateWithRefundAfterCreation = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM as string]: {
    events: [
      {
        name: ExtensionTypes.PnStreamReferenceBased.ACTION.CREATE,
        parameters: {},
        timestamp: arbitraryTimestamp,
      },
      {
        name: ExtensionTypes.PnStreamReferenceBased.ACTION.ADD_REFUND_ADDRESS,
        parameters: {
          refundAddress,
        },
        timestamp: arbitraryTimestamp,
      },
    ],
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      refundAddress,
    },
    version: '0.1.0',
  },
};

// TODO: Fee will be added later
// export const extensionStateWithFeeAfterCreation = {
//   [ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM as string]: {
//     events: [
//       {
//         name: ExtensionTypes.PnStreamReferenceBased.ACTION.CREATE,
//         parameters: {},
//         timestamp: arbitraryTimestamp,
//       },
//       {
//         name: ExtensionTypes.PnStreamReferenceBased.ACTION.ADD_FEE,
//         parameters: {
//           expectedFlowRate,
//           expectedStartDate,
//         },
//         timestamp: arbitraryTimestamp,
//       },
//     ],
//     id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM,
//     type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
//     values: {
//       expectedFlowRate,
//       expectedStartDate,
//     },
//     version: '0.1.0',
//   },
// };

// ---------------------------------------------------------------------
// request states
export const requestStateCreatedEmptyThenAddPayment: RequestLogicTypes.IRequest = {
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

// TODO: Fee will be added later
// export const requestStateCreatedEmptyThenAddFee: RequestLogicTypes.IRequest = {
//   creator: {
//     type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
//     value: TestData.payeeRaw.address,
//   },
//   currency: {
//     network: 'rinkeby',
//     type: RequestLogicTypes.CURRENCY.ERC777,
//     value: '0x745861aed1eee363b4aaa5f1994be40b1e05ff90', //fDAIx
//   },
//   events: [
//     {
//       actionSigner: {
//         type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
//         value: TestData.payeeRaw.address,
//       },
//       name: RequestLogicTypes.ACTION_NAME.CREATE,
//       parameters: {
//         expectedAmount: '123400000000000000',
//         extensionsDataLength: 2,
//         isSignedRequest: false,
//       },
//       timestamp: arbitraryTimestamp,
//     },
//   ],
//   expectedAmount: TestData.arbitraryExpectedAmount,
//   extensions: extensionStateWithFeeAfterCreation,
//   extensionsData: [TestDataCreate.actionCreationEmpty, actionAddFee],
//   payee: {
//     type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
//     value: TestData.payeeRaw.address,
//   },
//   payer: {
//     type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
//     value: TestData.payerRaw.address,
//   },
//   requestId: TestData.requestIdMock,
//   state: RequestLogicTypes.STATE.CREATED,
//   timestamp: TestData.arbitraryTimestamp,
//   version: '0.1.0',
// };
