import {
  AdvancedLogicTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';

import { mockAdvancedLogicBase } from './utils';
import { MetaDetector } from '../src/meta-payment-detector';
import { AnyToERC20PaymentDetector, TheGraphClient } from '../src';
import { CurrencyManager } from '@requestnetwork/currency';

jest.mock('../src/thegraph/client');
const theGraphClientMock = {
  GetAnyToFungiblePayments: jest.fn(),
} as jest.MockedObjectDeep<TheGraphClient>;

let detector: MetaDetector;

const createCreationActionMeta = jest.fn();
const createCreationActionAnyToErc20 = jest.fn().mockImplementation((parameters) => {
  return {
    parameters,
  };
});
const createAddPaymentInstructionAction = jest.fn();
const createAddRefundInstructionAction = jest.fn();
const createDeclareReceivedPaymentAction = jest.fn();
const createDeclareReceivedRefundAction = jest.fn();
const createDeclareSentPaymentAction = jest.fn();
const createDeclareSentRefundAction = jest.fn();
const createApplyActionToPn = jest.fn();

const currencyManager = CurrencyManager.getDefault();

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  ...mockAdvancedLogicBase,
  extensions: {
    metaPn: {
      createCreationAction: createCreationActionMeta,
      createAddPaymentInstructionAction,
      createAddRefundInstructionAction,
      createDeclareReceivedPaymentAction,
      createDeclareReceivedRefundAction,
      createDeclareSentPaymentAction,
      createDeclareSentRefundAction,
      createApplyActionToPn,
    },
    anyToErc20Proxy: {
      createCreationAction: createCreationActionAnyToErc20,
      // inherited from declarative
      createAddPaymentInstructionAction,
      createAddRefundInstructionAction,
    },
  } as any as AdvancedLogicTypes.IAdvancedLogicExtensions,
};

const mainnetAddress = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
const maticAddress = '0xf17f52151EbEF6C7334FAD080c5704D77216b733';

const requestMock: RequestLogicTypes.IRequest = {
  requestId: '0x1',
  creator: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '',
  },
  currency: {
    type: RequestLogicTypes.CURRENCY.ISO4217,
    value: 'USD',
  },
  events: [],
  expectedAmount: '100',
  extensions: {
    [ExtensionTypes.PAYMENT_NETWORK_ID.META]: {
      events: [],
      id: ExtensionTypes.PAYMENT_NETWORK_ID.META,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        abcd: {
          events: [],
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {
            feeAddress: '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef',
            feeAmount: '5',
            paymentAddress: maticAddress,
            refundAddress: '0x666666151EbEF6C7334FAD080c5704D77216b732',
            acceptedTokens: ['0x9FBDa871d559710256a2502A2517b794B482Db40'],
            network: 'matic',
            salt: 'abcd',
          },
        },
        efgh: {
          events: [],
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {
            feeAddress: '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef',
            feeAmount: '5',
            paymentAddress: mainnetAddress,
            refundAddress: '0x666666151EbEF6C7334FAD080c5704D77216b732',
            acceptedTokens: ['0x9FBDa871d559710256a2502A2517b794B482Db40'],
            network: 'mainnet',
            salt: 'efgh',
          },
        },
        salt: 'main-salt',
      },
      version: '0',
    },
  },
  extensionsData: [],
  state: RequestLogicTypes.STATE.CREATED,
  timestamp: 0,
  version: '',
};

// Most of the tests are done as integration tests in ../index.test.ts
/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('api/meta-payment-network', () => {
  beforeEach(() => {
    detector = new MetaDetector({
      advancedLogic: mockAdvancedLogic,
      currencyManager,
      options: {
        getSubgraphClient: () => theGraphClientMock,
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('can createExtensionsDataForCreation', async () => {
    const spyMeta = jest.spyOn(mockAdvancedLogic.extensions.metaPn, 'createCreationAction');
    const spySubPn = jest.spyOn(
      mockAdvancedLogic.extensions.anyToErc20Proxy,
      'createCreationAction',
    );

    await detector.createExtensionsDataForCreation({
      [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY]: [
        {
          feeAddress: '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef',
          feeAmount: '5',
          paymentAddress: '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
          refundAddress: '0x666666151EbEF6C7334FAD080c5704D77216b732',
          acceptedTokens: ['0x9FBDa871d559710256a2502A2517b794B482Db40'],
          network: 'matic',
          salt: 'abcd',
        },
        {
          feeAddress: '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef',
          feeAmount: '5',
          paymentAddress: '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
          refundAddress: '0x666666151EbEF6C7334FAD080c5704D77216b732',
          acceptedTokens: ['0x9FBDa871d559710256a2502A2517b794B482Db40'],
          network: 'mainnet',
          salt: 'efgh',
        },
      ],
    });

    expect(spyMeta).toHaveBeenCalledTimes(1);
    expect(spySubPn).toHaveBeenCalledTimes(2);
  });

  it('can createExtensionsDataForCreation without sub-pn salt', async () => {
    const spyMeta = jest.spyOn(mockAdvancedLogic.extensions.metaPn, 'createCreationAction');
    const spySubPn = jest.spyOn(
      mockAdvancedLogic.extensions.anyToErc20Proxy,
      'createCreationAction',
    );

    await detector.createExtensionsDataForCreation({
      [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY]: [
        {
          feeAddress: '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef',
          feeAmount: '5',
          paymentAddress: '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
          refundAddress: '0x666666151EbEF6C7334FAD080c5704D77216b732',
          acceptedTokens: ['0x9FBDa871d559710256a2502A2517b794B482Db40'],
          network: 'matic',
          salt: 'abcd',
        },
        {
          feeAddress: '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef',
          feeAmount: '5',
          paymentAddress: '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
          refundAddress: '0x666666151EbEF6C7334FAD080c5704D77216b732',
          acceptedTokens: ['0x9FBDa871d559710256a2502A2517b794B482Db40'],
          network: 'mainnet',
        },
      ],
      salt: 'anySalt',
    });

    expect(spyMeta).toHaveBeenCalledTimes(1);
    expect(spySubPn).toHaveBeenCalledTimes(2);
  });

  it('can createExtensionsDataForAddPaymentInformation', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.metaPn,
      'createAddPaymentInstructionAction',
    );

    detector.createExtensionsDataForAddPaymentInformation({
      paymentInfo: 'payment instruction',
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('can createExtensionsDataForAddRefundInformation', async () => {
    const spy = jest.spyOn(mockAdvancedLogic.extensions.metaPn, 'createAddRefundInstructionAction');

    detector.createExtensionsDataForAddRefundInformation({ refundInfo: 'refund instruction' });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('can createExtensionsDataForDeclareSentPayment', async () => {
    const spy = jest.spyOn(mockAdvancedLogic.extensions.metaPn, 'createDeclareSentPaymentAction');

    detector.createExtensionsDataForDeclareSentPayment({ amount: '1000', note: 'payment sent' });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('can createExtensionsDataForDeclareSentRefund', async () => {
    const spy = jest.spyOn(mockAdvancedLogic.extensions.metaPn, 'createDeclareSentRefundAction');

    detector.createExtensionsDataForDeclareSentRefund({ amount: '1000', note: 'refund sent' });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('can createExtensionsDataForDeclareReceivedPayment', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.metaPn,
      'createDeclareReceivedPaymentAction',
    );

    detector.createExtensionsDataForDeclareReceivedPayment({
      amount: '1000',
      note: 'payment received',
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('can createExtensionsDataForDeclareReceivedRefund', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.metaPn,
      'createDeclareReceivedRefundAction',
    );

    detector.createExtensionsDataForDeclareReceivedRefund({
      amount: '1000',
      note: 'refund received',
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('can createExtensionsDataForApplyActionOnPn', async () => {
    const spy = jest.spyOn(mockAdvancedLogic.extensions.metaPn, 'createApplyActionToPn');

    detector.createExtensionsDataForApplyActionOnPn({
      pnIdentifier: 'abcd',
      action: 'addPaymentAddress',
      parameters: {
        paymentAddress: 'any-address',
      },
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should not throw when getBalance fail', async () => {
    expect(await detector.getBalance({ extensions: {} } as RequestLogicTypes.IRequest)).toEqual({
      balance: null,
      error: {
        code: PaymentTypes.BALANCE_ERROR_CODE.WRONG_EXTENSION,
        message: 'The request does not have the extension: pn-meta',
      },
      events: [],
    });
  });

  it('can compute the balance', async () => {
    const mockExtractEvents = (eventName: PaymentTypes.EVENTS_NAMES, address: string) => {
      if (eventName === PaymentTypes.EVENTS_NAMES.PAYMENT) {
        if (address === mainnetAddress) {
          return Promise.resolve({
            paymentEvents: [
              // Wrong fee address
              {
                amount: '100',
                name: PaymentTypes.EVENTS_NAMES.PAYMENT,
                parameters: {
                  block: 1,
                  feeAddress: 'fee address',
                  feeAmount: '5',
                  to: mainnetAddress,
                  txHash: '0xABC',
                },
                timestamp: 10,
              },
              // Correct fee address and a fee value
              {
                amount: '500',
                name: PaymentTypes.EVENTS_NAMES.PAYMENT,
                parameters: {
                  block: 1,
                  feeAddress: '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef',
                  feeAmount: '5',
                  to: mainnetAddress,
                  txHash: '0xABCD',
                },
                timestamp: 11,
              },
              // No fee
              {
                amount: '500',
                name: PaymentTypes.EVENTS_NAMES.PAYMENT,
                parameters: {
                  block: 1,
                  feeAddress: '',
                  feeAmount: '0',
                  to: mainnetAddress,
                  txHash: '0xABCDE',
                },
                timestamp: 12,
              },
            ],
          });
        } else if (address == maticAddress) {
          return Promise.resolve({
            paymentEvents: [
              // Wrong fee address
              {
                amount: '100',
                name: PaymentTypes.EVENTS_NAMES.PAYMENT,
                parameters: {
                  block: 1,
                  feeAddress: 'fee address',
                  feeAmount: '5',
                  to: maticAddress,
                  txHash: '0xABC',
                },
                timestamp: 10,
              },
            ],
          });
        }
      }
      return {
        paymentEvents: [],
      };
    };
    jest
      .spyOn(AnyToERC20PaymentDetector.prototype as any, 'extractEvents')
      .mockImplementation(mockExtractEvents as any);

    const balance = await detector.getBalance(requestMock);
    expect(balance.error).toBeUndefined();
    // Mainnet Payments: 100 + 500 + 500
    // Matic Payments: 100
    expect(balance.balance).toBe('1200');
    // Fee Payment Mainnet: 5
    // Fee Payments Matic: 0
    expect(
      requestMock.extensions[ExtensionTypes.PAYMENT_NETWORK_ID.META].values.feeBalance.balance,
    ).toBe('5');
  });
});
