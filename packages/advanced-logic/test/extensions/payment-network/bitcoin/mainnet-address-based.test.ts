import 'mocha';

import mainnetBitcoinAddressBasedManager from '../../../../src/extensions/payment-network/bitcoin/mainnet-address-based';

import Utils from '@requestnetwork/utils';

import { expect } from 'chai';

import * as DataBTCAddPaymentAddress from '../../../utils/payment-network/bitcoin/generator-data-add-payment-address';
import * as DataBTCCreate from '../../../utils/payment-network/bitcoin/generator-data-create';
import * as TestData from '../../../utils/test-data-generator';

/* tslint:disable:no-unused-expression */
describe('extensions/payment-network/bitcoin/mainnet-address-based', () => {
  describe('createCreationAction', () => {
    it('can createCreationAction with payment and refund', () => {
      expect(
        mainnetBitcoinAddressBasedManager.createCreationAction({
          paymentAddress: DataBTCCreate.paymentBTCAddress,
          refundAddress: DataBTCCreate.refundBTCAddress,
        }),
        'extensionsdata is wrong',
      ).to.deep.equal(DataBTCCreate.actionCreationWithPaymentAndRefund);
    });

    it('can createCreationAction with only paymentAddress', () => {
      // deep copy to remove the undefined properties to comply deep.equal()
      expect(
        Utils.deepCopy(
          mainnetBitcoinAddressBasedManager.createCreationAction({
            paymentAddress: DataBTCCreate.paymentBTCAddress,
          }),
        ),
        'extensionsdata is wrong',
      ).to.deep.equal(DataBTCCreate.actionCreationOnlyPayment);
    });
    it('can createCreationAction with only refundAddress', () => {
      // deep copy to remove the undefined properties to comply deep.equal()
      expect(
        Utils.deepCopy(
          mainnetBitcoinAddressBasedManager.createCreationAction({
            refundAddress: DataBTCCreate.refundBTCAddress,
          }),
        ),
        'extensionsdata is wrong',
      ).to.deep.equal(DataBTCCreate.actionCreationOnlyRefund);
    });
    it('can createCreationAction with nothing', () => {
      // deep copy to remove the undefined properties to comply deep.equal()
      expect(
        Utils.deepCopy(mainnetBitcoinAddressBasedManager.createCreationAction({})),
        'extensionsdata is wrong',
      ).to.deep.equal(DataBTCCreate.actionCreationEmpty);
    });

    it('cannot createCreationAction with payment address not a mainnet bitcoin address', () => {
      expect(() => {
        mainnetBitcoinAddressBasedManager.createCreationAction({
          paymentAddress: DataBTCCreate.paymentTestnetBTCAddress,
        });
      }, 'must throw').to.throw('paymentAddress is not a valid bitcoin address');
    });
    it('cannot createCreationAction with refund address not a mainnet bitcoin address', () => {
      expect(() => {
        mainnetBitcoinAddressBasedManager.createCreationAction({
          refundAddress: DataBTCCreate.refundTestnetBTCAddress,
        });
      }, 'must throw').to.throw('refundAddress is not a valid bitcoin address');
    });
  });

  describe('createAddPaymentAddressAction', () => {
    it('can createAddPaymentAddressAction', () => {
      expect(
        mainnetBitcoinAddressBasedManager.createAddPaymentAddressAction({
          paymentAddress: DataBTCAddPaymentAddress.paymentBTCAddress,
        }),
        'extensionsdata is wrong',
      ).to.deep.equal(DataBTCAddPaymentAddress.actionAddPaymentAddress);
    });

    it('cannot createAddPaymentAddressAction with payment address not a mainnet bitcoin address', () => {
      expect(() => {
        mainnetBitcoinAddressBasedManager.createAddPaymentAddressAction({
          paymentAddress: DataBTCCreate.paymentTestnetBTCAddress,
        });
      }, 'must throw').to.throw('paymentAddress is not a valid bitcoin address');
    });
  });

  describe('createAddRefundAddressAction', () => {
    it('can createAddRefundAddressAction', () => {
      expect(
        mainnetBitcoinAddressBasedManager.createAddRefundAddressAction({
          refundAddress: DataBTCAddPaymentAddress.refundBTCAddress,
        }),
        'extensionsdata is wrong',
      ).to.deep.equal(DataBTCAddPaymentAddress.actionAddRefundAddress);
    });
    it('cannot createAddRefundAddressAction with payment address not a mainnet bitcoin address', () => {
      expect(() => {
        mainnetBitcoinAddressBasedManager.createAddRefundAddressAction({
          refundAddress: DataBTCCreate.refundTestnetBTCAddress,
        });
      }, 'must throw').to.throw('refundAddress is not a valid bitcoin address');
    });
  });

  describe('applyActionToExtension', () => {
    describe('applyActionToExtension/unknown action', () => {
      it('cannot applyActionToExtensions of unknown action', () => {
        const unknownAction = Utils.deepCopy(DataBTCAddPaymentAddress.actionAddPaymentAddress);
        unknownAction.action = 'unknown action';
        expect(() => {
          mainnetBitcoinAddressBasedManager.applyActionToExtension(
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
          mainnetBitcoinAddressBasedManager.applyActionToExtension(
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
          mainnetBitcoinAddressBasedManager.applyActionToExtension(
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
          mainnetBitcoinAddressBasedManager.applyActionToExtension(
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
          mainnetBitcoinAddressBasedManager.applyActionToExtension(
            TestData.requestCreatedNoExtension.extensions,
            DataBTCCreate.actionCreationWithPaymentAndRefund,
            TestData.requestCreatedNoExtension,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw('This extension can be used only on BTC request');
      });

      it('cannot applyActionToExtensions of creation with payment address not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(
          DataBTCCreate.actionCreationWithPaymentAndRefund,
        );
        testnetPaymentAddress.parameters.paymentAddress =
          DataBTCAddPaymentAddress.paymentTestnetBTCAddress;
        expect(() => {
          mainnetBitcoinAddressBasedManager.applyActionToExtension(
            DataBTCCreate.requestStateNoExtensions.extensions,
            testnetPaymentAddress,
            DataBTCCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw('paymentAddress is not a valid bitcoin address');
      });

      it('cannot applyActionToExtensions of creation with refund address not valid', () => {
        const testnetRefundAddress = Utils.deepCopy(
          DataBTCCreate.actionCreationWithPaymentAndRefund,
        );
        testnetRefundAddress.parameters.refundAddress =
          DataBTCAddPaymentAddress.refundTestnetBTCAddress;
        expect(() => {
          mainnetBitcoinAddressBasedManager.applyActionToExtension(
            DataBTCCreate.requestStateNoExtensions.extensions,
            testnetRefundAddress,
            DataBTCCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw('refundAddress is not a valid bitcoin address');
      });
    });

    describe('applyActionToExtension/addPaymentAddress', () => {
      it('can applyActionToExtensions of addPaymentAddress', () => {
        expect(
          mainnetBitcoinAddressBasedManager.applyActionToExtension(
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
          mainnetBitcoinAddressBasedManager.applyActionToExtension(
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
          mainnetBitcoinAddressBasedManager.applyActionToExtension(
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
          mainnetBitcoinAddressBasedManager.applyActionToExtension(
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
          mainnetBitcoinAddressBasedManager.applyActionToExtension(
            DataBTCCreate.requestStateCreatedWithPaymentAndRefund.extensions,
            DataBTCAddPaymentAddress.actionAddPaymentAddress,
            DataBTCCreate.requestStateCreatedWithPaymentAndRefund,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(`Payment address already given`);
      });
      it('cannot applyActionToExtensions of addPaymentAddress with payment address not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(
          DataBTCAddPaymentAddress.actionAddPaymentAddress,
        );
        testnetPaymentAddress.parameters.paymentAddress =
          DataBTCAddPaymentAddress.paymentTestnetBTCAddress;
        expect(() => {
          mainnetBitcoinAddressBasedManager.applyActionToExtension(
            DataBTCCreate.requestStateCreatedEmpty.extensions,
            testnetPaymentAddress,
            DataBTCCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw('paymentAddress is not a valid bitcoin address');
      });
    });

    describe('applyActionToExtension/addRefundAddress', () => {
      it('can applyActionToExtensions of addRefundAddress', () => {
        expect(
          mainnetBitcoinAddressBasedManager.applyActionToExtension(
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
          mainnetBitcoinAddressBasedManager.applyActionToExtension(
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
          mainnetBitcoinAddressBasedManager.applyActionToExtension(
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
          mainnetBitcoinAddressBasedManager.applyActionToExtension(
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
          mainnetBitcoinAddressBasedManager.applyActionToExtension(
            DataBTCCreate.requestStateCreatedWithPaymentAndRefund.extensions,
            DataBTCAddPaymentAddress.actionAddRefundAddress,
            DataBTCCreate.requestStateCreatedWithPaymentAndRefund,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(`Refund address already given`);
      });
      it('cannot applyActionToExtensions of addRefundAddress with refund address not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(
          DataBTCAddPaymentAddress.actionAddRefundAddress,
        );
        testnetPaymentAddress.parameters.refundAddress =
          DataBTCAddPaymentAddress.paymentTestnetBTCAddress;
        expect(() => {
          mainnetBitcoinAddressBasedManager.applyActionToExtension(
            DataBTCCreate.requestStateCreatedEmpty.extensions,
            testnetPaymentAddress,
            DataBTCCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw('refundAddress is not a valid bitcoin address');
      });
    });
  });
});
