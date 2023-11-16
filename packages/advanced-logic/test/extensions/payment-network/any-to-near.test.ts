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
import { CurrencyTypes, ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import AnyToNearPaymentNetwork from '../../../src/extensions/payment-network/near/any-to-near';
import AnyToNativeTokenPaymentNetwork from '../../../src/extensions/payment-network/any-to-native';
import { CurrencyManager } from '@requestnetwork/currency';
import { deepCopy } from '@requestnetwork/utils';
import AnyToNearTestnetPaymentNetwork from '../../../src/extensions/payment-network/near/any-to-near-testnet';

const salt = arbitrarySalt;
const currencyManager = CurrencyManager.getDefault();

describe('extensions/payment-network/any-to-native-token', () => {
  const validCurrency = {
    type: RequestLogicTypes.CURRENCY.ISO4217,
    value: 'USD',
  };
  const wrongCurrency = {
    type: RequestLogicTypes.CURRENCY.ISO4217,
    value: 'EUR',
  };
  const anyToNativeTokenTestCases = [
    {
      name: 'Near',
      paymentNetwork: new AnyToNearPaymentNetwork(
        currencyManager,
      ) as AnyToNativeTokenPaymentNetwork,
      suffix: 'near',
      wrongSuffix: 'testnet',
      network: 'aurora',
      wrongNetwork: 'aurora-testnet',
      maxRateTimespan: 100000,
      feeAmount: '100',
    },
    {
      name: 'Near testnet',
      paymentNetwork: new AnyToNearTestnetPaymentNetwork(
        currencyManager,
      ) as AnyToNativeTokenPaymentNetwork,
      suffix: 'testnet',
      wrongSuffix: 'near',
      network: 'aurora-testnet',
      wrongNetwork: 'aurora',
      maxRateTimespan: 100000,
      feeAmount: '100',
    },
  ] as const;

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
          ).toBeDefined();
        });
        it('works with minimum parameters', () => {
          expect(
            testCase.paymentNetwork.createCreationAction({
              salt,
              network: testCase.network,
            }),
          ).toBeTruthy();
        });
        it('throws when payment address is invalid', () => {
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
        it('throws when payment address is on the wrong network', () => {
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
        it('throws when refund address is invalid', () => {
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
        it('throws when refund address is on the wrong network', () => {
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
        it('throws when fee address is invalid', () => {
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
        it('throws when fee address is on the wrong network', () => {
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
        it('throws when fee amount is invalid', () => {
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
        it('throws when maxRateTimespan is invalid', () => {
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
        describe('edge cases', () => {
          const partialCreationParams: ExtensionTypes.PnAnyToAnyConversion.ICreationParameters = {
            salt,
            refundAddress: 'refund.near',
            feeAddress: 'fee.near',
            feeAmount: '100',
            maxRateTimespan: 1000000,
          };
          it('throws when payment network is not supported', () => {
            expect(() => {
              new AnyToNearPaymentNetwork(currencyManager).createCreationAction({
                ...partialCreationParams,
                network: 'another-chain' as CurrencyTypes.NearChainName,
              });
            }).toThrowError(
              `Payment network 'another-chain' is not supported by this extension (only aurora)`,
            );
          });
          it('throws when payment network is missing', () => {
            expect(() => {
              new AnyToNearPaymentNetwork(currencyManager).createCreationAction(
                partialCreationParams,
              );
            }).toThrowError(`network is required`);
          });
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
        it('throws when payment address is invalid', () => {
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
        it('throws when payment address is invalid', () => {
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
            id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN,
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

  describe('AdvancedLogic.applyActionToExtension', () => {
    const mainnetTestCase = anyToNativeTokenTestCases[0];
    let advancedLogic: AdvancedLogic;
    let validRequestState: typeof requestStateNoExtensions;
    let creationAction: ExtensionTypes.IAction;
    let anyToNearPn: AnyToNearPaymentNetwork;
    beforeEach(() => {
      advancedLogic = new AdvancedLogic(CurrencyManager.getDefault());
      anyToNearPn = new AnyToNearPaymentNetwork(currencyManager);
      validRequestState = {
        ...requestStateNoExtensions,
        currency: validCurrency,
      };
      creationAction = deepCopy(actionCreationWithAnyToNativeTokenPayment);
    });
    describe('applyActionToExtension/create action', () => {
      it('works with valid parameters', () => {
        const newExtensionState = advancedLogic.applyActionToExtensions(
          validRequestState.extensions,
          creationAction,
          validRequestState,
          payeeRaw.identity,
          arbitraryTimestamp,
        );

        expect(newExtensionState).toEqual(extensionStateWithAnyToNativeTokenPaymentAndRefund);
      });
      it('throws when currency is not supported', () => {
        const invalidRequestState: typeof requestStateNoExtensions = {
          ...requestStateNoExtensions,
          currency: wrongCurrency,
        };
        expect(() =>
          advancedLogic.applyActionToExtensions(
            invalidRequestState.extensions,
            creationAction,
            invalidRequestState,
            payeeRaw.identity,
            arbitraryTimestamp,
          ),
        ).toThrowError(
          `The currency (${wrongCurrency.value}) of the request is not supported for this payment network`,
        );
      });
      it('throws when network is undefined', () => {
        creationAction.parameters.network = undefined;
        expect(() =>
          advancedLogic.applyActionToExtensions(
            validRequestState.extensions,
            creationAction,
            validRequestState,
            payeeRaw.identity,
            arbitraryTimestamp,
          ),
        ).toThrowError(
          'extension with id: pn-any-to-native-token not found for network: undefined',
        );
      });
      it('throws when the network is wrong', () => {
        const wrongNetwork = `wrong network`;
        creationAction.parameters.network = wrongNetwork;

        expect(() =>
          advancedLogic.applyActionToExtensions(
            validRequestState.extensions,
            creationAction,
            validRequestState,
            payeeRaw.identity,
            arbitraryTimestamp,
          ),
        ).toThrowError(
          'extension with id: pn-any-to-native-token not found for network: wrong network',
        );
      });
      it('throws when payment address is not valid', () => {
        const invalidAddress = 'pay.testnet';
        creationAction.parameters.paymentAddress = invalidAddress;

        expect(() =>
          advancedLogic.applyActionToExtensions(
            validRequestState.extensions,
            creationAction,
            validRequestState,
            payeeRaw.identity,
            arbitraryTimestamp,
          ),
        ).toThrowError(`paymentAddress ${invalidAddress} is not a valid address`);
      });
      it('throws when refund address is not valid', () => {
        const invalidAddress = 'refund.testnet';
        creationAction.parameters.refundAddress = invalidAddress;

        expect(() =>
          advancedLogic.applyActionToExtensions(
            validRequestState.extensions,
            creationAction,
            validRequestState,
            payeeRaw.identity,
            arbitraryTimestamp,
          ),
        ).toThrowError(`refundAddress ${invalidAddress} is not a valid address`);
      });
      it('throws when fee address is not valid', () => {
        const invalidAddress = 'fee.testnet';
        creationAction.parameters.feeAddress = invalidAddress;

        expect(() =>
          advancedLogic.applyActionToExtensions(
            validRequestState.extensions,
            creationAction,
            validRequestState,
            payeeRaw.identity,
            arbitraryTimestamp,
          ),
        ).toThrowError(`feeAddress ${invalidAddress} is not a valid address`);
      });
      it('throws when fee amount is not valid', () => {
        const invalidFeeAmount = '-100';
        creationAction.parameters.feeAmount = invalidFeeAmount;

        expect(() =>
          advancedLogic.applyActionToExtensions(
            validRequestState.extensions,
            creationAction,
            validRequestState,
            payeeRaw.identity,
            arbitraryTimestamp,
          ),
        ).toThrowError(`feeAmount is not a valid amount`);
      });
      it('throws when version is missing', () => {
        expect(() => {
          advancedLogic.applyActionToExtensions(
            {},
            { ...actionCreationWithAnyToNativeTokenPayment, version: '' },
            validRequestState,
            payeeRaw.identity,
            arbitraryTimestamp,
          );
        }).toThrowError('version is required at creation');
      });
    });
    describe('applyActionToExtension/addPaymentAddress action', () => {
      it('works when adding a payment address to a created state', () => {
        const intermediateExtensionState = advancedLogic.applyActionToExtensions(
          validRequestState.extensions,
          anyToNearPn.createCreationAction({
            salt,
            network: 'aurora',
            refundAddress: 'refund.near',
            feeAddress: 'fee.near',
            feeAmount: '100',
            maxRateTimespan: 1000000,
          }),
          validRequestState,
          payeeRaw.identity,
          arbitraryTimestamp,
        );

        validRequestState.extensions = intermediateExtensionState;

        const addPaymentAddressAction = anyToNearPn.createAddPaymentAddressAction({
          paymentAddress: 'pay.near',
        });

        const newExtensionState = advancedLogic.applyActionToExtensions(
          intermediateExtensionState,
          addPaymentAddressAction,
          validRequestState,
          payeeRaw.identity,
          arbitraryTimestamp,
        );

        expect(newExtensionState).toEqual(extensionStateAnyToNativeWithPaymentAddressAdded);
      });
      it('throws when payment address is invalid', () => {
        const invalidAddress = 'pay.testnet';

        const intermediateExtensionState = advancedLogic.applyActionToExtensions(
          validRequestState.extensions,
          anyToNearPn.createCreationAction({
            salt,
            network: 'aurora',
            refundAddress: 'refund.near',
            feeAddress: 'fee.near',
            feeAmount: '100',
            maxRateTimespan: 1000000,
          }),
          validRequestState,
          payeeRaw.identity,
          arbitraryTimestamp,
        );

        validRequestState.extensions = intermediateExtensionState;

        expect(() => {
          anyToNearPn.createAddPaymentAddressAction({
            paymentAddress: invalidAddress,
          });
        }).toThrowError(`paymentAddress '${invalidAddress}' is not a valid address`);
      });
    });
    describe('applyActionToExtension/addFeeAddress action', () => {
      it('works when adding a fee parameters to a created state', () => {
        const intermediateExtensionState = advancedLogic.applyActionToExtensions(
          validRequestState.extensions,
          anyToNearPn.createCreationAction({
            salt,
            paymentAddress: 'pay.near',
            network: 'aurora',
            refundAddress: 'refund.near',
            maxRateTimespan: 1000000,
          }),
          validRequestState,
          payeeRaw.identity,
          arbitraryTimestamp,
        );

        validRequestState.extensions = intermediateExtensionState;

        const addFeeAction = anyToNearPn.createAddFeeAction({
          feeAddress: 'fee.near',
          feeAmount: '100',
        });

        const newExtensionState = advancedLogic.applyActionToExtensions(
          intermediateExtensionState,
          addFeeAction,
          validRequestState,
          payeeRaw.identity,
          arbitraryTimestamp,
        );

        expect(newExtensionState).toEqual(extensionStateAnyToNativeWithFeeAdded);
      });
      it('throws when fee amount is invalid', () => {
        const intermediateExtensionState = advancedLogic.applyActionToExtensions(
          validRequestState.extensions,
          anyToNearPn.createCreationAction({
            salt,
            network: 'aurora',
            refundAddress: 'refund.near',
            maxRateTimespan: 1000000,
          }),
          validRequestState,
          payeeRaw.identity,
          arbitraryTimestamp,
        );

        validRequestState.extensions = intermediateExtensionState;

        const addFeeAction = {
          action: 'addFee',
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN,
          parameters: {
            feeAddress: 'fee.near',
            feeAmount: '-200',
          },
        };

        expect(() => {
          advancedLogic.applyActionToExtensions(
            intermediateExtensionState,
            addFeeAction,
            validRequestState,
            payeeRaw.identity,
            arbitraryTimestamp,
          );
        }).toThrowError(`feeAmount is not a valid amount`);
      });
      it('throws when fee address is invalid', () => {
        const intermediateExtensionState = advancedLogic.applyActionToExtensions(
          validRequestState.extensions,
          anyToNearPn.createCreationAction({
            salt,
            network: 'aurora',
            refundAddress: 'refund.near',
            maxRateTimespan: 1000000,
          }),
          validRequestState,
          payeeRaw.identity,
          arbitraryTimestamp,
        );

        validRequestState.extensions = intermediateExtensionState;

        const addFeeAction = {
          action: 'addFee',
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN,
          parameters: {
            feeAddress: 'fee.testnet',
            feeAmount: '100',
          },
        };

        expect(() => {
          advancedLogic.applyActionToExtensions(
            intermediateExtensionState,
            addFeeAction,
            validRequestState,
            payeeRaw.identity,
            arbitraryTimestamp,
          );
        }).toThrowError(`feeAddress is not a valid address`);
      });
      it('throws when fee parameters is already given', () => {
        const intermediateExtensionState = advancedLogic.applyActionToExtensions(
          validRequestState.extensions,
          anyToNearPn.createCreationAction({
            salt,
            network: 'aurora',
            refundAddress: 'refund.near',
            feeAddress: 'fee.near',
            feeAmount: '100',
            maxRateTimespan: 1000000,
          }),
          validRequestState,
          payeeRaw.identity,
          arbitraryTimestamp,
        );

        validRequestState.extensions = intermediateExtensionState;

        const addFeeAction = {
          action: 'addFee',
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN,
          parameters: {
            feeAddress: 'newfee.near',
            feeAmount: '100',
          },
        };

        expect(() => {
          advancedLogic.applyActionToExtensions(
            intermediateExtensionState,
            addFeeAction,
            validRequestState,
            payeeRaw.identity,
            arbitraryTimestamp,
          );
        }).toThrowError(`Fee address already given`);
      });
      it('throws when addFee action is signed by someone else', () => {
        const intermediateExtensionState = advancedLogic.applyActionToExtensions(
          validRequestState.extensions,
          anyToNearPn.createCreationAction({
            salt,
            network: 'aurora',
            refundAddress: 'refund.near',
            maxRateTimespan: 1000000,
          }),
          validRequestState,
          payeeRaw.identity,
          arbitraryTimestamp,
        );

        validRequestState.extensions = intermediateExtensionState;

        const addFeeAction = {
          action: 'addFee',
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN,
          parameters: {
            feeAddress: 'fee.near',
            feeAmount: '100',
          },
        };

        expect(() => {
          advancedLogic.applyActionToExtensions(
            intermediateExtensionState,
            addFeeAction,
            validRequestState,
            payerRaw.identity,
            arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payee`);
      });
    });

    it('keeps the version used at creation', () => {
      const newState = advancedLogic.applyActionToExtensions(
        validRequestState.extensions,
        { ...actionCreationWithAnyToNativeTokenPayment, version: 'ABCD' },
        validRequestState,
        payeeRaw.identity,
        arbitraryTimestamp,
      );
      expect(newState[mainnetTestCase.paymentNetwork.extensionId].version).toBe('ABCD');
    });
  });
});
