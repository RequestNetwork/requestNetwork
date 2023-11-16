import { CurrencyManager } from '@requestnetwork/currency';
import NativeTokenPaymentNetwork from '../../../src/extensions/payment-network/native-token';
import NearNativePaymentNetwork from '../../../src/extensions/payment-network/near/near-native';
import {
  arbitrarySalt,
  requestStateNoExtensions,
} from '../../utils/payment-network/any/generator-data-create';
import {
  actionCreationWithNativeTokenPayment,
  extensionStateWithNativeTokenPaymentAndRefund,
  extensionStateWithPaymentAddressAdded,
} from '../../utils/payment-network/mocked_native_data';
import { AdvancedLogic } from '../../../src';
import { arbitraryTimestamp, payeeRaw } from '../../utils/test-data-generator';
import { CurrencyTypes, ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import NearTestnetNativeNativePaymentNetwork from '../../../src/extensions/payment-network/near/near-testnet-native';

const salt = arbitrarySalt;

const advancedLogic = new AdvancedLogic(CurrencyManager.getDefault());

describe('extensions/payment-network/native-token', () => {
  const nearCurrency = {
    type: RequestLogicTypes.CURRENCY.ETH,
    value: 'NEAR',
    network: 'aurora',
  } as const;
  const auroraTestnetCurrency = {
    type: RequestLogicTypes.CURRENCY.ETH,
    value: 'NEAR-testnet',
    network: 'aurora-testnet',
  } as const;
  const nearTestnetCurrency = {
    type: RequestLogicTypes.CURRENCY.ETH,
    value: 'NEAR-testnet',
    network: 'near-testnet',
  } as const;
  const nativeTokenTestCases = [
    {
      name: 'Near',
      paymentNetwork: new NearNativePaymentNetwork() as NativeTokenPaymentNetwork,
      networkName: 'aurora',
      suffix: 'near',
      wrongSuffix: 'testnet',
      currency: nearCurrency,
      wrongCurrency: auroraTestnetCurrency,
    },
    {
      name: 'Aurora testnet',
      paymentNetwork: new NearTestnetNativeNativePaymentNetwork() as NativeTokenPaymentNetwork,
      networkName: 'aurora-testnet',
      suffix: 'testnet',
      wrongSuffix: 'near',
      currency: auroraTestnetCurrency,
      wrongCurrency: nearCurrency,
    },
    {
      name: 'Near testnet',
      paymentNetwork: new NearTestnetNativeNativePaymentNetwork() as NativeTokenPaymentNetwork,
      networkName: 'near-testnet',
      suffix: 'testnet',
      wrongSuffix: 'near',
      currency: nearTestnetCurrency,
      wrongCurrency: nearCurrency,
    },
  ] as const;

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
          paymentNetworkName: 'another-chain' as CurrencyTypes.NearChainName,
        });
      }).toThrowError(
        `Payment network 'another-chain' is not supported by this extension (only aurora)`,
      );
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
    it('works with an action without payment network', () => {
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
      const nearPn = new NearTestnetNativeNativePaymentNetwork();

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
      const nearPn = new NearNativePaymentNetwork();

      const requestState: typeof requestStateNoExtensions = {
        ...requestStateNoExtensions,
        currency: mainnetTestCase.currency,
      };

      requestState.extensions = advancedLogic.applyActionToExtensions(
        requestState.extensions,
        nearPn.createCreationAction({ salt, paymentNetworkName: 'aurora' }),
        requestState,
        payeeRaw.identity,
        arbitraryTimestamp,
      );

      expect(() => {
        nearPn.createAddPaymentAddressAction({
          paymentAddress: 'pay.testnet',
        });
      }).toThrowError("paymentAddress 'pay.testnet' is not a valid address");
    });
    it('throws with no state or action payment network', () => {
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
      const wrongNetwork = `wrong network` as CurrencyTypes.EvmChainName;

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

    it('keeps the version used at creation', () => {
      const requestState = {
        ...requestStateNoExtensions,
        currency: mainnetTestCase.currency,
      };
      const newState = advancedLogic.applyActionToExtensions(
        {},
        { ...actionCreationWithNativeTokenPayment, version: 'ABCD' },
        requestState,
        payeeRaw.identity,
        arbitraryTimestamp,
      );
      expect(newState[mainnetTestCase.paymentNetwork.extensionId].version).toBe('ABCD');
    });

    it('requires a version at creation', () => {
      expect(() => {
        const requestState = {
          ...requestStateNoExtensions,
          currency: mainnetTestCase.currency,
        };
        advancedLogic.applyActionToExtensions(
          {},
          { ...actionCreationWithNativeTokenPayment, version: '' },
          requestState,
          payeeRaw.identity,
          arbitraryTimestamp,
        );
      }).toThrowError('version is required at creation');
    });
  });

  it('should throw when isValidAddress is not overridden', () => {
    class TestNativePaymentNetwork extends NativeTokenPaymentNetwork {
      public testIsValidAddress() {
        this.isValidAddress('test');
      }
    }
    expect(() => {
      const testNativePaymentNetwork = new TestNativePaymentNetwork(
        ExtensionTypes.PAYMENT_NETWORK_ID.NATIVE_TOKEN,
        'test',
        [],
      );
      testNativePaymentNetwork.testIsValidAddress();
    }).toThrowError(
      'Default implementation of isValidAddress() does not support native tokens. Please override this method.',
    );
  });
});
