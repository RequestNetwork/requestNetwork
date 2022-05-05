import {
  requestStateNoExtensions,
  arbitrarySalt,
  actionCreationWithAnyToNativeTokenPayment,
  extensionStateWithAnyToNativeTokenPaymentAndRefund,
  extensionStateAnyToNativeWithPaymentAddressAdded,
} from '../../utils/payment-network/any/generator-data-create';
import { AdvancedLogic } from '../../../src';
import { arbitraryTimestamp, payeeRaw } from '../../utils/test-data-generator';
import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import AnyToNearPaymentNetwork from '../../../src/extensions/payment-network/any-to-near';
import AnyToNativeTokenPaymentNetwork from '../../../src/extensions/payment-network/any-to-native';
import { CurrencyManager } from '@requestnetwork/currency';

const salt = arbitrarySalt;
const currencyManager = CurrencyManager.getDefault();

describe('extensions/payment-network/any-to-native-token', () => {
  const nearCurrency = {
    type: RequestLogicTypes.CURRENCY.ETH,
    value: 'NEAR',
    network: 'aurora',
  };
  const requestCurrency = {
    type: RequestLogicTypes.CURRENCY.ISO4217,
    value: 'USD',
  };
  const nearTestnetCurrency = {
    type: RequestLogicTypes.CURRENCY.ETH,
    value: 'NEAR-testnet',
    network: 'aurora-testnet',
  };
  const anyToNativeTokenTestCases = [
    {
      name: 'Near',
      paymentNetwork: new AnyToNearPaymentNetwork(
        currencyManager,
      ) as AnyToNativeTokenPaymentNetwork,
      networkName: 'aurora',
      suffix: 'near',
      wrongSuffix: 'testnet',
      currency: nearCurrency,
      wrongCurrency: nearTestnetCurrency,
      network: 'aurora',
      wrongNetwork: 'aurora-testnet',
      maxRateTimespan: 100000,
    },
    {
      name: 'Near testnet',
      paymentNetwork: new AnyToNearPaymentNetwork(
        currencyManager,
      ) as AnyToNativeTokenPaymentNetwork,
      networkName: 'aurora-testnet',
      suffix: 'testnet',
      wrongSuffix: 'near',
      currency: nearTestnetCurrency,
      wrongCurrency: nearCurrency,
      network: 'aurora-testnet',
      wrongNetwork: 'aurora',
      maxRateTimespan: 100000,
    },
  ];

  anyToNativeTokenTestCases.forEach((testCase) => {
    describe(`action creations for ${testCase.name}`, () => {
      describe('createCreationAction', () => {
        it('works with valid payment address', () => {
          expect(
            testCase.paymentNetwork.createCreationAction({
              paymentAddress: `pay.${testCase.suffix}`,
              refundAddress: `refund.${testCase.suffix}`,
              salt,
              paymentNetworkName: testCase.networkName,
              network: testCase.network,
              maxRateTimespan: testCase.maxRateTimespan,
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
              network: testCase.network,
              maxRateTimespan: testCase.maxRateTimespan,
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
              network: testCase.network,
              maxRateTimespan: testCase.maxRateTimespan,
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
      describe('createAddFeeAction', () => {
        it('can createAddFeeAction', () => {
          expect(
            testCase.paymentNetwork.createAddFeeAction({
              feeAddress: `fee.${testCase.suffix}`,
              feeAmount: '2000',
            }),
          ).toEqual({
            action: ExtensionTypes.PnFeeReferenceBased.ACTION.ADD_FEE,
            id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_NATIVE_TOKEN,
            parameters: {
              feeAddress: `fee.${testCase.suffix}`,
              feeAmount: '2000',
            },
          });
        });

        it('cannot createAddFeeAddressAction with fee address not valid for the associated PN', () => {
          // 'must throw'
          expect(() => {
            testCase.paymentNetwork.createAddFeeAction({
              feeAddress: `fee.${testCase.wrongSuffix}`,
              feeAmount: '2000',
            });
          }).toThrowError('feeAddress is not a valid address');
        });

        it('cannot createAddFeeAction with amount non positive integer', () => {
          // 'must throw'
          expect(() => {
            testCase.paymentNetwork.createAddFeeAction({
              feeAddress: `fee.${testCase.suffix}`,
              feeAmount: '-30000',
            });
          }).toThrowError('feeAmount is not a valid amount');
        });
      });
    });
  });

  describe('action creations, edge cases', () => {
    const partialCreationParams: ExtensionTypes.PnAnyToAnyConversion.ICreationParameters = {
      salt,
      refundAddress: 'refund.near',
      feeAddress: 'fee.near',
      feeAmount: '100',
      maxRateTimespan: 1000000,
    };
    it('createCreationAction() works with no payment, refund address, feeAddress and feeAmount', () => {
      expect(
        new AnyToNearPaymentNetwork(currencyManager).createCreationAction({
          salt,
          paymentNetworkName: 'aurora',
          network: 'aurora',
        }),
      ).toBeTruthy();
    });
    it('createCreationAction() throws with unsupported payment network', () => {
      expect(() => {
        new AnyToNearPaymentNetwork(currencyManager).createCreationAction({
          ...partialCreationParams,
          paymentNetworkName: 'another-chain',
          network: 'another-chain',
        });
      }).toThrowError(`network another-chain not supported`);
    });
    it('createCreationAction() throws without payment network', () => {
      expect(() => {
        new AnyToNearPaymentNetwork(currencyManager).createCreationAction(partialCreationParams);
      }).toThrowError(`network is required`);
    });
  });

  describe('AdvancedLogic.applyActionToExtension', () => {
    const mainnetTestCase = anyToNativeTokenTestCases[0];
    it('works with state and action on the same network', () => {
      const advancedLogic = new AdvancedLogic();

      const requestState: typeof requestStateNoExtensions = {
        ...requestStateNoExtensions,
        currency: requestCurrency,
      };

      const creationAction = {
        ...actionCreationWithAnyToNativeTokenPayment,
        parameters: {
          ...actionCreationWithAnyToNativeTokenPayment.parameters,
          paymentNetworkName: mainnetTestCase.network,
        },
      };

      const newExtensionState = advancedLogic.applyActionToExtensions(
        requestState.extensions,
        creationAction,
        requestState,
        payeeRaw.identity,
        arbitraryTimestamp,
      );

      expect(newExtensionState).toEqual(extensionStateWithAnyToNativeTokenPaymentAndRefund);
    });
    it('works when adding a payment address to a created state', () => {
      const advancedLogic = new AdvancedLogic();
      const anyToNearPn = new AnyToNearPaymentNetwork(currencyManager);

      const requestState: typeof requestStateNoExtensions = {
        ...requestStateNoExtensions,
        currency: requestCurrency,
      };

      const intermediateExtensionState = advancedLogic.applyActionToExtensions(
        requestState.extensions,
        anyToNearPn.createCreationAction({
          salt,
          paymentNetworkName: 'aurora',
          network: 'aurora',
          refundAddress: 'refund.near',
          feeAddress: 'fee.near',
          feeAmount: '100',
          maxRateTimespan: 1000000,
        }),
        requestState,
        payeeRaw.identity,
        arbitraryTimestamp,
      );

      requestState.extensions = intermediateExtensionState;

      const addPaymentAddressAction = anyToNearPn.createAddPaymentAddressAction({
        paymentAddress: 'pay.near',
      });

      const newExtensionState = advancedLogic.applyActionToExtensions(
        intermediateExtensionState,
        addPaymentAddressAction,
        requestState,
        payeeRaw.identity,
        arbitraryTimestamp,
      );

      expect(newExtensionState).toEqual(extensionStateAnyToNativeWithPaymentAddressAdded);
    });
    it('throws when adding a payment address a different network', () => {
      const advancedLogic = new AdvancedLogic();
      const anyToNearPn = new AnyToNearPaymentNetwork(currencyManager);

      const requestState: typeof requestStateNoExtensions = {
        ...requestStateNoExtensions,
        currency: requestCurrency,
      };

      const intermediateExtensionState = advancedLogic.applyActionToExtensions(
        requestState.extensions,
        anyToNearPn.createCreationAction({
          salt,
          paymentNetworkName: 'aurora',
          network: 'aurora',
          refundAddress: 'refund.near',
          feeAddress: 'fee.near',
          feeAmount: '100',
          maxRateTimespan: 1000000,
        }),
        requestState,
        payeeRaw.identity,
        arbitraryTimestamp,
      );

      requestState.extensions = intermediateExtensionState;

      const addPaymentAddressAction = anyToNearPn.createAddPaymentAddressAction({
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
    it('throws when network is undefined', () => {
      const advancedLogic = new AdvancedLogic();

      const requestState: typeof requestStateNoExtensions = {
        ...requestStateNoExtensions,
        currency: requestCurrency,
      };

      const wrongActionCreation = {
        ...actionCreationWithAnyToNativeTokenPayment,
        parameters: {
          ...actionCreationWithAnyToNativeTokenPayment.parameters,
          network: undefined,
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
      ).toThrowError('extension with id: pn-any-to-native-token not found for network: undefined');
    });
    it('throws on a wrong network', () => {
      const advancedLogic = new AdvancedLogic();
      const wrongNetwork = `wrong network`;

      const wrongNativeTokenRequestState: typeof requestStateNoExtensions = {
        ...requestStateNoExtensions,
        currency: requestCurrency,
      };

      const wrongActionCreation = {
        ...actionCreationWithAnyToNativeTokenPayment,
        parameters: {
          ...actionCreationWithAnyToNativeTokenPayment.parameters,
          network: wrongNetwork,
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
      ).toThrowError(
        'extension with id: pn-any-to-native-token not found for network: wrong network',
      );
    });
    it('keeps the version used at creation', () => {
      const advancedLogic = new AdvancedLogic();
      const requestState = {
        ...requestStateNoExtensions,
        currency: requestCurrency,
      };
      const newState = advancedLogic.applyActionToExtensions(
        requestState.extensions,
        { ...actionCreationWithAnyToNativeTokenPayment, version: 'ABCD' },
        requestState,
        payeeRaw.identity,
        arbitraryTimestamp,
      );
      expect(newState[mainnetTestCase.paymentNetwork.extensionId].version).toBe('ABCD');
    });

    it('requires a version at creation', () => {
      expect(() => {
        const advancedLogic = new AdvancedLogic();
        const requestState = {
          ...requestStateNoExtensions,
          currency: requestCurrency,
        };
        advancedLogic.applyActionToExtensions(
          {},
          { ...actionCreationWithAnyToNativeTokenPayment, version: '' },
          requestState,
          payeeRaw.identity,
          arbitraryTimestamp,
        );
      }).toThrowError('version is required at creation');
    });
  });

  it('should throw when isValidAddress is not overridden', () => {
    class TestNativePaymentNetwork extends AnyToNativeTokenPaymentNetwork {
      public testIsValidAddress() {
        this.isValidAddress('test', 'test');
      }
    }
    expect(() => {
      const testNativePaymentNetwork = new TestNativePaymentNetwork(
        ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_NATIVE_TOKEN,
        'test',
        [],
      );
      testNativePaymentNetwork.testIsValidAddress();
    }).toThrowError(
      'Default implementation of isValidAddress() does not support native tokens. Please override this method.',
    );
  });
});
