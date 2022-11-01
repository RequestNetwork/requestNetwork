import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { CurrencyManager } from '@requestnetwork/currency';
import { BtcMainnetAddressBasedDetector } from '../src/btc';
import {
  DeclarativePaymentDetector,
  EthInputDataPaymentDetector,
  PaymentNetworkFactory,
} from '../src';
import { mockAdvancedLogicBase } from './utils';

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  ...mockAdvancedLogicBase,
  extensions: {} as AdvancedLogicTypes.IAdvancedLogicExtensions,
};

const currencyManager = CurrencyManager.getDefault();
const paymentNetworkFactory = new PaymentNetworkFactory(
  mockAdvancedLogic,
  CurrencyManager.getDefault(),
);
// Most of the tests are done as integration tests in ../index.test.ts
/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('api/payment-network/payment-network-factory', () => {
  describe('createPaymentNetwork', () => {
    it('can createPaymentNetwork', async () => {
      expect(
        paymentNetworkFactory.createPaymentNetwork(
          PaymentTypes.PNShortcuts.BITCOIN_ADDRESS_BASED,
          RequestLogicTypes.CURRENCY.BTC,
        ),
      ).toBeInstanceOf(BtcMainnetAddressBasedDetector);
    });

    it('can createPaymentNetwork with any currency', async () => {
      expect(
        paymentNetworkFactory.createPaymentNetwork(
          PaymentTypes.PNShortcuts.DECLARATIVE,
          RequestLogicTypes.CURRENCY.BTC,
        ),
      ).toBeInstanceOf(DeclarativePaymentDetector);
    });

    it('cannot createPaymentNetwork with extension id not handled', async () => {
      expect(() => {
        paymentNetworkFactory.createPaymentNetwork(
          'ETHEREUM_MAGIC' as any,
          RequestLogicTypes.CURRENCY.BTC,
        );
      }).toThrowError(
        'the payment network id: ETHEREUM_MAGIC is not supported for the currency: BTC',
      );
    });
  });

  describe('getPaymentNetworkFromRequest', () => {
    it('can getPaymentNetworkFromRequest', async () => {
      const request: any = {
        currency: {
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.BTC,
          value: 'BTC',
        },
        extensions: {
          [ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED as string]: {
            id: ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED,
            type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          },
        },
      };

      // 'createPayment createPaymentNetwork'
      expect(paymentNetworkFactory.getPaymentNetworkFromRequest(request)).toBeInstanceOf(
        BtcMainnetAddressBasedDetector,
      );
    });
    it('can getPaymentNetworkFromRequest with a request without payment network', async () => {
      const request: any = {
        currency: {
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.BTC,
          value: 'BTC',
        },
        extensions: {
          [ExtensionTypes.ID.CONTENT_DATA as string]: {
            id: ExtensionTypes.ID.CONTENT_DATA,
            type: ExtensionTypes.TYPE.CONTENT_DATA,
          },
        },
      };

      // 'createPayment createPaymentNetwork'
      expect(paymentNetworkFactory.getPaymentNetworkFromRequest(request)).toBeNull();
    });

    it('cannot getPaymentNetworkFromRequest with extension id not handled', async () => {
      const request: any = {
        currency: {
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.BTC,
          value: 'BTC',
        },
        extensions: {
          [ExtensionTypes.ID.CONTENT_DATA as string]: {
            id: ExtensionTypes.ID.CONTENT_DATA,
            type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          },
        },
      };
      // 'should throw wrong'
      expect(() => {
        paymentNetworkFactory.getPaymentNetworkFromRequest(request);
      }).toThrowError(
        'the payment network id: content-data is not supported for the currency: BTC',
      );
    });

    it('can getPaymentNetworkFromRequest with any currency', async () => {
      const request: any = {
        currency: 'ETH',
        extensions: {
          [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string]: {
            id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
            type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          },
        },
      };

      // 'createPayment getPaymentNetworkFromRequest'
      expect(paymentNetworkFactory.getPaymentNetworkFromRequest(request)).toBeInstanceOf(
        DeclarativePaymentDetector,
      );
    });

    it('can pass options down to the paymentNetwork', async () => {
      const request: any = {
        currency: {
          type: 'ETH',
          network: 'mainnet',
          value: 'ETH',
        },
        extensions: {
          [ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA as string]: {
            id: ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA,
            type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          },
        },
      };
      const paymentNetworkFactory = new PaymentNetworkFactory(mockAdvancedLogic, currencyManager, {
        explorerApiKeys: { homestead: 'abcd' },
      });
      const pn = paymentNetworkFactory.getPaymentNetworkFromRequest(request);
      expect(pn).toBeInstanceOf(EthInputDataPaymentDetector);
      expect((pn as any).explorerApiKeys).toMatchObject({
        homestead: 'abcd',
      });
    });
  });
});
