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
          txHash: TestDataDeclarative.txHash,
          network: TestDataDeclarative.network,
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
          txHash: TestDataDeclarative.txHash,
          network: TestDataDeclarative.network,
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
          txHash: TestDataDeclarative.txHash,
          network: TestDataDeclarative.network,
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
          txHash: TestDataDeclarative.txHash,
          network: TestDataDeclarative.network,
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

        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.emptyRequestWithPayeeDelegate.extensions,
            unknownAction,
            TestDataDeclarative.emptyRequestWithPayeeDelegate,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('Unknown action: unknown action');
      });
    });

    describe('applyActionToExtension/create', () => {
      it('can applyActionToExtensions of creation', () => {
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
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateWithPaymentAndRefund.extensions,
            TestDataDeclarative.actionCreationWithPaymentAndRefund,
            TestDataDeclarative.requestStateWithPaymentAndRefund,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('This extension has already been created');
      });
    });

    it('keeps the version used at creation', () => {
      const newState = pnAnyDeclarative.applyActionToExtension(
        {},
        { ...TestDataDeclarative.actionCreationWithPaymentAndRefund, version: 'ABCD' },
        TestDataDeclarative.requestStateNoExtensions,
        TestData.otherIdRaw.identity,
        TestData.arbitraryTimestamp,
      );
      expect(newState[pnAnyDeclarative.extensionId].version).toBe('ABCD');
    });

    it('requires a version at creation', () => {
      expect(() => {
        pnAnyDeclarative.applyActionToExtension(
          {},
          { ...TestDataDeclarative.actionCreationWithPaymentAndRefund, version: '' },
          TestDataDeclarative.requestStateNoExtensions,
          TestData.otherIdRaw.identity,
          TestData.arbitraryTimestamp,
        );
      }).toThrowError('version is required at creation');
    });

    describe('applyActionToExtension/addPaymentInstruction', () => {
      it('can applyActionToExtensions of addPaymentInstruction', () => {
        expect(
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.emptyRequestWithPayeeDelegate.extensions,
            TestDataDeclarative.actionPaymentInstruction,
            TestDataDeclarative.emptyRequestWithPayeeDelegate,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(TestDataDeclarative.extensionStatePaymentInstructionAdded);
      });
      it('can applyActionToExtensions of addPaymentInstruction from payeeDelegate', () => {
        const expectedFromPayeeDelegate = Utils.deepCopy(
          TestDataDeclarative.extensionStatePaymentInstructionAdded,
        );
        expectedFromPayeeDelegate[
          ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE as string
        ].events[1].from = TestDataDeclarative.payeeDelegate;

        expect(
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.emptyRequestWithPayeeDelegate.extensions,
            TestDataDeclarative.actionPaymentInstruction,
            TestDataDeclarative.emptyRequestWithPayeeDelegate,
            TestData.payeeDelegateRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(expectedFromPayeeDelegate);
      });
      it('cannot applyActionToExtensions of addPaymentInstruction without a previous state', () => {
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
        const previousState = Utils.deepCopy(TestDataDeclarative.emptyRequestWithPayeeDelegate);
        previousState.payee = undefined;
        previousState.extensions[
          ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE as string
        ].values.payeeDelegate = undefined;

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
        const previousState = Utils.deepCopy(TestDataDeclarative.emptyRequestWithPayeeDelegate);

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
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateWithPaymentAndRefund.extensions,
            TestDataDeclarative.actionPaymentInstruction,
            TestDataDeclarative.requestStateWithPaymentAndRefund,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The payment instruction already assigned`);
      });
    });

    describe('applyActionToExtension/addRefundInstruction', () => {
      it('can applyActionToExtensions of addRefundInstruction', () => {
        expect(
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.emptyRequestWithNoDelegate.extensions,
            TestDataDeclarative.actionRefundInstruction,
            TestDataDeclarative.emptyRequestWithNoDelegate,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(TestDataDeclarative.extensionStateRefundInstructionAdded);
      });
      it('can applyActionToExtensions of addRefundInstruction from payerDelegate', () => {
        const expectedFromThirdParty = Utils.deepCopy(
          TestDataDeclarative.extensionStateRefundInstructionAdded,
        );
        expectedFromThirdParty[
          ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE as string
        ].events[1].from = TestDataDeclarative.payerDelegate;
        expectedFromThirdParty[
          ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE as string
        ].values.payeeDelegate = undefined;
        expectedFromThirdParty[
          ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE as string
        ].values.payerDelegate = TestData.payerDelegateRaw.identity;

        expect(
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.emptyRequestWithPayerDelegate.extensions,
            TestDataDeclarative.actionRefundInstruction,
            TestDataDeclarative.emptyRequestWithPayerDelegate,
            TestData.payerDelegateRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(expectedFromThirdParty);
      });
      it('cannot applyActionToExtensions of addRefundInstruction without a previous state', () => {
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
        const previousState = Utils.deepCopy(TestDataDeclarative.emptyRequestWithPayeeDelegate);
        previousState.payer = undefined;
        previousState.extensions[
          ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE as string
        ].values.payeeDelegate = undefined;

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
        const previousState = Utils.deepCopy(TestDataDeclarative.emptyRequestWithPayeeDelegate);

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
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.requestStateWithPaymentAndRefund.extensions,
            TestDataDeclarative.actionRefundInstruction,
            TestDataDeclarative.requestStateWithPaymentAndRefund,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The refund instruction already assigned`);
      });
    });

    describe('applyActionToExtension/declareSentPayment', () => {
      it('can applyActionToExtensions of declareSentPayment', () => {
        expect(
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.emptyRequestWithNoDelegate.extensions,
            TestDataDeclarative.actionDeclareSentPayment,
            TestDataDeclarative.emptyRequestWithNoDelegate,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(TestDataDeclarative.extensionStateDeclaredSent);
      });
      it('can applyActionToExtensions of declareSentPayment from payerDelegate', () => {
        const expectedFromThirdParty = Utils.deepCopy(
          TestDataDeclarative.extensionStateDeclaredSent,
        );
        expectedFromThirdParty[
          ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE as string
        ].events[1].from = TestDataDeclarative.payerDelegate;
        expectedFromThirdParty[
          ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE as string
        ].values.payerDelegate = TestDataDeclarative.payerDelegate;

        expect(
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.emptyRequestWithPayerDelegate.extensions,
            TestDataDeclarative.actionDeclareSentPayment,
            TestDataDeclarative.emptyRequestWithPayerDelegate,
            TestData.payerDelegateRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(expectedFromThirdParty);
      });
      it('cannot applyActionToExtensions of declareSentPayment without a previous state', () => {
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
        const previousState = Utils.deepCopy(TestDataDeclarative.emptyRequestWithPayeeDelegate);
        previousState.payer = undefined;
        previousState.extensions[
          ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE as string
        ].values.payeeDelegate = undefined;

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
        const previousState = Utils.deepCopy(TestDataDeclarative.emptyRequestWithPayeeDelegate);

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

        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.emptyRequestWithPayeeDelegate.extensions,
            TestDataDeclarative.actionDeclareSentPayment,
            TestDataDeclarative.emptyRequestWithPayeeDelegate,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The amount is not a valid amount`);
      });
    });

    describe('applyActionToExtension/declareReceivedRefund', () => {
      it('can applyActionToExtensions of declareReceivedRefund', () => {
        expect(
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.emptyRequestWithNoDelegate.extensions,
            TestDataDeclarative.actionDeclareReceivedRefund,
            TestDataDeclarative.emptyRequestWithNoDelegate,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(TestDataDeclarative.declarativeExtStateRefundDeclared);
      });
      it('can applyActionToExtensions of declareReceivedRefund from payerDelegate', () => {
        const expectedFromThirdParty = Utils.deepCopy(
          TestDataDeclarative.declarativeExtStateRefundDeclared,
        );
        expectedFromThirdParty[
          ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE as string
        ].events[1].from = TestDataDeclarative.payerDelegate;
        expectedFromThirdParty[
          ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE as string
        ].values.payerDelegate = TestDataDeclarative.payerDelegate;

        expect(
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.emptyRequestWithPayerDelegate.extensions,
            TestDataDeclarative.actionDeclareReceivedRefund,
            TestDataDeclarative.emptyRequestWithPayerDelegate,
            TestData.payerDelegateRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(expectedFromThirdParty);
      });
      it('cannot applyActionToExtensions of declareReceivedRefund without a previous state', () => {
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
        const previousState = Utils.deepCopy(TestDataDeclarative.emptyRequestWithPayeeDelegate);
        previousState.payer = undefined;
        previousState.extensions[
          ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE as string
        ].values.payeeDelegate = undefined;

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
        const previousState = Utils.deepCopy(TestDataDeclarative.emptyRequestWithPayeeDelegate);

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

        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.emptyRequestWithPayeeDelegate.extensions,
            TestDataDeclarative.actionDeclareReceivedRefund,
            TestDataDeclarative.emptyRequestWithPayeeDelegate,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The amount is not a valid amount`);
      });
    });

    describe('applyActionToExtension/declareSentRefund', () => {
      it('can applyActionToExtensions of declareSentRefund', () => {
        expect(
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.emptyRequestWithPayeeDelegate.extensions,
            TestDataDeclarative.actionDeclareSentRefund,
            TestDataDeclarative.emptyRequestWithPayeeDelegate,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(TestDataDeclarative.extensionStateSentRefund);
      });
      it('can applyActionToExtensions of declareSentRefund from payeeDelegate', () => {
        const expectedFromThirdParty = Utils.deepCopy(TestDataDeclarative.extensionStateSentRefund);
        expectedFromThirdParty[
          ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE as string
        ].events[1].from = TestDataDeclarative.payeeDelegate;

        expect(
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.emptyRequestWithPayeeDelegate.extensions,
            TestDataDeclarative.actionDeclareSentRefund,
            TestDataDeclarative.emptyRequestWithPayeeDelegate,
            TestData.payeeDelegateRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(expectedFromThirdParty);
      });
      it('cannot applyActionToExtensions of declareSentRefund without a previous state', () => {
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
        const previousState = Utils.deepCopy(TestDataDeclarative.emptyRequestWithPayeeDelegate);
        previousState.payee = undefined;
        previousState.extensions[
          ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE as string
        ].values.payeeDelegate = undefined;

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
        const previousState = Utils.deepCopy(TestDataDeclarative.emptyRequestWithPayeeDelegate);

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

        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.emptyRequestWithPayeeDelegate.extensions,
            TestDataDeclarative.actionDeclareSentRefund,
            TestDataDeclarative.emptyRequestWithPayeeDelegate,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The amount is not a valid amount`);
      });
    });

    describe('applyActionToExtension/declareReceivedPayment', () => {
      it('can applyActionToExtensions of declareReceivedPayment', () => {
        expect(
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.emptyRequestWithPayeeDelegate.extensions,
            TestDataDeclarative.actionDeclareReceivedPayment,
            TestDataDeclarative.emptyRequestWithPayeeDelegate,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(TestDataDeclarative.extensionStateReceivedPayment);
      });
      it('can applyActionToExtensions of declareReceivedPayment from payeeDelegate', () => {
        const expectedFromThirdParty = Utils.deepCopy(
          TestDataDeclarative.extensionStateReceivedPayment,
        );
        expectedFromThirdParty[
          ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE as string
        ].events[1].from = TestDataDeclarative.payeeDelegate;

        expect(
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.emptyRequestWithPayeeDelegate.extensions,
            TestDataDeclarative.actionDeclareReceivedPayment,
            TestDataDeclarative.emptyRequestWithPayeeDelegate,
            TestData.payeeDelegateRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(expectedFromThirdParty);
      });
      it('cannot applyActionToExtensions of declareReceivedPayment without a previous state', () => {
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
        const previousState = Utils.deepCopy(TestDataDeclarative.emptyRequestWithPayeeDelegate);
        previousState.payee = undefined;
        previousState.extensions[
          ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE as string
        ].values.payeeDelegate = undefined;

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
        const previousState = Utils.deepCopy(TestDataDeclarative.emptyRequestWithPayeeDelegate);

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

        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.emptyRequestWithPayeeDelegate.extensions,
            TestDataDeclarative.actionDeclareReceivedPayment,
            TestDataDeclarative.emptyRequestWithPayeeDelegate,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The amount is not a valid amount`);
      });
    });

    describe('applyActionToExtension/addDelegate', () => {
      it('lets the payee add a delegate', () => {
        expect(
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.emptyRequestWithNoDelegate.extensions,
            TestDataDeclarative.actionAddDelegate,
            TestDataDeclarative.emptyRequestWithNoDelegate,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(TestDataDeclarative.extensionStateAddPayeeDelegate);
      });
      it('lets the payer add a delegate', () => {
        expect(
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.emptyRequestWithNoDelegate.extensions,
            TestDataDeclarative.actionAddDelegate,
            TestDataDeclarative.emptyRequestWithNoDelegate,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(TestDataDeclarative.extensionStateAddPayerDelegate);
      });
      it('lets both the payer and the payee declare delegates', () => {
        expect(
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.emptyRequestWithPayeeDelegate.extensions,
            TestDataDeclarative.actionAddDelegate,
            TestDataDeclarative.emptyRequestWithPayeeDelegate,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(TestDataDeclarative.extensionStateWithTwoDelegates);
      });
      it('does not let one add a delegate if a similar delegate is already assigned', () => {
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.emptyRequestWithPayeeDelegate.extensions,
            TestDataDeclarative.actionAddDelegate,
            TestDataDeclarative.emptyRequestWithPayeeDelegate,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The payeeDelegate is already assigned`);
      });
      it('cannot applyActionToExtensions of addDelegate from a thirdparty', () => {
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            TestDataDeclarative.emptyRequestWithPayeeDelegate.extensions,
            TestDataDeclarative.actionAddDelegate,
            TestDataDeclarative.emptyRequestWithPayeeDelegate,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payee or the payer`);
      });
    });
  });
});
