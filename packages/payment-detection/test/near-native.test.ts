import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import PaymentNetworkFactory from '../src/payment-network-factory';
import PaymentReferenceCalculator from '../src/payment-reference-calculator';
import NearNativeTokenPaymentDetector from '../src/near-detector';
import { NearInfoRetriever } from '../src/near-info-retriever';

const mockNearPaymentNetwork = {
  supportedNetworks: ['aurora', 'aurora-testnet'],
};
const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions(): any {
    return;
  },
  extensions: { nativeToken: [mockNearPaymentNetwork] },
};
const request: any = {
  requestId: '0124dc29327931e5d7631c2d866ee62d79a3b38e2b9976e4e218ebd1ece83c9d5d',
  currency: {
    network: 'aurora-testnet',
    type: RequestLogicTypes.CURRENCY.ETH,
    value: 'NEAR',
  },
  extensions: {
    [ExtensionTypes.ID.PAYMENT_NETWORK_NATIVE_TOKEN as string]: {
      id: ExtensionTypes.ID.PAYMENT_NETWORK_NATIVE_TOKEN,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        paymentAddress: 'benji.testnet',
        salt: 'a1a2a3a4a5a6a7a8',
      },
      version: '0.1.0',
    },
  },
};

describe('Near payments detection', () => {
  it('NearInfoRetriever can detect a NEAR payment', async () => {
    const paymentAddress = 'benji.testnet';
    const paymentReference = PaymentReferenceCalculator.calculate(
      '0124dc29327931e5d7631c2d866ee62d79a3b38e2b9976e4e218ebd1ece83c9d5d',
      'a1a2a3a4a5a6a7a8',
      paymentAddress,
    );

    const infoRetriever = new NearInfoRetriever(
      paymentReference,
      paymentAddress,
      'dev-1626339335241-5544297',
      'com.nearprotocol.testnet.explorer.select:INDEXER_BACKEND',
      PaymentTypes.EVENTS_NAMES.PAYMENT,
      'aurora-testnet',
    );
    const events = await infoRetriever.getTransferEvents();
    expect(events).toHaveLength(2);

    expect(events[0].amount).toBe('3141593000000000000000000');
  });

  it('PaymentNetworkFactory can get the detector (testnet)', async () => {
    expect(
      PaymentNetworkFactory.getPaymentNetworkFromRequest({
        advancedLogic: mockAdvancedLogic,
        request,
      }),
    ).toBeInstanceOf(NearNativeTokenPaymentDetector);
  });

  it('PaymentNetworkFactory can get the detector (mainnet)', async () => {
    expect(
      PaymentNetworkFactory.getPaymentNetworkFromRequest({
        advancedLogic: mockAdvancedLogic,
        request: { ...request, currency: { ...request.currency, network: 'aurora' } },
      }),
    ).toBeInstanceOf(NearNativeTokenPaymentDetector);
  });

  it('NearNativeTokenPaymentDetector can detect a payment on aurora-testnet', async () => {
    const paymentDetector = new NearNativeTokenPaymentDetector({
      advancedLogic: mockAdvancedLogic,
    });
    const balance = await paymentDetector.getBalance(request);

    expect(balance.balance).toBe('6283186000000000000000000');
    expect(balance.events).toHaveLength(2);
  });
});
