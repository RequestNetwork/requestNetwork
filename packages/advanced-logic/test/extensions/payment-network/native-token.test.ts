import NativeTokenPaymentNetwork from '../../../src/extensions/payment-network/native-token';
import NearNativePaymentNetwork from '../../../src/extensions/payment-network/near-native';
import {
  actionCreationWithNativeTokenPayment,
  extensionStateWithNativeTokenPaymentAndRefund,
  extensionStateWithPaymentAddressAdded,
  requestStateNoExtensions,
  arbitrarySalt,
} from '../../utils/payment-network/any/generator-data-create';
import { AdvancedLogic } from '../../../src';
import { arbitraryTimestamp, payeeRaw } from '../../utils/test-data-generator';
import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';

const salt = arbitrarySalt;

describe('extensions/payment-network/native-token', () => {
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
          expect(
            testCase.paymentNetwork.createCreationAction({
              paymentAddress: `pay.${testCase.suffix}`,
              refundAddress: `refund.${testCase.suffix}`,
              salt,
              paymentNetworkName: testCase.networkName,
            }),
          ).toBeTruthy();
        });
        it('throws with invalid payment address', () => {
          expect(() => {
            testCase.paymentNetwork.createCreationAction({
              paymentAddress: 'not a near address',
              refundAddress: `refund.${testCase.suffix}`,
              salt,
              paymentNetworkName: testCase.networkName,
            });
          }).toThrowError("paymentAddress 'not a near address' is not a valid address");
        });
        it('throws with payment address on the wrong network', () => {
          expect(() => {
            testCase.paymentNetwork.createCreationAction({
              paymentAddress: `pay.${testCase.wrongSuffix}`,
              refundAddress: `refund.${testCase.wrongSuffix}`,
              salt,
              paymentNetworkName: testCase.networkName,
            });
          }).toThrowError(`paymentAddress 'pay.${testCase.wrongSuffix}' is not a valid address`);
        });
      });
      describe('createAddPaymentAddressAction', () => {
        it('works with valid payment address', () => {
          expect(
            testCase.paymentNetwork.createAddPaymentAddressAction({
              paymentAddress: `pay.${testCase.suffix}`,
            }),
          ).toBeTruthy();
        });
        it('throws with invalid payment address', () => {
          expect(() => {
            testCase.paymentNetwork.createAddPaymentAddressAction({
              paymentAddress: 'not a near address',
            });
          }).toThrowError("paymentAddress 'not a near address' is not a valid address");
        });
      });
      describe('createAddRefundAddress', () => {
        it('works with valid payment address', () => {
          expect(
            testCase.paymentNetwork.createAddRefundAddressAction({
              refundAddress: `refund.${testCase.suffix}`,
            }),
          ).toBeTruthy();
        });
        it('throws with invalid payment address', () => {
          expect(() => {
            testCase.paymentNetwork.createAddRefundAddressAction({
              refundAddress: `not a near address`,
            });
          }).toThrowError("refundAddress 'not a near address' is not a valid address");
        });
      });
    });
  });

  describe('action creations, edge cases', () => {
    const partialCreationParams: ExtensionTypes.PnReferenceBased.ICreationParameters = {
      paymentAddress: `pay.near`,
      refundAddress: `refund.near`,
      salt,
    };
    it('createCreationAction() works with no payment or refund address nor network name', () => {
      expect(
        new NearNativePaymentNetwork().createCreationAction({
          salt,
        }),
      ).toBeTruthy();
    });
    it('createCreationAction() throws with unsupported payment network', () => {
      expect(() => {
        new NearNativePaymentNetwork().createCreationAction({
          ...partialCreationParams,
          paymentNetworkName: 'another-chain',
        });
      }).toThrowError(`Payment network 'another-chain' is not supported by this extension (only`);
    });
    it('createCreationAction() throws without payment network', () => {
      expect(() => {
        new NearNativePaymentNetwork().createCreationAction(partialCreationParams);
      }).toThrowError(
        `The network name is mandatory for the creation of the extension pn-native-token.`,
      );
    });
  });

  describe('AdvancedLogic.applyActionToExtension', () => {
    const mainnetTestCase = nativeTokenTestCases[0];
    it('works with state and action on the same network', () => {
      const advancedLogic = new AdvancedLogic();

      const requestState: typeof requestStateNoExtensions = {
        ...requestStateNoExtensions,
        currency: mainnetTestCase.currency,
      };

      const creationAction = {
        ...actionCreationWithNativeTokenPayment,
        parameters: {
          ...actionCreationWithNativeTokenPayment.parameters,
          paymentNetworkName: mainnetTestCase.currency.network,
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
        currency: { ...mainnetTestCase.currency, network: undefined },
      };

      const creationAction = {
        ...actionCreationWithNativeTokenPayment,
        parameters: {
          ...actionCreationWithNativeTokenPayment.parameters,
          paymentNetworkName: mainnetTestCase.currency.network,
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
        currency: mainnetTestCase.currency,
      };

      const creationAction = {
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
    it('works when adding a payment address to a created state', () => {
      const advancedLogic = new AdvancedLogic();
      const nearPn = new NearNativePaymentNetwork();

      const requestState: typeof requestStateNoExtensions = {
        ...requestStateNoExtensions,
        currency: mainnetTestCase.currency,
      };

      const intermediateExtensionState = advancedLogic.applyActionToExtensions(
        requestState.extensions,
        nearPn.createCreationAction({ salt, paymentNetworkName: 'aurora' }),
        requestState,
        payeeRaw.identity,
        arbitraryTimestamp,
      );

      requestState.extensions = intermediateExtensionState;

      const addPaymentAddressAction = nearPn.createAddPaymentAddressAction({
        paymentAddress: 'pay.near',
      });

      const newExtensionState = advancedLogic.applyActionToExtensions(
        intermediateExtensionState,
        addPaymentAddressAction,
        requestState,
        payeeRaw.identity,
        arbitraryTimestamp,
      );

      expect(newExtensionState).toEqual(extensionStateWithPaymentAddressAdded);
    });
    it('throws when creating the extension on a different network from the request network', () => {
      const advancedLogic = new AdvancedLogic();
      const nearPn = new NearNativePaymentNetwork();

      const requestState: typeof requestStateNoExtensions = {
        ...requestStateNoExtensions,
        currency: mainnetTestCase.currency,
      };

      expect(() => {
        advancedLogic.applyActionToExtensions(
          requestState.extensions,
          nearPn.createCreationAction({ salt, paymentNetworkName: 'aurora-testnet' }),
          requestState,
          payeeRaw.identity,
          arbitraryTimestamp,
        );
      }).toThrowError(
        'Cannot apply action for network aurora-testnet on state with payment network: aurora',
      );
    });
    it('throws when adding a payment address a different network', () => {
      const advancedLogic = new AdvancedLogic();
      const nearPn = new NearNativePaymentNetwork();

      const requestState: typeof requestStateNoExtensions = {
        ...requestStateNoExtensions,
        currency: mainnetTestCase.currency,
      };

      const intermediateExtensionState = advancedLogic.applyActionToExtensions(
        requestState.extensions,
        nearPn.createCreationAction({ salt, paymentNetworkName: 'aurora' }),
        requestState,
        payeeRaw.identity,
        arbitraryTimestamp,
      );

      requestState.extensions = intermediateExtensionState;

      const addPaymentAddressAction = nearPn.createAddPaymentAddressAction({
        paymentAddress: 'pay.testnet',
      });

      expect(() => {
        advancedLogic.applyActionToExtensions(
          intermediateExtensionState,
          addPaymentAddressAction,
          requestState,
          payeeRaw.identity,
          arbitraryTimestamp,
        );
      }).toThrowError("paymentAddress 'pay.testnet' is not a valid address");
    });
    it('throws with no state or action payment network', () => {
      const advancedLogic = new AdvancedLogic();

      const wrongNativeTokenRequestState: typeof requestStateNoExtensions = {
        ...requestStateNoExtensions,
        currency: {
          ...mainnetTestCase.currency,
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
          ...mainnetTestCase.currency,
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
        currency: mainnetTestCase.currency,
      };

      const wrongActionCreation = {
        ...actionCreationWithNativeTokenPayment,
        parameters: {
          ...actionCreationWithNativeTokenPayment.parameters,
          paymentNetworkName: mainnetTestCase.wrongCurrency.network,
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
        `Cannot apply action for network ${mainnetTestCase.wrongCurrency.network} on state with payment network: ${mainnetTestCase.currency.network}`,
      );
    });
  });
});
