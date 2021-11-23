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
const salt = '360ab22e5fb6c41c';
const paymentAddress = 'pay.testnet';
const request: any = {
  requestId: '017a738821782329122ffb1b944dc2bbcecc56fdc8d95b050fe49a1fc04349a9c4',
  currency: {
    network: 'aurora-testnet',
    type: RequestLogicTypes.CURRENCY.ETH,
    value: 'NEAR-testnet',
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
  it.skip('NearInfoRetriever can detect a NEAR payment', async () => {
    const paymentReference = PaymentReferenceCalculator.calculate(
      request.requestId,
      salt,
      paymentAddress,
    );

    const infoRetriever = new NearInfoRetriever(
      paymentReference,
      paymentAddress,
      'dev-1631521265288-35171138540673',
      'com.nearprotocol.testnet.explorer.select:INDEXER_BACKEND',
      PaymentTypes.EVENTS_NAMES.PAYMENT,
      'aurora-testnet',
    );
    const events = await infoRetriever.getTransferEvents();
    expect(events).toHaveLength(1);

    expect(events[0].amount).toBe('2000000000000000000000000');
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

  // TODO Near tests failing. Asked NEAR team about this.
  it.skip('NearNativeTokenPaymentDetector can detect a payment on aurora-testnet', async () => {
    const paymentDetector = new NearNativeTokenPaymentDetector({
      advancedLogic: mockAdvancedLogic,
    });
    const balance = await paymentDetector.getBalance(request);

    expect(balance.events).toHaveLength(1);
    expect(balance.balance).toBe('2000000000000000000000000');
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
