import { ExtensionTypes, PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';
import { CurrencyDefinition, CurrencyManager } from '@requestnetwork/currency';
import { PaymentNetworkFactory } from '../../src/payment-network-factory';
import PaymentReferenceCalculator from '../../src/payment-reference-calculator';
import {
  NearConversionInfoRetriever,
  NearConversionNativeTokenPaymentDetector,
} from '../../src/near';
import { deepCopy } from 'ethers/lib/utils';
import { GraphQLClient } from 'graphql-request';
import { mocked } from 'ts-jest/utils';
import { AdvancedLogic } from '@requestnetwork/advanced-logic';

jest.mock('graphql-request');
const graphql = mocked(GraphQLClient.prototype);
const currencyManager = CurrencyManager.getDefault();
const advancedLogic = new AdvancedLogic(currencyManager);
const salt = 'a6475e4c3d45feb6';
const paymentAddress = 'issuer.near';
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
    [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN as string]: {
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN,
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
  to: paymentAddress,
  maxRateTimespan: 0,
  timestamp: 1643647285,
  receiptId,
  gasUsed: '144262',
  gasPrice: '2425000017',
};

const paymentNetworkFactory = new PaymentNetworkFactory(advancedLogic, currencyManager);
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
      'native.conversion.mock',
      PaymentTypes.EVENTS_NAMES.PAYMENT,
      'aurora',
    );
    const events = await infoRetriever.getTransferEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({
      amount: graphPaymentEvent.amount,
      name: 'payment',
      parameters: {
        amountInCrypto: null,
        block: 10088347,
        currency: 'USD',
        feeAddress,
        feeAmount: '5',
        feeAmountInCrypto: undefined,
        from: 'payer.near',
        to: paymentAddress,
        maxRateTimespan: '0',
        receiptId,
        gasUsed: '144262',
        gasPrice: '2425000017',
      },
      timestamp: graphPaymentEvent.timestamp,
    });
  });

  it('PaymentNetworkFactory can get the detector (testnet)', async () => {
    expect(
      paymentNetworkFactory.getPaymentNetworkFromRequest({
        ...request,
        currency: { ...request.currency, network: 'aurora-testnet' },
      }),
    ).toBeInstanceOf(NearConversionNativeTokenPaymentDetector);
  });

  it('PaymentNetworkFactory can get the detector (mainnet)', async () => {
    expect(
      paymentNetworkFactory.getPaymentNetworkFromRequest({
        ...request,
        currency: { ...request.currency, network: 'aurora' },
      }),
    ).toBeInstanceOf(NearConversionNativeTokenPaymentDetector);
  });

  it('NearConversionNativeTokenPaymentDetector can detect a payment on Near', async () => {
    const paymentDetector = new NearConversionNativeTokenPaymentDetector({
      network: 'aurora',
      advancedLogic: advancedLogic,
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
          [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN]: {
            ...requestWithWrongVersion.extensions[
              ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN
            ],
            version: '3.14',
          },
        },
      };
      const paymentDetector = new NearConversionNativeTokenPaymentDetector({
        network: 'aurora',
        advancedLogic: advancedLogic,
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
          [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN as string]: {
            ...requestWithWrongNetwork.extensions[
              ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN
            ],
            values: {
              ...requestWithWrongNetwork.extensions[
                ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN
              ].values,
              network: 'unknown-network',
            },
          },
        },
      };
      const paymentDetector = new NearConversionNativeTokenPaymentDetector({
        network: 'aurora',
        advancedLogic: advancedLogic,
        currencyManager,
      });
      expect(await paymentDetector.getBalance(requestWithWrongNetwork)).toMatchObject({
        balance: null,
        error: {
          code: 2,
          message:
            "Unconfigured near-conversion-detector chain 'unknown-network' and version '0.1.0'",
        },
        events: [],
      });
    });
  });
});
