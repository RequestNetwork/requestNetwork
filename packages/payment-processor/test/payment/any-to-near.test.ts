import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import { PaymentReferenceCalculator } from '@requestnetwork/payment-detection';

import { IConversionPaymentSettings, payNearConversionRequest } from '../../src';
import * as nearUtils from '../../src/payment/utils-near';
import { deepCopy } from '@requestnetwork/utils';

/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/await-thenable */

const usdCurrency = {
  type: RequestLogicTypes.CURRENCY.ISO4217,
  value: 'USD',
};

const salt = 'a6475e4c3d45feb6';
const paymentAddress = 'gus.near';
const feeAddress = 'fee.near';
const network = 'aurora';
const feeAmount = '5';
const request: any = {
  requestId: '0x123',
  expectedAmount: '100',
  currencyInfo: usdCurrency,
  extensions: {
    [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN]: {
      events: [],
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        salt,
        paymentAddress,
        feeAddress,
        network,
        feeAmount,
      },
      version: '0.1.0',
    },
  },
};

// Use the default currency manager
const conversionSettings: IConversionPaymentSettings = { maxToSpend: '30' };

describe('payNearWithConversionRequest', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it('pays a NEAR request with NEAR payment method (with mock)', async () => {
    // A mock is used to bypass Near wallet connection for address validation and contract interaction
    const paymentSpy = jest
      .spyOn(nearUtils, 'processNearPaymentWithConversion')
      .mockReturnValue(Promise.resolve());
    const mockedNearWalletConnection = {
      account: () => ({
        functionCall: () => true,
        state: () => Promise.resolve({ amount: 100 }),
      }),
    } as any;

    const paymentReference = PaymentReferenceCalculator.calculate(
      request.requestId,
      salt,
      paymentAddress,
    );

    await payNearConversionRequest(
      request,
      mockedNearWalletConnection,
      conversionSettings,
      undefined,
      { callbackUrl: 'https://some.callback.url', meta: 'param' },
    );
    expect(paymentSpy).toHaveBeenCalledWith(
      expect.anything(),
      'aurora',
      '100',
      paymentAddress,
      paymentReference,
      'USD',
      feeAddress,
      feeAmount,
      conversionSettings.maxToSpend,
      '0',
      '0.1.0',
      {
        callbackUrl: 'https://some.callback.url',
        meta: 'param',
      },
    );
  });
  it('throws when trying to pay another payment extension', async () => {
    // A mock is used to bypass Near wallet connection for address validation and contract interaction
    const paymentSpy = jest
      .spyOn(nearUtils, 'processNearPaymentWithConversion')
      .mockReturnValue(Promise.resolve());
    const mockedNearWalletConnection = {
      account: () => ({
        functionCall: () => true,
        state: () => Promise.resolve({ amount: 100 }),
      }),
    } as any;
    let invalidRequest = deepCopy(request);
    invalidRequest = {
      ...invalidRequest,
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ETH_PROXY]: {
          ...invalidRequest.extensions[ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN],
        },
      },
    };

    await expect(
      payNearConversionRequest(invalidRequest, mockedNearWalletConnection, conversionSettings),
    ).rejects.toThrowError(
      'request cannot be processed, or is not an pn-any-to-native-token request',
    );
    expect(paymentSpy).not.toHaveBeenCalled();
  });
  it('throws when trying to pay with an unsupported currency', async () => {
    // A mock is used to bypass Near wallet connection for address validation and contract interaction
    const paymentSpy = jest
      .spyOn(nearUtils, 'processNearPaymentWithConversion')
      .mockReturnValue(Promise.resolve());
    const mockedNearWalletConnection = {
      account: () => ({
        functionCall: () => true,
        state: () => Promise.resolve({ amount: 100 }),
      }),
    } as any;
    let invalidRequest = deepCopy(request);
    invalidRequest = {
      ...invalidRequest,
      currencyInfo: {
        type: RequestLogicTypes.CURRENCY.BTC,
        value: 'BTC',
      },
    };

    await expect(
      payNearConversionRequest(invalidRequest, mockedNearWalletConnection, conversionSettings),
    ).rejects.toThrowError('Near payment with conversion only implemented for fiat denominations.');
    expect(paymentSpy).not.toHaveBeenCalled();
  });
  it('throws when the netwrok is not near', async () => {
    // A mock is used to bypass Near wallet connection for address validation and contract interaction
    const paymentSpy = jest
      .spyOn(nearUtils, 'processNearPaymentWithConversion')
      .mockReturnValue(Promise.resolve());
    const mockedNearWalletConnection = {
      account: () => ({
        functionCall: () => true,
        state: () => Promise.resolve({ amount: 100 }),
      }),
    } as any;
    let invalidRequest = deepCopy(request);
    invalidRequest = {
      ...invalidRequest,
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN]: {
          ...invalidRequest.extensions[ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN],
          values: {
            ...invalidRequest.extensions[ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN]
              .values,
            network: 'unknown-network',
          },
        },
      },
    };

    await expect(
      payNearConversionRequest(invalidRequest, mockedNearWalletConnection, conversionSettings),
    ).rejects.toThrowError('Should be a Near network');
    expect(paymentSpy).not.toHaveBeenCalled();
  });
});
