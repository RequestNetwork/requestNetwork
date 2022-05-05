import {
  requestStateNoExtensions,
  arbitrarySalt,
  actionCreationWithAnyToNativeTokenPayment,
  extensionStateWithAnyToNativeTokenPaymentAndRefund,
  extensionStateAnyToNativeWithPaymentAddressAdded,
  extensionStateAnyToNativeWithFeeAdded,
} from '../../utils/payment-network/any/generator-data-create';
import { AdvancedLogic } from '../../../src';
import { arbitraryTimestamp, payeeRaw, payerRaw } from '../../utils/test-data-generator';
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
  const validCurrency = {
    type: RequestLogicTypes.CURRENCY.ISO4217,
    value: 'USD',
  };
  const wrongCurrency = {
    type: RequestLogicTypes.CURRENCY.ISO4217,
    value: 'EUR',
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
      suffix: 'near',
      wrongSuffix: 'testnet',
      currency: nearCurrency,
      wrongCurrency: nearTestnetCurrency,
      network: 'aurora',
      wrongNetwork: 'aurora-testnet',
      maxRateTimespan: 100000,
      feeAmount: '100',
    },
    {
      name: 'Near testnet',
      paymentNetwork: new AnyToNearPaymentNetwork(
        currencyManager,
      ) as AnyToNativeTokenPaymentNetwork,
      suffix: 'testnet',
      wrongSuffix: 'near',
      currency: nearTestnetCurrency,
      wrongCurrency: nearCurrency,
      network: 'aurora-testnet',
      wrongNetwork: 'aurora',
      maxRateTimespan: 100000,
      feeAmount: '100',
    },
  ];

  anyToNativeTokenTestCases.forEach((testCase) => {
    describe(`action creations for ${testCase.name}`, () => {
      describe('createCreationAction', () => {
        it('works with valid parameters', () => {
          expect(
            testCase.paymentNetwork.createCreationAction({
              paymentAddress: `pay.${testCase.suffix}`,
              refundAddress: `refund.${testCase.suffix}`,
              feeAddress: `fee.${testCase.suffix}`,
              feeAmount: testCase.feeAmount,
              salt,
              network: testCase.network,
              maxRateTimespan: testCase.maxRateTimespan,
            }),
          ).toBeTruthy();
        });
        it('works with minimum parameters', () => {
          expect(
            testCase.paymentNetwork.createCreationAction({
              salt,
              network: testCase.network,
            }),
          ).toBeTruthy();
        });
        it('throws with invalid payment address', () => {
          expect(() => {
            testCase.paymentNetwork.createCreationAction({
              paymentAddress: 'not a near address',
              refundAddress: `refund.${testCase.suffix}`,
              salt,
              network: testCase.network,
              maxRateTimespan: testCase.maxRateTimespan,
            });
          }).toThrowError("paymentAddress 'not a near address' is not a valid address");
        });
        it('throws with payment address on the wrong network', () => {
          expect(() => {
            testCase.paymentNetwork.createCreationAction({
              paymentAddress: `pay.${testCase.wrongSuffix}`,
              refundAddress: `refund.${testCase.suffix}`,
              salt,
              network: testCase.network,
              maxRateTimespan: testCase.maxRateTimespan,
            });
          }).toThrowError(`paymentAddress 'pay.${testCase.wrongSuffix}' is not a valid address`);
        });
        it('throws with invalid refund address', () => {
          expect(() => {
            testCase.paymentNetwork.createCreationAction({
              paymentAddress: `pay.${testCase.suffix}`,
              refundAddress: 'not a near address',
              salt,
              network: testCase.network,
              maxRateTimespan: testCase.maxRateTimespan,
            });
          }).toThrowError("refundAddress 'not a near address' is not a valid address");
        });
        it('throws with refund address on the wrong network', () => {
          expect(() => {
            testCase.paymentNetwork.createCreationAction({
              paymentAddress: `pay.${testCase.suffix}`,
              refundAddress: `refund.${testCase.wrongSuffix}`,
              salt,
              network: testCase.network,
              maxRateTimespan: testCase.maxRateTimespan,
            });
          }).toThrowError(`refundAddress 'refund.${testCase.wrongSuffix}' is not a valid address`);
        });
        it('throws with invalid fee address', () => {
          expect(() => {
            testCase.paymentNetwork.createCreationAction({
              paymentAddress: `pay.${testCase.suffix}`,
              refundAddress: `refund.${testCase.suffix}`,
              feeAddress: 'not a near address',
              salt,
              network: testCase.network,
              maxRateTimespan: testCase.maxRateTimespan,
            });
          }).toThrowError("feeAddress 'not a near address' is not a valid address");
        });
        it('throws with fee address on the wrong network', () => {
          expect(() => {
            testCase.paymentNetwork.createCreationAction({
              paymentAddress: `pay.${testCase.suffix}`,
              refundAddress: `refund.${testCase.suffix}`,
              feeAddress: `fee.${testCase.wrongSuffix}`,
              salt,
              network: testCase.network,
              maxRateTimespan: testCase.maxRateTimespan,
            });
          }).toThrowError(`feeAddress 'fee.${testCase.wrongSuffix}' is not a valid address`);
        });
        it('throws with invalid fee amount', () => {
          expect(() => {
            testCase.paymentNetwork.createCreationAction({
              paymentAddress: `pay.${testCase.suffix}`,
              refundAddress: `refund.${testCase.suffix}`,
              feeAddress: `fee.${testCase.suffix}`,
              feeAmount: '-2000',
              salt,
              network: testCase.network,
              maxRateTimespan: testCase.maxRateTimespan,
            });
          }).toThrowError(`feeAmount is not a valid amount`);
        });
        it('throws with invalid maxRateTimespan', () => {
          expect(() => {
            testCase.paymentNetwork.createCreationAction({
              paymentAddress: `pay.${testCase.suffix}`,
              refundAddress: `refund.${testCase.suffix}`,
              feeAddress: `fee.${testCase.suffix}`,
              feeAmount: '2000',
              salt,
              network: testCase.network,
              maxRateTimespan: -2000,
            });
          }).toThrowError(`-2000 is not a valid maxRateTimespan`);
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
      describe('createAddRefundAddressAction', () => {
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
        it('cannot createAddFeeAction with amount non positive integer', () => {
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
    describe('applyActionToExtension/create action', () => {
      it('works with valid parameters', () => {
        const advancedLogic = new AdvancedLogic();

        const requestState: typeof requestStateNoExtensions = {
          ...requestStateNoExtensions,
          currency: validCurrency,
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
      it('throws with unsupported currencies', () => {
        const advancedLogic = new AdvancedLogic();

        const requestState: typeof requestStateNoExtensions = {
          ...requestStateNoExtensions,
          currency: wrongCurrency,
        };

        const creationAction = {
          ...actionCreationWithAnyToNativeTokenPayment,
          parameters: {
            ...actionCreationWithAnyToNativeTokenPayment.parameters,
            paymentNetworkName: mainnetTestCase.network,
          },
        };

        expect(() =>
          advancedLogic.applyActionToExtensions(
            requestState.extensions,
            creationAction,
            requestState,
            payeeRaw.identity,
            arbitraryTimestamp,
          ),
        ).toThrowError(
          'The currency (EUR) of the request is not supported for this payment network',
        );
      });
      it('throws when network is undefined', () => {
        const advancedLogic = new AdvancedLogic();

        const requestState: typeof requestStateNoExtensions = {
          ...requestStateNoExtensions,
          currency: validCurrency,
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
        ).toThrowError(
          'extension with id: pn-any-to-native-token not found for network: undefined',
        );
      });
      it('throws on a wrong network', () => {
        const advancedLogic = new AdvancedLogic();
        const wrongNetwork = `wrong network`;

        const requestState: typeof requestStateNoExtensions = {
          ...requestStateNoExtensions,
          currency: validCurrency,
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
            requestState.extensions,
            wrongActionCreation,
            requestState,
            payeeRaw.identity,
            arbitraryTimestamp,
          ),
        ).toThrowError(
          'extension with id: pn-any-to-native-token not found for network: wrong network',
        );
      });
      it('throws when payment address is not valid', () => {
        const advancedLogic = new AdvancedLogic();
        const invalidAddress = 'pay.testnet';

        const requestState: typeof requestStateNoExtensions = {
          ...requestStateNoExtensions,
          currency: validCurrency,
        };

        const wrongActionCreation = {
          ...actionCreationWithAnyToNativeTokenPayment,
          parameters: {
            ...actionCreationWithAnyToNativeTokenPayment.parameters,
            paymentAddress: invalidAddress,
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
        ).toThrowError(`paymentAddress ${invalidAddress} is not a valid address`);
      });
      it('throws when fee address is not valid', () => {
        const advancedLogic = new AdvancedLogic();
        const invalidAddress = 'fee.testnet';

        const requestState: typeof requestStateNoExtensions = {
          ...requestStateNoExtensions,
          currency: validCurrency,
        };

        const wrongActionCreation = {
          ...actionCreationWithAnyToNativeTokenPayment,
          parameters: {
            ...actionCreationWithAnyToNativeTokenPayment.parameters,
            feeAddress: invalidAddress,
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
        ).toThrowError(`feeAddress ${invalidAddress} is not a valid address`);
      });
      it('throws when refund address is not valid', () => {
        const advancedLogic = new AdvancedLogic();
        const invalidAddress = 'refund.testnet';

        const requestState: typeof requestStateNoExtensions = {
          ...requestStateNoExtensions,
          currency: validCurrency,
        };

        const wrongActionCreation = {
          ...actionCreationWithAnyToNativeTokenPayment,
          parameters: {
            ...actionCreationWithAnyToNativeTokenPayment.parameters,
            refundAddress: invalidAddress,
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
        ).toThrowError(`refundAddress ${invalidAddress} is not a valid address`);
      });
      it('throws when version is missing', () => {
        expect(() => {
          const advancedLogic = new AdvancedLogic();
          const requestState = {
            ...requestStateNoExtensions,
            currency: validCurrency,
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
    describe('applyActionToExtension/addPaymentAddress action', () => {
      it('works when adding a payment address to a created state', () => {
        const advancedLogic = new AdvancedLogic();
        const anyToNearPn = new AnyToNearPaymentNetwork(currencyManager);

        const requestState: typeof requestStateNoExtensions = {
          ...requestStateNoExtensions,
          currency: validCurrency,
        };

        const intermediateExtensionState = advancedLogic.applyActionToExtensions(
          requestState.extensions,
          anyToNearPn.createCreationAction({
            salt,
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
      it('throws with invalid payment address', () => {
        const advancedLogic = new AdvancedLogic();
        const anyToNearPn = new AnyToNearPaymentNetwork(currencyManager);
        const invalidAddress = 'pay.testnet';

        const requestState: typeof requestStateNoExtensions = {
          ...requestStateNoExtensions,
          currency: validCurrency,
        };

        const intermediateExtensionState = advancedLogic.applyActionToExtensions(
          requestState.extensions,
          anyToNearPn.createCreationAction({
            salt,
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
          paymentAddress: invalidAddress,
        });

        expect(() => {
          advancedLogic.applyActionToExtensions(
            intermediateExtensionState,
            addPaymentAddressAction,
            requestState,
            payeeRaw.identity,
            arbitraryTimestamp,
          );
        }).toThrowError(`paymentAddress '${invalidAddress}' is not a valid address`);
      });
    });
    describe('applyActionToExtension/addFeeAddress action', () => {
      it('works when adding a fee parameters to a created state', () => {
        const advancedLogic = new AdvancedLogic();
        const anyToNearPn = new AnyToNearPaymentNetwork(currencyManager);

        const requestState: typeof requestStateNoExtensions = {
          ...requestStateNoExtensions,
          currency: validCurrency,
        };

        const intermediateExtensionState = advancedLogic.applyActionToExtensions(
          requestState.extensions,
          anyToNearPn.createCreationAction({
            salt,
            paymentAddress: 'pay.near',
            network: 'aurora',
            refundAddress: 'refund.near',
            maxRateTimespan: 1000000,
          }),
          requestState,
          payeeRaw.identity,
          arbitraryTimestamp,
        );

        requestState.extensions = intermediateExtensionState;

        const addFeeAction = anyToNearPn.createAddFeeAction({
          feeAddress: 'fee.near',
          feeAmount: '100',
        });

        const newExtensionState = advancedLogic.applyActionToExtensions(
          intermediateExtensionState,
          addFeeAction,
          requestState,
          payeeRaw.identity,
          arbitraryTimestamp,
        );

        expect(newExtensionState).toEqual(extensionStateAnyToNativeWithFeeAdded);
      });
      it('throws with invalid fee amount', () => {
        const advancedLogic = new AdvancedLogic();
        const anyToNearPn = new AnyToNearPaymentNetwork(currencyManager);

        const requestState: typeof requestStateNoExtensions = {
          ...requestStateNoExtensions,
          currency: validCurrency,
        };

        const intermediateExtensionState = advancedLogic.applyActionToExtensions(
          requestState.extensions,
          anyToNearPn.createCreationAction({
            salt,
            network: 'aurora',
            refundAddress: 'refund.near',
            maxRateTimespan: 1000000,
          }),
          requestState,
          payeeRaw.identity,
          arbitraryTimestamp,
        );

        requestState.extensions = intermediateExtensionState;

        const addFeeAction = {
          action: 'addFee',
          id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_NATIVE_TOKEN,
          parameters: {
            feeAddress: 'fee.near',
            feeAmount: '-200',
          },
        };

        expect(() => {
          advancedLogic.applyActionToExtensions(
            intermediateExtensionState,
            addFeeAction,
            requestState,
            payeeRaw.identity,
            arbitraryTimestamp,
          );
        }).toThrowError(`feeAmount is not a valid amount`);
      });
      it('throws with invalid fee address', () => {
        const advancedLogic = new AdvancedLogic();
        const anyToNearPn = new AnyToNearPaymentNetwork(currencyManager);

        const requestState: typeof requestStateNoExtensions = {
          ...requestStateNoExtensions,
          currency: validCurrency,
        };

        const intermediateExtensionState = advancedLogic.applyActionToExtensions(
          requestState.extensions,
          anyToNearPn.createCreationAction({
            salt,
            network: 'aurora',
            refundAddress: 'refund.near',
            maxRateTimespan: 1000000,
          }),
          requestState,
          payeeRaw.identity,
          arbitraryTimestamp,
        );

        requestState.extensions = intermediateExtensionState;

        const addFeeAction = {
          action: 'addFee',
          id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_NATIVE_TOKEN,
          parameters: {
            feeAddress: 'fee.testnet',
            feeAmount: '100',
          },
        };

        expect(() => {
          advancedLogic.applyActionToExtensions(
            intermediateExtensionState,
            addFeeAction,
            requestState,
            payeeRaw.identity,
            arbitraryTimestamp,
          );
        }).toThrowError(`feeAddress is not a valid address`);
      });
      it('throws when fee parameters already given', () => {
        const advancedLogic = new AdvancedLogic();
        const anyToNearPn = new AnyToNearPaymentNetwork(currencyManager);

        const requestState: typeof requestStateNoExtensions = {
          ...requestStateNoExtensions,
          currency: validCurrency,
        };

        const intermediateExtensionState = advancedLogic.applyActionToExtensions(
          requestState.extensions,
          anyToNearPn.createCreationAction({
            salt,
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

        const addFeeAction = {
          action: 'addFee',
          id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_NATIVE_TOKEN,
          parameters: {
            feeAddress: 'newfee.near',
            feeAmount: '100',
          },
        };

        expect(() => {
          advancedLogic.applyActionToExtensions(
            intermediateExtensionState,
            addFeeAction,
            requestState,
            payeeRaw.identity,
            arbitraryTimestamp,
          );
        }).toThrowError(`Fee address already given`);
      });
      it('throws when addFee action is signed by someone else', () => {
        const advancedLogic = new AdvancedLogic();
        const anyToNearPn = new AnyToNearPaymentNetwork(currencyManager);

        const requestState: typeof requestStateNoExtensions = {
          ...requestStateNoExtensions,
          currency: validCurrency,
        };

        const intermediateExtensionState = advancedLogic.applyActionToExtensions(
          requestState.extensions,
          anyToNearPn.createCreationAction({
            salt,
            network: 'aurora',
            refundAddress: 'refund.near',
            maxRateTimespan: 1000000,
          }),
          requestState,
          payeeRaw.identity,
          arbitraryTimestamp,
        );

        requestState.extensions = intermediateExtensionState;

        const addFeeAction = {
          action: 'addFee',
          id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_NATIVE_TOKEN,
          parameters: {
            feeAddress: 'fee.near',
            feeAmount: '100',
          },
        };

        expect(() => {
          advancedLogic.applyActionToExtensions(
            intermediateExtensionState,
            addFeeAction,
            requestState,
            payerRaw.identity,
            arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payee`);
      });
    });

    it('keeps the version used at creation', () => {
      const advancedLogic = new AdvancedLogic();
      const requestState = {
        ...requestStateNoExtensions,
        currency: validCurrency,
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
