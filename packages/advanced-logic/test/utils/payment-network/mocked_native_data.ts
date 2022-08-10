import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';

const arbitraryTimestamp = 1544426030;
const arbitrarySalt = 'ea3bc7caf64110ca';

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
// ---------------------------------------------------------------------
const salt = arbitrarySalt;

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

export const extensionStateWithNativeTokenPaymentAndRefund: RequestLogicTypes.IExtensionStates = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_NATIVE_TOKEN as string]: {
    events: [
      {
        ...createEvent,
        parameters: {
          paymentAddress: 'pay.near',
          refundAddress: 'refund.near',
          salt,
        },
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
      ...zeroAmounts,
      refundInfo: undefined,
    },
    version: '0.2.0',
  },
};
export const extensionStateWithPaymentAddressAdded: RequestLogicTypes.IExtensionStates = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_NATIVE_TOKEN as string]: {
    events: [
      {
        ...createEvent,
        parameters: {
          salt,
        },
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
      ...zeroAmounts,
      refundInfo: undefined,
    },
    version: '0.2.0',
  },
};
