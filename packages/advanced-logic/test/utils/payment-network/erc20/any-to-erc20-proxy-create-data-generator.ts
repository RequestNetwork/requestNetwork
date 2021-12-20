import * as TestData from '../../test-data-generator';

import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';

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
// ---------------------------------------------------------------------
export const salt = 'ea3bc7caf64110ca';
// actions
export const actionCreationFull = {
  action: 'create',
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY,
  parameters: {
    feeAddress,
    feeAmount,
    paymentAddress,
    refundAddress,
    salt,
    acceptedTokens: [tokenAddress],
    network
  },
  version: '0.1.0',
};
export const actionCreationOnlyPayment = {
  action: 'create',
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY,
  parameters: {
    paymentAddress,
    acceptedTokens: [tokenAddress],
    network
  },
  version: '0.1.0',
};
export const actionCreationOnlyRefund = {
  action: 'create',
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY,
  parameters: {
    refundAddress,
    acceptedTokens: [tokenAddress],
    network
  },
  version: '0.1.0',
};
export const actionCreationOnlyFee = {
  action: 'create',
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY,
  parameters: {
    feeAddress,
    feeAmount,
    acceptedTokens: [tokenAddress],
    network
  },
  version: '0.1.0',
};
export const actionCreationEmpty = {
  action: 'create',
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY,
  parameters: {},
  version: '0.1.0',
};

// ---------------------------------------------------------------------
// extensions states
export const extensionFullState = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY as string]: {
    events: [
      {
        name: 'create',
        parameters: {
          feeAddress,
          feeAmount,
          network,
          paymentAddress,
          refundAddress,
          salt,
          acceptedTokens: [tokenAddress],
          maxRateTimespan: undefined,
        },
        timestamp: arbitraryTimestamp,
      },
    ],
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      feeAddress,
      feeAmount,
      network,
      paymentAddress,
      refundAddress,
      salt,
      acceptedTokens: [tokenAddress],
      maxRateTimespan: undefined,
      payeeDelegate: undefined,
      payerDelegate: undefined,
      paymentInfo: undefined,
      receivedPaymentAmount: "0",
      receivedRefundAmount: "0",
      refundInfo: undefined,
      sentPaymentAmount: "0",
      sentRefundAmount: "0",
    },
    version: '0.1.0',
  },
};
export const extensionStateCreatedEmpty = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY as string]: {
    events: [
      {
        name: 'create',
        parameters: {},
        timestamp: arbitraryTimestamp,
      },
    ],
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      receivedPaymentAmount: '0',
    },
    version: '0.1.0',
  },
};
export const extensionStateDeclareReceivedPayment = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY as string]: {
    events: [
      {
        name: 'create',
        parameters: {
        },
        timestamp: arbitraryTimestamp,
      },
      {
        name: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_PAYMENT,
        from: {
          type: 'ethereumAddress',
          value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce'
        },
        parameters: {
          amount: '123400000000000000',
          txHash: 'somehash',
          note: 'this is your payment',
          network: 'matic'
        },
        timestamp: arbitraryTimestamp,
      }
    ],
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      receivedPaymentAmount: '123400000000000000',
    },
    version: '0.1.0',
  }
}

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
