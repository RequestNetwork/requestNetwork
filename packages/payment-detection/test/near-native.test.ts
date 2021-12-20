import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { CurrencyManager } from '@requestnetwork/currency';
import PaymentNetworkFactory from '../src/payment-network-factory';
import PaymentReferenceCalculator from '../src/payment-reference-calculator';
import { NearNativeTokenPaymentDetector } from '../src/near-detector';
import { NearInfoRetriever } from '../src/near-info-retriever';
import { deepCopy } from 'ethers/lib/utils';

const mockNearPaymentNetwork = {
  supportedNetworks: ['aurora', 'aurora-testnet'],
};
const currencyManager = CurrencyManager.getDefault();

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions(): any {
    return;
  },
  extensions: { nativeToken: [mockNearPaymentNetwork] },
};
const salt = '9c08824125b870eb';
const paymentAddress = 'gus.near';
const request: any = {
  requestId: '01cc915b9b2cde7f97be812679f6212d3d464965cc27d423d55e37962b06937a7f',
  currency: {
    network: 'aurora',
    type: RequestLogicTypes.CURRENCY.ETH,
    value: 'NEAR',
  },
  extensions: {
    [ExtensionTypes.ID.PAYMENT_NETWORK_NATIVE_TOKEN as string]: {
      id: ExtensionTypes.ID.PAYMENT_NETWORK_NATIVE_TOKEN,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        paymentAddress,
        salt,
      },
      version: '0.2.0',
    },
  },
};

describe('Near payments detection', () => {
  // TODO Near tests failing. Asked NEAR team about this.
  it('NearInfoRetriever can retrieve a NEAR payment', async () => {
    const paymentReference = PaymentReferenceCalculator.calculate(
      request.requestId,
      salt,
      paymentAddress,
    );

    const infoRetriever = new NearInfoRetriever(
      paymentReference,
      'gus.near',
      'requestnetwork.near',
      PaymentTypes.EVENTS_NAMES.PAYMENT,
      'aurora',
    );
    const events = await infoRetriever.getTransferEvents();
    expect(events).toHaveLength(1);

    expect(events[0].amount).toBe('1000000000000000000000000');
  });

  it('PaymentNetworkFactory can get the detector (testnet)', async () => {
    expect(
      PaymentNetworkFactory.getPaymentNetworkFromRequest({
        advancedLogic: mockAdvancedLogic,
        request,
        currencyManager,
      }),
    ).toBeInstanceOf(NearNativeTokenPaymentDetector);
  });

  it('PaymentNetworkFactory can get the detector (mainnet)', async () => {
    expect(
      PaymentNetworkFactory.getPaymentNetworkFromRequest({
        advancedLogic: mockAdvancedLogic,
        request: { ...request, currency: { ...request.currency, network: 'aurora' } },
        currencyManager,
      }),
    ).toBeInstanceOf(NearNativeTokenPaymentDetector);
  });

  it('NearNativeTokenPaymentDetector can detect a payment on aurora', async () => {
    const paymentDetector = new NearNativeTokenPaymentDetector({
      advancedLogic: mockAdvancedLogic,
    });
    const balance = await paymentDetector.getBalance(request);

    expect(balance.events).toHaveLength(1);
    expect(balance.balance).toBe('1000000000000000000000000');
  });

  describe('Edge cases for NearNativeTokenPaymentDetector', () => {
    it('throws with a wrong version', async () => {
      let requestWithWrongVersion = deepCopy(request);
      requestWithWrongVersion = {
        ...requestWithWrongVersion,
        extensions: {
          [ExtensionTypes.ID.PAYMENT_NETWORK_NATIVE_TOKEN]: {
            ...requestWithWrongVersion.extensions[ExtensionTypes.ID.PAYMENT_NETWORK_NATIVE_TOKEN],
            version: '3.14',
          },
        },
      };
      const paymentDetector = new NearNativeTokenPaymentDetector({
        advancedLogic: mockAdvancedLogic,
      });
      expect(await paymentDetector.getBalance(requestWithWrongVersion)).toMatchObject({
        balance: null,
        error: { code: 0, message: 'Near payment detection not implemented for version 3.14' },
        events: [],
      });
    });

    it('throws with a wrong currency network', async () => {
      let requestWithWrongNetwork = deepCopy(request);
      requestWithWrongNetwork = {
        ...requestWithWrongNetwork,
        currency: { ...requestWithWrongNetwork.currency, network: 'unknown-network' },
      };
      const paymentDetector = new NearNativeTokenPaymentDetector({
        advancedLogic: mockAdvancedLogic,
      });
      expect(await paymentDetector.getBalance(requestWithWrongNetwork)).toMatchObject({
        balance: null,
        error: {
          code: 2,
          message:
            'Payment network unknown-network not supported by pn-native-token payment detection. Supported networks: aurora, aurora-testnet',
        },
        events: [],
      });
    });
  });
});
