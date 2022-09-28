import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { CurrencyDefinition, CurrencyManager } from '@requestnetwork/currency';
import PaymentNetworkFactory from '../../src/payment-network-factory';
import PaymentReferenceCalculator from '../../src/payment-reference-calculator';
import {
  NearConversionNativeTokenPaymentDetector,
  NearConversionInfoRetriever,
} from '../../src/near';
import { deepCopy } from 'ethers/lib/utils';
import { GraphQLClient } from 'graphql-request';
import { mocked } from 'ts-jest/utils';

jest.mock('graphql-request');
const graphql = mocked(GraphQLClient.prototype);
const mockNearPaymentNetwork = {
  supportedNetworks: ['aurora', 'aurora-testnet'],
};
const currencyManager = CurrencyManager.getDefault();

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions(): any {
    return;
  },
  extensions: { anyToNativeToken: [mockNearPaymentNetwork] },
};
const salt = 'a6475e4c3d45feb6';
const paymentAddress = 'gus.near';
const feeAddress = 'fee.near';
const network = 'aurora';
const feeAmount = '5';
const receiptId = 'FYVnCvJFoNtK7LE2uAdTFfReFMGiCUHMczLsvEni1Cpf';
const requestCurrency = currencyManager.from('USD') as CurrencyDefinition;
const request: any = {
  requestId: '01c9190b6d015b3a0b2bbd0e492b9474b0734ca19a16f2fda8f7adec10d0fa3e7a',
  currency: {
    type: RequestLogicTypes.CURRENCY.ISO4217,
    value: 'USD',
  },
  extensions: {
    [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_NATIVE_TOKEN as string]: {
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_NATIVE_TOKEN,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        paymentAddress,
        salt,
        feeAddress,
        feeAmount,
        network,
      },
      version: '0.1.0',
    },
  },
};
const graphPaymentEvent = {
  // 500 USD
  amount: '50000',
  amountInCrypto: null,
  block: 10088347,
  currency: 'USD',
  feeAddress,
  // .05 USD
  feeAmount: '5',
  feeAmountInCrypto: null,
  from: 'payer.near',
  maxRateTimespan: 0,
  timestamp: 1643647285,
  receiptId,
  gasUsed: '144262',
  gasPrice: '2425000017',
};
const expectedRetrieverEvent = {
  amount: graphPaymentEvent.amount,
  name: 'payment',
  parameters: {
    ...graphPaymentEvent,
    amount: undefined,
    timestamp: undefined,
    to: paymentAddress,
    maxRateTimespan: graphPaymentEvent.maxRateTimespan.toString(),
  },
  timestamp: graphPaymentEvent.timestamp,
};

describe('Near payments detection', () => {
  beforeAll(() => {
    graphql.request.mockResolvedValue({
      payments: [graphPaymentEvent],
    });
  });

  it('NearConversionInfoRetriever can retrieve a NEAR payment', async () => {
    const paymentReference = PaymentReferenceCalculator.calculate(
      request.requestId,
      salt,
      paymentAddress,
    );

    const infoRetriever = new NearConversionInfoRetriever(
      requestCurrency,
      paymentReference,
      paymentAddress,
      'requestnetwork.conversion.near',
      PaymentTypes.EVENTS_NAMES.PAYMENT,
      'aurora',
    );
    const events = await infoRetriever.getTransferEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(expectedRetrieverEvent);
  });

  it('PaymentNetworkFactory can get the detector (testnet)', async () => {
    expect(
      PaymentNetworkFactory.getPaymentNetworkFromRequest({
        advancedLogic: mockAdvancedLogic,
        request,
        currencyManager,
      }),
    ).toBeInstanceOf(NearConversionNativeTokenPaymentDetector);
  });

  it('PaymentNetworkFactory can get the detector (mainnet)', async () => {
    expect(
      PaymentNetworkFactory.getPaymentNetworkFromRequest({
        advancedLogic: mockAdvancedLogic,
        request: { ...request, currency: { ...request.currency, network: 'aurora' } },
        currencyManager,
      }),
    ).toBeInstanceOf(NearConversionNativeTokenPaymentDetector);
  });

  it('NearConversionNativeTokenPaymentDetector can detect a payment on Near', async () => {
    const paymentDetector = new NearConversionNativeTokenPaymentDetector({
      advancedLogic: mockAdvancedLogic,
      currencyManager,
    });
    const balance = await paymentDetector.getBalance(request);

    expect(balance.events).toHaveLength(1);
    expect(balance.balance).toBe(graphPaymentEvent.amount);
  });

  describe('Edge cases for NearConversionNativeTokenPaymentDetector', () => {
    it('throws with a wrong version', async () => {
      let requestWithWrongVersion = deepCopy(request);
      requestWithWrongVersion = {
        ...requestWithWrongVersion,
        extensions: {
          [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_NATIVE_TOKEN]: {
            ...requestWithWrongVersion.extensions[
              ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_NATIVE_TOKEN
            ],
            version: '3.14',
          },
        },
      };
      const paymentDetector = new NearConversionNativeTokenPaymentDetector({
        advancedLogic: mockAdvancedLogic,
        currencyManager,
      });
      expect(await paymentDetector.getBalance(requestWithWrongVersion)).toMatchObject({
        balance: null,
        error: { code: 0, message: 'Near payment detection not implemented for version 3.14' },
        events: [],
      });
    });

    it('throws with a wrong network', async () => {
      let requestWithWrongNetwork = deepCopy(request);
      requestWithWrongNetwork = {
        ...requestWithWrongNetwork,
        extensions: {
          [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_NATIVE_TOKEN as string]: {
            ...requestWithWrongNetwork.extensions[
              ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_NATIVE_TOKEN
            ],
            values: {
              ...requestWithWrongNetwork.extensions[
                ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_NATIVE_TOKEN
              ].values,
              network: 'unknown-network',
            },
          },
        },
      };
      const paymentDetector = new NearConversionNativeTokenPaymentDetector({
        advancedLogic: mockAdvancedLogic,
        currencyManager,
      });
      expect(await paymentDetector.getBalance(requestWithWrongNetwork)).toMatchObject({
        balance: null,
        error: {
          code: 2,
          message:
            'Payment network unknown-network not supported by pn-any-to-native-token payment detection. Supported networks: aurora, aurora-testnet',
        },
        events: [],
      });
    });
  });
});
