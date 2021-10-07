import * as TestData from '../../test-data-generator';

import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';

export const arbitraryTimestamp = 1544426030;
export const arbitrarySalt = 'ea3bc7caf64110ca';

// ---------------------------------------------------------------------
export const paymentInfo = { IBAN: 'FR123456789123456789', BIC: 'CE123456789' };
export const refundInfo = { IBAN: 'FR987654321987654321', BIC: 'CE987654321' };
export const amount = '12345';
export const note = { transactionId: '123456789' };
export const payeeDelegate = TestData.payeeDelegateRaw.identity;
export const payerDelegate = TestData.payerDelegateRaw.identity;
export const delegateToAdd = TestData.otherIdRaw.identity;
export const txHash = 'somehash';

// ---------------------------------------------------------------------
const salt = arbitrarySalt;

// actions
export const actionCreationWithPaymentAndRefund = {
  action: ExtensionTypes.PnAnyDeclarative.ACTION.CREATE,
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
  parameters: {
    paymentInfo,
    refundInfo,
    payeeDelegate,
  },
  version: '0.1.0',
};
export const actionCreationWithPayeeDelegate = {
  action: ExtensionTypes.PnAnyDeclarative.ACTION.CREATE,
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
  parameters: {
    payeeDelegate,
  },
  version: '0.1.0',
};
export const actionCreationOnlyPayment = {
  action: ExtensionTypes.PnAnyDeclarative.ACTION.CREATE,
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
  parameters: {
    paymentInfo,
  },
  version: '0.1.0',
};
export const actionCreationOnlyRefund = {
  action: ExtensionTypes.PnAnyDeclarative.ACTION.CREATE,
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
  parameters: {
    refundInfo,
  },
  version: '0.1.0',
};
export const actionCreationEmpty = {
  action: ExtensionTypes.PnAnyDeclarative.ACTION.CREATE,
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
  parameters: {},
  version: '0.1.0',
};
export const actionCreationPayeeDelegate = {
  action: ExtensionTypes.PnAnyDeclarative.ACTION.CREATE,
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
  parameters: { payeeDelegate },
  version: '0.1.0',
};
export const actionCreationWithNativeTokenPayment: ExtensionTypes.IAction<ExtensionTypes.PnReferenceBased.ICreationParameters> = {
  action: ExtensionTypes.PnAnyDeclarative.ACTION.CREATE,
  id: ExtensionTypes.ID.PAYMENT_NETWORK_NATIVE_TOKEN,
  parameters: {
    paymentAddress: 'pay.near',
    refundAddress: 'refund.near',
    salt,
  },
  version: '0.2.0',
};

export const actionAddDelegate = {
  action: ExtensionTypes.PnAnyDeclarative.ACTION.ADD_DELEGATE,
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
  parameters: {
    delegate: delegateToAdd,
  },
};
export const actionPaymentInstruction = {
  action: ExtensionTypes.PnAnyDeclarative.ACTION.ADD_PAYMENT_INSTRUCTION,
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
  parameters: {
    paymentInfo,
  },
};
export const actionRefundInstruction = {
  action: ExtensionTypes.PnAnyDeclarative.ACTION.ADD_REFUND_INSTRUCTION,
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
  parameters: {
    refundInfo,
  },
};

export const actionDeclareSentPayment = {
  action: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_SENT_PAYMENT,
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
  parameters: {
    amount,
    note,
    txHash,
  },
};
export const actionDeclareSentRefund = {
  action: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_SENT_REFUND,
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
  parameters: {
    amount,
    note,
    txHash,
  },
};

export const actionDeclareReceivedPayment = {
  action: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_PAYMENT,
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
  parameters: {
    amount,
    note,
    txHash,
  },
};
export const actionDeclareReceivedRefund = {
  action: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_REFUND,
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
  parameters: {
    amount,
    note,
    txHash,
  },
};
// ---------------------------------------------------------------------
// extensions states
export const extensionStateWithPaymentAndRefund = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string]: {
    events: [
      {
        name: 'create',
        parameters: {
          paymentInfo,
          refundInfo,
          payeeDelegate,
        },
        timestamp: arbitraryTimestamp,
      },
    ],
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      paymentInfo,
      receivedPaymentAmount: '0',
      receivedRefundAmount: '0',
      refundInfo,
      sentPaymentAmount: '0',
      sentRefundAmount: '0',
      payeeDelegate,
      txHash: '',
    },
    version: '0.1.0',
  },
};
export const extensionStateCreatedEmpty = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string]: {
    events: [
      {
        name: 'create',
        parameters: { payeeDelegate },
        timestamp: arbitraryTimestamp,
      },
    ],
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      receivedPaymentAmount: '0',
      receivedRefundAmount: '0',
      sentPaymentAmount: '0',
      sentRefundAmount: '0',
      payeeDelegate,
      payerDelegate,
      txHash: '',
    },
    version: '0.1.0',
  },
};
export const extensionStateWithNativeTokenPaymentAndRefund: RequestLogicTypes.IExtensionStates = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_NATIVE_TOKEN as string]: {
    events: [
      {
        name: 'create',
        parameters: {
          paymentAddress: 'pay.near',
          refundAddress: 'refund.near',
          salt,
        },
        timestamp: arbitraryTimestamp,
      },
    ],
    id: ExtensionTypes.ID.PAYMENT_NETWORK_NATIVE_TOKEN,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      paymentAddress: 'pay.near',
      refundAddress: 'refund.near',
      salt,
      payeeDelegate: undefined,
      payerDelegate: undefined,
      paymentInfo: undefined,
      receivedPaymentAmount: "0",
      receivedRefundAmount: "0",
      refundInfo: undefined,
      sentPaymentAmount: "0",
      sentRefundAmount: "0",
      txHash: "",
    },
    version: '0.2.0',
  },
};
export const extensionStateWithPaymentAddressAdded: RequestLogicTypes.IExtensionStates = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_NATIVE_TOKEN as string]: {
    events: [
      {
        name: 'create',
        parameters: {
          salt,
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
    id: ExtensionTypes.ID.PAYMENT_NETWORK_NATIVE_TOKEN,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      paymentAddress: 'pay.near',
      salt,
      payeeDelegate: undefined,
      payerDelegate: undefined,
      paymentInfo: undefined,
      receivedPaymentAmount: "0",
      receivedRefundAmount: "0",
      refundInfo: undefined,
      sentPaymentAmount: "0",
      sentRefundAmount: "0",
      txHash: "",
    },
    version: '0.2.0',
  },
};

export const extensionStateCreatedEmptyNoDelegate = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string]: {
    events: [
      {
        name: 'create',
        parameters: {},
        timestamp: arbitraryTimestamp,
      },
    ],
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      receivedPaymentAmount: '0',
      receivedRefundAmount: '0',
      sentPaymentAmount: '0',
      sentRefundAmount: '0',
    },
    version: '0.1.0',
  },
};
export const extensionStateCreatedEmptyPaymentInstructionAdded = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string]: {
    events: [
      {
        name: ExtensionTypes.PnAnyDeclarative.ACTION.CREATE,
        parameters: { payeeDelegate },
        timestamp: arbitraryTimestamp,
      },
      {
        name: ExtensionTypes.PnAnyDeclarative.ACTION.ADD_PAYMENT_INSTRUCTION,
        parameters: {
          paymentInfo,
        },
        timestamp: arbitraryTimestamp,
        from: TestData.payeeRaw.identity,
      },
    ],
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      paymentInfo,
      receivedPaymentAmount: '0',
      receivedRefundAmount: '0',
      sentPaymentAmount: '0',
      sentRefundAmount: '0',
      payeeDelegate,
      payerDelegate,
      txHash: '',
    },
    version: '0.1.0',
  },
};
export const extensionStateCreatedEmptyRefundInstructionAdded = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string]: {
    events: [
      {
        name: ExtensionTypes.PnAnyDeclarative.ACTION.CREATE,
        parameters: { payeeDelegate },
        timestamp: arbitraryTimestamp,
      },
      {
        name: ExtensionTypes.PnAnyDeclarative.ACTION.ADD_REFUND_INSTRUCTION,
        parameters: {
          refundInfo,
        },
        timestamp: arbitraryTimestamp,
        from: TestData.payerRaw.identity,
      },
    ],
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      receivedPaymentAmount: '0',
      receivedRefundAmount: '0',
      refundInfo,
      sentPaymentAmount: '0',
      sentRefundAmount: '0',
      payeeDelegate,
      payerDelegate,
      txHash: '',
    },
    version: '0.1.0',
  },
};

export const extensionStateCreatedEmptySentPayment = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string]: {
    events: [
      {
        name: ExtensionTypes.PnAnyDeclarative.ACTION.CREATE,
        parameters: { payeeDelegate },
        timestamp: arbitraryTimestamp,
      },
      {
        name: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_SENT_PAYMENT,
        parameters: {
          amount,
          note,
          txHash,
        },
        timestamp: arbitraryTimestamp,
        from: TestData.payerRaw.identity,
      },
    ],
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      receivedPaymentAmount: '0',
      receivedRefundAmount: '0',
      sentPaymentAmount: amount,
      sentRefundAmount: '0',
      payeeDelegate,
      payerDelegate,
      txHash,
    },
    version: '0.1.0',
  },
};
export const extensionStateCreatedEmptyReceivedRefund = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string]: {
    events: [
      {
        name: ExtensionTypes.PnAnyDeclarative.ACTION.CREATE,
        parameters: { payeeDelegate },
        timestamp: arbitraryTimestamp,
      },
      {
        name: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_REFUND,
        parameters: {
          amount,
          note,
          txHash,
        },
        timestamp: arbitraryTimestamp,
        from: TestData.payerRaw.identity,
      },
    ],
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      receivedPaymentAmount: '0',
      receivedRefundAmount: amount,
      sentPaymentAmount: '0',
      sentRefundAmount: '0',
      payeeDelegate,
      payerDelegate,
      txHash,
    },
    version: '0.1.0',
  },
};
export const extensionStateCreatedEmptySentRefund = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string]: {
    events: [
      {
        name: ExtensionTypes.PnAnyDeclarative.ACTION.CREATE,
        parameters: { payeeDelegate },
        timestamp: arbitraryTimestamp,
      },
      {
        name: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_SENT_REFUND,
        parameters: {
          amount,
          note,
          txHash,
        },
        timestamp: arbitraryTimestamp,
        from: TestData.payeeRaw.identity,
      },
    ],
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      receivedPaymentAmount: '0',
      receivedRefundAmount: '0',
      sentPaymentAmount: '0',
      sentRefundAmount: amount,
      payeeDelegate,
      payerDelegate,
      txHash,
    },
    version: '0.1.0',
  },
};
export const extensionStateCreatedEmptyAddPayeeDelegate = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string]: {
    events: [
      {
        name: ExtensionTypes.PnAnyDeclarative.ACTION.CREATE,
        parameters: {},
        timestamp: arbitraryTimestamp,
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
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      receivedPaymentAmount: '0',
      receivedRefundAmount: '0',
      sentPaymentAmount: '0',
      sentRefundAmount: '0',
      payeeDelegate: delegateToAdd,
    },
    version: '0.1.0',
  },
};
export const extensionStateCreatedEmptyAddPayerDelegate = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string]: {
    events: [
      {
        name: ExtensionTypes.PnAnyDeclarative.ACTION.CREATE,
        parameters: {},
        timestamp: arbitraryTimestamp,
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
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      receivedPaymentAmount: '0',
      receivedRefundAmount: '0',
      sentPaymentAmount: '0',
      sentRefundAmount: '0',
      payerDelegate: delegateToAdd,
    },
    version: '0.1.0',
  },
};
export const extensionStateCreatedEmptyReceivedPayment = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string]: {
    events: [
      {
        name: ExtensionTypes.PnAnyDeclarative.ACTION.CREATE,
        parameters: { payeeDelegate },
        timestamp: arbitraryTimestamp,
      },
      {
        name: ExtensionTypes.PnAnyDeclarative.ACTION.DECLARE_RECEIVED_PAYMENT,
        parameters: {
          amount,
          note,
          txHash,
        },
        timestamp: arbitraryTimestamp,
        from: TestData.payeeRaw.identity,
      },
    ],
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      receivedPaymentAmount: amount,
      receivedRefundAmount: '0',
      sentPaymentAmount: '0',
      sentRefundAmount: '0',
      payeeDelegate,
      payerDelegate,
      txHash,
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

export const requestStateCreatedEmptyNoDelegate: RequestLogicTypes.IRequest = {
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
  extensions: extensionStateCreatedEmptyNoDelegate,
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
