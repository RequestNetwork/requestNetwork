import * as TestData from '../../test-data-generator.js';

import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';

export const arbitraryTimestamp = 1544426030;

// ---------------------------------------------------------------------
// Mock addresses for testing ETH payment networks
export const paymentAddress = 'issuer.reqnetwork.testnet';
export const refundAddress = 'payer.reqnetwork.testnet';
export const feeAddress = 'builder.reqnetwork.testnet';
export const feeAmount = '2000000000000000000';
export const invalidAddress = 'not and address';
// ---------------------------------------------------------------------
export const salt = 'ea3bc7caf64110ca';
// actions
export const actionCreationFull = {
  action: 'create',
  id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
  parameters: {
    feeAddress,
    feeAmount,
    paymentAddress,
    refundAddress,
    salt,
  },
  version: 'NEAR-0.1.0',
};

// ---------------------------------------------------------------------
// extensions states
export const extensionFullState = {
  [ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT as string]: {
    events: [
      {
        name: 'create',
        parameters: {
          feeAddress,
          feeAmount,
          paymentAddress,
          refundAddress,
          salt,
        },
        timestamp: arbitraryTimestamp,
      },
    ],
    id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      feeAddress,
      feeAmount,
      paymentAddress,
      refundAddress,
      salt,
      payeeDelegate: undefined,
      payerDelegate: undefined,
      paymentInfo: undefined,
      receivedPaymentAmount: '0',
      receivedRefundAmount: '0',
      refundInfo: undefined,
      sentPaymentAmount: '0',
      sentRefundAmount: '0',
    },
    version: 'NEAR-0.1.0',
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
    network: 'aurora-testnet',
    type: RequestLogicTypes.CURRENCY.ERC20,
    value: 'fau.reqnetwork.testnet',
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
