import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import { CurrencyManager } from '@requestnetwork/currency';
import { AdvancedLogic } from '@requestnetwork/advanced-logic';
import { PaymentNetworkFactory } from '../../src';
import { TronFeeProxyPaymentDetector } from '../../src/tron';

const currencyManager = CurrencyManager.getDefault();
const advancedLogic = new AdvancedLogic(currencyManager);

const salt = 'a6475e4c3d45feb6';
const paymentAddress = 'TToAddress456';
const tokenAddress = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

const createRequest = (network: string): any => ({
  requestId: '01c9190b6d015b3a0b2bbd0e492b9474b0734ca19a16f2fda8f7adec10d0fa3e7a',
  currency: {
    network,
    type: RequestLogicTypes.CURRENCY.ERC20,
    value: tokenAddress,
  },
  extensions: {
    [ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT as string]: {
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        paymentAddress,
        salt,
        feeAddress: 'TFeeAddress789',
        feeAmount: '1000000',
        network,
      },
      version: '0.2.0',
    },
  },
});

describe('PaymentNetworkFactory with TRON', () => {
  const paymentNetworkFactory = new PaymentNetworkFactory(advancedLogic, currencyManager);

  describe('createPaymentNetwork', () => {
    it('should create TronFeeProxyPaymentDetector for tron network', () => {
      const detector = paymentNetworkFactory.createPaymentNetwork(
        ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
        RequestLogicTypes.CURRENCY.ERC20,
        'tron',
      );

      expect(detector).toBeInstanceOf(TronFeeProxyPaymentDetector);
    });

    it('should create TronFeeProxyPaymentDetector for nile testnet', () => {
      const detector = paymentNetworkFactory.createPaymentNetwork(
        ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
        RequestLogicTypes.CURRENCY.ERC20,
        'nile',
      );

      expect(detector).toBeInstanceOf(TronFeeProxyPaymentDetector);
    });
  });

  describe('getPaymentNetworkFromRequest', () => {
    it('should return TronFeeProxyPaymentDetector for TRON ERC20 request', () => {
      const request = createRequest('tron');
      const detector = paymentNetworkFactory.getPaymentNetworkFromRequest(request);

      expect(detector).toBeInstanceOf(TronFeeProxyPaymentDetector);
    });

    it('should return TronFeeProxyPaymentDetector for nile testnet request', () => {
      const request = createRequest('nile');
      const detector = paymentNetworkFactory.getPaymentNetworkFromRequest(request);

      expect(detector).toBeInstanceOf(TronFeeProxyPaymentDetector);
    });

    it('should return null when no payment network extension', () => {
      const request = {
        requestId: '01c9190b6d015b3a0b2bbd0e492b9474b0734ca19a16f2fda8f7adec10d0fa3e7a',
        currency: {
          network: 'tron',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: tokenAddress,
        },
        extensions: {},
      };

      const detector = paymentNetworkFactory.getPaymentNetworkFromRequest(request);

      expect(detector).toBeNull();
    });
  });
});
