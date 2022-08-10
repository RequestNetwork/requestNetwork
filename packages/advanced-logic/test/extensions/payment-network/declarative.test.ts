import PnAnyDeclarative from '../../../src/extensions/payment-network/declarative';

import Utils from '@requestnetwork/utils';
import { ExtensionTypes } from '@requestnetwork/types';

import * as DeclarativeMocks from '../../utils/payment-network/any/generator-data-create';
import * as TestData from '../../utils/test-data-generator';

const pnAnyDeclarative = new PnAnyDeclarative();

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('extensions/payment-network/any/declarative', () => {
  describe('createCreationAction', () => {
    it('can createCreationAction with payment and refund instruction', () => {
      // 'extensionsdata is wrong'
      expect(
        pnAnyDeclarative.createCreationAction({
          paymentInfo: DeclarativeMocks.paymentInfo,
          refundInfo: DeclarativeMocks.refundInfo,
          payeeDelegate: DeclarativeMocks.payeeDelegate,
        }),
      ).toEqual(DeclarativeMocks.actionCreationWithPaymentAndRefund);
    });

    it('can createCreationAction with only payment instruction', () => {
      // deep copy to remove the undefined properties to comply deep.equal()
      // 'extensionsdata is wrong'
      expect(
        Utils.deepCopy(
          pnAnyDeclarative.createCreationAction({
            paymentInfo: DeclarativeMocks.paymentInfo,
          }),
        ),
      ).toEqual(DeclarativeMocks.actionCreationOnlyPayment);
    });
    it('can createCreationAction with only refund instruction', () => {
      // deep copy to remove the undefined properties to comply deep.equal()
      // 'extensionsdata is wrong'
      expect(
        Utils.deepCopy(
          pnAnyDeclarative.createCreationAction({
            refundInfo: DeclarativeMocks.refundInfo,
          }),
        ),
      ).toEqual(DeclarativeMocks.actionCreationOnlyRefund);
    });

    it('can createCreationAction with payee delegate', () => {
      // deep copy to remove the undefined properties to comply deep.equal()
      // 'extensionsdata is wrong'
      expect(
        Utils.deepCopy(
          pnAnyDeclarative.createCreationAction({
            payeeDelegate: DeclarativeMocks.payeeDelegate,
          }),
        ),
      ).toEqual(DeclarativeMocks.actionCreationPayeeDelegate);
    });
  });

  describe('createAddPaymentInstructionAction', () => {
    it('can createAddPaymentInstructionAction', () => {
      // 'extensionsdata is wrong'
      expect(
        pnAnyDeclarative.createAddPaymentInstructionAction({
          paymentInfo: DeclarativeMocks.paymentInfo,
        }),
      ).toEqual(DeclarativeMocks.actionPaymentInstruction);
    });
  });

  describe('createAddRefundInstructionAction', () => {
    it('can createAddRefundInstructionAction', () => {
      // 'extensionsdata is wrong'
      expect(
        pnAnyDeclarative.createAddRefundInstructionAction({
          refundInfo: DeclarativeMocks.refundInfo,
        }),
      ).toEqual(DeclarativeMocks.actionRefundInstruction);
    });
  });

  describe('createDeclareSentPaymentAction', () => {
    it('can createDeclareSentPaymentAction', () => {
      // 'extensionsdata is wrong'
      expect(
        pnAnyDeclarative.createDeclareSentPaymentAction({
          amount: DeclarativeMocks.amount,
          note: DeclarativeMocks.note,
          txHash: DeclarativeMocks.txHash,
          network: DeclarativeMocks.network,
        }),
      ).toEqual(DeclarativeMocks.actionDeclareSentPayment);
    });
  });

  describe('createDeclareSentRefundAction', () => {
    it('can createDeclareSentRefundAction', () => {
      // 'extensionsdata is wrong'
      expect(
        pnAnyDeclarative.createDeclareSentRefundAction({
          amount: DeclarativeMocks.amount,
          note: DeclarativeMocks.note,
          txHash: DeclarativeMocks.txHash,
          network: DeclarativeMocks.network,
        }),
      ).toEqual(DeclarativeMocks.actionDeclareSentRefund);
    });
  });

  describe('createDeclareReceivedPaymentAction', () => {
    it('can createDeclareReceivedPaymentAction', () => {
      // 'extensionsdata is wrong'
      expect(
        pnAnyDeclarative.createDeclareReceivedPaymentAction({
          amount: DeclarativeMocks.amount,
          note: DeclarativeMocks.note,
          txHash: DeclarativeMocks.txHash,
          network: DeclarativeMocks.network,
        }),
      ).toEqual(DeclarativeMocks.actionDeclareReceivedPayment);
    });
  });

  describe('createDeclareReceivedRefundAction', () => {
    it('can createDeclareReceivedRefundAction', () => {
      // 'extensionsdata is wrong'
      expect(
        pnAnyDeclarative.createDeclareReceivedRefundAction({
          amount: DeclarativeMocks.amount,
          note: DeclarativeMocks.note,
          txHash: DeclarativeMocks.txHash,
          network: DeclarativeMocks.network,
        }),
      ).toEqual(DeclarativeMocks.actionDeclareReceivedRefund);
    });
  });

  describe('createAddDelegateAction', () => {
    it('can createAddDelegateAction', () => {
      // 'extensionsdata is wrong'
      expect(
        pnAnyDeclarative.createAddDelegateAction({
          delegate: DeclarativeMocks.delegateToAdd,
        }),
      ).toEqual(DeclarativeMocks.actionAddDelegate);
    });
  });

  describe('applyActionToExtension', () => {
    describe('applyActionToExtension/unknown action', () => {
      it('cannot applyActionToExtensions of unknown action', () => {
        const unknownAction = Utils.deepCopy(DeclarativeMocks.actionCreationEmpty);
        unknownAction.action = 'unknown action' as any;

        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            DeclarativeMocks.emptyRequestWithPayeeDelegate.extensions,
            unknownAction,
            DeclarativeMocks.emptyRequestWithPayeeDelegate,
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
            DeclarativeMocks.requestStateNoExtensions.extensions,
            DeclarativeMocks.actionCreationWithPaymentAndRefund,
            DeclarativeMocks.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DeclarativeMocks.extensionStateWithPaymentAndRefund);
      });
      it('cannot applyActionToExtensions of creation with a previous state', () => {
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            DeclarativeMocks.requestStateWithPaymentAndRefund.extensions,
            DeclarativeMocks.actionCreationWithPaymentAndRefund,
            DeclarativeMocks.requestStateWithPaymentAndRefund,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('This extension has already been created');
      });
    });

    it('keeps the version used at creation', () => {
      const newState = pnAnyDeclarative.applyActionToExtension(
        {},
        { ...DeclarativeMocks.actionCreationWithPaymentAndRefund, version: 'ABCD' },
        DeclarativeMocks.requestStateNoExtensions,
        TestData.otherIdRaw.identity,
        TestData.arbitraryTimestamp,
      );
      expect(newState[pnAnyDeclarative.extensionId].version).toBe('ABCD');
    });

    it('requires a version at creation', () => {
      expect(() => {
        pnAnyDeclarative.applyActionToExtension(
          {},
          { ...DeclarativeMocks.actionCreationWithPaymentAndRefund, version: '' },
          DeclarativeMocks.requestStateNoExtensions,
          TestData.otherIdRaw.identity,
          TestData.arbitraryTimestamp,
        );
      }).toThrowError('version is required at creation');
    });

    describe('applyActionToExtension/addPaymentInstruction', () => {
      it('can applyActionToExtensions of addPaymentInstruction', () => {
        expect(
          pnAnyDeclarative.applyActionToExtension(
            DeclarativeMocks.emptyRequestWithPayeeDelegate.extensions,
            DeclarativeMocks.actionPaymentInstruction,
            DeclarativeMocks.emptyRequestWithPayeeDelegate,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DeclarativeMocks.extensionStatePaymentInstructionAdded);
      });
      it('can applyActionToExtensions of addPaymentInstruction from payeeDelegate', () => {
        const expectedFromPayeeDelegate = Utils.deepCopy(
          DeclarativeMocks.extensionStatePaymentInstructionAdded,
        );
        expectedFromPayeeDelegate[
          ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string
        ].events[1].from = DeclarativeMocks.payeeDelegate;

        expect(
          pnAnyDeclarative.applyActionToExtension(
            DeclarativeMocks.emptyRequestWithPayeeDelegate.extensions,
            DeclarativeMocks.actionPaymentInstruction,
            DeclarativeMocks.emptyRequestWithPayeeDelegate,
            TestData.payeeDelegateRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(expectedFromPayeeDelegate);
      });
      it('cannot applyActionToExtensions of addPaymentInstruction without a previous state', () => {
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            DeclarativeMocks.requestStateNoExtensions.extensions,
            DeclarativeMocks.actionPaymentInstruction,
            DeclarativeMocks.requestStateNoExtensions,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });
      it('cannot applyActionToExtensions of addPaymentInstruction without a payee', () => {
        const previousState = Utils.deepCopy(DeclarativeMocks.emptyRequestWithPayeeDelegate);
        previousState.payee = undefined;
        previousState.extensions[
          ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string
        ].values.payeeDelegate = undefined;

        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            previousState.extensions,
            DeclarativeMocks.actionPaymentInstruction,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payee`);
      });
      it('cannot applyActionToExtensions of addPaymentInstruction signed by someone else than the payee', () => {
        const previousState = Utils.deepCopy(DeclarativeMocks.emptyRequestWithPayeeDelegate);

        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            previousState.extensions,
            DeclarativeMocks.actionPaymentInstruction,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payee`);
      });
      it('cannot applyActionToExtensions of addPaymentInstruction with payment instruction already assigned', () => {
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            DeclarativeMocks.requestStateWithPaymentAndRefund.extensions,
            DeclarativeMocks.actionPaymentInstruction,
            DeclarativeMocks.requestStateWithPaymentAndRefund,
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
            DeclarativeMocks.emptyRequestWithNoDelegate.extensions,
            DeclarativeMocks.actionRefundInstruction,
            DeclarativeMocks.emptyRequestWithNoDelegate,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DeclarativeMocks.extensionStateRefundInstructionAdded);
      });
      it('can applyActionToExtensions of addRefundInstruction from payerDelegate', () => {
        const expectedFromThirdParty = Utils.deepCopy(
          DeclarativeMocks.extensionStateRefundInstructionAdded,
        );
        expectedFromThirdParty[
          ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string
        ].events[1].from = DeclarativeMocks.payerDelegate;
        expectedFromThirdParty[
          ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string
        ].values.payeeDelegate = undefined;
        expectedFromThirdParty[
          ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string
        ].values.payerDelegate = TestData.payerDelegateRaw.identity;

        expect(
          pnAnyDeclarative.applyActionToExtension(
            DeclarativeMocks.emptyRequestWithPayerDelegate.extensions,
            DeclarativeMocks.actionRefundInstruction,
            DeclarativeMocks.emptyRequestWithPayerDelegate,
            TestData.payerDelegateRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(expectedFromThirdParty);
      });
      it('cannot applyActionToExtensions of addRefundInstruction without a previous state', () => {
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            DeclarativeMocks.requestStateNoExtensions.extensions,
            DeclarativeMocks.actionRefundInstruction,
            DeclarativeMocks.requestStateNoExtensions,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });
      it('cannot applyActionToExtensions of addRefundInstruction without a payer', () => {
        const previousState = Utils.deepCopy(DeclarativeMocks.emptyRequestWithPayeeDelegate);
        previousState.payer = undefined;
        previousState.extensions[
          ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string
        ].values.payeeDelegate = undefined;

        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            previousState.extensions,
            DeclarativeMocks.actionRefundInstruction,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payer`);
      });
      it('cannot applyActionToExtensions of addRefundInstruction signed by someone else than the payer', () => {
        const previousState = Utils.deepCopy(DeclarativeMocks.emptyRequestWithPayeeDelegate);

        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            previousState.extensions,
            DeclarativeMocks.actionRefundInstruction,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payer`);
      });
      it('cannot applyActionToExtensions of addRefundInstruction with payment instruction already assigned', () => {
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            DeclarativeMocks.requestStateWithPaymentAndRefund.extensions,
            DeclarativeMocks.actionRefundInstruction,
            DeclarativeMocks.requestStateWithPaymentAndRefund,
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
            DeclarativeMocks.emptyRequestWithNoDelegate.extensions,
            DeclarativeMocks.actionDeclareSentPayment,
            DeclarativeMocks.emptyRequestWithNoDelegate,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DeclarativeMocks.extensionStateDeclaredSent);
      });
      it('can applyActionToExtensions of declareSentPayment from payerDelegate', () => {
        const expectedFromThirdParty = Utils.deepCopy(DeclarativeMocks.extensionStateDeclaredSent);
        expectedFromThirdParty[
          ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string
        ].events[1].from = DeclarativeMocks.payerDelegate;
        expectedFromThirdParty[
          ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string
        ].values.payerDelegate = DeclarativeMocks.payerDelegate;

        expect(
          pnAnyDeclarative.applyActionToExtension(
            DeclarativeMocks.emptyRequestWithPayerDelegate.extensions,
            DeclarativeMocks.actionDeclareSentPayment,
            DeclarativeMocks.emptyRequestWithPayerDelegate,
            TestData.payerDelegateRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(expectedFromThirdParty);
      });
      it('cannot applyActionToExtensions of declareSentPayment without a previous state', () => {
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            DeclarativeMocks.requestStateNoExtensions.extensions,
            DeclarativeMocks.actionDeclareSentPayment,
            DeclarativeMocks.requestStateNoExtensions,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });
      it('cannot applyActionToExtensions of declareSentPayment without a payer', () => {
        const previousState = Utils.deepCopy(DeclarativeMocks.emptyRequestWithPayeeDelegate);
        previousState.payer = undefined;
        previousState.extensions[
          ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string
        ].values.payeeDelegate = undefined;

        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            previousState.extensions,
            DeclarativeMocks.actionDeclareSentPayment,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payer`);
      });
      it('cannot applyActionToExtensions of declareSentPayment signed by someone else than the payer', () => {
        const previousState = Utils.deepCopy(DeclarativeMocks.emptyRequestWithPayeeDelegate);

        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            previousState.extensions,
            DeclarativeMocks.actionDeclareSentPayment,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payer`);
      });
      it('cannot applyActionToExtensions of declareSentPayment with an invalid amount', () => {
        DeclarativeMocks.actionDeclareSentPayment.parameters.amount = 'invalid amount';

        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            DeclarativeMocks.emptyRequestWithPayeeDelegate.extensions,
            DeclarativeMocks.actionDeclareSentPayment,
            DeclarativeMocks.emptyRequestWithPayeeDelegate,
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
            DeclarativeMocks.emptyRequestWithNoDelegate.extensions,
            DeclarativeMocks.actionDeclareReceivedRefund,
            DeclarativeMocks.emptyRequestWithNoDelegate,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DeclarativeMocks.declarativeExtStateRefundDeclared);
      });
      it('can applyActionToExtensions of declareReceivedRefund from payerDelegate', () => {
        const expectedFromThirdParty = Utils.deepCopy(
          DeclarativeMocks.declarativeExtStateRefundDeclared,
        );
        expectedFromThirdParty[
          ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string
        ].events[1].from = DeclarativeMocks.payerDelegate;
        expectedFromThirdParty[
          ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string
        ].values.payerDelegate = DeclarativeMocks.payerDelegate;

        expect(
          pnAnyDeclarative.applyActionToExtension(
            DeclarativeMocks.emptyRequestWithPayerDelegate.extensions,
            DeclarativeMocks.actionDeclareReceivedRefund,
            DeclarativeMocks.emptyRequestWithPayerDelegate,
            TestData.payerDelegateRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(expectedFromThirdParty);
      });
      it('cannot applyActionToExtensions of declareReceivedRefund without a previous state', () => {
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            DeclarativeMocks.requestStateNoExtensions.extensions,
            DeclarativeMocks.actionDeclareReceivedRefund,
            DeclarativeMocks.requestStateNoExtensions,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });
      it('cannot applyActionToExtensions of declareReceivedRefund without a payer', () => {
        const previousState = Utils.deepCopy(DeclarativeMocks.emptyRequestWithPayeeDelegate);
        previousState.payer = undefined;
        previousState.extensions[
          ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string
        ].values.payeeDelegate = undefined;

        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            previousState.extensions,
            DeclarativeMocks.actionDeclareReceivedRefund,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payer`);
      });
      it('cannot applyActionToExtensions of declareReceivedRefund signed by someone else than the payer', () => {
        const previousState = Utils.deepCopy(DeclarativeMocks.emptyRequestWithPayeeDelegate);

        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            previousState.extensions,
            DeclarativeMocks.actionDeclareReceivedRefund,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payer`);
      });
      it('cannot applyActionToExtensions of declareReceivedRefund with an invalid amount', () => {
        DeclarativeMocks.actionDeclareReceivedRefund.parameters.amount = 'invalid amount';

        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            DeclarativeMocks.emptyRequestWithPayeeDelegate.extensions,
            DeclarativeMocks.actionDeclareReceivedRefund,
            DeclarativeMocks.emptyRequestWithPayeeDelegate,
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
            DeclarativeMocks.emptyRequestWithPayeeDelegate.extensions,
            DeclarativeMocks.actionDeclareSentRefund,
            DeclarativeMocks.emptyRequestWithPayeeDelegate,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DeclarativeMocks.extensionStateSentRefund);
      });
      it('can applyActionToExtensions of declareSentRefund from payeeDelegate', () => {
        const expectedFromThirdParty = Utils.deepCopy(DeclarativeMocks.extensionStateSentRefund);
        expectedFromThirdParty[
          ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string
        ].events[1].from = DeclarativeMocks.payeeDelegate;

        expect(
          pnAnyDeclarative.applyActionToExtension(
            DeclarativeMocks.emptyRequestWithPayeeDelegate.extensions,
            DeclarativeMocks.actionDeclareSentRefund,
            DeclarativeMocks.emptyRequestWithPayeeDelegate,
            TestData.payeeDelegateRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(expectedFromThirdParty);
      });
      it('cannot applyActionToExtensions of declareSentRefund without a previous state', () => {
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            DeclarativeMocks.requestStateNoExtensions.extensions,
            DeclarativeMocks.actionDeclareSentRefund,
            DeclarativeMocks.requestStateNoExtensions,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });
      it('cannot applyActionToExtensions of declareSentRefund without a payee', () => {
        const previousState = Utils.deepCopy(DeclarativeMocks.emptyRequestWithPayeeDelegate);
        previousState.payee = undefined;
        previousState.extensions[
          ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string
        ].values.payeeDelegate = undefined;

        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            previousState.extensions,
            DeclarativeMocks.actionDeclareSentRefund,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payee`);
      });
      it('cannot applyActionToExtensions of declareSentRefund signed by someone else than the payee', () => {
        const previousState = Utils.deepCopy(DeclarativeMocks.emptyRequestWithPayeeDelegate);

        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            previousState.extensions,
            DeclarativeMocks.actionDeclareSentRefund,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payee`);
      });
      it('cannot applyActionToExtensions of declareSentRefund with an invalid amount', () => {
        DeclarativeMocks.actionDeclareSentRefund.parameters.amount = 'invalid amount';

        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            DeclarativeMocks.emptyRequestWithPayeeDelegate.extensions,
            DeclarativeMocks.actionDeclareSentRefund,
            DeclarativeMocks.emptyRequestWithPayeeDelegate,
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
            DeclarativeMocks.emptyRequestWithPayeeDelegate.extensions,
            DeclarativeMocks.actionDeclareReceivedPayment,
            DeclarativeMocks.emptyRequestWithPayeeDelegate,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DeclarativeMocks.extensionStateReceivedPayment);
      });
      it('can applyActionToExtensions of declareReceivedPayment from payeeDelegate', () => {
        const expectedFromThirdParty = Utils.deepCopy(
          DeclarativeMocks.extensionStateReceivedPayment,
        );
        expectedFromThirdParty[
          ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string
        ].events[1].from = DeclarativeMocks.payeeDelegate;

        expect(
          pnAnyDeclarative.applyActionToExtension(
            DeclarativeMocks.emptyRequestWithPayeeDelegate.extensions,
            DeclarativeMocks.actionDeclareReceivedPayment,
            DeclarativeMocks.emptyRequestWithPayeeDelegate,
            TestData.payeeDelegateRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(expectedFromThirdParty);
      });
      it('cannot applyActionToExtensions of declareReceivedPayment without a previous state', () => {
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            DeclarativeMocks.requestStateNoExtensions.extensions,
            DeclarativeMocks.actionDeclareReceivedPayment,
            DeclarativeMocks.requestStateNoExtensions,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });
      it('cannot applyActionToExtensions of declareReceivedPayment without a payee', () => {
        const previousState = Utils.deepCopy(DeclarativeMocks.emptyRequestWithPayeeDelegate);
        previousState.payee = undefined;
        previousState.extensions[
          ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE as string
        ].values.payeeDelegate = undefined;

        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            previousState.extensions,
            DeclarativeMocks.actionDeclareReceivedPayment,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payee`);
      });
      it('cannot applyActionToExtensions of declareReceivedPayment signed by someone else than the payee', () => {
        const previousState = Utils.deepCopy(DeclarativeMocks.emptyRequestWithPayeeDelegate);

        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            previousState.extensions,
            DeclarativeMocks.actionDeclareReceivedPayment,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payee`);
      });
      it('cannot applyActionToExtensions of declareReceivedPayment with an invalid amount', () => {
        DeclarativeMocks.actionDeclareReceivedPayment.parameters.amount = 'invalid amount';

        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            DeclarativeMocks.emptyRequestWithPayeeDelegate.extensions,
            DeclarativeMocks.actionDeclareReceivedPayment,
            DeclarativeMocks.emptyRequestWithPayeeDelegate,
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
            DeclarativeMocks.emptyRequestWithNoDelegate.extensions,
            DeclarativeMocks.actionAddDelegate,
            DeclarativeMocks.emptyRequestWithNoDelegate,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DeclarativeMocks.extensionStateAddPayeeDelegate);
      });
      it('lets the payer add a delegate', () => {
        expect(
          pnAnyDeclarative.applyActionToExtension(
            DeclarativeMocks.emptyRequestWithNoDelegate.extensions,
            DeclarativeMocks.actionAddDelegate,
            DeclarativeMocks.emptyRequestWithNoDelegate,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DeclarativeMocks.extensionStateAddPayerDelegate);
      });
      it('lets both the payer and the payee declare delegates', () => {
        expect(
          pnAnyDeclarative.applyActionToExtension(
            DeclarativeMocks.emptyRequestWithPayeeDelegate.extensions,
            DeclarativeMocks.actionAddDelegate,
            DeclarativeMocks.emptyRequestWithPayeeDelegate,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DeclarativeMocks.extensionStateWithTwoDelegates);
      });
      it('does not let one add a delegate if a similar delegate is already assigned', () => {
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            DeclarativeMocks.emptyRequestWithPayeeDelegate.extensions,
            DeclarativeMocks.actionAddDelegate,
            DeclarativeMocks.emptyRequestWithPayeeDelegate,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The payeeDelegate is already assigned`);
      });
      it('cannot applyActionToExtensions of addDelegate from a thirdparty', () => {
        expect(() => {
          pnAnyDeclarative.applyActionToExtension(
            DeclarativeMocks.emptyRequestWithPayeeDelegate.extensions,
            DeclarativeMocks.actionAddDelegate,
            DeclarativeMocks.emptyRequestWithPayeeDelegate,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payee or the payer`);
      });
    });
  });
});
