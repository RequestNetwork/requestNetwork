import PnAnyDeclarative from '../../../src/extensions/payment-network/declarative';

import Utils from '@requestnetwork/utils';

import * as TestDataDeclarative from '../../utils/payment-network/any/generator-data-create';
import * as TestData from '../../utils/test-data-generator';

/* tslint:disable:no-unused-expression */
describe('extensions/payment-network/any/declarative', () => {
  describe('createCreationAction', () => {
    it('can createCreationAction with payment and refund instruction', () => {
      // 'extensionsdata is wrong'
      expect(PnAnyDeclarative.createCreationAction({
        paymentInfo: TestDataDeclarative.paymentInfo,
        refundInfo: TestDataDeclarative.refundInfo,
      })).toEqual(TestDataDeclarative.actionCreationWithPaymentAndRefund);
    });

    it('can createCreationAction with only payment instruction', () => {
      // deep copy to remove the undefined properties to comply deep.equal()
      // 'extensionsdata is wrong'
      expect(Utils.deepCopy(
        PnAnyDeclarative.createCreationAction({
          paymentInfo: TestDataDeclarative.paymentInfo,
        }),
      )).toEqual(TestDataDeclarative.actionCreationOnlyPayment);
    });
    it('can createCreationAction with only refund instruction', () => {
      // deep copy to remove the undefined properties to comply deep.equal()
      // 'extensionsdata is wrong'
      expect(Utils.deepCopy(
        PnAnyDeclarative.createCreationAction({
          refundInfo: TestDataDeclarative.refundInfo,
        }),
      )).toEqual(TestDataDeclarative.actionCreationOnlyRefund);
    });
    it('can createCreationAction with nothing', () => {
      // deep copy to remove the undefined properties to comply deep.equal()
      // 'extensionsdata is wrong'
      expect(Utils.deepCopy(PnAnyDeclarative.createCreationAction())).toEqual(TestDataDeclarative.actionCreationEmpty);
    });
  });

  describe('createAddPaymentInstructionAction', () => {
    it('can createAddPaymentInstructionAction', () => {
      // 'extensionsdata is wrong'
      expect(PnAnyDeclarative.createAddPaymentInstructionAction({
        paymentInfo: TestDataDeclarative.paymentInfo,
      })).toEqual(TestDataDeclarative.actionPaymentInstruction);
    });
  });

  describe('createAddRefundInstructionAction', () => {
    it('can createAddRefundInstructionAction', () => {
      // 'extensionsdata is wrong'
      expect(PnAnyDeclarative.createAddRefundInstructionAction({
        refundInfo: TestDataDeclarative.refundInfo,
      })).toEqual(TestDataDeclarative.actionRefundInstruction);
    });
  });

  describe('createDeclareSentPaymentAction', () => {
    it('can createDeclareSentPaymentAction', () => {
      // 'extensionsdata is wrong'
      expect(PnAnyDeclarative.createDeclareSentPaymentAction({
        amount: TestDataDeclarative.amount,
        note: TestDataDeclarative.note,
      })).toEqual(TestDataDeclarative.actionDeclareSentPayment);
    });
  });

  describe('createDeclareSentRefundAction', () => {
    it('can createDeclareSentRefundAction', () => {
      // 'extensionsdata is wrong'
      expect(PnAnyDeclarative.createDeclareSentRefundAction({
        amount: TestDataDeclarative.amount,
        note: TestDataDeclarative.note,
      })).toEqual(TestDataDeclarative.actionDeclareSentRefund);
    });
  });

  describe('createDeclareReceivedPaymentAction', () => {
    it('can createDeclareReceivedPaymentAction', () => {
      // 'extensionsdata is wrong'
      expect(PnAnyDeclarative.createDeclareReceivedPaymentAction({
        amount: TestDataDeclarative.amount,
        note: TestDataDeclarative.note,
      })).toEqual(TestDataDeclarative.actionDeclareReceivedPayment);
    });
  });

  describe('createDeclareReceivedRefundAction', () => {
    it('can createDeclareReceivedRefundAction', () => {
      // 'extensionsdata is wrong'
      expect(PnAnyDeclarative.createDeclareReceivedRefundAction({
        amount: TestDataDeclarative.amount,
        note: TestDataDeclarative.note,
      })).toEqual(TestDataDeclarative.actionDeclareReceivedRefund);
    });
  });

  describe('applyActionToExtension', () => {
    describe('applyActionToExtension/unknown action', () => {
      it('cannot applyActionToExtensions of unknown action', () => {
        const unknownAction = Utils.deepCopy(TestDataDeclarative.actionCreationEmpty);
        unknownAction.action = 'unknown action';
        // 'must throw'
        expect(() => {
          PnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateCreatedEmpty.extensions,
            unknownAction,
            TestDataDeclarative.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('Unknown action: unknown action');
      });
    });

    describe('applyActionToExtension/create', () => {
      it('can applyActionToExtensions of creation', () => {
        // 'new extension state wrong'
        expect(PnAnyDeclarative.applyActionToExtension(
          TestDataDeclarative.requestStateNoExtensions.extensions,
          TestDataDeclarative.actionCreationWithPaymentAndRefund,
          TestDataDeclarative.requestStateNoExtensions,
          TestData.otherIdRaw.identity,
          TestData.arbitraryTimestamp,
        )).toEqual(TestDataDeclarative.extensionStateWithPaymentAndRefund);
      });
      it(
        'cannot applyActionToExtensions of creation with a previous state',
        () => {
          // 'must throw'
          expect(() => {
            PnAnyDeclarative.applyActionToExtension(
              TestDataDeclarative.requestStateCreatedWithPaymentAndRefund.extensions,
              TestDataDeclarative.actionCreationWithPaymentAndRefund,
              TestDataDeclarative.requestStateCreatedWithPaymentAndRefund,
              TestData.otherIdRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError('This extension has already been created');
        }
      );
    });

    describe('applyActionToExtension/addPaymentInstruction', () => {
      it('can applyActionToExtensions of addPaymentInstruction', () => {
        // 'new extension state wrong'
        expect(PnAnyDeclarative.applyActionToExtension(
          TestDataDeclarative.requestStateCreatedEmpty.extensions,
          TestDataDeclarative.actionPaymentInstruction,
          TestDataDeclarative.requestStateCreatedEmpty,
          TestData.payeeRaw.identity,
          TestData.arbitraryTimestamp,
        )).toEqual(TestDataDeclarative.extensionStateCreatedEmptyPaymentInstructionAdded);
      });
      it(
        'cannot applyActionToExtensions of addPaymentInstruction without a previous state',
        () => {
          // 'must throw'
          expect(() => {
            PnAnyDeclarative.applyActionToExtension(
              TestDataDeclarative.requestStateNoExtensions.extensions,
              TestDataDeclarative.actionPaymentInstruction,
              TestDataDeclarative.requestStateNoExtensions,
              TestData.payeeRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`This extension must have been already created`);
        }
      );
      it(
        'cannot applyActionToExtensions of addPaymentInstruction without a payee',
        () => {
          const previousState = Utils.deepCopy(TestDataDeclarative.requestStateCreatedEmpty);
          previousState.payee = undefined;
          // 'must throw'
          expect(() => {
            PnAnyDeclarative.applyActionToExtension(
              previousState.extensions,
              TestDataDeclarative.actionPaymentInstruction,
              previousState,
              TestData.payeeRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`The request must have a payee`);
        }
      );
      it(
        'cannot applyActionToExtensions of addPaymentInstruction signed by someone else than the payee',
        () => {
          const previousState = Utils.deepCopy(TestDataDeclarative.requestStateCreatedEmpty);
          // 'must throw'
          expect(() => {
            PnAnyDeclarative.applyActionToExtension(
              previousState.extensions,
              TestDataDeclarative.actionPaymentInstruction,
              previousState,
              TestData.payerRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`The signer must be the payee`);
        }
      );
      it(
        'cannot applyActionToExtensions of addPaymentInstruction with payment instruction already given',
        () => {
          // 'must throw'
          expect(() => {
            PnAnyDeclarative.applyActionToExtension(
              TestDataDeclarative.requestStateCreatedWithPaymentAndRefund.extensions,
              TestDataDeclarative.actionPaymentInstruction,
              TestDataDeclarative.requestStateCreatedWithPaymentAndRefund,
              TestData.payeeRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`The payment instruction already given`);
        }
      );
    });

    describe('applyActionToExtension/addRefundInstruction', () => {
      it('can applyActionToExtensions of addRefundInstruction', () => {
        // 'new extension state wrong'
        expect(PnAnyDeclarative.applyActionToExtension(
          TestDataDeclarative.requestStateCreatedEmpty.extensions,
          TestDataDeclarative.actionRefundInstruction,
          TestDataDeclarative.requestStateCreatedEmpty,
          TestData.payerRaw.identity,
          TestData.arbitraryTimestamp,
        )).toEqual(TestDataDeclarative.extensionStateCreatedEmptyRefundInstructionAdded);
      });
      it(
        'cannot applyActionToExtensions of addRefundInstruction without a previous state',
        () => {
          // 'must throw'
          expect(() => {
            PnAnyDeclarative.applyActionToExtension(
              TestDataDeclarative.requestStateNoExtensions.extensions,
              TestDataDeclarative.actionRefundInstruction,
              TestDataDeclarative.requestStateNoExtensions,
              TestData.payerRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`This extension must have been already created`);
        }
      );
      it(
        'cannot applyActionToExtensions of addRefundInstruction without a payer',
        () => {
          const previousState = Utils.deepCopy(TestDataDeclarative.requestStateCreatedEmpty);
          previousState.payer = undefined;
          // 'must throw'
          expect(() => {
            PnAnyDeclarative.applyActionToExtension(
              previousState.extensions,
              TestDataDeclarative.actionRefundInstruction,
              previousState,
              TestData.payerRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`The request must have a payer`);
        }
      );
      it(
        'cannot applyActionToExtensions of addRefundInstruction signed by someone else than the payer',
        () => {
          const previousState = Utils.deepCopy(TestDataDeclarative.requestStateCreatedEmpty);
          // 'must throw'
          expect(() => {
            PnAnyDeclarative.applyActionToExtension(
              previousState.extensions,
              TestDataDeclarative.actionRefundInstruction,
              previousState,
              TestData.payeeRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`The signer must be the payer`);
        }
      );
      it(
        'cannot applyActionToExtensions of addRefundInstruction with payment instruction already given',
        () => {
          // 'must throw'
          expect(() => {
            PnAnyDeclarative.applyActionToExtension(
              TestDataDeclarative.requestStateCreatedWithPaymentAndRefund.extensions,
              TestDataDeclarative.actionRefundInstruction,
              TestDataDeclarative.requestStateCreatedWithPaymentAndRefund,
              TestData.payerRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`The refund instruction already given`);
        }
      );
    });

    describe('applyActionToExtension/declareSentPayment', () => {
      it('can applyActionToExtensions of declareSentPayment', () => {
        // 'new extension state wrong'
        expect(PnAnyDeclarative.applyActionToExtension(
          TestDataDeclarative.requestStateCreatedEmpty.extensions,
          TestDataDeclarative.actionDeclareSentPayment,
          TestDataDeclarative.requestStateCreatedEmpty,
          TestData.payerRaw.identity,
          TestData.arbitraryTimestamp,
        )).toEqual(TestDataDeclarative.extensionStateCreatedEmptySentPayment);
      });
      it(
        'cannot applyActionToExtensions of declareSentPayment without a previous state',
        () => {
          // 'must throw'
          expect(() => {
            PnAnyDeclarative.applyActionToExtension(
              TestDataDeclarative.requestStateNoExtensions.extensions,
              TestDataDeclarative.actionDeclareSentPayment,
              TestDataDeclarative.requestStateNoExtensions,
              TestData.payerRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`This extension must have been already created`);
        }
      );
      it(
        'cannot applyActionToExtensions of declareSentPayment without a payer',
        () => {
          const previousState = Utils.deepCopy(TestDataDeclarative.requestStateCreatedEmpty);
          previousState.payer = undefined;
          // 'must throw'
          expect(() => {
            PnAnyDeclarative.applyActionToExtension(
              previousState.extensions,
              TestDataDeclarative.actionDeclareSentPayment,
              previousState,
              TestData.payerRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`The request must have a payer`);
        }
      );
      it(
        'cannot applyActionToExtensions of declareSentPayment signed by someone else than the payer',
        () => {
          const previousState = Utils.deepCopy(TestDataDeclarative.requestStateCreatedEmpty);
          // 'must throw'
          expect(() => {
            PnAnyDeclarative.applyActionToExtension(
              previousState.extensions,
              TestDataDeclarative.actionDeclareSentPayment,
              previousState,
              TestData.payeeRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`The signer must be the payer`);
        }
      );
      it(
        'cannot applyActionToExtensions of declareSentPayment with an invalid amount',
        () => {
          TestDataDeclarative.actionDeclareSentPayment.parameters.amount = 'invalid amount';

          // 'must throw'
          expect(() => {
            PnAnyDeclarative.applyActionToExtension(
              TestDataDeclarative.requestStateCreatedEmpty.extensions,
              TestDataDeclarative.actionDeclareSentPayment,
              TestDataDeclarative.requestStateCreatedEmpty,
              TestData.payerRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`The amount is not a valid amount`);
        }
      );
    });

    describe('applyActionToExtension/declareReceivedRefund', () => {
      it('can applyActionToExtensions of declareReceivedRefund', () => {
        // 'new extension state wrong'
        expect(PnAnyDeclarative.applyActionToExtension(
          TestDataDeclarative.requestStateCreatedEmpty.extensions,
          TestDataDeclarative.actionDeclareReceivedRefund,
          TestDataDeclarative.requestStateCreatedEmpty,
          TestData.payerRaw.identity,
          TestData.arbitraryTimestamp,
        )).toEqual(TestDataDeclarative.extensionStateCreatedEmptyReceivedRefund);
      });
      it(
        'cannot applyActionToExtensions of declareReceivedRefund without a previous state',
        () => {
          // 'must throw'
          expect(() => {
            PnAnyDeclarative.applyActionToExtension(
              TestDataDeclarative.requestStateNoExtensions.extensions,
              TestDataDeclarative.actionDeclareReceivedRefund,
              TestDataDeclarative.requestStateNoExtensions,
              TestData.payerRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`This extension must have been already created`);
        }
      );
      it(
        'cannot applyActionToExtensions of declareReceivedRefund without a payer',
        () => {
          const previousState = Utils.deepCopy(TestDataDeclarative.requestStateCreatedEmpty);
          previousState.payer = undefined;
          // 'must throw'
          expect(() => {
            PnAnyDeclarative.applyActionToExtension(
              previousState.extensions,
              TestDataDeclarative.actionDeclareReceivedRefund,
              previousState,
              TestData.payerRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`The request must have a payer`);
        }
      );
      it(
        'cannot applyActionToExtensions of declareReceivedRefund signed by someone else than the payer',
        () => {
          const previousState = Utils.deepCopy(TestDataDeclarative.requestStateCreatedEmpty);
          // 'must throw'
          expect(() => {
            PnAnyDeclarative.applyActionToExtension(
              previousState.extensions,
              TestDataDeclarative.actionDeclareReceivedRefund,
              previousState,
              TestData.payeeRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`The signer must be the payer`);
        }
      );
      it(
        'cannot applyActionToExtensions of declareReceivedRefund with an invalid amount',
        () => {
          TestDataDeclarative.actionDeclareReceivedRefund.parameters.amount = 'invalid amount';

          // 'must throw'
          expect(() => {
            PnAnyDeclarative.applyActionToExtension(
              TestDataDeclarative.requestStateCreatedEmpty.extensions,
              TestDataDeclarative.actionDeclareReceivedRefund,
              TestDataDeclarative.requestStateCreatedEmpty,
              TestData.payerRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`The amount is not a valid amount`);
        }
      );
    });

    describe('applyActionToExtension/declareSentRefund', () => {
      it('can applyActionToExtensions of declareSentRefund', () => {
        // 'new extension state wrong'
        expect(PnAnyDeclarative.applyActionToExtension(
          TestDataDeclarative.requestStateCreatedEmpty.extensions,
          TestDataDeclarative.actionDeclareSentRefund,
          TestDataDeclarative.requestStateCreatedEmpty,
          TestData.payeeRaw.identity,
          TestData.arbitraryTimestamp,
        )).toEqual(TestDataDeclarative.extensionStateCreatedEmptySentRefund);
      });
      it(
        'cannot applyActionToExtensions of declareSentRefund without a previous state',
        () => {
          // 'must throw'
          expect(() => {
            PnAnyDeclarative.applyActionToExtension(
              TestDataDeclarative.requestStateNoExtensions.extensions,
              TestDataDeclarative.actionDeclareSentRefund,
              TestDataDeclarative.requestStateNoExtensions,
              TestData.payeeRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`This extension must have been already created`);
        }
      );
      it(
        'cannot applyActionToExtensions of declareSentRefund without a payee',
        () => {
          const previousState = Utils.deepCopy(TestDataDeclarative.requestStateCreatedEmpty);
          previousState.payee = undefined;
          // 'must throw'
          expect(() => {
            PnAnyDeclarative.applyActionToExtension(
              previousState.extensions,
              TestDataDeclarative.actionDeclareSentRefund,
              previousState,
              TestData.payeeRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`The request must have a payee`);
        }
      );
      it(
        'cannot applyActionToExtensions of declareSentRefund signed by someone else than the payee',
        () => {
          const previousState = Utils.deepCopy(TestDataDeclarative.requestStateCreatedEmpty);
          // 'must throw'
          expect(() => {
            PnAnyDeclarative.applyActionToExtension(
              previousState.extensions,
              TestDataDeclarative.actionDeclareSentRefund,
              previousState,
              TestData.payerRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`The signer must be the payee`);
        }
      );
      it(
        'cannot applyActionToExtensions of declareSentRefund with an invalid amount',
        () => {
          TestDataDeclarative.actionDeclareSentRefund.parameters.amount = 'invalid amount';

          // 'must throw'
          expect(() => {
            PnAnyDeclarative.applyActionToExtension(
              TestDataDeclarative.requestStateCreatedEmpty.extensions,
              TestDataDeclarative.actionDeclareSentRefund,
              TestDataDeclarative.requestStateCreatedEmpty,
              TestData.payeeRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`The amount is not a valid amount`);
        }
      );
    });

    describe('applyActionToExtension/declareReceivedPayment', () => {
      it('can applyActionToExtensions of declareReceivedPayment', () => {
        // 'new extension state wrong'
        expect(PnAnyDeclarative.applyActionToExtension(
          TestDataDeclarative.requestStateCreatedEmpty.extensions,
          TestDataDeclarative.actionDeclareReceivedPayment,
          TestDataDeclarative.requestStateCreatedEmpty,
          TestData.payeeRaw.identity,
          TestData.arbitraryTimestamp,
        )).toEqual(TestDataDeclarative.extensionStateCreatedEmptyReceivedPayment);
      });
      it(
        'cannot applyActionToExtensions of declareReceivedPayment without a previous state',
        () => {
          // 'must throw'
          expect(() => {
            PnAnyDeclarative.applyActionToExtension(
              TestDataDeclarative.requestStateNoExtensions.extensions,
              TestDataDeclarative.actionDeclareReceivedPayment,
              TestDataDeclarative.requestStateNoExtensions,
              TestData.payeeRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`This extension must have been already created`);
        }
      );
      it(
        'cannot applyActionToExtensions of declareReceivedPayment without a payee',
        () => {
          const previousState = Utils.deepCopy(TestDataDeclarative.requestStateCreatedEmpty);
          previousState.payee = undefined;
          // 'must throw'
          expect(() => {
            PnAnyDeclarative.applyActionToExtension(
              previousState.extensions,
              TestDataDeclarative.actionDeclareReceivedPayment,
              previousState,
              TestData.payeeRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`The request must have a payee`);
        }
      );
      it(
        'cannot applyActionToExtensions of declareReceivedPayment signed by someone else than the payee',
        () => {
          const previousState = Utils.deepCopy(TestDataDeclarative.requestStateCreatedEmpty);
          // 'must throw'
          expect(() => {
            PnAnyDeclarative.applyActionToExtension(
              previousState.extensions,
              TestDataDeclarative.actionDeclareReceivedPayment,
              previousState,
              TestData.payerRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`The signer must be the payee`);
        }
      );
      it(
        'cannot applyActionToExtensions of declareReceivedPayment with an invalid amount',
        () => {
          TestDataDeclarative.actionDeclareReceivedPayment.parameters.amount = 'invalid amount';

          // 'must throw'
          expect(() => {
            PnAnyDeclarative.applyActionToExtension(
              TestDataDeclarative.requestStateCreatedEmpty.extensions,
              TestDataDeclarative.actionDeclareReceivedPayment,
              TestDataDeclarative.requestStateCreatedEmpty,
              TestData.payeeRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`The amount is not a valid amount`);
        }
      );
    });
  });
});
