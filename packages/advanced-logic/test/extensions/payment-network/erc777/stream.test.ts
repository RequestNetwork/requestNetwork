import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import Erc777StreamPaymentNetwork from '../../../../src/extensions/payment-network/erc777/stream';

import * as DataERC777StreamAddData from '../../../utils/payment-network/erc777/stream-add-data-generator';
import * as DataERC777StreamCreate from '../../../utils/payment-network/erc777/stream-create-data-generator';
import * as TestData from '../../../utils/test-data-generator';

const erc777StreamPaymentNetwork = new Erc777StreamPaymentNetwork();

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('extensions/payment-network/erc777/stream', () => {
  describe('createCreationAction', () => {
    it('can create a create action with all parameters', () => {
      expect(
        erc777StreamPaymentNetwork.createCreationAction({
          expectedFlowRate: '0x0000000000000000000000000000000000000001',
          expectedStartDate: '0',
          paymentAddress: '0x0000000000000000000000000000000000000002',
          refundAddress: '0x0000000000000000000000000000000000000003',
          salt: 'ea3bc7caf64110ca',
        }),
      ).toEqual({
        action: 'create',
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM,
        parameters: {
          expectedFlowRate: '0x0000000000000000000000000000000000000001',
          expectedStartDate: '0',
          paymentAddress: '0x0000000000000000000000000000000000000002',
          refundAddress: '0x0000000000000000000000000000000000000003',
          salt: 'ea3bc7caf64110ca',
        },
        version: '0.1.0',
      });
    });

    describe('createAddPaymentAddressAction', () => {
      it('can createAddPaymentAddressAction', () => {
        expect(
          erc777StreamPaymentNetwork.createAddPaymentAddressAction({
            paymentAddress: '0x0000000000000000000000000000000000000001',
          }),
        ).toEqual({
          action: ExtensionTypes.PnReferenceBased.ACTION.ADD_PAYMENT_ADDRESS,
          id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM,
          parameters: {
            paymentAddress: '0x0000000000000000000000000000000000000001',
          },
        });
      });

      it('cannot createAddPaymentAddressAction with payment address not an ethereum address', () => {
        // 'must throw'
        expect(() => {
          erc777StreamPaymentNetwork.createAddPaymentAddressAction({
            paymentAddress: 'not an ethereum address',
          });
        }).toThrowError("paymentAddress 'not an ethereum address' is not a valid address");
      });
    });

    describe('createAddRefundAddressAction', () => {
      it('can createAddRefundAddressAction', () => {
        expect(
          erc777StreamPaymentNetwork.createAddRefundAddressAction({
            refundAddress: '0x0000000000000000000000000000000000000002',
          }),
        ).toEqual({
          action: ExtensionTypes.PnReferenceBased.ACTION.ADD_REFUND_ADDRESS,
          id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM,
          parameters: {
            refundAddress: '0x0000000000000000000000000000000000000002',
          },
        });
      });

      it('cannot createAddRefundAddressAction with payment address not an ethereum address', () => {
        // 'must throw'
        expect(() => {
          erc777StreamPaymentNetwork.createAddRefundAddressAction({
            refundAddress: 'not an ethereum address',
          });
        }).toThrowError("refundAddress 'not an ethereum address' is not a valid address");
      });
    });

    describe('applyActionToExtension', () => {
      describe('applyActionToExtension/unknown action', () => {
        it('cannot applyActionToExtensions of unknown action', () => {
          const unknownAction = Utils.deepCopy(DataERC777StreamAddData.actionAddPaymentAddress);
          unknownAction.action = 'unknown action' as any;
          // 'must throw'
          expect(() => {
            erc777StreamPaymentNetwork.applyActionToExtension(
              DataERC777StreamCreate.requestStateCreatedEmpty.extensions,
              unknownAction,
              DataERC777StreamCreate.requestStateCreatedEmpty,
              TestData.payeeRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError('Unknown action: unknown action');
        });

        it('cannot applyActionToExtensions of unknown id', () => {
          const unknownAction = Utils.deepCopy(DataERC777StreamAddData.actionAddPaymentAddress);
          unknownAction.id = 'unknown id' as any;
          // 'must throw'
          expect(() => {
            erc777StreamPaymentNetwork.applyActionToExtension(
              DataERC777StreamCreate.requestStateCreatedEmpty.extensions,
              unknownAction,
              DataERC777StreamCreate.requestStateCreatedEmpty,
              TestData.payeeRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError('The extension should be created before receiving any other action');
        });
      });

      describe('applyActionToExtension/create', () => {
        it('can applyActionToExtensions of creation', () => {
          // 'new extension state wrong'
          expect(
            erc777StreamPaymentNetwork.applyActionToExtension(
              DataERC777StreamCreate.requestStateNoExtensions.extensions,
              DataERC777StreamCreate.actionCreationFull,
              DataERC777StreamCreate.requestStateNoExtensions,
              TestData.otherIdRaw.identity,
              TestData.arbitraryTimestamp,
            ),
          ).toEqual(DataERC777StreamCreate.extensionFullState);
        });

        it('cannot applyActionToExtensions of creation with a previous state', () => {
          // 'must throw'
          expect(() => {
            erc777StreamPaymentNetwork.applyActionToExtension(
              DataERC777StreamCreate.requestFullStateCreated.extensions,
              DataERC777StreamCreate.actionCreationFull,
              DataERC777StreamCreate.requestFullStateCreated,
              TestData.otherIdRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError('This extension has already been created');
        });

        it('cannot applyActionToExtensions of creation on a non ERC777 request', () => {
          const requestCreatedNoExtension: RequestLogicTypes.IRequest = Utils.deepCopy(
            TestData.requestCreatedNoExtension,
          );
          requestCreatedNoExtension.currency = {
            type: RequestLogicTypes.CURRENCY.BTC,
            value: 'BTC',
          };
          // 'must throw'
          expect(() => {
            erc777StreamPaymentNetwork.applyActionToExtension(
              TestData.requestCreatedNoExtension.extensions,
              DataERC777StreamCreate.actionCreationFull,
              requestCreatedNoExtension,
              TestData.otherIdRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError('This extension can be used only on ERC777 requests');
        });

        it('cannot applyActionToExtensions of creation with payment address not valid', () => {
          const testnetPaymentAddress = Utils.deepCopy(DataERC777StreamCreate.actionCreationFull);
          testnetPaymentAddress.parameters.paymentAddress = DataERC777StreamAddData.invalidAddress;
          // 'must throw'
          expect(() => {
            erc777StreamPaymentNetwork.applyActionToExtension(
              DataERC777StreamCreate.requestStateNoExtensions.extensions,
              testnetPaymentAddress,
              DataERC777StreamCreate.requestStateNoExtensions,
              TestData.otherIdRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(
            `paymentAddress '${DataERC777StreamAddData.invalidAddress}' is not a valid address`,
          );
        });

        it('cannot applyActionToExtensions of creation with refund address not valid', () => {
          const testnetRefundAddress = Utils.deepCopy(DataERC777StreamCreate.actionCreationFull);
          testnetRefundAddress.parameters.refundAddress = DataERC777StreamAddData.invalidAddress;
          // 'must throw'
          expect(() => {
            erc777StreamPaymentNetwork.applyActionToExtension(
              DataERC777StreamCreate.requestStateNoExtensions.extensions,
              testnetRefundAddress,
              DataERC777StreamCreate.requestStateNoExtensions,
              TestData.otherIdRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(
            `refundAddress '${DataERC777StreamAddData.invalidAddress}' is not a valid address`,
          );
        });

        it('keeps the version used at creation', () => {
          const newState = erc777StreamPaymentNetwork.applyActionToExtension(
            {},
            { ...DataERC777StreamCreate.actionCreationFull, version: 'ABCD' },
            DataERC777StreamCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
          expect(newState[erc777StreamPaymentNetwork.extensionId].version).toBe('ABCD');
        });

        it('requires a version at creation', () => {
          expect(() => {
            erc777StreamPaymentNetwork.applyActionToExtension(
              {},
              { ...DataERC777StreamCreate.actionCreationFull, version: '' },
              DataERC777StreamCreate.requestStateNoExtensions,
              TestData.otherIdRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError('version is required at creation');
        });
      });

      describe('applyActionToExtension/addPaymentAddress', () => {
        it('can applyActionToExtensions of addPaymentAddress', () => {
          // 'new extension state wrong'
          expect(
            erc777StreamPaymentNetwork.applyActionToExtension(
              DataERC777StreamCreate.requestStateCreatedEmpty.extensions,
              DataERC777StreamAddData.actionAddPaymentAddress,
              DataERC777StreamCreate.requestStateCreatedEmpty,
              TestData.payeeRaw.identity,
              TestData.arbitraryTimestamp,
            ),
          ).toEqual(DataERC777StreamAddData.extensionStateWithPaymentAfterCreation);
        });

        it('cannot applyActionToExtensions of addPaymentAddress without a previous state', () => {
          // 'must throw'
          expect(() => {
            erc777StreamPaymentNetwork.applyActionToExtension(
              DataERC777StreamCreate.requestStateNoExtensions.extensions,
              DataERC777StreamAddData.actionAddPaymentAddress,
              DataERC777StreamCreate.requestStateNoExtensions,
              TestData.payeeRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`The extension should be created before receiving any other action`);
        });

        it('cannot applyActionToExtensions of addPaymentAddress without a payee', () => {
          const previousState = Utils.deepCopy(DataERC777StreamCreate.requestStateCreatedEmpty);
          previousState.payee = undefined;
          // 'must throw'
          expect(() => {
            erc777StreamPaymentNetwork.applyActionToExtension(
              previousState.extensions,
              DataERC777StreamAddData.actionAddPaymentAddress,
              previousState,
              TestData.payeeRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`The request must have a payee`);
        });

        it('cannot applyActionToExtensions of addPaymentAddress signed by someone else than the payee', () => {
          const previousState = Utils.deepCopy(DataERC777StreamCreate.requestStateCreatedEmpty);
          // 'must throw'
          expect(() => {
            erc777StreamPaymentNetwork.applyActionToExtension(
              previousState.extensions,
              DataERC777StreamAddData.actionAddPaymentAddress,
              previousState,
              TestData.payerRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`The signer must be the payee`);
        });

        it('cannot applyActionToExtensions of addPaymentAddress with payment address already given', () => {
          // 'must throw'
          expect(() => {
            erc777StreamPaymentNetwork.applyActionToExtension(
              DataERC777StreamCreate.requestFullStateCreated.extensions,
              DataERC777StreamAddData.actionAddPaymentAddress,
              DataERC777StreamCreate.requestFullStateCreated,
              TestData.payeeRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`Payment address already given`);
        });

        it('cannot applyActionToExtensions of addPaymentAddress with payment address not valid', () => {
          const testnetPaymentAddress = Utils.deepCopy(
            DataERC777StreamAddData.actionAddPaymentAddress,
          );
          testnetPaymentAddress.parameters.paymentAddress = DataERC777StreamAddData.invalidAddress;
          // 'must throw'
          expect(() => {
            erc777StreamPaymentNetwork.applyActionToExtension(
              DataERC777StreamCreate.requestStateCreatedEmpty.extensions,
              testnetPaymentAddress,
              DataERC777StreamCreate.requestStateCreatedEmpty,
              TestData.payeeRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(
            `paymentAddress '${DataERC777StreamAddData.invalidAddress}' is not a valid address`,
          );
        });
      });

      describe('applyActionToExtension/addRefundAddress', () => {
        it('can applyActionToExtensions of addRefundAddress', () => {
          // 'new extension state wrong'
          expect(
            erc777StreamPaymentNetwork.applyActionToExtension(
              DataERC777StreamCreate.requestStateCreatedEmpty.extensions,
              DataERC777StreamAddData.actionAddRefundAddress,
              DataERC777StreamCreate.requestStateCreatedEmpty,
              TestData.payerRaw.identity,
              TestData.arbitraryTimestamp,
            ),
          ).toEqual(DataERC777StreamAddData.extensionStateWithRefundAfterCreation);
        });

        it('cannot applyActionToExtensions of addRefundAddress without a previous state', () => {
          // 'must throw'
          expect(() => {
            erc777StreamPaymentNetwork.applyActionToExtension(
              DataERC777StreamCreate.requestStateNoExtensions.extensions,
              DataERC777StreamAddData.actionAddRefundAddress,
              DataERC777StreamCreate.requestStateNoExtensions,
              TestData.payerRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`The extension should be created before receiving any other action`);
        });

        it('cannot applyActionToExtensions of addRefundAddress without a payer', () => {
          const previousState = Utils.deepCopy(DataERC777StreamCreate.requestStateCreatedEmpty);
          previousState.payer = undefined;
          // 'must throw'
          expect(() => {
            erc777StreamPaymentNetwork.applyActionToExtension(
              previousState.extensions,
              DataERC777StreamAddData.actionAddRefundAddress,
              previousState,
              TestData.payerRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`The request must have a payer`);
        });

        it('cannot applyActionToExtensions of addRefundAddress signed by someone else than the payer', () => {
          const previousState = Utils.deepCopy(DataERC777StreamCreate.requestStateCreatedEmpty);
          // 'must throw'
          expect(() => {
            erc777StreamPaymentNetwork.applyActionToExtension(
              previousState.extensions,
              DataERC777StreamAddData.actionAddRefundAddress,
              previousState,
              TestData.payeeRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`The signer must be the payer`);
        });

        it('cannot applyActionToExtensions of addRefundAddress with payment address already given', () => {
          // 'must throw'
          expect(() => {
            erc777StreamPaymentNetwork.applyActionToExtension(
              DataERC777StreamCreate.requestFullStateCreated.extensions,
              DataERC777StreamAddData.actionAddRefundAddress,
              DataERC777StreamCreate.requestFullStateCreated,
              TestData.payerRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError(`Refund address already given`);
        });

        it('cannot applyActionToExtensions of addRefundAddress with refund address not valid', () => {
          const testnetPaymentAddress = Utils.deepCopy(
            DataERC777StreamAddData.actionAddRefundAddress,
          );
          testnetPaymentAddress.parameters.refundAddress = DataERC777StreamAddData.invalidAddress;
          // 'must throw'
          expect(() => {
            erc777StreamPaymentNetwork.applyActionToExtension(
              DataERC777StreamCreate.requestStateCreatedEmpty.extensions,
              testnetPaymentAddress,
              DataERC777StreamCreate.requestStateCreatedEmpty,
              TestData.payeeRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError('refundAddress is not a valid address');
        });
      });
    });

    describe('Subsequent Request creation', () => {
      const invalidCases = ['originalRequestId', 'previousRequestId', 'recurrenceNumber'];
      describe('createCreateAction', () => {
        it('Can create a create action for a subsequent request of a serie', () => {
          expect(
            erc777StreamPaymentNetwork.createCreationAction({
              originalRequestId: 'abcd',
              previousRequestId: 'efgh',
              recurrenceNumber: 2,
            }),
          ).toEqual({
            action: 'create',
            id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM,
            parameters: {
              originalRequestId: 'abcd',
              previousRequestId: 'efgh',
              recurrenceNumber: 2,
            },
            version: '0.1.0',
          });
        });

        it(`Can not create a subsequent request with invalid parameters - 1`, () => {
          expect(() =>
            erc777StreamPaymentNetwork.createCreationAction({
              originalRequestId: 'abcd',
              previousRequestId: 'abcd',
              recurrenceNumber: 2,
            }),
          ).toThrowError(
            'recurrenceNumber must be 1 if originalRequestId and previousRequestId are equal and vice versa',
          );
        });

        it(`Can not create a subsequent request with invalid parameters - 2`, () => {
          expect(() =>
            erc777StreamPaymentNetwork.createCreationAction({
              originalRequestId: 'abcd',
              previousRequestId: 'efgh',
              recurrenceNumber: 1,
            }),
          ).toThrowError(
            'recurrenceNumber must be 1 if originalRequestId and previousRequestId are equal and vice versa',
          );
        });
      });

      describe('applyCreateAction', () => {
        it('can applyActionToExtensions of creation', () => {
          expect(
            erc777StreamPaymentNetwork.applyActionToExtension(
              DataERC777StreamCreate.requestStateNoExtensions.extensions,
              DataERC777StreamCreate.actionCreationFullSubsequent,
              DataERC777StreamCreate.requestStateNoExtensions,
              TestData.otherIdRaw.identity,
              TestData.arbitraryTimestamp,
            ),
          ).toEqual(DataERC777StreamCreate.extensionFullStateSubsequent);
        });

        invalidCases.forEach((invalidCase) => {
          it(`Can not create a subsequent request with missing ${invalidCase}.`, () => {
            const badActionCreation = {
              ...DataERC777StreamCreate.actionCreationFullSubsequent,
              parameters: {
                originalRequestId: invalidCase === 'originalRequestId' ? undefined : 'abcd',
                previousRequestId: invalidCase === 'previousRequestId' ? undefined : 'efgh',
                recurrenceNumber: invalidCase === 'recurrenceNumber' ? undefined : 2,
              },
            };
            expect(() =>
              erc777StreamPaymentNetwork.applyActionToExtension(
                DataERC777StreamCreate.requestStateNoExtensions.extensions,
                badActionCreation,
                DataERC777StreamCreate.requestStateNoExtensions,
                TestData.otherIdRaw.identity,
                TestData.arbitraryTimestamp,
              ),
            ).toThrowError(`${invalidCase} is empty`);
          });
        });

        it(`Can not create a the first subsequent request with invalid parameters - 1`, () => {
          const badActionCreation = {
            ...DataERC777StreamCreate.actionCreationFullSubsequent,
            parameters: {
              originalRequestId: 'abcd',
              previousRequestId: 'abcd',
              recurrenceNumber: 2,
            },
          };
          expect(() =>
            erc777StreamPaymentNetwork.applyActionToExtension(
              DataERC777StreamCreate.requestStateNoExtensions.extensions,
              badActionCreation,
              DataERC777StreamCreate.requestStateNoExtensions,
              TestData.otherIdRaw.identity,
              TestData.arbitraryTimestamp,
            ),
          ).toThrowError(
            'recurrenceNumber must be 1 if originalRequestId and previousRequestId are equal and vice versa',
          );
        });

        it(`Can not create a subsequent request with invalid parameters - 2`, () => {
          const badActionCreation = {
            ...DataERC777StreamCreate.actionCreationFullSubsequent,
            parameters: {
              originalRequestId: 'abcd',
              previousRequestId: 'efgh',
              recurrenceNumber: 1,
            },
          };
          expect(() =>
            erc777StreamPaymentNetwork.applyActionToExtension(
              DataERC777StreamCreate.requestStateNoExtensions.extensions,
              badActionCreation,
              DataERC777StreamCreate.requestStateNoExtensions,
              TestData.otherIdRaw.identity,
              TestData.arbitraryTimestamp,
            ),
          ).toThrowError(
            'recurrenceNumber must be 1 if originalRequestId and previousRequestId are equal and vice versa',
          );
        });

        it('requires a version at creation', () => {
          const badActionCreation = {
            ...DataERC777StreamCreate.actionCreationFullSubsequent,
            version: undefined,
          };
          expect(() => {
            erc777StreamPaymentNetwork.applyActionToExtension(
              DataERC777StreamCreate.requestStateNoExtensions.extensions,
              badActionCreation,
              DataERC777StreamCreate.requestStateNoExtensions,
              TestData.otherIdRaw.identity,
              TestData.arbitraryTimestamp,
            );
          }).toThrowError('version is required at creation');
        });
      });
    });
  });
});
