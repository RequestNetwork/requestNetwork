import { AdvancedLogicTypes, ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';

import BTCAddressedBased from '../../../src/api/payment-network/btc/mainnet-address-based';
import Declarative from '../../../src/api/payment-network/declarative';

import { expect } from 'chai';

import 'mocha';

import PaymentNetworkFactory from '../../../src/api/payment-network/payment-network-factory';

import * as Types from '../../../src/types';

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
      const paymentNetworkParameters: Types.IPaymentNetworkCreateParameters = {
        id: Types.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED,
        parameters: {
          paymentAddress: 'bitcoin address here',
        },
      };
      expect(
        PaymentNetworkFactory.createPaymentNetwork(
          mockAdvancedLogic,
          {
            network: 'mainnet',
            type: RequestLogicTypes.CURRENCY.BTC,
            value: 'BTC',
          },
          paymentNetworkParameters,
        ),
        'createPayment createPaymentNetwork',
      ).to.instanceOf(BTCAddressedBased);
    });

    it('can createPaymentNetwork with any currency', async () => {
      const paymentNetworkParameters: Types.IPaymentNetworkCreateParameters = {
        id: Types.PAYMENT_NETWORK_ID.DECLARATIVE,
        parameters: {
          paymentAddress: 'bitcoin address here',
        },
      };
      expect(
        PaymentNetworkFactory.createPaymentNetwork(
          mockAdvancedLogic,
          {
            network: 'mainnet',
            type: RequestLogicTypes.CURRENCY.BTC,
            value: 'BTC',
          },
          paymentNetworkParameters,
        ),
        'createPayment createPaymentNetwork',
      ).to.instanceOf(Declarative);
    });

    it('cannot createPaymentNetwork with extension id not handled', async () => {
      const paymentNetworkParameters: any = {
        id: 'ETHEREUM_MAGIC',
        parameters: {
          paymentAddress: 'bitcoin address here',
        },
      };
      expect(() => {
        PaymentNetworkFactory.createPaymentNetwork(
          mockAdvancedLogic,
          {
            network: 'mainnet',
            type: RequestLogicTypes.CURRENCY.BTC,
            value: 'BTC',
          },
          paymentNetworkParameters,
        );
      }, 'should throw wrong').to.throw(
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

      expect(
        PaymentNetworkFactory.getPaymentNetworkFromRequest(mockAdvancedLogic, request),
        'createPayment createPaymentNetwork',
      ).to.instanceOf(BTCAddressedBased);
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

      expect(
        PaymentNetworkFactory.getPaymentNetworkFromRequest(mockAdvancedLogic, request),
        'createPayment createPaymentNetwork',
      ).to.be.null;
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
      expect(() => {
        PaymentNetworkFactory.getPaymentNetworkFromRequest(mockAdvancedLogic, request);
      }, 'should throw wrong').to.throw(
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

      expect(
        PaymentNetworkFactory.getPaymentNetworkFromRequest(mockAdvancedLogic, request),
        'createPayment getPaymentNetworkFromRequest',
      ).to.instanceOf(Declarative);
    });
  });
});
