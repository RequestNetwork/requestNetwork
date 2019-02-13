import {
  AdvancedLogic as AdvancedLogicTypes,
  Extension as ExtensionTypes,
  RequestLogic as RequestLogicTypes,
} from '@requestnetwork/types';

import BTCAddressedBased from '../../../src/api/payment-network/btc/mainnet-address-based';

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
          RequestLogicTypes.REQUEST_LOGIC_CURRENCY.BTC,
          paymentNetworkParameters,
        ),
        'createPayment createPaymentNetwork',
      ).to.instanceOf(BTCAddressedBased);
    });

    it('cannot createPaymentNetwork with currency not handled', async () => {
      const paymentNetworkParameters: Types.IPaymentNetworkCreateParameters = {
        id: Types.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED,
        parameters: {
          paymentAddress: 'bitcoin address here',
        },
      };
      expect(() => {
        PaymentNetworkFactory.createPaymentNetwork(
          mockAdvancedLogic,
          RequestLogicTypes.REQUEST_LOGIC_CURRENCY.ETH,
          paymentNetworkParameters,
        );
      }, 'should throw wrong').to.throw('No payment network support the currency: ETH');
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
          RequestLogicTypes.REQUEST_LOGIC_CURRENCY.BTC,
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
        currency: RequestLogicTypes.REQUEST_LOGIC_CURRENCY.BTC,
        extensions: {
          [ExtensionTypes.EXTENSION_ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED as string]: {
            id: ExtensionTypes.EXTENSION_ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED,
            type: ExtensionTypes.EXTENSION_TYPE.PAYMENT_NETWORK,
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
        currency: RequestLogicTypes.REQUEST_LOGIC_CURRENCY.BTC,
        extensions: {
          [ExtensionTypes.EXTENSION_ID.CONTENT_DATA as string]: {
            id: ExtensionTypes.EXTENSION_ID.CONTENT_DATA,
            type: ExtensionTypes.EXTENSION_TYPE.CONTENT_DATA,
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
        currency: RequestLogicTypes.REQUEST_LOGIC_CURRENCY.BTC,
        extensions: {
          [ExtensionTypes.EXTENSION_ID.CONTENT_DATA as string]: {
            id: ExtensionTypes.EXTENSION_ID.CONTENT_DATA,
            type: ExtensionTypes.EXTENSION_TYPE.PAYMENT_NETWORK,
          },
        },
      };
      expect(() => {
        PaymentNetworkFactory.getPaymentNetworkFromRequest(mockAdvancedLogic, request);
      }, 'should throw wrong').to.throw(
        'the payment network id: content-data is not supported for the currency: BTC',
      );
    });

    it('cannot getPaymentNetworkFromRequest with currency not handled', async () => {
      const request: any = {
        currency: RequestLogicTypes.REQUEST_LOGIC_CURRENCY.ETH,
        extensions: {
          [ExtensionTypes.EXTENSION_ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED as string]: {
            id: ExtensionTypes.EXTENSION_ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED,
            type: ExtensionTypes.EXTENSION_TYPE.PAYMENT_NETWORK,
          },
        },
      };
      expect(() => {
        PaymentNetworkFactory.getPaymentNetworkFromRequest(mockAdvancedLogic, request);
      }, 'should throw wrong').to.throw('No payment network support the currency: ETH');
    });
  });
});
