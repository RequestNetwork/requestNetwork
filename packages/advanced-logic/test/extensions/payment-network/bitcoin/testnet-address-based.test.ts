import TestnetBitcoinAddressBasedPN from '../../../../src/extensions/payment-network/bitcoin/testnet-address-based';

import Utils from '@requestnetwork/utils';

import * as DataBTCAddPaymentAddress from '../../../utils/payment-network/bitcoin/testnet-generator-data-add-payment-address';
import * as DataBTCCreate from '../../../utils/payment-network/bitcoin/testnet-generator-data-create';
import * as TestData from '../../../utils/test-data-generator';

const testnetBitcoinAddressBasedPN = new TestnetBitcoinAddressBasedPN();

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('extensions/payment-network/bitcoin/testnet-address-based', () => {
  describe('createCreationAction', () => {
    it('can createCreationAction with payment and refund', () => {
      // 'extensionsdata is wrong'
      expect(
        testnetBitcoinAddressBasedPN.createCreationAction({
          paymentAddress: DataBTCCreate.paymentTestnetBTCAddress,
          refundAddress: DataBTCCreate.refundTestnetBTCAddress,
        }),
      ).toEqual(DataBTCCreate.actionCreationWithPaymentAndRefund);
    });

    it('can createCreationAction with only paymentAddress', () => {
      // deep copy to remove the undefined properties to comply deep.equal()
      // 'extensionsdata is wrong'
      expect(
        Utils.deepCopy(
          testnetBitcoinAddressBasedPN.createCreationAction({
            paymentAddress: DataBTCCreate.paymentTestnetBTCAddress,
          }),
        ),
      ).toEqual(DataBTCCreate.actionCreationOnlyPayment);
    });
    it('can createCreationAction with only refundAddress', () => {
      // deep copy to remove the undefined properties to comply deep.equal()
      // 'extensionsdata is wrong'
      expect(
        Utils.deepCopy(
          testnetBitcoinAddressBasedPN.createCreationAction({
            refundAddress: DataBTCCreate.refundTestnetBTCAddress,
          }),
        ),
      ).toEqual(DataBTCCreate.actionCreationOnlyRefund);
    });
    it('can createCreationAction with nothing', () => {
      // deep copy to remove the undefined properties to comply deep.equal()
      // 'extensionsdata is wrong'
      expect(Utils.deepCopy(testnetBitcoinAddressBasedPN.createCreationAction({}))).toEqual(
        DataBTCCreate.actionCreationEmpty,
      );
    });

    it('cannot createCreationAction with payment address not a testnet address', () => {
      // 'must throw'
      expect(() => {
        testnetBitcoinAddressBasedPN.createCreationAction({
          paymentAddress: DataBTCCreate.paymentBTCAddress,
        });
      }).toThrowError('paymentAddress is not a valid address');
    });
    it('cannot createCreationAction with refund address not a testnet address', () => {
      // 'must throw'
      expect(() => {
        testnetBitcoinAddressBasedPN.createCreationAction({
          refundAddress: DataBTCCreate.refundBTCAddress,
        });
      }).toThrowError('refundAddress is not a valid address');
    });
  });

  describe('createAddPaymentAddressAction', () => {
    it('can createAddPaymentAddressAction', () => {
      // 'extensionsdata is wrong'
      expect(
        testnetBitcoinAddressBasedPN.createAddPaymentAddressAction({
          paymentAddress: DataBTCAddPaymentAddress.paymentTestnetBTCAddress,
        }),
      ).toEqual(DataBTCAddPaymentAddress.actionAddPaymentAddress);
    });

    it('cannot createAddPaymentAddressAction with payment address not a mainnet address', () => {
      // 'must throw'
      expect(() => {
        testnetBitcoinAddressBasedPN.createAddPaymentAddressAction({
          paymentAddress: DataBTCCreate.paymentBTCAddress,
        });
      }).toThrowError('paymentAddress is not a valid address');
    });
  });

  describe('createAddRefundAddressAction', () => {
    it('can createAddRefundAddressAction', () => {
      // 'extensionsdata is wrong'
      expect(
        testnetBitcoinAddressBasedPN.createAddRefundAddressAction({
          refundAddress: DataBTCAddPaymentAddress.refundTestnetBTCAddress,
        }),
      ).toEqual(DataBTCAddPaymentAddress.actionAddRefundAddress);
    });
    it('cannot createAddRefundAddressAction with payment address not a mainnet address', () => {
      // 'must throw'
      expect(() => {
        testnetBitcoinAddressBasedPN.createAddRefundAddressAction({
          refundAddress: DataBTCCreate.refundBTCAddress,
        });
      }).toThrowError('refundAddress is not a valid address');
    });
  });

  describe('applyActionToExtension', () => {
    describe('applyActionToExtension/unknown action', () => {
      it('cannot applyActionToExtensions of unknown action', () => {
        const unknownAction = Utils.deepCopy(DataBTCAddPaymentAddress.actionAddPaymentAddress);
        unknownAction.action = 'unknown action' as any;
        // 'must throw'
        expect(() => {
          testnetBitcoinAddressBasedPN.applyActionToExtension(
            DataBTCCreate.requestStateCreatedEmpty.extensions,
            unknownAction,
            DataBTCCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('Unknown action: unknown action');
      });
    });

    describe('applyActionToExtension/create', () => {
      it('can applyActionToExtensions of creation', () => {
        // 'new extension state wrong'
        expect(
          testnetBitcoinAddressBasedPN.applyActionToExtension(
            DataBTCCreate.requestStateNoExtensions.extensions,
            DataBTCCreate.actionCreationWithPaymentAndRefund,
            DataBTCCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DataBTCCreate.extensionStateWithPaymentAndRefund);
      });
      it('cannot applyActionToExtensions of creation with a previous state', () => {
        // 'must throw'
        expect(() => {
          testnetBitcoinAddressBasedPN.applyActionToExtension(
            DataBTCCreate.requestStateCreatedWithPaymentAndRefund.extensions,
            DataBTCCreate.actionCreationWithPaymentAndRefund,
            DataBTCCreate.requestStateCreatedWithPaymentAndRefund,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('This extension has already been created');
      });
      it('cannot applyActionToExtensions of creation on a not BTC request', () => {
        // 'must throw'
        expect(() => {
          testnetBitcoinAddressBasedPN.applyActionToExtension(
            TestData.requestCreatedNoExtension.extensions,
            DataBTCCreate.actionCreationWithPaymentAndRefund,
            TestData.requestCreatedNoExtension,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('This extension can be used only on BTC request');
      });

      it('cannot applyActionToExtensions of creation with payment address not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(
          DataBTCCreate.actionCreationWithPaymentAndRefund,
        );
        testnetPaymentAddress.parameters.paymentAddress =
          DataBTCAddPaymentAddress.paymentBTCAddress;
        // 'must throw'
        expect(() => {
          testnetBitcoinAddressBasedPN.applyActionToExtension(
            DataBTCCreate.requestStateNoExtensions.extensions,
            testnetPaymentAddress,
            DataBTCCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('paymentAddress is not a valid address');
      });

      it('cannot applyActionToExtensions of creation with refund address not valid', () => {
        const testnetRefundAddress = Utils.deepCopy(
          DataBTCCreate.actionCreationWithPaymentAndRefund,
        );
        testnetRefundAddress.parameters.refundAddress = DataBTCAddPaymentAddress.refundBTCAddress;
        // 'must throw'
        expect(() => {
          testnetBitcoinAddressBasedPN.applyActionToExtension(
            DataBTCCreate.requestStateNoExtensions.extensions,
            testnetRefundAddress,
            DataBTCCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('refundAddress is not a valid address');
      });
    });

    describe('applyActionToExtension/addPaymentAddress', () => {
      it('can applyActionToExtensions of addPaymentAddress', () => {
        // 'new extension state wrong'
        expect(
          testnetBitcoinAddressBasedPN.applyActionToExtension(
            DataBTCCreate.requestStateCreatedEmpty.extensions,
            DataBTCAddPaymentAddress.actionAddPaymentAddress,
            DataBTCCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DataBTCAddPaymentAddress.extensionStateWithPaymentAfterCreation);
      });
      it('cannot applyActionToExtensions of addPaymentAddress without a previous state', () => {
        // 'must throw'
        expect(() => {
          testnetBitcoinAddressBasedPN.applyActionToExtension(
            DataBTCCreate.requestStateNoExtensions.extensions,
            DataBTCAddPaymentAddress.actionAddPaymentAddress,
            DataBTCCreate.requestStateNoExtensions,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });
      it('cannot applyActionToExtensions of addPaymentAddress without a payee', () => {
        const previousState = Utils.deepCopy(DataBTCCreate.requestStateCreatedEmpty);
        previousState.payee = undefined;
        // 'must throw'
        expect(() => {
          testnetBitcoinAddressBasedPN.applyActionToExtension(
            previousState.extensions,
            DataBTCAddPaymentAddress.actionAddPaymentAddress,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payee`);
      });
      it('cannot applyActionToExtensions of addPaymentAddress signed by someone else than the payee', () => {
        const previousState = Utils.deepCopy(DataBTCCreate.requestStateCreatedEmpty);
        // 'must throw'
        expect(() => {
          testnetBitcoinAddressBasedPN.applyActionToExtension(
            previousState.extensions,
            DataBTCAddPaymentAddress.actionAddPaymentAddress,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payee`);
      });
      it('cannot applyActionToExtensions of addPaymentAddress with payment address already given', () => {
        // 'must throw'
        expect(() => {
          testnetBitcoinAddressBasedPN.applyActionToExtension(
            DataBTCCreate.requestStateCreatedWithPaymentAndRefund.extensions,
            DataBTCAddPaymentAddress.actionAddPaymentAddress,
            DataBTCCreate.requestStateCreatedWithPaymentAndRefund,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`Payment address already given`);
      });
      it('cannot applyActionToExtensions of addPaymentAddress with payment address not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(
          DataBTCAddPaymentAddress.actionAddPaymentAddress,
        );
        testnetPaymentAddress.parameters.paymentAddress =
          DataBTCAddPaymentAddress.paymentBTCAddress;
        // 'must throw'
        expect(() => {
          testnetBitcoinAddressBasedPN.applyActionToExtension(
            DataBTCCreate.requestStateCreatedEmpty.extensions,
            testnetPaymentAddress,
            DataBTCCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('paymentAddress is not a valid address');
      });
    });

    describe('applyActionToExtension/addRefundAddress', () => {
      it('can applyActionToExtensions of addRefundAddress', () => {
        // 'new extension state wrong'
        expect(
          testnetBitcoinAddressBasedPN.applyActionToExtension(
            DataBTCCreate.requestStateCreatedEmpty.extensions,
            DataBTCAddPaymentAddress.actionAddRefundAddress,
            DataBTCCreate.requestStateCreatedEmpty,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DataBTCAddPaymentAddress.extensionStateWithRefundAfterCreation);
      });
      it('cannot applyActionToExtensions of addRefundAddress without a previous state', () => {
        // 'must throw'
        expect(() => {
          testnetBitcoinAddressBasedPN.applyActionToExtension(
            DataBTCCreate.requestStateNoExtensions.extensions,
            DataBTCAddPaymentAddress.actionAddRefundAddress,
            DataBTCCreate.requestStateNoExtensions,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });
      it('cannot applyActionToExtensions of addRefundAddress without a payer', () => {
        const previousState = Utils.deepCopy(DataBTCCreate.requestStateCreatedEmpty);
        previousState.payer = undefined;
        // 'must throw'
        expect(() => {
          testnetBitcoinAddressBasedPN.applyActionToExtension(
            previousState.extensions,
            DataBTCAddPaymentAddress.actionAddRefundAddress,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payer`);
      });
      it('cannot applyActionToExtensions of addRefundAddress signed by someone else than the payer', () => {
        const previousState = Utils.deepCopy(DataBTCCreate.requestStateCreatedEmpty);
        // 'must throw'
        expect(() => {
          testnetBitcoinAddressBasedPN.applyActionToExtension(
            previousState.extensions,
            DataBTCAddPaymentAddress.actionAddRefundAddress,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payer`);
      });
      it('cannot applyActionToExtensions of addRefundAddress with payment address already given', () => {
        // 'must throw'
        expect(() => {
          testnetBitcoinAddressBasedPN.applyActionToExtension(
            DataBTCCreate.requestStateCreatedWithPaymentAndRefund.extensions,
            DataBTCAddPaymentAddress.actionAddRefundAddress,
            DataBTCCreate.requestStateCreatedWithPaymentAndRefund,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`Refund address already given`);
      });
      it('cannot applyActionToExtensions of addRefundAddress with refund address not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(
          DataBTCAddPaymentAddress.actionAddRefundAddress,
        );
        testnetPaymentAddress.parameters.refundAddress = DataBTCAddPaymentAddress.refundBTCAddress;
        // 'must throw'
        expect(() => {
          testnetBitcoinAddressBasedPN.applyActionToExtension(
            DataBTCCreate.requestStateCreatedEmpty.extensions,
            testnetPaymentAddress,
            DataBTCCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('refundAddress is not a valid address');
      });
    });
  });
});
