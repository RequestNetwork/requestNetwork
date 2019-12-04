import 'mocha';

import referenceBasedManager from '../../../src/extensions/payment-network/reference-based';

import { ExtensionTypes } from '@requestnetwork/types';

import Utils from '@requestnetwork/utils';

import { expect } from 'chai';

import * as DataAddPaymentAddress from '../../utils/payment-network/reference-based-add-payment-address-data-generator';
import * as DataCreate from '../../utils/payment-network/reference-based-data-generator';
import * as TestData from '../../utils/test-data-generator';

const isValidAddressMock = (valid = true): (() => boolean) => (): boolean => valid;

const PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED = 'do-not-use!-pn-test-reference-based' as ExtensionTypes.ID;

/* tslint:disable:no-unused-expression */
describe('extensions/payment-network/reference-based', () => {
  describe('createCreationAction', () => {
    it('can createCreationAction with payment and refund', () => {
      expect(
        referenceBasedManager.createCreationAction(PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED, {
          paymentAddress: DataCreate.paymentAddress,
          refundAddress: DataCreate.refundAddress,
          salt: DataCreate.salt,
        }),
        'extensionsdata is wrong',
      ).to.deep.equal(DataCreate.actionCreationWithPaymentAndRefund);
    });

    it('can createCreationAction with paymentAddress', () => {
      // deep copy to remove the undefined properties to comply deep.equal()
      expect(
        Utils.deepCopy(
          referenceBasedManager.createCreationAction(PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED, {
            paymentAddress: DataCreate.paymentAddress,
            salt: DataCreate.salt,
          }),
        ),
        'extensionsdata is wrong',
      ).to.deep.equal(DataCreate.actionCreationOnlyPayment);
    });
    it('can createCreationAction with refundAddress', () => {
      // deep copy to remove the undefined properties to comply deep.equal()
      expect(
        Utils.deepCopy(
          referenceBasedManager.createCreationAction(PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED, {
            refundAddress: DataCreate.refundAddress,
            salt: DataCreate.salt,
          }),
        ),
        'extensionsdata is wrong',
      ).to.deep.equal(DataCreate.actionCreationOnlyRefund);
    });
    it('can createCreationAction with only salt', () => {
      // deep copy to remove the undefined properties to comply deep.equal()
      expect(
        Utils.deepCopy(
          referenceBasedManager.createCreationAction(PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED, {
            salt: DataCreate.salt,
          }),
        ),
        'extensionsdata is wrong',
      ).to.deep.equal(DataCreate.actionCreationEmpty);
    });
    it('prevent createCreationAction with no salt', () => {
      expect(() => {
        referenceBasedManager.createCreationAction(
          PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED,
          {} as ExtensionTypes.PnReferenceBased.ICreationParameters,
        );
      }, 'must throw').to.throw('salt should not be empty');
    });
    it('prevent createCreationAction with invalid salt', () => {
      expect(() => {
        referenceBasedManager.createCreationAction(PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED, {
          salt: DataCreate.invalidSalt,
        });
      }, 'must throw').to.throw(
        `The salt must be a string of minimum 16 hexadecimal characters. Example: 'ea3bc7caf64110ca'`,
      );
    });
  });

  describe('createAddPaymentAddressAction', () => {
    it('can createAddPaymentAddressAction', () => {
      expect(
        referenceBasedManager.createAddPaymentAddressAction(
          PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED,
          {
            paymentAddress: DataAddPaymentAddress.paymentAddress,
          },
        ),
        'extensionsdata is wrong',
      ).to.deep.equal(DataAddPaymentAddress.actionAddPaymentAddress);
    });
  });

  describe('createAddRefundAddressAction', () => {
    it('can createAddRefundAddressAction', () => {
      expect(
        referenceBasedManager.createAddRefundAddressAction(
          PAYMENT_NETWORK_TEST_GENERIC_REFERENCE_BASED,
          {
            refundAddress: DataAddPaymentAddress.refundAddress,
          },
        ),
        'extensionsdata is wrong',
      ).to.deep.equal(DataAddPaymentAddress.actionAddRefundAddress);
    });
  });

  describe('applyActionToExtension', () => {
    describe('applyActionToExtension/unknown action', () => {
      it('cannot applyActionToExtensions of unknown action', () => {
        const unknownAction = Utils.deepCopy(DataAddPaymentAddress.actionAddPaymentAddress);
        unknownAction.action = 'unknown action';
        expect(() => {
          referenceBasedManager.applyActionToExtension(
            isValidAddressMock(),
            DataCreate.requestStateCreatedEmpty.extensions,
            unknownAction,
            DataCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw('Unknown action: unknown action');
      });
    });

    describe('applyActionToExtension/create', () => {
      it('can applyActionToExtensions of creation', () => {
        expect(
          referenceBasedManager.applyActionToExtension(
            isValidAddressMock(),
            DataCreate.requestStateNoExtensions.extensions,
            DataCreate.actionCreationWithPaymentAndRefund,
            DataCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          ),
          'new extension state wrong',
        ).to.deep.equal(DataCreate.extensionStateWithPaymentAndRefund);
      });

      it('cannot applyActionToExtensions of creation with a previous state', () => {
        expect(() => {
          referenceBasedManager.applyActionToExtension(
            isValidAddressMock(),
            DataCreate.requestStateCreatedWithPaymentAndRefund.extensions,
            DataCreate.actionCreationWithPaymentAndRefund,
            DataCreate.requestStateCreatedWithPaymentAndRefund,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw('This extension has already been created');
      });
    });

    describe('applyActionToExtension/addPaymentAddress', () => {
      it('can applyActionToExtensions of addPaymentAddress', () => {
        expect(
          referenceBasedManager.applyActionToExtension(
            isValidAddressMock(),
            DataCreate.requestStateCreatedEmpty.extensions,
            DataAddPaymentAddress.actionAddPaymentAddress,
            DataCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          ),
          'new extension state wrong',
        ).to.deep.equal(DataAddPaymentAddress.extensionStateWithPaymentAfterCreation);
      });
      it('cannot applyActionToExtensions of addPaymentAddress without a previous state', () => {
        expect(() => {
          referenceBasedManager.applyActionToExtension(
            isValidAddressMock(),
            DataCreate.requestStateNoExtensions.extensions,
            DataAddPaymentAddress.actionAddPaymentAddress,
            DataCreate.requestStateNoExtensions,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(
          `The extension should be created before receiving any other action`,
        );
      });
      it('cannot applyActionToExtensions of addPaymentAddress without a payee', () => {
        const previousState = Utils.deepCopy(DataCreate.requestStateCreatedEmpty);
        previousState.payee = undefined;
        expect(() => {
          referenceBasedManager.applyActionToExtension(
            isValidAddressMock(),
            previousState.extensions,
            DataAddPaymentAddress.actionAddPaymentAddress,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(`The request must have a payee`);
      });
      it('cannot applyActionToExtensions of addPaymentAddress signed by someone else than the payee', () => {
        const previousState = Utils.deepCopy(DataCreate.requestStateCreatedEmpty);
        expect(() => {
          referenceBasedManager.applyActionToExtension(
            isValidAddressMock(),
            previousState.extensions,
            DataAddPaymentAddress.actionAddPaymentAddress,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(`The signer must be the payee`);
      });
      it('cannot applyActionToExtensions of addPaymentAddress with payment address already given', () => {
        expect(() => {
          referenceBasedManager.applyActionToExtension(
            isValidAddressMock(),
            DataCreate.requestStateCreatedWithPaymentAndRefund.extensions,
            DataAddPaymentAddress.actionAddPaymentAddress,
            DataCreate.requestStateCreatedWithPaymentAndRefund,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(`Payment address already given`);
      });
    });

    describe('applyActionToExtension/addRefundAddress', () => {
      it('can applyActionToExtensions of addRefundAddress', () => {
        expect(
          referenceBasedManager.applyActionToExtension(
            isValidAddressMock(),
            DataCreate.requestStateCreatedEmpty.extensions,
            DataAddPaymentAddress.actionAddRefundAddress,
            DataCreate.requestStateCreatedEmpty,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          ),
          'new extension state wrong',
        ).to.deep.equal(DataAddPaymentAddress.extensionStateWithRefundAfterCreation);
      });
      it('cannot applyActionToExtensions of addRefundAddress without a previous state', () => {
        expect(() => {
          referenceBasedManager.applyActionToExtension(
            isValidAddressMock(),
            DataCreate.requestStateNoExtensions.extensions,
            DataAddPaymentAddress.actionAddRefundAddress,
            DataCreate.requestStateNoExtensions,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(
          `The extension should be created before receiving any other action`,
        );
      });
      it('cannot applyActionToExtensions of addRefundAddress without a payer', () => {
        const previousState = Utils.deepCopy(DataCreate.requestStateCreatedEmpty);
        previousState.payer = undefined;
        expect(() => {
          referenceBasedManager.applyActionToExtension(
            isValidAddressMock(),
            previousState.extensions,
            DataAddPaymentAddress.actionAddRefundAddress,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(`The request must have a payer`);
      });
      it('cannot applyActionToExtensions of addRefundAddress signed by someone else than the payer', () => {
        const previousState = Utils.deepCopy(DataCreate.requestStateCreatedEmpty);
        expect(() => {
          referenceBasedManager.applyActionToExtension(
            isValidAddressMock(),
            previousState.extensions,
            DataAddPaymentAddress.actionAddRefundAddress,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(`The signer must be the payer`);
      });
      it('cannot applyActionToExtensions of addRefundAddress with payment address already given', () => {
        expect(() => {
          referenceBasedManager.applyActionToExtension(
            isValidAddressMock(),
            DataCreate.requestStateCreatedWithPaymentAndRefund.extensions,
            DataAddPaymentAddress.actionAddRefundAddress,
            DataCreate.requestStateCreatedWithPaymentAndRefund,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(`Refund address already given`);
      });
    });
  });
});
