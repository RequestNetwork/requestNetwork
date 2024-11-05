import * as TestData from '../../test-data-generator';

import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';

export const arbitraryTimestamp = 1544426030;
export const arbitrarySalt = 'ea3bc7caf64110ca';

// ---------------------------------------------------------------------
export const paymentInfo = { IBAN: 'FR123456789123456789', BIC: 'CE123456789' };
export const refundInfo = { IBAN: 'FR987654321987654321', BIC: 'CE987654321' };
export const amount = '12345';
export const note = '123456789';
export const txHash = '0x123456789';
export const network = 'matic';
export const payeeDelegate = TestData.payeeDelegateRaw.identity;
export const payerDelegate = TestData.payerDelegateRaw.identity;
export const delegateToAdd = TestData.otherIdRaw.identity;

const zeroAmounts = {
  receivedPaymentAmount: '0',
  receivedRefundAmount: '0',
  sentPaymentAmount: '0',
  sentRefundAmount: '0',
};

const createEvent: ExtensionTypes.IEvent = {
  name: ExtensionTypes.PnAnyDeclarative.ACTION.CREATE,
  parameters: {},
  timestamp: arbitraryTimestamp,
};

const createEventWithPayeeDelegate: ExtensionTypes.IEvent = {
  ...createEvent,
  parameters: { payeeDelegate },
};

// ---------------------------------------------------------------------

// actions
export const actionCreationWithPaymentAndRefund = {
  action: ExtensionTypes.PnAnyDeclarative.ACTION.CREATE,
  id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
  parameters: {
    paymentInfo,
    refundInfo,
    payeeDelegate,
  },
  version: '0.1.0',
};
export const actionCreationWithPayeeDelegate = {
  action: ExtensionTypes.PnAnyDeclarative.ACTION.CREATE,
  id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
  parameters: {
    payeeDelegate,
  },
  version: '0.1.0',
};
export const actionCreationOnlyPayment = {
  action: ExtensionTypes.PnAnyDeclarative.ACTION.CREATE,
  id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
  parameters: {
    paymentInfo,
  },
  version: '0.1.0',
};
export const actionCreationOnlyRefund = {
  action: ExtensionTypes.PnAnyDeclarative.ACTION.CREATE,
  id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
  parameters: {
    refundInfo,
  },
  version: '0.1.0',
};
export const actionCreationEmpty = {
  action: ExtensionTypes.PnAnyDeclarative.ACTION.CREATE,
  id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
  parameters: {},
  version: '0.1.0',
};
export const actionCreationPayeeDelegate = {
  action: ExtensionTypes.PnAnyDeclarative.ACTION.CREATE,
  id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
  parameters: { payeeDelegate },
  version: '0.1.0',
};

export const actionCreationWithNativeTokenPayment: ExtensionTypes.IAction<ExtensionTypes.PnReferenceBased.ICreationParameters> =
  {
    action: ExtensionTypes.PnAnyDeclarative.ACTION.CREATE,
    id: ExtensionTypes.PAYMENT_NETWORK_ID.NATIVE_TOKEN,
    parameters: {
      paymentAddress: 'pay.near',
      refundAddress: 'refund.near',
      salt: arbitrarySalt,
    },
    version: '0.1.0',
  };
export const actionCreationWithAnyToNativeTokenPayment: ExtensionTypes.IAction<ExtensionTypes.PnAnyToAnyConversion.ICreationParameters> =
  {
    action: ExtensionTypes.PnAnyDeclarative.ACTION.CREATE,
    id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN,
    parameters: {
      paymentAddress: 'pay.near',
      refundAddress: 'refund.near',
      feeAddress: 'fee.near',
      feeAmount: '100',
      salt: arbitrarySalt,
      network: 'aurora',
      maxRateTimespan: 1000000,
    },
    version: '0.1.0',
  };

export const actionAddDelegate = {
  action: ExtensionTypes.PnAnyDeclarative.ACTION.ADD_DELEGATE,
  id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
  parameters: {
    delegate: delegateToAdd,
  },
};
export const actionPaymentInstruction = {
  action: ExtensionTypes.PnAnyDeclarative.ACTION.ADD_PAYMENT_INSTRUCTION,
  id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
  parameters: {
    paymentInfo,
  },
};
export const actionRefundInstruction = {
  action: ExtensionTypes.PnAnyDeclarative.ACTION.ADD_REFUND_INSTRUCTION,
  id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
  parameters: {
    refundInfo,
  },
};

export const actionDeclareSentPayment = {
  action: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_SENT_PAYMENT,
  id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
  parameters: {
    amount,
    note,
    txHash,
    network,
  },
};
export const actionDeclareSentRefund = {
  action: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_SENT_REFUND,
  id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
  parameters: {
    amount,
    note,
    txHash,
    network,
  },
};

export const actionDeclareReceivedPayment = {
  action: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_PAYMENT,
  id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
  parameters: {
    amount,
    note,
    txHash,
    network,
  },
};
export const actionDeclareReceivedRefund = {
  action: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_REFUND,
  id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
  parameters: {
    amount,
    note,
    txHash,
    network,
  },
};
// ---------------------------------------------------------------------
// extensions states
export const extensionStateWithPaymentAndRefund: RequestLogicTypes.IExtensionStates = {
  [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE as string]: {
    events: [
      {
        ...createEvent,
        parameters: {
          paymentInfo,
          refundInfo,
          payeeDelegate,
        },
      },
    ],
    id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      paymentInfo,
      ...zeroAmounts,
      refundInfo,
      payeeDelegate,
    },
    version: '0.1.0',
  },
};
const extensionStateWithPayeeDelegate: RequestLogicTypes.IExtensionStates = {
  [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE as string]: {
    events: [createEventWithPayeeDelegate],
    id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      ...zeroAmounts,
      payeeDelegate,
    },
    version: '0.1.0',
  },
};
export const extensionStateWithNativeTokenPaymentAndRefund: RequestLogicTypes.IExtensionStates = {
  [ExtensionTypes.PAYMENT_NETWORK_ID.NATIVE_TOKEN as string]: {
    events: [
      {
        name: 'create',
        parameters: {
          paymentAddress: 'pay.near',
          refundAddress: 'refund.near',
          salt: arbitrarySalt,
        },
        timestamp: arbitraryTimestamp,
      },
    ],
    id: ExtensionTypes.PAYMENT_NETWORK_ID.NATIVE_TOKEN,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      paymentAddress: 'pay.near',
      refundAddress: 'refund.near',
      salt: arbitrarySalt,
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
export const extensionStateWithAnyToNativeTokenPaymentAndRefund: RequestLogicTypes.IExtensionStates =
  {
    [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN as string]: {
      events: [
        {
          name: 'create',
          parameters: {
            paymentAddress: 'pay.near',
            refundAddress: 'refund.near',
            salt: arbitrarySalt,
            feeAddress: 'fee.near',
            feeAmount: '100',
            maxRateTimespan: 1000000,
            network: 'aurora',
          },
          timestamp: arbitraryTimestamp,
        },
      ],
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        paymentAddress: 'pay.near',
        refundAddress: 'refund.near',
        feeAddress: 'fee.near',
        salt: arbitrarySalt,
        payeeDelegate: undefined,
        payerDelegate: undefined,
        paymentInfo: undefined,
        receivedPaymentAmount: '0',
        receivedRefundAmount: '0',
        refundInfo: undefined,
        sentPaymentAmount: '0',
        sentRefundAmount: '0',
        network: 'aurora',
        maxRateTimespan: 1000000,
        feeAmount: '100',
      },
      version: '0.1.0',
    },
  };
export const extensionStateWithAnyToNativeTokenPaymentAndRefundTGExtension: RequestLogicTypes.IExtensionStates =
  {
    [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN as string]: {
      events: [
        {
          name: 'create',
          parameters: {
            paymentAddress: 'pay.tg',
            refundAddress: 'refund.near',
            salt: arbitrarySalt,
            feeAddress: 'fee.near',
            feeAmount: '100',
            maxRateTimespan: 1000000,
            network: 'aurora',
          },
          timestamp: arbitraryTimestamp,
        },
      ],
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        paymentAddress: 'pay.tg',
        refundAddress: 'refund.near',
        feeAddress: 'fee.near',
        salt: arbitrarySalt,
        payeeDelegate: undefined,
        payerDelegate: undefined,
        paymentInfo: undefined,
        receivedPaymentAmount: '0',
        receivedRefundAmount: '0',
        refundInfo: undefined,
        sentPaymentAmount: '0',
        sentRefundAmount: '0',
        network: 'aurora',
        maxRateTimespan: 1000000,
        feeAmount: '100',
      },
      version: '0.1.0',
    },
  };
export const extensionStateAnyToNativeWithPaymentAddressAdded: RequestLogicTypes.IExtensionStates =
  {
    [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN as string]: {
      events: [
        {
          name: 'create',
          parameters: {
            refundAddress: 'refund.near',
            salt: arbitrarySalt,
            feeAddress: 'fee.near',
            feeAmount: '100',
            maxRateTimespan: 1000000,
            network: 'aurora',
          },
          timestamp: arbitraryTimestamp,
        },
        {
          name: 'addPaymentAddress',
          parameters: {
            paymentAddress: 'pay.near',
          },
          timestamp: arbitraryTimestamp,
        },
      ],
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        paymentAddress: 'pay.near',
        refundAddress: 'refund.near',
        feeAddress: 'fee.near',
        salt: arbitrarySalt,
        payeeDelegate: undefined,
        payerDelegate: undefined,
        paymentInfo: undefined,
        receivedPaymentAmount: '0',
        receivedRefundAmount: '0',
        refundInfo: undefined,
        sentPaymentAmount: '0',
        sentRefundAmount: '0',
        network: 'aurora',
        maxRateTimespan: 1000000,
        feeAmount: '100',
      },
      version: '0.1.0',
    },
  };

export const extensionStateAnyToNativeWithFeeAdded: RequestLogicTypes.IExtensionStates = {
  [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN as string]: {
    events: [
      {
        name: 'create',
        parameters: {
          paymentAddress: 'pay.near',
          refundAddress: 'refund.near',
          salt: arbitrarySalt,
          maxRateTimespan: 1000000,
          network: 'aurora',
        },
        timestamp: arbitraryTimestamp,
      },
      {
        name: 'addFee',
        parameters: {
          feeAddress: 'fee.near',
          feeAmount: '100',
        },
        timestamp: arbitraryTimestamp,
      },
    ],
    id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      paymentAddress: 'pay.near',
      refundAddress: 'refund.near',
      feeAddress: 'fee.near',
      salt: arbitrarySalt,
      payeeDelegate: undefined,
      payerDelegate: undefined,
      paymentInfo: undefined,
      receivedPaymentAmount: '0',
      receivedRefundAmount: '0',
      refundInfo: undefined,
      sentPaymentAmount: '0',
      sentRefundAmount: '0',
      network: 'aurora',
      maxRateTimespan: 1000000,
      feeAmount: '100',
    },
    version: '0.1.0',
  },
};

export const extensionStateWithPaymentAddressAdded: RequestLogicTypes.IExtensionStates = {
  [ExtensionTypes.PAYMENT_NETWORK_ID.NATIVE_TOKEN as string]: {
    events: [
      {
        name: 'create',
        parameters: {
          salt: arbitrarySalt,
        },
        timestamp: arbitraryTimestamp,
      },
      {
        name: 'addPaymentAddress',
        parameters: {
          paymentAddress: 'pay.near',
        },
        timestamp: arbitraryTimestamp,
      },
    ],
    id: ExtensionTypes.PAYMENT_NETWORK_ID.NATIVE_TOKEN,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      ...zeroAmounts,
      payerDelegate,
    },
    version: '0.1.0',
  },
};

const extensionStateWithPayerDelegate: RequestLogicTypes.IExtensionStates = {
  [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE as string]: {
    events: [createEvent],
    id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      ...zeroAmounts,
      payerDelegate,
    },
    version: '0.1.0',
  },
};

export const extensionStateNoDelegate: RequestLogicTypes.IExtensionStates = {
  [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE as string]: {
    events: [createEvent],
    id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: zeroAmounts,
    version: '0.1.0',
  },
};
export const extensionStatePaymentInstructionAdded: RequestLogicTypes.IExtensionStates = {
  [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE as string]: {
    events: [
      createEventWithPayeeDelegate,
      {
        name: ExtensionTypes.PnAnyDeclarative.ACTION.ADD_PAYMENT_INSTRUCTION,
        parameters: {
          paymentInfo,
        },
        timestamp: arbitraryTimestamp,
        from: TestData.payeeRaw.identity,
      },
    ],
    id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      paymentInfo,
      ...zeroAmounts,
      payeeDelegate,
    },
    version: '0.1.0',
  },
};
export const extensionStateRefundInstructionAdded: RequestLogicTypes.IExtensionStates = {
  [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE as string]: {
    events: [
      createEvent,
      {
        name: ExtensionTypes.PnAnyDeclarative.ACTION.ADD_REFUND_INSTRUCTION,
        parameters: {
          refundInfo,
        },
        timestamp: arbitraryTimestamp,
        from: TestData.payerRaw.identity,
      },
    ],
    id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      ...zeroAmounts,
      refundInfo,
    } as any,
    version: '0.1.0',
  },
};

export const extensionStateDeclaredSent: RequestLogicTypes.IExtensionStates = {
  [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE as string]: {
    events: [
      createEvent,
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
    id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      ...zeroAmounts,
      sentPaymentAmount: amount,
    },
    version: '0.1.0',
  },
};
export const declarativeExtStateRefundDeclared: RequestLogicTypes.IExtensionStates = {
  [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE as string]: {
    events: [
      createEvent,
      {
        name: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_REFUND,
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
    id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      ...zeroAmounts,
      receivedRefundAmount: amount,
    },
    version: '0.1.0',
  },
};
export const extensionStateSentRefund: RequestLogicTypes.IExtensionStates = {
  [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE as string]: {
    events: [
      createEventWithPayeeDelegate,
      {
        name: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_SENT_REFUND,
        parameters: {
          amount,
          note,
          txHash,
          network,
        },
        timestamp: arbitraryTimestamp,
        from: TestData.payeeRaw.identity,
      },
    ],
    id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      ...zeroAmounts,
      sentRefundAmount: amount,
      payeeDelegate,
    },
    version: '0.1.0',
  },
};
export const extensionStateAddPayeeDelegate: RequestLogicTypes.IExtensionStates = {
  [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE as string]: {
    events: [
      {
        ...createEventWithPayeeDelegate,
        parameters: {},
      },
      {
        name: ExtensionTypes.PnAnyDeclarative.ACTION.ADD_DELEGATE,
        parameters: {
          delegate: delegateToAdd,
        },
        timestamp: arbitraryTimestamp,
        from: TestData.payeeRaw.identity,
      },
    ],
    id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      ...zeroAmounts,
      payeeDelegate: delegateToAdd,
    },
    version: '0.1.0',
  },
};
export const extensionStateAddPayerDelegate: RequestLogicTypes.IExtensionStates = {
  [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE as string]: {
    events: [
      {
        ...createEventWithPayeeDelegate,
        parameters: {},
      },
      {
        name: ExtensionTypes.PnAnyDeclarative.ACTION.ADD_DELEGATE,
        parameters: {
          delegate: delegateToAdd,
        },
        timestamp: arbitraryTimestamp,
        from: TestData.payerRaw.identity,
      },
    ],
    id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      ...zeroAmounts,
      payerDelegate: delegateToAdd,
    },
    version: '0.1.0',
  },
};
export const extensionStateWithTwoDelegates: RequestLogicTypes.IExtensionStates = {
  [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE as string]: {
    events: [
      createEventWithPayeeDelegate,
      {
        name: ExtensionTypes.PnAnyDeclarative.ACTION.ADD_DELEGATE,
        parameters: {
          delegate: delegateToAdd,
        },
        timestamp: arbitraryTimestamp,
        from: TestData.payerRaw.identity,
      },
    ],
    id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      ...zeroAmounts,
      payeeDelegate,
      payerDelegate: delegateToAdd,
    },
    version: '0.1.0',
  },
};
export const extensionStateReceivedPayment: RequestLogicTypes.IExtensionStates = {
  [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE as string]: {
    events: [
      createEventWithPayeeDelegate,
      {
        name: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_PAYMENT,
        parameters: {
          amount,
          note,
          txHash,
          network,
        },
        timestamp: arbitraryTimestamp,
        from: TestData.payeeRaw.identity,
      },
    ],
    id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      ...zeroAmounts,
      receivedPaymentAmount: amount,
      payeeDelegate,
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

export const requestStateWithPaymentAndRefund: RequestLogicTypes.IRequest = {
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

export const emptyRequestWithNoDelegate: RequestLogicTypes.IRequest = {
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
  extensions: extensionStateNoDelegate,
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

export const emptyRequestWithPayeeDelegate: RequestLogicTypes.IRequest = {
  ...emptyRequestWithNoDelegate,
  extensions: extensionStateWithPayeeDelegate,
};

export const emptyRequestWithPayerDelegate: RequestLogicTypes.IRequest = {
  ...emptyRequestWithNoDelegate,
  extensions: extensionStateWithPayerDelegate,
};
