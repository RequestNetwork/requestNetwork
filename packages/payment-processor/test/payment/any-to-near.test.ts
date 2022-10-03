import { ExtensionTypes, PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';
import { PaymentReferenceCalculator } from '@requestnetwork/payment-detection';
import * as Utils from '@requestnetwork/utils';

import { IConversionPaymentSettings, _getPaymentUrl } from '../../src/payment';
import * as nearUtils from '../../src/payment/utils-near';
import { payNearConversionRequest } from '../../src/payment/near-conversion';

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
    [PaymentTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE]: {
      events: [],
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_NATIVE_TOKEN,
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
const conversionSettings = {} as unknown as IConversionPaymentSettings;

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

    await payNearConversionRequest(request, mockedNearWalletConnection, conversionSettings);
    expect(paymentSpy).toHaveBeenCalledWith(
      expect.anything(),
      'aurora',
      '100',
      paymentAddress,
      paymentReference,
      'USD',
      feeAddress,
      feeAmount,
      '0',
      '0.1.0',
    );
  });
  it('throws when tyring to pay another payment extension', async () => {
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
    let invalidRequest = Utils.default.deepCopy(request);
    invalidRequest = {
      ...invalidRequest,
      extensions: {
        [PaymentTypes.PAYMENT_NETWORK_ID.ANY_TO_ETH_PROXY]: {
          ...invalidRequest.extensions[PaymentTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE],
        },
      },
    };

    await expect(
      payNearConversionRequest(invalidRequest, mockedNearWalletConnection, conversionSettings),
    ).rejects.toThrowError(
      'request cannot be processed, or is not an pn-any-to-native-token request',
    );
    expect(paymentSpy).toHaveBeenCalledTimes(0);
  });
  it('throws when tyring to pay with an unsupported currency', async () => {
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
    let invalidRequest = Utils.default.deepCopy(request);
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
    expect(paymentSpy).toHaveBeenCalledTimes(0);
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
    let invalidRequest = Utils.default.deepCopy(request);
    invalidRequest = {
      ...invalidRequest,
      extensions: {
        [PaymentTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE]: {
          ...invalidRequest.extensions[PaymentTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE],
          values: {
            ...invalidRequest.extensions[PaymentTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE].values,
            network: 'unknown-network',
          },
        },
      },
    };

    await expect(
      payNearConversionRequest(invalidRequest, mockedNearWalletConnection, conversionSettings),
    ).rejects.toThrowError('Should be a near network');
    expect(paymentSpy).toHaveBeenCalledTimes(0);
  });
});
