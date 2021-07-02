import PnAnyDeclarative from '../../../src/extensions/payment-network/declarative';

import Utils from '@requestnetwork/utils';
import { ExtensionTypes } from '@requestnetwork/types';

import * as TestDataDeclarative from '../../utils/payment-network/any/generator-data-create';
import * as TestData from '../../utils/test-data-generator';

const pnAnyDeclarative = new PnAnyDeclarative();

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('extensions/payment-network/any/declarative', () => {
  describe('createCreationAction', () => {
    it('can createCreationAction with payment and refund instruction', () => {
      // 'extensionsdata is wrong'
      expect(
        pnAnyDeclarative.createCreationAction({
          paymentInfo: TestDataDeclarative.paymentInfo,
          refundInfo: TestDataDeclarative.refundInfo,
          payeeDelegate: TestDataDeclarative.payeeDelegate,
        }),
      ).toEqual(TestDataDeclarative.actionCreationWithPaymentAndRefund);
    });

    it('can createCreationAction with only payment instruction', () => {
      // deep copy to remove the undefined properties to comply deep.equal()
      // 'extensionsdata is wrong'
      expect(
        Utils.deepCopy(
          pnAnyDeclarative.createCreationAction({
            paymentInfo: TestDataDeclarative.paymentInfo,
          }),
        ),
      ).toEqual(TestDataDeclarative.actionCreationOnlyPayment);
    });
    it('can createCreationAction with only refund instruction', () => {
      // deep copy to remove the undefined properties to comply deep.equal()
      // 'extensionsdata is wrong'
      expect(
        Utils.deepCopy(
          pnAnyDeclarative.createCreationAction({
            refundInfo: TestDataDeclarative.refundInfo,
          }),
        ),
      ).toEqual(TestDataDeclarative.actionCreationOnlyRefund);
    });

    it('can createCreationAction with payee delegate', () => {
      // deep copy to remove the undefined properties to comply deep.equal()
      // 'extensionsdata is wrong'
      expect(
        Utils.deepCopy(
          pnAnyDeclarative.createCreationAction({
            payeeDelegate: TestDataDeclarative.payeeDelegate,
          }),
        ),
      ).toEqual(TestDataDeclarative.actionCreationPayeeDelegate);
    });
  });

  describe('createAddPaymentInstructionAction', () => {
    it('can createAddPaymentInstructionAction', () => {
      // 'extensionsdata is wrong'
      expect(
        pnAnyDeclarative.createAddPaymentInstructionAction({
          paymentInfo: TestDataDeclarative.paymentInfo,
        }),
      ).toEqual(TestDataDeclarative.actionPaymentInstruction);
    });
  });

  describe('createAddRefundInstructionAction', () => {
    it('can createAddRefundInstructionAction', () => {
      // 'extensionsdata is wrong'
      expect(
        pnAnyDeclarative.createAddRefundInstructionAction({
          refundInfo: TestDataDeclarative.refundInfo,
        }),
      ).toEqual(TestDataDeclarative.actionRefundInstruction);
    });
  });

  describe('createDeclareSentPaymentAction', () => {
    it('can createDeclareSentPaymentAction', () => {
      // 'extensionsdata is wrong'
      expect(
        pnAnyDeclarative.createDeclareSentPaymentAction({
          amount: TestDataDeclarative.amount,
          note: TestDataDeclarative.note,
        }),
      ).toEqual(TestDataDeclarative.actionDeclareSentPayment);
    });
  });

  describe('createDeclareSentRefundAction', () => {
    it('can createDeclareSentRefundAction', () => {
      // 'extensionsdata is wrong'
      expect(
        pnAnyDeclarative.createDeclareSentRefundAction({
          amount: TestDataDeclarative.amount,
          note: TestDataDeclarative.note,
        }),
      ).toEqual(TestDataDeclarative.actionDeclareSentRefund);
    });
  });

  describe('createDeclareReceivedPaymentAction', () => {
    it('can createDeclareReceivedPaymentAction', () => {
      // 'extensionsdata is wrong'
      expect(
        pnAnyDeclarative.createDeclareReceivedPaymentAction({
          amount: TestDataDeclarative.amount,
          note: TestDataDeclarative.note,
        }),
      ).toEqual(TestDataDeclarative.actionDeclareReceivedPayment);
    });
  });

  describe('createDeclareReceivedRefundAction', () => {
    it('can createDeclareReceivedRefundAction', () => {
      // 'extensionsdata is wrong'
      expect(
        pnAnyDeclarative.createDeclareReceivedRefundAction({
          amount: TestDataDeclarative.amount,
          note: TestDataDeclarative.note,
        }),
      ).toEqual(TestDataDeclarative.actionDeclareReceivedRefund);
    });
  });

  describe('createAddDelegateAction', () => {
    it('can createAddDelegateAction', () => {
      // 'extensionsdata is wrong'
      expect(
        pnAnyDeclarative.createAddDelegateAction({
          delegate: TestDataDeclarative.delegateToAdd,
        }),
      ).toEqual(TestDataDeclarative.actionAddDelegate);
    });
  });

  describe('applyActionToExtension', () => {
    describe('applyActionToExtension/unknown action', () => {
      it('cannot applyActionToExtensions of unknown action', () => {
        const unknownAction = Utils.deepCopy(TestDataDeclarative.actionCreationEmpty);
        unknownAction.action = 'unknown action' as any;
        // 'must throw'
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
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
        expect(
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateNoExtensions.extensions,
            TestDataDeclarative.actionCreationWithPaymentAndRefund,
            TestDataDeclarative.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(TestDataDeclarative.extensionStateWithPaymentAndRefund);
      });
      it('cannot applyActionToExtensions of creation with a previous state', () => {
        // 'must throw'
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateCreatedWithPaymentAndRefund.extensions,
            TestDataDeclarative.actionCreationWithPaymentAndRefund,
            TestDataDeclarative.requestStateCreatedWithPaymentAndRefund,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('This extension has already been created');
      });
    });

    describe('applyActionToExtension/addPaymentInstruction', () => {
      it('can applyActionToExtensions of addPaymentInstruction', () => {
        // 'new extension state wrong'
        expect(
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateCreatedEmpty.extensions,
            TestDataDeclarative.actionPaymentInstruction,
            TestDataDeclarative.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(TestDataDeclarative.extensionStateCreatedEmptyPaymentInstructionAdded);
      });
      it('can applyActionToExtensions of addPaymentInstruction from payeeDelegate', () => {
        const expectedFromPayeeDelegate = Utils.deepCopy(
          TestDataDeclarative.extensionStateCreatedEmptyPaymentInstructionAdded,
        );
        expectedFromPayeeDelegate[
          ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string
        ].events[1].from = TestDataDeclarative.payeeDelegate;
        // 'new extension state wrong'
        expect(
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateCreatedEmpty.extensions,
            TestDataDeclarative.actionPaymentInstruction,
            TestDataDeclarative.requestStateCreatedEmpty,
            TestData.payeeDelegateRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(expectedFromPayeeDelegate);
      });
      it('cannot applyActionToExtensions of addPaymentInstruction without a previous state', () => {
        // 'must throw'
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateNoExtensions.extensions,
            TestDataDeclarative.actionPaymentInstruction,
            TestDataDeclarative.requestStateNoExtensions,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });
      it('cannot applyActionToExtensions of addPaymentInstruction without a payee', () => {
        const previousState = Utils.deepCopy(TestDataDeclarative.requestStateCreatedEmpty);
        previousState.payee = undefined;
        previousState.extensions[
          ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string
        ].values.payeeDelegate = undefined;
        // 'must throw'
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            previousState.extensions,
            TestDataDeclarative.actionPaymentInstruction,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payee`);
      });
      it('cannot applyActionToExtensions of addPaymentInstruction signed by someone else than the payee', () => {
        const previousState = Utils.deepCopy(TestDataDeclarative.requestStateCreatedEmpty);
        // 'must throw'
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            previousState.extensions,
            TestDataDeclarative.actionPaymentInstruction,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payee`);
      });
      it('cannot applyActionToExtensions of addPaymentInstruction with payment instruction already assigned', () => {
        // 'must throw'
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateCreatedWithPaymentAndRefund.extensions,
            TestDataDeclarative.actionPaymentInstruction,
            TestDataDeclarative.requestStateCreatedWithPaymentAndRefund,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The payment instruction already assigned`);
      });
    });

    describe('applyActionToExtension/addRefundInstruction', () => {
      it('can applyActionToExtensions of addRefundInstruction', () => {
        // 'new extension state wrong'
        expect(
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateCreatedEmpty.extensions,
            TestDataDeclarative.actionRefundInstruction,
            TestDataDeclarative.requestStateCreatedEmpty,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(TestDataDeclarative.extensionStateCreatedEmptyRefundInstructionAdded);
      });
      it('can applyActionToExtensions of addRefundInstruction from payerDelegate', () => {
        const expectedFromThirdParty = Utils.deepCopy(
          TestDataDeclarative.extensionStateCreatedEmptyRefundInstructionAdded,
        );
        expectedFromThirdParty[
          ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string
        ].events[1].from = TestDataDeclarative.payerDelegate;

        // 'new extension state wrong'
        expect(
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateCreatedEmpty.extensions,
            TestDataDeclarative.actionRefundInstruction,
            TestDataDeclarative.requestStateCreatedEmpty,
            TestData.payerDelegateRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(expectedFromThirdParty);
      });
      it('cannot applyActionToExtensions of addRefundInstruction without a previous state', () => {
        // 'must throw'
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateNoExtensions.extensions,
            TestDataDeclarative.actionRefundInstruction,
            TestDataDeclarative.requestStateNoExtensions,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });
      it('cannot applyActionToExtensions of addRefundInstruction without a payer', () => {
        const previousState = Utils.deepCopy(TestDataDeclarative.requestStateCreatedEmpty);
        previousState.payer = undefined;
        previousState.extensions[
          ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string
        ].values.payeeDelegate = undefined;
        // 'must throw'
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            previousState.extensions,
            TestDataDeclarative.actionRefundInstruction,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payer`);
      });
      it('cannot applyActionToExtensions of addRefundInstruction signed by someone else than the payer', () => {
        const previousState = Utils.deepCopy(TestDataDeclarative.requestStateCreatedEmpty);
        // 'must throw'
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            previousState.extensions,
            TestDataDeclarative.actionRefundInstruction,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payer`);
      });
      it('cannot applyActionToExtensions of addRefundInstruction with payment instruction already assigned', () => {
        // 'must throw'
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateCreatedWithPaymentAndRefund.extensions,
            TestDataDeclarative.actionRefundInstruction,
            TestDataDeclarative.requestStateCreatedWithPaymentAndRefund,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The refund instruction already assigned`);
      });
    });

    describe('applyActionToExtension/declareSentPayment', () => {
      it('can applyActionToExtensions of declareSentPayment', () => {
        // 'new extension state wrong'
        expect(
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateCreatedEmpty.extensions,
            TestDataDeclarative.actionDeclareSentPayment,
            TestDataDeclarative.requestStateCreatedEmpty,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(TestDataDeclarative.extensionStateCreatedEmptySentPayment);
      });
      it('can applyActionToExtensions of declareSentPayment from payerDelegate', () => {
        const expectedFromThirdParty = Utils.deepCopy(
          TestDataDeclarative.extensionStateCreatedEmptySentPayment,
        );
        expectedFromThirdParty[
          ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string
        ].events[1].from = TestDataDeclarative.payerDelegate;

        // 'new extension state wrong'
        expect(
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateCreatedEmpty.extensions,
            TestDataDeclarative.actionDeclareSentPayment,
            TestDataDeclarative.requestStateCreatedEmpty,
            TestData.payerDelegateRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(expectedFromThirdParty);
      });
      it('cannot applyActionToExtensions of declareSentPayment without a previous state', () => {
        // 'must throw'
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateNoExtensions.extensions,
            TestDataDeclarative.actionDeclareSentPayment,
            TestDataDeclarative.requestStateNoExtensions,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });
      it('cannot applyActionToExtensions of declareSentPayment without a payer', () => {
        const previousState = Utils.deepCopy(TestDataDeclarative.requestStateCreatedEmpty);
        previousState.payer = undefined;
        previousState.extensions[
          ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string
        ].values.payeeDelegate = undefined;
        // 'must throw'
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            previousState.extensions,
            TestDataDeclarative.actionDeclareSentPayment,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payer`);
      });
      it('cannot applyActionToExtensions of declareSentPayment signed by someone else than the payer', () => {
        const previousState = Utils.deepCopy(TestDataDeclarative.requestStateCreatedEmpty);
        // 'must throw'
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            previousState.extensions,
            TestDataDeclarative.actionDeclareSentPayment,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payer`);
      });
      it('cannot applyActionToExtensions of declareSentPayment with an invalid amount', () => {
        TestDataDeclarative.actionDeclareSentPayment.parameters.amount = 'invalid amount';

        // 'must throw'
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateCreatedEmpty.extensions,
            TestDataDeclarative.actionDeclareSentPayment,
            TestDataDeclarative.requestStateCreatedEmpty,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The amount is not a valid amount`);
      });
    });

    describe('applyActionToExtension/declareReceivedRefund', () => {
      it('can applyActionToExtensions of declareReceivedRefund', () => {
        // 'new extension state wrong'
        expect(
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateCreatedEmpty.extensions,
            TestDataDeclarative.actionDeclareReceivedRefund,
            TestDataDeclarative.requestStateCreatedEmpty,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(TestDataDeclarative.extensionStateCreatedEmptyReceivedRefund);
      });
      it('can applyActionToExtensions of declareReceivedRefund from payerDelegate', () => {
        const expectedFromThirdParty = Utils.deepCopy(
          TestDataDeclarative.extensionStateCreatedEmptyReceivedRefund,
        );
        expectedFromThirdParty[
          ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string
        ].events[1].from = TestDataDeclarative.payerDelegate;

        // 'new extension state wrong'
        expect(
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateCreatedEmpty.extensions,
            TestDataDeclarative.actionDeclareReceivedRefund,
            TestDataDeclarative.requestStateCreatedEmpty,
            TestData.payerDelegateRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(expectedFromThirdParty);
      });
      it('cannot applyActionToExtensions of declareReceivedRefund without a previous state', () => {
        // 'must throw'
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateNoExtensions.extensions,
            TestDataDeclarative.actionDeclareReceivedRefund,
            TestDataDeclarative.requestStateNoExtensions,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });
      it('cannot applyActionToExtensions of declareReceivedRefund without a payer', () => {
        const previousState = Utils.deepCopy(TestDataDeclarative.requestStateCreatedEmpty);
        previousState.payer = undefined;
        previousState.extensions[
          ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string
        ].values.payeeDelegate = undefined;
        // 'must throw'
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            previousState.extensions,
            TestDataDeclarative.actionDeclareReceivedRefund,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payer`);
      });
      it('cannot applyActionToExtensions of declareReceivedRefund signed by someone else than the payer', () => {
        const previousState = Utils.deepCopy(TestDataDeclarative.requestStateCreatedEmpty);
        // 'must throw'
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            previousState.extensions,
            TestDataDeclarative.actionDeclareReceivedRefund,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payer`);
      });
      it('cannot applyActionToExtensions of declareReceivedRefund with an invalid amount', () => {
        TestDataDeclarative.actionDeclareReceivedRefund.parameters.amount = 'invalid amount';

        // 'must throw'
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateCreatedEmpty.extensions,
            TestDataDeclarative.actionDeclareReceivedRefund,
            TestDataDeclarative.requestStateCreatedEmpty,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The amount is not a valid amount`);
      });
    });

    describe('applyActionToExtension/declareSentRefund', () => {
      it('can applyActionToExtensions of declareSentRefund', () => {
        // 'new extension state wrong'
        expect(
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateCreatedEmpty.extensions,
            TestDataDeclarative.actionDeclareSentRefund,
            TestDataDeclarative.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(TestDataDeclarative.extensionStateCreatedEmptySentRefund);
      });
      it('can applyActionToExtensions of declareSentRefund from payeeDelegate', () => {
        const expectedFromThirdParty = Utils.deepCopy(
          TestDataDeclarative.extensionStateCreatedEmptySentRefund,
        );
        expectedFromThirdParty[
          ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string
        ].events[1].from = TestDataDeclarative.payeeDelegate;

        // 'new extension state wrong'
        expect(
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateCreatedEmpty.extensions,
            TestDataDeclarative.actionDeclareSentRefund,
            TestDataDeclarative.requestStateCreatedEmpty,
            TestData.payeeDelegateRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(expectedFromThirdParty);
      });
      it('cannot applyActionToExtensions of declareSentRefund without a previous state', () => {
        // 'must throw'
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateNoExtensions.extensions,
            TestDataDeclarative.actionDeclareSentRefund,
            TestDataDeclarative.requestStateNoExtensions,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });
      it('cannot applyActionToExtensions of declareSentRefund without a payee', () => {
        const previousState = Utils.deepCopy(TestDataDeclarative.requestStateCreatedEmpty);
        previousState.payee = undefined;
        previousState.extensions[
          ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string
        ].values.payeeDelegate = undefined;

        // 'must throw'
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            previousState.extensions,
            TestDataDeclarative.actionDeclareSentRefund,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payee`);
      });
      it('cannot applyActionToExtensions of declareSentRefund signed by someone else than the payee', () => {
        const previousState = Utils.deepCopy(TestDataDeclarative.requestStateCreatedEmpty);
        // 'must throw'
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            previousState.extensions,
            TestDataDeclarative.actionDeclareSentRefund,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payee`);
      });
      it('cannot applyActionToExtensions of declareSentRefund with an invalid amount', () => {
        TestDataDeclarative.actionDeclareSentRefund.parameters.amount = 'invalid amount';

        // 'must throw'
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateCreatedEmpty.extensions,
            TestDataDeclarative.actionDeclareSentRefund,
            TestDataDeclarative.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The amount is not a valid amount`);
      });
    });

    describe('applyActionToExtension/declareReceivedPayment', () => {
      it('can applyActionToExtensions of declareReceivedPayment', () => {
        // 'new extension state wrong'
        expect(
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateCreatedEmpty.extensions,
            TestDataDeclarative.actionDeclareReceivedPayment,
            TestDataDeclarative.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(TestDataDeclarative.extensionStateCreatedEmptyReceivedPayment);
      });
      it('can applyActionToExtensions of declareReceivedPayment from payeeDelegate', () => {
        const expectedFromThirdParty = Utils.deepCopy(
          TestDataDeclarative.extensionStateCreatedEmptyReceivedPayment,
        );
        expectedFromThirdParty[
          ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string
        ].events[1].from = TestDataDeclarative.payeeDelegate;

        // 'new extension state wrong'
        expect(
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateCreatedEmpty.extensions,
            TestDataDeclarative.actionDeclareReceivedPayment,
            TestDataDeclarative.requestStateCreatedEmpty,
            TestData.payeeDelegateRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(expectedFromThirdParty);
      });
      it('cannot applyActionToExtensions of declareReceivedPayment without a previous state', () => {
        // 'must throw'
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateNoExtensions.extensions,
            TestDataDeclarative.actionDeclareReceivedPayment,
            TestDataDeclarative.requestStateNoExtensions,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });
      it('cannot applyActionToExtensions of declareReceivedPayment without a payee', () => {
        const previousState = Utils.deepCopy(TestDataDeclarative.requestStateCreatedEmpty);
        previousState.payee = undefined;
        previousState.extensions[
          ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string
        ].values.payeeDelegate = undefined;

        // 'must throw'
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            previousState.extensions,
            TestDataDeclarative.actionDeclareReceivedPayment,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payee`);
      });
      it('cannot applyActionToExtensions of declareReceivedPayment signed by someone else than the payee', () => {
        const previousState = Utils.deepCopy(TestDataDeclarative.requestStateCreatedEmpty);
        // 'must throw'
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            previousState.extensions,
            TestDataDeclarative.actionDeclareReceivedPayment,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payee`);
      });
      it('cannot applyActionToExtensions of declareReceivedPayment with an invalid amount', () => {
        TestDataDeclarative.actionDeclareReceivedPayment.parameters.amount = 'invalid amount';

        // 'must throw'
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateCreatedEmpty.extensions,
            TestDataDeclarative.actionDeclareReceivedPayment,
            TestDataDeclarative.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The amount is not a valid amount`);
      });
    });

    describe('applyActionToExtension/addDelegate', () => {
      it('can applyActionToExtensions of addDelegate from payee', () => {
        // 'new extension state wrong'
        expect(
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateCreatedEmptyNoDelegate.extensions,
            TestDataDeclarative.actionAddDelegate,
            TestDataDeclarative.requestStateCreatedEmptyNoDelegate,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(TestDataDeclarative.extensionStateCreatedEmptyAddPayeeDelegate);
      });
      it('can applyActionToExtensions of addDelegate from payer', () => {
        // 'new extension state wrong'
        expect(
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateCreatedEmptyNoDelegate.extensions,
            TestDataDeclarative.actionAddDelegate,
            TestDataDeclarative.requestStateCreatedEmptyNoDelegate,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(TestDataDeclarative.extensionStateCreatedEmptyAddPayerDelegate);
      });
      it('cannot applyActionToExtensions of addDelegate if delegate already assigned', () => {
        // 'must throw'
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateCreatedEmpty.extensions,
            TestDataDeclarative.actionAddDelegate,
            TestDataDeclarative.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The payeeDelegate is already assigned`);
      });
      it('cannot applyActionToExtensions of addDelegate from a thirdparty', () => {
        // 'must throw'
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateCreatedEmpty.extensions,
            TestDataDeclarative.actionAddDelegate,
            TestDataDeclarative.requestStateCreatedEmpty,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payee or the payer`);
      });
    });
  });
});
