import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import { CurrencyManager } from '@requestnetwork/currency';
import { BtcMainnetAddressBasedDetector } from '../src/btc';
import {
  AnyToERC20PaymentDetector,
  DeclarativePaymentDetector,
  EthInputDataPaymentDetector,
  PaymentNetworkFactory,
} from '../src';
import { AdvancedLogic } from '@requestnetwork/advanced-logic';
import { ERC20FeeProxyPaymentDetector } from '../src/erc20/fee-proxy-contract';
import { IRequest } from '@requestnetwork/types/src/request-logic-types';

const currencyManager = CurrencyManager.getDefault();
const advancedLogic = new AdvancedLogic(currencyManager);

const paymentNetworkFactory = new PaymentNetworkFactory(
  advancedLogic,
  CurrencyManager.getDefault(),
);
// Most of the tests are done as integration tests in ../index.test.ts
/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('api/payment-network/payment-network-factory', () => {
  describe('createPaymentNetwork', () => {
    it('can createPaymentNetwork', async () => {
      expect(
        paymentNetworkFactory.createPaymentNetwork(
          ExtensionTypes.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED,
          RequestLogicTypes.CURRENCY.BTC,
        ),
      ).toBeInstanceOf(BtcMainnetAddressBasedDetector);
    });

    it('can createPaymentNetwork with any currency', async () => {
      expect(
        paymentNetworkFactory.createPaymentNetwork(
          ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
          RequestLogicTypes.CURRENCY.BTC,
        ),
      ).toBeInstanceOf(DeclarativePaymentDetector);
    });

    it('can createPaymentNetwork with a NEAR network for en extension supporting both EVM and NEAR', async () => {
      const pnInterpretor = paymentNetworkFactory.createPaymentNetwork(
        ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
        RequestLogicTypes.CURRENCY.ERC20,
        'aurora-testnet',
        'NEAR-0.1.0',
      );
      expect(pnInterpretor).toBeInstanceOf(ERC20FeeProxyPaymentDetector);
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
          [ExtensionTypes.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED as string]: {
            id: ExtensionTypes.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED,
            type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          },
        },
      };

      // 'createPayment createPaymentNetwork'
      expect(paymentNetworkFactory.getPaymentNetworkFromRequest(request)).toBeInstanceOf(
        BtcMainnetAddressBasedDetector,
      );
    });

    it('can getPaymentNetworkFromRequest for payment with conversion', async () => {
      const request: any = {
        currency: {
          type: RequestLogicTypes.CURRENCY.ISO4217,
          value: 'USD',
        },
        extensions: {
          [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY as string]: {
            id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY,
            type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
            values: {
              network: 'mainnet',
            },
          },
        },
      };

      // 'createPayment createPaymentNetwork'
      expect(paymentNetworkFactory.getPaymentNetworkFromRequest(request)).toBeInstanceOf(
        AnyToERC20PaymentDetector,
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
          [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE as string]: {
            id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
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
          [ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA as string]: {
            id: ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA,
            type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          },
        },
      };
      const paymentNetworkFactory = new PaymentNetworkFactory(advancedLogic, currencyManager, {
        explorerApiKeys: { mainnet: 'abcd' },
      });
      const pn = paymentNetworkFactory.getPaymentNetworkFromRequest(request);
      expect(pn).toBeInstanceOf(EthInputDataPaymentDetector);
      expect((pn as any).explorerApiKeys).toMatchObject({
        mainnet: 'abcd',
      });
    });
  });
});
