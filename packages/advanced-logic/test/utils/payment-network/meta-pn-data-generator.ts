import * as TestData from '../test-data-generator';

import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';
import * as AnyToErc20Create from './erc20/any-to-erc20-proxy-create-data-generator';
import * as AnyToErc20Add from './erc20/any-to-erc20-proxy-add-data-generator';

export const arbitraryTimestamp = 1544426030;

// ---------------------------------------------------------------------
// Mock addresses for testing ETH payment networks
export const paymentAddress = '0x627306090abaB3A6e1400e9345bC60c78a8BEf57';
export const refundAddress = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
export const feeAddress = '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef';
export const feeAmount = '2000000000000000000';
export const invalidAddress = '0x not and address';
export const tokenAddress = '0x6b175474e89094c44da98b954eedeac495271d0f';
export const network = 'mainnet';
export const amount = '12345';
export const note = '123456789';
export const txHash = '0x123456789';
export const saltMain = 'ea3bc7caf64110ca';
export const salt1 = 'ea3bc7caf64110cb';
export const salt2 = 'ea3bc7caf64110cc';
export const salt3 = 'ea3bc7caf64110cd';
export const salt4 = 'ea3bc7caf64110ce';
// ---------------------------------------------------------------------
export const baseParams = (salt: string) => ({
  feeAddress,
  feeAmount,
  paymentAddress,
  refundAddress,
  salt,
  acceptedTokens: [tokenAddress],
  network,
});
export const extendedParams = (salt: string) => ({
  ...baseParams(salt),
  maxRateTimespan: undefined,
  payeeDelegate: undefined,
  payerDelegate: undefined,
  paymentInfo: undefined,
  receivedPaymentAmount: '0',
  receivedRefundAmount: '0',
  refundInfo: undefined,
  sentPaymentAmount: '0',
  sentRefundAmount: '0',
});
// actions
export const actionCreationMultipleAnyToErc20 = {
  action: 'create',
  id: ExtensionTypes.PAYMENT_NETWORK_ID.META,
  parameters: {
    [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY]: [baseParams(salt1), baseParams(salt2)],
  },
  version: '0.1.0',
};

export const actionCreationEmpty = {
  action: 'create',
  id: ExtensionTypes.PAYMENT_NETWORK_ID.META,
  parameters: {},
  version: '0.1.0',
};

export const actionApplyActionToPn = {
  action: ExtensionTypes.PnMeta.ACTION.APPLY_ACTION_TO_PN,
  id: ExtensionTypes.PAYMENT_NETWORK_ID.META,
  parameters: {
    action: ExtensionTypes.PnAddressBased.ACTION.ADD_PAYMENT_ADDRESS,
    pnIdentifier: salt2,
    parameters: {
      paymentAddress,
    },
  },
};

export const actionDeclareSentPayment = {
  action: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_SENT_PAYMENT,
  id: ExtensionTypes.PAYMENT_NETWORK_ID.META,
  parameters: {
    amount,
    note,
    txHash,
    network,
  },
};

// ---------------------------------------------------------------------
// extensions states
export const extensionFullStateMultipleAnyToErc20 = {
  [ExtensionTypes.PAYMENT_NETWORK_ID.META as string]: {
    events: [
      {
        name: 'create',
        parameters: {
          [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY]: [
            baseParams(salt1),
            baseParams(salt2),
          ],
        },
        timestamp: arbitraryTimestamp,
      },
    ],
    id: ExtensionTypes.PAYMENT_NETWORK_ID.META,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      [salt1]:
        AnyToErc20Create.extensionFullState(salt1)[
          ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY
        ],
      [salt2]:
        AnyToErc20Create.extensionFullState(salt2)[
          ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY
        ],
      receivedPaymentAmount: '0',
      receivedRefundAmount: '0',
      sentPaymentAmount: '0',
      sentRefundAmount: '0',
    },
    version: '0.1.0',
  },
};
export const extensionStateCreatedEmpty = {
  [ExtensionTypes.PAYMENT_NETWORK_ID.META as string]: {
    events: [
      {
        name: 'create',
        parameters: {},
        timestamp: arbitraryTimestamp,
      },
    ],
    id: ExtensionTypes.PAYMENT_NETWORK_ID.META,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {},
    version: '0.1.0',
  },
};

export const extensionStateCreatedMissingAddress = {
  [ExtensionTypes.PAYMENT_NETWORK_ID.META as string]: {
    events: [
      {
        name: 'create',
        parameters: {
          [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY]: [
            baseParams(salt1),
            { ...baseParams(salt2), paymentAddress: undefined },
          ],
        },
        timestamp: arbitraryTimestamp,
      },
    ],
    id: ExtensionTypes.PAYMENT_NETWORK_ID.META,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      [salt1]:
        AnyToErc20Create.extensionFullState(salt1)[
          ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY
        ],
      [salt2]: AnyToErc20Create.extensionFullState(salt2, null)[
        ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY
      ],
      receivedPaymentAmount: '0',
      receivedRefundAmount: '0',
      sentPaymentAmount: '0',
      sentRefundAmount: '0',
    },
    version: '0.1.0',
  },
};

export const extensionStateWithApplyAddPaymentAddressAfterCreation = {
  [ExtensionTypes.PAYMENT_NETWORK_ID.META as string]: {
    events: [
      {
        name: 'create',
        parameters: {
          [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY]: [
            baseParams(salt1),
            { ...baseParams(salt2), paymentAddress: undefined },
          ],
        },
        timestamp: arbitraryTimestamp,
      },
      {
        from: {
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: TestData.payeeRaw.address,
        },
        name: ExtensionTypes.PnMeta.ACTION.APPLY_ACTION_TO_PN,
        parameters: {
          pnIdentifier: salt2,
          action: ExtensionTypes.PnAddressBased.ACTION.ADD_PAYMENT_ADDRESS,
          parameters: {
            paymentAddress,
          },
        },
        timestamp: arbitraryTimestamp,
      },
    ],
    id: ExtensionTypes.PAYMENT_NETWORK_ID.META,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      [salt1]:
        AnyToErc20Create.extensionFullState(salt1)[
          ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY
        ],
      [salt2]: {
        ...AnyToErc20Create.extensionFullState(salt2, null)[
          ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY
        ],
        events: [
          ...AnyToErc20Create.extensionFullState(salt2, null)[
            ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY
          ].events,
          {
            name: ExtensionTypes.PnAddressBased.ACTION.ADD_PAYMENT_ADDRESS,
            parameters: {
              paymentAddress,
            },
            timestamp: 1544426030,
          },
        ],
        values: {
          ...AnyToErc20Create.extensionFullState(salt2, null)[
            ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY
          ].values,
          paymentAddress,
        },
      },
      receivedPaymentAmount: '0',
      receivedRefundAmount: '0',
      sentPaymentAmount: '0',
      sentRefundAmount: '0',
    },
    version: '0.1.0',
  },
};

export const extensionStateWithDeclaredSent: RequestLogicTypes.IExtensionStates = {
  [ExtensionTypes.PAYMENT_NETWORK_ID.META as string]: {
    events: [
      {
        name: 'create',
        parameters: {
          [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY]: [
            baseParams(salt1),
            baseParams(salt2),
          ],
        },
        timestamp: arbitraryTimestamp,
      },
      {
        name: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_SENT_PAYMENT,
        parameters: {
          amount,
          note,
          txHash,
          network,
        },
        timestamp: arbitraryTimestamp,
        from: TestData.payerRaw.identity,
      },
    ],
    id: ExtensionTypes.PAYMENT_NETWORK_ID.META,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      [salt1]:
        AnyToErc20Create.extensionFullState(salt1)[
          ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY
        ],
      [salt2]:
        AnyToErc20Create.extensionFullState(salt2)[
          ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY
        ],
      receivedPaymentAmount: '0',
      receivedRefundAmount: '0',
      sentRefundAmount: '0',
      sentPaymentAmount: amount,
    },
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

export const requestFullStateCreated: RequestLogicTypes.IRequest = {
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
  extensions: extensionFullStateMultipleAnyToErc20,
  extensionsData: [actionCreationMultipleAnyToErc20],
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

export const requestStateCreatedMissingAddress: RequestLogicTypes.IRequest = {
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
  extensions: extensionStateCreatedMissingAddress,
  extensionsData: [extensionStateCreatedMissingAddress],
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

export const requestStateCreatedAfterApplyAddAddress: RequestLogicTypes.IRequest = {
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
  extensions: extensionStateWithApplyAddPaymentAddressAfterCreation,
  extensionsData: [extensionStateWithApplyAddPaymentAddressAfterCreation],
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
