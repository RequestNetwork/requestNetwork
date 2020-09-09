import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';

import BTCAddressedBased from '../src/btc/mainnet-address-based';
import Declarative from '../src/declarative';

import PaymentNetworkFactory from '../src/payment-network-factory';

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions(): any {
    return;
  },
  extensions: {},
};

// Most of the tests are done as integration tests in ../index.test.ts
/* tslint:disable:no-unused-expression */
describe('api/payment-network/payment-network-factory', () => {
  describe('createPaymentNetwork', () => {
    it('can createPaymentNetwork', async () => {
      const paymentNetworkCreationParameters: PaymentTypes.IPaymentNetworkCreateParameters = {
        id: PaymentTypes.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED,
        parameters: {
          paymentAddress: 'bitcoin address here',
        },
      };
      // 'createPayment createPaymentNetwork'
      expect(PaymentNetworkFactory.createPaymentNetwork({
        advancedLogic: mockAdvancedLogic,
        currency: {
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.BTC,
          value: 'BTC',
        },
        paymentNetworkCreationParameters,
      })).toBeInstanceOf(BTCAddressedBased);
    });

    it('can createPaymentNetwork with any currency', async () => {
      const paymentNetworkCreationParameters: PaymentTypes.IPaymentNetworkCreateParameters = {
        id: PaymentTypes.PAYMENT_NETWORK_ID.DECLARATIVE,
        parameters: {
          paymentAddress: 'bitcoin address here',
        },
      };
      // 'createPayment createPaymentNetwork'
      expect(PaymentNetworkFactory.createPaymentNetwork({
        advancedLogic: mockAdvancedLogic,
        currency: {
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.BTC,
          value: 'BTC',
        },
        paymentNetworkCreationParameters,
      })).toBeInstanceOf(Declarative);
    });

    it('cannot createPaymentNetwork with extension id not handled', async () => {
      const paymentNetworkCreationParameters: any = {
        id: 'ETHEREUM_MAGIC',
        parameters: {
          paymentAddress: 'bitcoin address here',
        },
      };
      // 'should throw wrong'
      expect(() => {
        PaymentNetworkFactory.createPaymentNetwork({
          advancedLogic: mockAdvancedLogic,
          currency: {
            network: 'mainnet',
            type: RequestLogicTypes.CURRENCY.BTC,
            value: 'BTC',
          },
          paymentNetworkCreationParameters,
        });
      }).toThrowError(
        'the payment network id: ETHEREUM_MAGIC is not supported for the currency: BTC'
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
      expect(PaymentNetworkFactory.getPaymentNetworkFromRequest({
        advancedLogic: mockAdvancedLogic,
        request,
      })).toBeInstanceOf(BTCAddressedBased);
    });
    it(
      'can getPaymentNetworkFromRequest with a request without payment network',
      async () => {
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
        expect(PaymentNetworkFactory.getPaymentNetworkFromRequest({
          advancedLogic: mockAdvancedLogic,
          request,
        })).toBeNull();
      }
    );

    it(
      'cannot getPaymentNetworkFromRequest with extension id not handled',
      async () => {
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
          PaymentNetworkFactory.getPaymentNetworkFromRequest({
            advancedLogic: mockAdvancedLogic,
            request,
          });
        }).toThrowError(
          'the payment network id: content-data is not supported for the currency: BTC'
        );
      }
    );

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
      expect(PaymentNetworkFactory.getPaymentNetworkFromRequest({
        advancedLogic: mockAdvancedLogic,
        request,
      })).toBeInstanceOf(Declarative);
    });
  });
});
