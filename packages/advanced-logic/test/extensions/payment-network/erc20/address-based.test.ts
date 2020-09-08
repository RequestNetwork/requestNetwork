import mainnetERC20AddressBasedManager from '../../../../src/extensions/payment-network/erc20/address-based';

import Utils from '@requestnetwork/utils';

import * as DataERC20AddPaymentAddress from '../../../utils/payment-network/erc20/address-based-add-payment-address-data-generator';
import * as DataERC20Create from '../../../utils/payment-network/erc20/address-based-create-data-generator';
import * as TestData from '../../../utils/test-data-generator';

/* tslint:disable:no-unused-expression */
describe('extensions/payment-network/erc20/mainnet-address-based', () => {
  describe('createCreationAction', () => {
    it('can createCreationAction with payment and refund', () => {
      // 'extensionsdata is wrong'
      expect(mainnetERC20AddressBasedManager.createCreationAction({
        paymentAddress: DataERC20Create.paymentAddress,
        refundAddress: DataERC20Create.refundAddress,
      })).toEqual(DataERC20Create.actionCreationWithPaymentAndRefund);
    });

    it('can createCreationAction with only paymentAddress', () => {
      // deep copy to remove the undefined properties to comply deep.equal()
      // 'extensionsdata is wrong'
      expect(Utils.deepCopy(
        mainnetERC20AddressBasedManager.createCreationAction({
          paymentAddress: DataERC20Create.paymentAddress,
        }),
      )).toEqual(DataERC20Create.actionCreationOnlyPayment);
    });
    it('can createCreationAction with only refundAddress', () => {
      // deep copy to remove the undefined properties to comply deep.equal()
      // 'extensionsdata is wrong'
      expect(Utils.deepCopy(
        mainnetERC20AddressBasedManager.createCreationAction({
          refundAddress: DataERC20Create.refundAddress,
        }),
      )).toEqual(DataERC20Create.actionCreationOnlyRefund);
    });
    it('can createCreationAction with nothing', () => {
      // deep copy to remove the undefined properties to comply deep.equal()
      // 'extensionsdata is wrong'
      expect(Utils.deepCopy(mainnetERC20AddressBasedManager.createCreationAction({}))).toEqual(DataERC20Create.actionCreationEmpty);
    });

    it(
      'cannot createCreationAction with payment address not an ethereum address',
      () => {
        // 'must throw'
        expect(() => {
          mainnetERC20AddressBasedManager.createCreationAction({
            paymentAddress: DataERC20Create.invalidAddress,
          });
        }).toThrowError('paymentAddress is not a valid ethereum address');
      }
    );
    it(
      'cannot createCreationAction with refund address not an ethereum address',
      () => {
        // 'must throw'
        expect(() => {
          mainnetERC20AddressBasedManager.createCreationAction({
            refundAddress: DataERC20Create.invalidAddress,
          });
        }).toThrowError('refundAddress is not a valid ethereum address');
      }
    );
  });

  describe('createAddPaymentAddressAction', () => {
    it('can createAddPaymentAddressAction', () => {
      // 'extensionsdata is wrong'
      expect(mainnetERC20AddressBasedManager.createAddPaymentAddressAction({
        paymentAddress: DataERC20AddPaymentAddress.paymentAddress,
      })).toEqual(DataERC20AddPaymentAddress.actionAddPaymentAddress);
    });

    it(
      'cannot createAddPaymentAddressAction with payment address not an ethereum address',
      () => {
        // 'must throw'
        expect(() => {
          mainnetERC20AddressBasedManager.createAddPaymentAddressAction({
            paymentAddress: DataERC20Create.invalidAddress,
          });
        }).toThrowError('paymentAddress is not a valid ethereum address');
      }
    );
  });

  describe('createAddRefundAddressAction', () => {
    it('can createAddRefundAddressAction', () => {
      // 'extensionsdata is wrong'
      expect(mainnetERC20AddressBasedManager.createAddRefundAddressAction({
        refundAddress: DataERC20AddPaymentAddress.refundAddress,
      })).toEqual(DataERC20AddPaymentAddress.actionAddRefundAddress);
    });
    it(
      'cannot createAddRefundAddressAction with payment address not an ethereum address',
      () => {
        // 'must throw'
        expect(() => {
          mainnetERC20AddressBasedManager.createAddRefundAddressAction({
            refundAddress: DataERC20Create.invalidAddress,
          });
        }).toThrowError('refundAddress is not a valid ethereum address');
      }
    );
  });

  describe('applyActionToExtension', () => {
    describe('applyActionToExtension/unknown action', () => {
      it('cannot applyActionToExtensions of unknown action', () => {
        const unknownAction = Utils.deepCopy(DataERC20AddPaymentAddress.actionAddPaymentAddress);
        unknownAction.action = 'unknown action';
        // 'must throw'
        expect(() => {
          mainnetERC20AddressBasedManager.applyActionToExtension(
            DataERC20Create.requestStateCreatedEmpty.extensions,
            unknownAction,
            DataERC20Create.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('Unknown action: unknown action');
      });
      it('cannot applyActionToExtensions of unknown id', () => {
        const unknownAction = Utils.deepCopy(DataERC20AddPaymentAddress.actionAddPaymentAddress);
        unknownAction.id = 'unknown id';
        // 'must throw'
        expect(() => {
          mainnetERC20AddressBasedManager.applyActionToExtension(
            DataERC20Create.requestStateCreatedEmpty.extensions,
            unknownAction,
            DataERC20Create.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('The extension should be created before receiving any other action');
      });
    });

    describe('applyActionToExtension/create', () => {
      it('can applyActionToExtensions of creation', () => {
        // 'new extension state wrong'
        expect(mainnetERC20AddressBasedManager.applyActionToExtension(
          DataERC20Create.requestStateNoExtensions.extensions,
          DataERC20Create.actionCreationWithPaymentAndRefund,
          DataERC20Create.requestStateNoExtensions,
          TestData.otherIdRaw.identity,
          TestData.arbitraryTimestamp,
        )).toEqual(DataERC20Create.extensionStateWithPaymentAndRefund);
      });
      it(
        'cannot applyActionToExtensions of creation with a previous state',
        () => {
          // 'must throw'
          expect(() => {
            mainnetERC20AddressBasedManager.applyActionToExtension(
              DataERC20Create.requestStateCreatedWithPaymentAndRefund.extensions,
              DataERC20Create.actionCreationWithPaymentAndRefund,
              DataERC20Create.requestStateCreatedWithPaymentAndRefund,
              TestData.otherIdRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError('This extension has already been created');
        }
      );
      it(
        'cannot applyActionToExtensions of creation on a not ERC20 request',
        () => {
          // 'must throw'
          expect(() => {
            mainnetERC20AddressBasedManager.applyActionToExtension(
              TestData.requestCreatedNoExtension.extensions,
              DataERC20Create.actionCreationWithPaymentAndRefund,
              TestData.requestCreatedNoExtension,
              TestData.otherIdRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError('This extension can be used only on ERC20 request');
        }
      );

      it(
        'cannot applyActionToExtensions of creation with payment address not valid',
        () => {
          const testnetPaymentAddress = Utils.deepCopy(
            DataERC20Create.actionCreationWithPaymentAndRefund,
          );
          testnetPaymentAddress.parameters.paymentAddress = DataERC20AddPaymentAddress.invalidAddress;
          // 'must throw'
          expect(() => {
            mainnetERC20AddressBasedManager.applyActionToExtension(
              DataERC20Create.requestStateNoExtensions.extensions,
              testnetPaymentAddress,
              DataERC20Create.requestStateNoExtensions,
              TestData.otherIdRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError('paymentAddress is not a valid address');
        }
      );

      it(
        'cannot applyActionToExtensions of creation with refund address not valid',
        () => {
          const testnetRefundAddress = Utils.deepCopy(
            DataERC20Create.actionCreationWithPaymentAndRefund,
          );
          testnetRefundAddress.parameters.refundAddress = DataERC20AddPaymentAddress.invalidAddress;
          // 'must throw'
          expect(() => {
            mainnetERC20AddressBasedManager.applyActionToExtension(
              DataERC20Create.requestStateNoExtensions.extensions,
              testnetRefundAddress,
              DataERC20Create.requestStateNoExtensions,
              TestData.otherIdRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError('refundAddress is not a valid address');
        }
      );
    });

    describe('applyActionToExtension/addPaymentAddress', () => {
      it('can applyActionToExtensions of addPaymentAddress', () => {
        // 'new extension state wrong'
        expect(mainnetERC20AddressBasedManager.applyActionToExtension(
          DataERC20Create.requestStateCreatedEmpty.extensions,
          DataERC20AddPaymentAddress.actionAddPaymentAddress,
          DataERC20Create.requestStateCreatedEmpty,
          TestData.payeeRaw.identity,
          TestData.arbitraryTimestamp,
        )).toEqual(DataERC20AddPaymentAddress.extensionStateWithPaymentAfterCreation);
      });
      it(
        'cannot applyActionToExtensions of addPaymentAddress without a previous state',
        () => {
          // 'must throw'
          expect(() => {
            mainnetERC20AddressBasedManager.applyActionToExtension(
              DataERC20Create.requestStateNoExtensions.extensions,
              DataERC20AddPaymentAddress.actionAddPaymentAddress,
              DataERC20Create.requestStateNoExtensions,
              TestData.payeeRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`The extension should be created before receiving any other action`);
        }
      );
      it(
        'cannot applyActionToExtensions of addPaymentAddress without a payee',
        () => {
          const previousState = Utils.deepCopy(DataERC20Create.requestStateCreatedEmpty);
          previousState.payee = undefined;
          // 'must throw'
          expect(() => {
            mainnetERC20AddressBasedManager.applyActionToExtension(
              previousState.extensions,
              DataERC20AddPaymentAddress.actionAddPaymentAddress,
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
          const previousState = Utils.deepCopy(DataERC20Create.requestStateCreatedEmpty);
          // 'must throw'
          expect(() => {
            mainnetERC20AddressBasedManager.applyActionToExtension(
              previousState.extensions,
              DataERC20AddPaymentAddress.actionAddPaymentAddress,
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
            mainnetERC20AddressBasedManager.applyActionToExtension(
              DataERC20Create.requestStateCreatedWithPaymentAndRefund.extensions,
              DataERC20AddPaymentAddress.actionAddPaymentAddress,
              DataERC20Create.requestStateCreatedWithPaymentAndRefund,
              TestData.payeeRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`Payment address already given`);
        }
      );
      it(
        'cannot applyActionToExtensions of addPaymentAddress with payment address not valid',
        () => {
          const testnetPaymentAddress = Utils.deepCopy(
            DataERC20AddPaymentAddress.actionAddPaymentAddress,
          );
          testnetPaymentAddress.parameters.paymentAddress = DataERC20AddPaymentAddress.invalidAddress;
          // 'must throw'
          expect(() => {
            mainnetERC20AddressBasedManager.applyActionToExtension(
              DataERC20Create.requestStateCreatedEmpty.extensions,
              testnetPaymentAddress,
              DataERC20Create.requestStateCreatedEmpty,
              TestData.payeeRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError('paymentAddress is not a valid address');
        }
      );
    });

    describe('applyActionToExtension/addRefundAddress', () => {
      it('can applyActionToExtensions of addRefundAddress', () => {
        // 'new extension state wrong'
        expect(mainnetERC20AddressBasedManager.applyActionToExtension(
          DataERC20Create.requestStateCreatedEmpty.extensions,
          DataERC20AddPaymentAddress.actionAddRefundAddress,
          DataERC20Create.requestStateCreatedEmpty,
          TestData.payerRaw.identity,
          TestData.arbitraryTimestamp,
        )).toEqual(DataERC20AddPaymentAddress.extensionStateWithRefundAfterCreation);
      });
      it(
        'cannot applyActionToExtensions of addRefundAddress without a previous state',
        () => {
          // 'must throw'
          expect(() => {
            mainnetERC20AddressBasedManager.applyActionToExtension(
              DataERC20Create.requestStateNoExtensions.extensions,
              DataERC20AddPaymentAddress.actionAddRefundAddress,
              DataERC20Create.requestStateNoExtensions,
              TestData.payerRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`The extension should be created before receiving any other action`);
        }
      );
      it(
        'cannot applyActionToExtensions of addRefundAddress without a payer',
        () => {
          const previousState = Utils.deepCopy(DataERC20Create.requestStateCreatedEmpty);
          previousState.payer = undefined;
          // 'must throw'
          expect(() => {
            mainnetERC20AddressBasedManager.applyActionToExtension(
              previousState.extensions,
              DataERC20AddPaymentAddress.actionAddRefundAddress,
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
          const previousState = Utils.deepCopy(DataERC20Create.requestStateCreatedEmpty);
          // 'must throw'
          expect(() => {
            mainnetERC20AddressBasedManager.applyActionToExtension(
              previousState.extensions,
              DataERC20AddPaymentAddress.actionAddRefundAddress,
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
            mainnetERC20AddressBasedManager.applyActionToExtension(
              DataERC20Create.requestStateCreatedWithPaymentAndRefund.extensions,
              DataERC20AddPaymentAddress.actionAddRefundAddress,
              DataERC20Create.requestStateCreatedWithPaymentAndRefund,
              TestData.payerRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`Refund address already given`);
        }
      );
      it(
        'cannot applyActionToExtensions of addRefundAddress with refund address not valid',
        () => {
          const testnetPaymentAddress = Utils.deepCopy(
            DataERC20AddPaymentAddress.actionAddRefundAddress,
          );
          testnetPaymentAddress.parameters.refundAddress = DataERC20AddPaymentAddress.invalidAddress;
          // 'must throw'
          expect(() => {
            mainnetERC20AddressBasedManager.applyActionToExtension(
              DataERC20Create.requestStateCreatedEmpty.extensions,
              testnetPaymentAddress,
              DataERC20Create.requestStateCreatedEmpty,
              TestData.payeeRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError('refundAddress is not a valid address');
        }
      );
    });
  });
});
