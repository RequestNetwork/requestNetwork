import NativeTokenPaymentNetwork from '../../../src/extensions/payment-network/native-tokens';
import NearNativePaymentNetwork from '../../../src/extensions/payment-network/near-native';
import {
  actionCreationWithNativeTokenPayment,
  extensionStateWithNativeTokenPaymentAndRefund,
  requestStateNoExtensions,
} from '../../utils/payment-network/any/generator-data-create';
import { AdvancedLogic } from '../../../src';
import { arbitraryTimestamp, payeeRaw } from '../../utils/test-data-generator';
import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';

describe('extensions/payment-network/native-tokens', () => {
  const nearCurrency = {
    type: RequestLogicTypes.CURRENCY.ETH,
    value: 'NEAR',
    network: 'aurora',
  };
  const nearTestnetCurrency = {
    type: RequestLogicTypes.CURRENCY.ETH,
    value: 'NEAR-testnet',
    network: 'aurora-testnet',
  };
  const nativeTokenTestCases = [
    {
      name: 'Near',
      paymentNetwork: new NearNativePaymentNetwork() as NativeTokenPaymentNetwork,
      networkName: 'aurora',
      suffix: 'near',
      wrongSuffix: 'testnet',
      currency: nearCurrency,
      wrongCurrency: nearTestnetCurrency,
    },
    {
      name: 'Near testnet',
      paymentNetwork: new NearNativePaymentNetwork() as NativeTokenPaymentNetwork,
      networkName: 'aurora-testnet',
      suffix: 'testnet',
      wrongSuffix: 'near',
      currency: nearTestnetCurrency,
      wrongCurrency: nearCurrency,
    },
  ];

  nativeTokenTestCases.forEach((testCase) => {
    describe(`action creations for ${testCase.name}`, () => {
      describe('createCreationAction', () => {
        it('works with valid payment address', () => {
          expect(() => {
            testCase.paymentNetwork.createCreationAction({
              paymentAddress: `pay.${testCase.suffix}`,
              refundAddress: `refund.${testCase.suffix}`,
              salt: 'ea3bc7caf64110ca',
              paymentNetworkName: testCase.networkName,
            });
          }).toBeTruthy();
        });
        it('throws with invalid payment address', () => {
          expect(() => {
            testCase.paymentNetwork.createCreationAction({
              paymentAddress: 'not a near address',
              refundAddress: `refund.${testCase.suffix}`,
              salt: 'ea3bc7caf64110ca',
              paymentNetworkName: testCase.networkName,
            });
          }).toThrowError('paymentAddress is not a valid address');
        });
        it('throws with payment address on the wrong network', () => {
          expect(() => {
            testCase.paymentNetwork.createCreationAction({
              paymentAddress: `pay.${testCase.wrongSuffix}`,
              refundAddress: `refund.${testCase.wrongSuffix}`,
              salt: 'ea3bc7caf64110ca',
              paymentNetworkName: testCase.networkName,
            });
          }).toThrowError('paymentAddress is not a valid address');
        });
      });
      describe('createAddPaymentAddressAction', () => {
        it('works with valid payment address', () => {
          expect(() => {
            testCase.paymentNetwork.createAddPaymentAddressAction({
              paymentAddress: `pay.${testCase.suffix}`,
              paymentNetworkName: testCase.networkName,
            });
          }).toBeTruthy();
        });
        it('throws with invalid payment address', () => {
          expect(() => {
            testCase.paymentNetwork.createAddPaymentAddressAction({
              paymentAddress: 'not a near address',
              paymentNetworkName: testCase.networkName,
            });
          }).toThrowError('paymentAddress is not a valid address');
        });
        it('throws with payment address on the wrong network', () => {
          expect(() => {
            testCase.paymentNetwork.createAddPaymentAddressAction({
              paymentAddress: `pay.${testCase.wrongSuffix}`,
              paymentNetworkName: testCase.networkName,
            });
          }).toThrowError('paymentAddress is not a valid address');
        });
      });
      describe('createAddRefundAddress', () => {
        it('works with valid payment address', () => {
          expect(() => {
            testCase.paymentNetwork.createAddRefundAddressAction({
              refundAddress: `refund.${testCase.suffix}`,
              paymentNetworkName: testCase.networkName,
            });
          }).toBeTruthy();
        });
        it('throws with invalid payment address', () => {
          expect(() => {
            testCase.paymentNetwork.createAddRefundAddressAction({
              refundAddress: `not a near address`,
              paymentNetworkName: testCase.networkName,
            });
          }).toThrowError('refundAddress is not a valid address');
        });
        it('throws with payment address on the wrong network', () => {
          expect(() => {
            testCase.paymentNetwork.createAddRefundAddressAction({
              refundAddress: `refund.${testCase.wrongSuffix}`,
              paymentNetworkName: testCase.networkName,
            });
          }).toThrowError('refundAddress is not a valid address');
        });
      });
    });
  });

  describe('Native NEAR token exceptions', () => {
    const partialCreationParams: ExtensionTypes.PnReferenceBased.ICreationParameters = {
      paymentAddress: `pay.near`,
      refundAddress: `refund.near`,
      salt: 'ea3bc7caf64110ca',
    };
    it('createCreationAction() throws with unsupported payment network', () => {
      expect(() => {
        new NearNativePaymentNetwork().createCreationAction({
          ...partialCreationParams,
          paymentNetworkName: 'another-chain',
        });
      }).toThrowError(`Payment network another-chain is not supported by this extension (only`);
    });
    it('createCreationAction() throws without payment network', () => {
      expect(() => {
        new NearNativePaymentNetwork().createCreationAction(partialCreationParams);
      }).toThrowError(`The payment network is mandatory for extension pn-native-token.`);
    });
    it('createAddPaymentAddressAction() throws with unsupported payment network', () => {
      expect(() => {
        new NearNativePaymentNetwork().createAddPaymentAddressAction({
          paymentAddress: `pay.near`,
          paymentNetworkName: 'another-chain',
        });
      }).toThrowError(`Payment network another-chain is not supported`);
    });
    it('createAddPaymentAddressAction() throws without payment network', () => {
      expect(() => {
        new NearNativePaymentNetwork().createAddPaymentAddressAction({
          paymentAddress: `pay.near`,
        });
      }).toThrowError(`The payment network is mandatory for extension pn-native-token.`);
    });
    it('createAddRefundAddressAction() throws with unsupported payment network', () => {
      expect(() => {
        new NearNativePaymentNetwork().createAddRefundAddressAction({
          refundAddress: `refund.near`,
          paymentNetworkName: 'another-chain',
        });
      }).toThrowError(`Payment network another-chain is not supported`);
    });
    it('createAddRefundAddressAction() throws without payment network', () => {
      expect(() => {
        new NearNativePaymentNetwork().createAddRefundAddressAction({
          refundAddress: `refund.near`,
        });
      }).toThrowError(`The payment network is mandatory for extension pn-native-token.`);
    });
  });

  describe('AdvancedLogic.applyActionToExtension', () => {
    const testCase = nativeTokenTestCases[0];
    it('works with state and action on the same network', () => {
      const advancedLogic = new AdvancedLogic();

      const requestState: typeof requestStateNoExtensions = {
        ...requestStateNoExtensions,
        currency: testCase.currency,
      };

      const creationAction = {
        // const creationAction: typeof actionCreationWithNativeTokenPayment = {
        ...actionCreationWithNativeTokenPayment,
        parameters: {
          ...actionCreationWithNativeTokenPayment.parameters,
          paymentNetworkName: testCase.currency.network,
        },
      };

      const newExtensionState = advancedLogic.applyActionToExtensions(
        requestState.extensions,
        creationAction,
        requestState,
        payeeRaw.identity,
        arbitraryTimestamp,
      );

      expect(newExtensionState).toEqual(extensionStateWithNativeTokenPaymentAndRefund);
    });
    it('works on a state with no currency network', () => {
      const advancedLogic = new AdvancedLogic();

      const requestState: typeof requestStateNoExtensions = {
        ...requestStateNoExtensions,
        currency: { ...testCase.currency, network: undefined },
      };

      const creationAction = {
        // const creationAction: typeof actionCreationWithNativeTokenPayment = {
        ...actionCreationWithNativeTokenPayment,
        parameters: {
          ...actionCreationWithNativeTokenPayment.parameters,
          paymentNetworkName: testCase.currency.network,
        },
      };

      const newExtensionState = advancedLogic.applyActionToExtensions(
        requestState.extensions,
        creationAction,
        requestState,
        payeeRaw.identity,
        arbitraryTimestamp,
      );

      expect(newExtensionState).toEqual(extensionStateWithNativeTokenPaymentAndRefund);
    });
    it('works with an action without payment network', () => {
      const advancedLogic = new AdvancedLogic();

      const requestState: typeof requestStateNoExtensions = {
        ...requestStateNoExtensions,
        currency: testCase.currency,
      };

      const creationAction = {
        // const creationAction: typeof actionCreationWithNativeTokenPayment = {
        ...actionCreationWithNativeTokenPayment,
        parameters: {
          ...actionCreationWithNativeTokenPayment.parameters,
          paymentNetworkName: undefined,
        },
      };

      const newExtensionState = advancedLogic.applyActionToExtensions(
        requestState.extensions,
        creationAction,
        requestState,
        payeeRaw.identity,
        arbitraryTimestamp,
      );

      expect(newExtensionState).toEqual(extensionStateWithNativeTokenPaymentAndRefund);
    });
    it('throws with no state or action payment network', () => {
      const advancedLogic = new AdvancedLogic();

      const wrongNativeTokenRequestState: typeof requestStateNoExtensions = {
        ...requestStateNoExtensions,
        currency: {
          ...testCase.currency,
          network: undefined,
        },
      };

      const wrongActionCreation = {
        ...actionCreationWithNativeTokenPayment,
        parameters: {
          ...actionCreationWithNativeTokenPayment.parameters,
          paymentNetworkName: undefined,
        },
      };

      expect(() =>
        advancedLogic.applyActionToExtensions(
          wrongNativeTokenRequestState.extensions,
          wrongActionCreation,
          wrongNativeTokenRequestState,
          payeeRaw.identity,
          arbitraryTimestamp,
        ),
      ).toThrowError('extension with id: pn-native-token not found for network: undefined');
    });
    it('throws on a wrong payment network', () => {
      const advancedLogic = new AdvancedLogic();
      const wrongNetwork = `wrong network`;

      const wrongNativeTokenRequestState: typeof requestStateNoExtensions = {
        ...requestStateNoExtensions,
        currency: {
          ...testCase.currency,
          network: wrongNetwork,
        },
      };

      const wrongActionCreation = {
        ...actionCreationWithNativeTokenPayment,
        parameters: {
          ...actionCreationWithNativeTokenPayment.parameters,
          paymentNetworkName: wrongNetwork,
        },
      };

      expect(() =>
        advancedLogic.applyActionToExtensions(
          wrongNativeTokenRequestState.extensions,
          wrongActionCreation,
          wrongNativeTokenRequestState,
          payeeRaw.identity,
          arbitraryTimestamp,
        ),
      ).toThrowError('extension with id: pn-native-token not found for network: wrong network');
    });
    it('throws on a different payment network', () => {
      const advancedLogic = new AdvancedLogic();

      const requestState = {
        ...requestStateNoExtensions,
        currency: testCase.currency,
      };

      const wrongActionCreation = {
        ...actionCreationWithNativeTokenPayment,
        parameters: {
          ...actionCreationWithNativeTokenPayment.parameters,
          paymentNetworkName: testCase.wrongCurrency.network,
        },
      };

      expect(() =>
        advancedLogic.applyActionToExtensions(
          requestState.extensions,
          wrongActionCreation,
          requestState,
          payeeRaw.identity,
          arbitraryTimestamp,
        ),
      ).toThrowError(
        `Cannot apply action for network ${testCase.wrongCurrency.network} on state with payment network: ${testCase.currency.network}`,
      );
    });
  });
});
