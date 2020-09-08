import referenceBasedManager from '../../../src/extensions/payment-network/reference-based';

import { ExtensionTypes } from '@requestnetwork/types';

import Utils from '@requestnetwork/utils';

import * as DataAddPaymentAddress from '../../utils/payment-network/reference-based-add-payment-address-data-generator';
import * as DataCreate from '../../utils/payment-network/reference-based-data-generator';
import * as TestData from '../../utils/test-data-generator';

const isValidAddressMock = (valid = true): (() => boolean) => (): boolean => valid;

const PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED = 'do-not-use!-pn-test-reference-based' as ExtensionTypes.ID;

/* tslint:disable:no-unused-expression */
describe('extensions/payment-network/reference-based', () => {
  describe('createCreationAction', () => {
    it('can createCreationAction with payment and refund', () => {
      // 'extensionsdata is wrong'
      expect(referenceBasedManager.createCreationAction(
        PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED,
        {
          paymentAddress: DataCreate.paymentAddress,
          refundAddress: DataCreate.refundAddress,
          salt: DataCreate.salt,
        },
        '0.1.0',
      )).toEqual(DataCreate.actionCreationWithPaymentAndRefund);
    });

    it('can createCreationAction with paymentAddress', () => {
      // deep copy to remove the undefined properties to comply deep.equal()
      // 'extensionsdata is wrong'
      expect(Utils.deepCopy(
        referenceBasedManager.createCreationAction(
          PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED,
          {
            paymentAddress: DataCreate.paymentAddress,
            salt: DataCreate.salt,
          },
          '0.1.0',
        ),
      )).toEqual(DataCreate.actionCreationOnlyPayment);
    });
    it('can createCreationAction with refundAddress', () => {
      // deep copy to remove the undefined properties to comply deep.equal()
      // 'extensionsdata is wrong'
      expect(Utils.deepCopy(
        referenceBasedManager.createCreationAction(
          PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED,
          {
            refundAddress: DataCreate.refundAddress,
            salt: DataCreate.salt,
          },
          '0.1.0',
        ),
      )).toEqual(DataCreate.actionCreationOnlyRefund);
    });
    it('can createCreationAction with only salt', () => {
      // deep copy to remove the undefined properties to comply deep.equal()
      // 'extensionsdata is wrong'
      expect(Utils.deepCopy(
        referenceBasedManager.createCreationAction(
          PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED,
          {
            salt: DataCreate.salt,
          },
          '0.1.0',
        ),
      )).toEqual(DataCreate.actionCreationEmpty);
    });
    it('prevent createCreationAction with no salt', () => {
      // 'must throw'
      expect(() => {
        referenceBasedManager.createCreationAction(
          PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED,
          {} as ExtensionTypes.PnReferenceBased.ICreationParameters,
          '0.1.0',
        );
      }).toThrowError('salt should not be empty');
    });
    it('prevent createCreationAction with invalid salt', () => {
      // 'must throw'
      expect(() => {
        referenceBasedManager.createCreationAction(
          PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED,
          {
            salt: DataCreate.invalidSalt,
          },
          '0.1.0',
        );
      }).toThrowError(
        `The salt must be a string of minimum 16 hexadecimal characters. Example: 'ea3bc7caf64110ca'`
      );
    });
  });

  describe('createAddPaymentAddressAction', () => {
    it('can createAddPaymentAddressAction', () => {
      // 'extensionsdata is wrong'
      expect(referenceBasedManager.createAddPaymentAddressAction(
        PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED,
        {
          paymentAddress: DataAddPaymentAddress.paymentAddress,
        },
      )).toEqual(DataAddPaymentAddress.actionAddPaymentAddress);
    });
  });

  describe('createAddRefundAddressAction', () => {
    it('can createAddRefundAddressAction', () => {
      // 'extensionsdata is wrong'
      expect(referenceBasedManager.createAddRefundAddressAction(
        PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED,
        {
          refundAddress: DataAddPaymentAddress.refundAddress,
        },
      )).toEqual(DataAddPaymentAddress.actionAddRefundAddress);
    });
  });

  describe('applyActionToExtension', () => {
    describe('applyActionToExtension/unknown action', () => {
      it('cannot applyActionToExtensions of unknown action', () => {
        const unknownAction = Utils.deepCopy(DataAddPaymentAddress.actionAddPaymentAddress);
        unknownAction.action = 'unknown action';
        // 'must throw'
        expect(() => {
          referenceBasedManager.applyActionToExtension(
            isValidAddressMock(),
            DataCreate.requestStateCreatedEmpty.extensions,
            unknownAction,
            DataCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('Unknown action: unknown action');
      });
    });

    describe('applyActionToExtension/create', () => {
      it('can applyActionToExtensions of creation', () => {
        // 'new extension state wrong'
        expect(referenceBasedManager.applyActionToExtension(
          isValidAddressMock(),
          DataCreate.requestStateNoExtensions.extensions,
          DataCreate.actionCreationWithPaymentAndRefund,
          DataCreate.requestStateNoExtensions,
          TestData.otherIdRaw.identity,
          TestData.arbitraryTimestamp,
        )).toEqual(DataCreate.extensionStateWithPaymentAndRefund);
      });

      it(
        'cannot applyActionToExtensions of creation with a previous state',
        () => {
          // 'must throw'
          expect(() => {
            referenceBasedManager.applyActionToExtension(
              isValidAddressMock(),
              DataCreate.requestStateCreatedWithPaymentAndRefund.extensions,
              DataCreate.actionCreationWithPaymentAndRefund,
              DataCreate.requestStateCreatedWithPaymentAndRefund,
              TestData.otherIdRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError('This extension has already been created');
        }
      );
    });

    describe('applyActionToExtension/addPaymentAddress', () => {
      it('can applyActionToExtensions of addPaymentAddress', () => {
        // 'new extension state wrong'
        expect(referenceBasedManager.applyActionToExtension(
          isValidAddressMock(),
          DataCreate.requestStateCreatedEmpty.extensions,
          DataAddPaymentAddress.actionAddPaymentAddress,
          DataCreate.requestStateCreatedEmpty,
          TestData.payeeRaw.identity,
          TestData.arbitraryTimestamp,
        )).toEqual(DataAddPaymentAddress.extensionStateWithPaymentAfterCreation);
      });
      it(
        'cannot applyActionToExtensions of addPaymentAddress without a previous state',
        () => {
          // 'must throw'
          expect(() => {
            referenceBasedManager.applyActionToExtension(
              isValidAddressMock(),
              DataCreate.requestStateNoExtensions.extensions,
              DataAddPaymentAddress.actionAddPaymentAddress,
              DataCreate.requestStateNoExtensions,
              TestData.payeeRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`The extension should be created before receiving any other action`);
        }
      );
      it(
        'cannot applyActionToExtensions of addPaymentAddress without a payee',
        () => {
          const previousState = Utils.deepCopy(DataCreate.requestStateCreatedEmpty);
          previousState.payee = undefined;
          // 'must throw'
          expect(() => {
            referenceBasedManager.applyActionToExtension(
              isValidAddressMock(),
              previousState.extensions,
              DataAddPaymentAddress.actionAddPaymentAddress,
              previousState,
              TestData.payeeRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`The request must have a payee`);
        }
      );
      it(
        'cannot applyActionToExtensions of addPaymentAddress signed by someone else than the payee',
        () => {
          const previousState = Utils.deepCopy(DataCreate.requestStateCreatedEmpty);
          // 'must throw'
          expect(() => {
            referenceBasedManager.applyActionToExtension(
              isValidAddressMock(),
              previousState.extensions,
              DataAddPaymentAddress.actionAddPaymentAddress,
              previousState,
              TestData.payerRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`The signer must be the payee`);
        }
      );
      it(
        'cannot applyActionToExtensions of addPaymentAddress with payment address already given',
        () => {
          // 'must throw'
          expect(() => {
            referenceBasedManager.applyActionToExtension(
              isValidAddressMock(),
              DataCreate.requestStateCreatedWithPaymentAndRefund.extensions,
              DataAddPaymentAddress.actionAddPaymentAddress,
              DataCreate.requestStateCreatedWithPaymentAndRefund,
              TestData.payeeRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`Payment address already given`);
        }
      );
    });

    describe('applyActionToExtension/addRefundAddress', () => {
      it('can applyActionToExtensions of addRefundAddress', () => {
        // 'new extension state wrong'
        expect(referenceBasedManager.applyActionToExtension(
          isValidAddressMock(),
          DataCreate.requestStateCreatedEmpty.extensions,
          DataAddPaymentAddress.actionAddRefundAddress,
          DataCreate.requestStateCreatedEmpty,
          TestData.payerRaw.identity,
          TestData.arbitraryTimestamp,
        )).toEqual(DataAddPaymentAddress.extensionStateWithRefundAfterCreation);
      });
      it(
        'cannot applyActionToExtensions of addRefundAddress without a previous state',
        () => {
          // 'must throw'
          expect(() => {
            referenceBasedManager.applyActionToExtension(
              isValidAddressMock(),
              DataCreate.requestStateNoExtensions.extensions,
              DataAddPaymentAddress.actionAddRefundAddress,
              DataCreate.requestStateNoExtensions,
              TestData.payerRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`The extension should be created before receiving any other action`);
        }
      );
      it(
        'cannot applyActionToExtensions of addRefundAddress without a payer',
        () => {
          const previousState = Utils.deepCopy(DataCreate.requestStateCreatedEmpty);
          previousState.payer = undefined;
          // 'must throw'
          expect(() => {
            referenceBasedManager.applyActionToExtension(
              isValidAddressMock(),
              previousState.extensions,
              DataAddPaymentAddress.actionAddRefundAddress,
              previousState,
              TestData.payerRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`The request must have a payer`);
        }
      );
      it(
        'cannot applyActionToExtensions of addRefundAddress signed by someone else than the payer',
        () => {
          const previousState = Utils.deepCopy(DataCreate.requestStateCreatedEmpty);
          // 'must throw'
          expect(() => {
            referenceBasedManager.applyActionToExtension(
              isValidAddressMock(),
              previousState.extensions,
              DataAddPaymentAddress.actionAddRefundAddress,
              previousState,
              TestData.payeeRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`The signer must be the payer`);
        }
      );
      it(
        'cannot applyActionToExtensions of addRefundAddress with payment address already given',
        () => {
          // 'must throw'
          expect(() => {
            referenceBasedManager.applyActionToExtension(
              isValidAddressMock(),
              DataCreate.requestStateCreatedWithPaymentAndRefund.extensions,
              DataAddPaymentAddress.actionAddRefundAddress,
              DataCreate.requestStateCreatedWithPaymentAndRefund,
              TestData.payerRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`Refund address already given`);
        }
      );
    });
  });
});
