import 'mocha';

import bitcoinAddressBasedManager from '../../../../src/extensions/payment-network/bitcoin/address-based';

import { ExtensionTypes } from '@requestnetwork/types';

import Utils from '@requestnetwork/utils';

import { expect } from 'chai';

import * as DataBTCAddPaymentAddress from '../../../utils/payment-network/bitcoin/generator-data-add-payment-address';
import * as DataBTCCreate from '../../../utils/payment-network/bitcoin/generator-data-create';
import * as TestData from '../../../utils/test-data-generator';

/* tslint:disable:no-unused-expression */
describe('extensions/payment-network/bitcoin/address-based', () => {
  describe('createCreationAction', () => {
    it('can createCreationAction with payment and refund', () => {
      expect(
        bitcoinAddressBasedManager.createCreationAction(
          ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED,
          {
            paymentAddress: DataBTCCreate.paymentBTCAddress,
            refundAddress: DataBTCCreate.refundBTCAddress,
          },
        ),
        'extensionsdata is wrong',
      ).to.deep.equal(DataBTCCreate.actionCreationWithPaymentAndRefund);
    });

    it('can createCreationAction with only paymentAddress', () => {
      // deep copy to remove the undefined properties to comply deep.equal()
      expect(
        Utils.deepCopy(
          bitcoinAddressBasedManager.createCreationAction(
            ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED,
            {
              paymentAddress: DataBTCCreate.paymentBTCAddress,
            },
          ),
        ),
        'extensionsdata is wrong',
      ).to.deep.equal(DataBTCCreate.actionCreationOnlyPayment);
    });
    it('can createCreationAction with only refundAddress', () => {
      // deep copy to remove the undefined properties to comply deep.equal()
      expect(
        Utils.deepCopy(
          bitcoinAddressBasedManager.createCreationAction(
            ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED,
            {
              refundAddress: DataBTCCreate.refundBTCAddress,
            },
          ),
        ),
        'extensionsdata is wrong',
      ).to.deep.equal(DataBTCCreate.actionCreationOnlyRefund);
    });
    it('can createCreationAction with nothing', () => {
      // deep copy to remove the undefined properties to comply deep.equal()
      expect(
        Utils.deepCopy(
          bitcoinAddressBasedManager.createCreationAction(
            ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED,
            {},
          ),
        ),
        'extensionsdata is wrong',
      ).to.deep.equal(DataBTCCreate.actionCreationEmpty);
    });
  });

  describe('createAddPaymentAddressAction', () => {
    it('can createAddPaymentAddressAction', () => {
      expect(
        bitcoinAddressBasedManager.createAddPaymentAddressAction(
          ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED,
          {
            paymentAddress: DataBTCAddPaymentAddress.paymentBTCAddress,
          },
        ),
        'extensionsdata is wrong',
      ).to.deep.equal(DataBTCAddPaymentAddress.actionAddPaymentAddress);
    });
  });

  describe('createAddRefundAddressAction', () => {
    it('can createAddRefundAddressAction', () => {
      expect(
        bitcoinAddressBasedManager.createAddRefundAddressAction(
          ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED,
          {
            refundAddress: DataBTCAddPaymentAddress.refundBTCAddress,
          },
        ),
        'extensionsdata is wrong',
      ).to.deep.equal(DataBTCAddPaymentAddress.actionAddRefundAddress);
    });
  });

  describe('applyActionToExtension', () => {
    describe('applyActionToExtension/unknown action', () => {
      it('cannot applyActionToExtensions of unknown action', () => {
        const unknownAction = Utils.deepCopy(DataBTCAddPaymentAddress.actionAddPaymentAddress);
        unknownAction.action = 'unknown action';
        expect(() => {
          bitcoinAddressBasedManager.applyActionToExtension(
            DataBTCCreate.requestStateCreatedEmpty.extensions,
            unknownAction,
            DataBTCCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw('Unknown action: unknown action');
      });
      it('cannot applyActionToExtensions of unknown id', () => {
        const unknownAction = Utils.deepCopy(DataBTCAddPaymentAddress.actionAddPaymentAddress);
        unknownAction.id = 'unknown id';
        expect(() => {
          bitcoinAddressBasedManager.applyActionToExtension(
            DataBTCCreate.requestStateCreatedEmpty.extensions,
            unknownAction,
            DataBTCCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(
          'This extension is not recognized by the BTC payment network address based',
        );
      });
    });

    describe('applyActionToExtension/create', () => {
      it('can applyActionToExtensions of creation', () => {
        expect(
          bitcoinAddressBasedManager.applyActionToExtension(
            DataBTCCreate.requestStateNoExtensions.extensions,
            DataBTCCreate.actionCreationWithPaymentAndRefund,
            DataBTCCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          ),
          'new extension state wrong',
        ).to.deep.equal(DataBTCCreate.extensionStateWithPaymentAndRefund);
      });

      it('cannot applyActionToExtensions of creation with a previous state', () => {
        expect(() => {
          bitcoinAddressBasedManager.applyActionToExtension(
            DataBTCCreate.requestStateCreatedWithPaymentAndRefund.extensions,
            DataBTCCreate.actionCreationWithPaymentAndRefund,
            DataBTCCreate.requestStateCreatedWithPaymentAndRefund,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw('This extension have already been created');
      });
      it('cannot applyActionToExtensions of creation on a not BTC request', () => {
        expect(() => {
          bitcoinAddressBasedManager.applyActionToExtension(
            TestData.requestCreatedNoExtension.extensions,
            DataBTCCreate.actionCreationWithPaymentAndRefund,
            TestData.requestCreatedNoExtension,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw('This extension can be used only on BTC request');
      });
    });

    describe('applyActionToExtension/addPaymentAddress', () => {
      it('can applyActionToExtensions of addPaymentAddress', () => {
        expect(
          bitcoinAddressBasedManager.applyActionToExtension(
            DataBTCCreate.requestStateCreatedEmpty.extensions,
            DataBTCAddPaymentAddress.actionAddPaymentAddress,
            DataBTCCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          ),
          'new extension state wrong',
        ).to.deep.equal(DataBTCAddPaymentAddress.extensionStateWithPaymentAfterCreation);
      });
      it('cannot applyActionToExtensions of addPaymentAddress without a previous state', () => {
        expect(() => {
          bitcoinAddressBasedManager.applyActionToExtension(
            DataBTCCreate.requestStateNoExtensions.extensions,
            DataBTCAddPaymentAddress.actionAddPaymentAddress,
            DataBTCCreate.requestStateNoExtensions,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(`This extension must have been already created`);
      });
      it('cannot applyActionToExtensions of addPaymentAddress without a payee', () => {
        const previousState = Utils.deepCopy(DataBTCCreate.requestStateCreatedEmpty);
        previousState.payee = undefined;
        expect(() => {
          bitcoinAddressBasedManager.applyActionToExtension(
            previousState.extensions,
            DataBTCAddPaymentAddress.actionAddPaymentAddress,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(`The request must have a payee`);
      });
      it('cannot applyActionToExtensions of addPaymentAddress signed by someone else than the payee', () => {
        const previousState = Utils.deepCopy(DataBTCCreate.requestStateCreatedEmpty);
        expect(() => {
          bitcoinAddressBasedManager.applyActionToExtension(
            previousState.extensions,
            DataBTCAddPaymentAddress.actionAddPaymentAddress,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(`The signer must be the payee`);
      });
      it('cannot applyActionToExtensions of addPaymentAddress with payment address already given', () => {
        expect(() => {
          bitcoinAddressBasedManager.applyActionToExtension(
            DataBTCCreate.requestStateCreatedWithPaymentAndRefund.extensions,
            DataBTCAddPaymentAddress.actionAddPaymentAddress,
            DataBTCCreate.requestStateCreatedWithPaymentAndRefund,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(`Payment address already given`);
      });
    });

    describe('applyActionToExtension/addRefundAddress', () => {
      it('can applyActionToExtensions of addRefundAddress', () => {
        expect(
          bitcoinAddressBasedManager.applyActionToExtension(
            DataBTCCreate.requestStateCreatedEmpty.extensions,
            DataBTCAddPaymentAddress.actionAddRefundAddress,
            DataBTCCreate.requestStateCreatedEmpty,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          ),
          'new extension state wrong',
        ).to.deep.equal(DataBTCAddPaymentAddress.extensionStateWithRefundAfterCreation);
      });
      it('cannot applyActionToExtensions of addRefundAddress without a previous state', () => {
        expect(() => {
          bitcoinAddressBasedManager.applyActionToExtension(
            DataBTCCreate.requestStateNoExtensions.extensions,
            DataBTCAddPaymentAddress.actionAddRefundAddress,
            DataBTCCreate.requestStateNoExtensions,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(`This extension must have been already created`);
      });
      it('cannot applyActionToExtensions of addRefundAddress without a payer', () => {
        const previousState = Utils.deepCopy(DataBTCCreate.requestStateCreatedEmpty);
        previousState.payer = undefined;
        expect(() => {
          bitcoinAddressBasedManager.applyActionToExtension(
            previousState.extensions,
            DataBTCAddPaymentAddress.actionAddRefundAddress,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(`The request must have a payer`);
      });
      it('cannot applyActionToExtensions of addRefundAddress signed by someone else than the payer', () => {
        const previousState = Utils.deepCopy(DataBTCCreate.requestStateCreatedEmpty);
        expect(() => {
          bitcoinAddressBasedManager.applyActionToExtension(
            previousState.extensions,
            DataBTCAddPaymentAddress.actionAddRefundAddress,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(`The signer must be the payer`);
      });
      it('cannot applyActionToExtensions of addRefundAddress with payment address already given', () => {
        expect(() => {
          bitcoinAddressBasedManager.applyActionToExtension(
            DataBTCCreate.requestStateCreatedWithPaymentAndRefund.extensions,
            DataBTCAddPaymentAddress.actionAddRefundAddress,
            DataBTCCreate.requestStateCreatedWithPaymentAndRefund,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(`Refund address already given`);
      });
    });
  });
});
