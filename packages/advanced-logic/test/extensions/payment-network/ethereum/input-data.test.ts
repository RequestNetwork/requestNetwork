import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import ethereumInputData from '../../../../src/extensions/payment-network/ethereum/input-data';

import * as DataEthAddPaymentAddress from '../../../utils/payment-network/ethereum/add-payment-address-data-generator';
import * as DataEthCreate from '../../../utils/payment-network/ethereum/create-data-generator';
import * as TestData from '../../../utils/test-data-generator';

/* tslint:disable:no-unused-expression */
describe('extensions/payment-network/ethereum/input-data', () => {
  describe('createCreationAction', () => {
    it('can create a create action', () => {
      // 'extensionsdata is wrong'
      expect(
        ethereumInputData.createCreationAction({
          paymentAddress: '0x0000000000000000000000000000000000000001',
          refundAddress: '0x0000000000000000000000000000000000000002',
          salt: 'ea3bc7caf64110ca',
        }),
      ).toEqual({
        action: 'create',
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA,
        parameters: {
          paymentAddress: '0x0000000000000000000000000000000000000001',
          refundAddress: '0x0000000000000000000000000000000000000002',
          salt: 'ea3bc7caf64110ca',
        },
        version: '0.2.0',
      });
    });

    it('can create a create action with only salt', () => {
      // 'extensionsdata is wrong'
      expect(
        ethereumInputData.createCreationAction({
          salt: 'ea3bc7caf64110ca',
        }),
      ).toEqual({
        action: 'create',
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA,
        parameters: {
          salt: 'ea3bc7caf64110ca',
        },
        version: '0.2.0',
      });
    });

    it('cannot createCreationAction with payment address not an ethereum address', () => {
      // 'must throw'
      expect(() => {
        ethereumInputData.createCreationAction({
          paymentAddress: 'not an ethereum address',
          refundAddress: '0x0000000000000000000000000000000000000002',
          salt: 'ea3bc7caf64110ca',
        });
      }).toThrowError('paymentAddress is not a valid ethereum address');
    });

    it('cannot createCreationAction with refund address not an ethereum address', () => {
      // 'must throw'
      expect(() => {
        ethereumInputData.createCreationAction({
          paymentAddress: '0x0000000000000000000000000000000000000001',
          refundAddress: 'not an ethereum address',
          salt: 'ea3bc7caf64110ca',
        });
      }).toThrowError('refundAddress is not a valid ethereum address');
    });
  });

  describe('createAddPaymentAddressAction', () => {
    it('can createAddPaymentAddressAction', () => {
      // 'extensionsdata is wrong'
      expect(
        ethereumInputData.createAddPaymentAddressAction({
          paymentAddress: '0x0000000000000000000000000000000000000001',
        }),
      ).toEqual({
        action: ExtensionTypes.PnReferenceBased.ACTION.ADD_PAYMENT_ADDRESS,
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA,
        parameters: {
          paymentAddress: '0x0000000000000000000000000000000000000001',
        },
      });
    });

    it('cannot createAddPaymentAddressAction with payment address not an ethereum address', () => {
      // 'must throw'
      expect(() => {
        ethereumInputData.createAddPaymentAddressAction({
          paymentAddress: 'not an ethereum address',
        });
      }).toThrowError('paymentAddress is not a valid ethereum address');
    });
  });

  describe('createAddRefundAddressAction', () => {
    it('can createAddRefundAddressAction', () => {
      // 'extensionsdata is wrong'
      expect(
        ethereumInputData.createAddRefundAddressAction({
          refundAddress: '0x0000000000000000000000000000000000000002',
        }),
      ).toEqual({
        action: ExtensionTypes.PnReferenceBased.ACTION.ADD_REFUND_ADDRESS,
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA,
        parameters: {
          refundAddress: '0x0000000000000000000000000000000000000002',
        },
      });
    });
    it('cannot createAddRefundAddressAction with payment address not an ethereum address', () => {
      // 'must throw'
      expect(() => {
        ethereumInputData.createAddRefundAddressAction({
          refundAddress: 'not an ethereum address',
        });
      }).toThrowError('refundAddress is not a valid ethereum address');
    });
  });

  describe('applyActionToExtension', () => {
    describe('applyActionToExtension/unknown action', () => {
      it('cannot applyActionToExtensions of unknown action', () => {
        const unknownAction = Utils.deepCopy(DataEthAddPaymentAddress.actionAddPaymentAddress);
        unknownAction.action = 'unknown action';
        // 'must throw'
        expect(() => {
          ethereumInputData.applyActionToExtension(
            DataEthCreate.requestStateCreatedEmpty.extensions,
            unknownAction,
            DataEthCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('Unknown action: unknown action');
      });

      it('cannot applyActionToExtensions of unknown id', () => {
        const unknownAction = Utils.deepCopy(DataEthAddPaymentAddress.actionAddPaymentAddress);
        unknownAction.id = 'unknown id';
        // 'must throw'
        expect(() => {
          ethereumInputData.applyActionToExtension(
            DataEthCreate.requestStateCreatedEmpty.extensions,
            unknownAction,
            DataEthCreate.requestStateCreatedEmpty,
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
          ethereumInputData.applyActionToExtension(
            DataEthCreate.requestStateNoExtensions.extensions,
            DataEthCreate.actionCreationWithPaymentAndRefund,
            DataEthCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DataEthCreate.extensionStateWithPaymentAndRefund);
      });

      it('cannot applyActionToExtensions of creation with a previous state', () => {
        // 'must throw'
        expect(() => {
          ethereumInputData.applyActionToExtension(
            DataEthCreate.requestStateCreatedWithPaymentAndRefund.extensions,
            DataEthCreate.actionCreationWithPaymentAndRefund,
            DataEthCreate.requestStateCreatedWithPaymentAndRefund,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('This extension has already been created');
      });

      it('cannot applyActionToExtensions of creation on a not Eth request', () => {
        const requestCreatedNoExtension: RequestLogicTypes.IRequest = Utils.deepCopy(
          TestData.requestCreatedNoExtension,
        );
        requestCreatedNoExtension.currency = {
          type: RequestLogicTypes.CURRENCY.BTC,
          value: 'BTC',
        };
        // 'must throw'
        expect(() => {
          ethereumInputData.applyActionToExtension(
            TestData.requestCreatedNoExtension.extensions,
            DataEthCreate.actionCreationWithPaymentAndRefund,
            requestCreatedNoExtension,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('This extension can be used only on ETH request');
      });

      it('cannot applyActionToExtensions of creation with payment address not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(
          DataEthCreate.actionCreationWithPaymentAndRefund,
        );
        testnetPaymentAddress.parameters.paymentAddress = DataEthAddPaymentAddress.invalidAddress;
        // 'must throw'
        expect(() => {
          ethereumInputData.applyActionToExtension(
            DataEthCreate.requestStateNoExtensions.extensions,
            testnetPaymentAddress,
            DataEthCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('paymentAddress is not a valid address');
      });

      it('cannot applyActionToExtensions of creation with refund address not valid', () => {
        const testnetRefundAddress = Utils.deepCopy(
          DataEthCreate.actionCreationWithPaymentAndRefund,
        );
        testnetRefundAddress.parameters.refundAddress = DataEthAddPaymentAddress.invalidAddress;
        // 'must throw'
        expect(() => {
          ethereumInputData.applyActionToExtension(
            DataEthCreate.requestStateNoExtensions.extensions,
            testnetRefundAddress,
            DataEthCreate.requestStateNoExtensions,
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
          ethereumInputData.applyActionToExtension(
            DataEthCreate.requestStateCreatedEmpty.extensions,
            DataEthAddPaymentAddress.actionAddPaymentAddress,
            DataEthCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DataEthAddPaymentAddress.extensionStateWithPaymentAfterCreation);
      });
      it('cannot applyActionToExtensions of addPaymentAddress without a previous state', () => {
        // 'must throw'
        expect(() => {
          ethereumInputData.applyActionToExtension(
            DataEthCreate.requestStateNoExtensions.extensions,
            DataEthAddPaymentAddress.actionAddPaymentAddress,
            DataEthCreate.requestStateNoExtensions,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });
      it('cannot applyActionToExtensions of addPaymentAddress without a payee', () => {
        const previousState = Utils.deepCopy(DataEthCreate.requestStateCreatedEmpty);
        previousState.payee = undefined;
        // 'must throw'
        expect(() => {
          ethereumInputData.applyActionToExtension(
            previousState.extensions,
            DataEthAddPaymentAddress.actionAddPaymentAddress,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payee`);
      });
      it('cannot applyActionToExtensions of addPaymentAddress signed by someone else than the payee', () => {
        const previousState = Utils.deepCopy(DataEthCreate.requestStateCreatedEmpty);
        // 'must throw'
        expect(() => {
          ethereumInputData.applyActionToExtension(
            previousState.extensions,
            DataEthAddPaymentAddress.actionAddPaymentAddress,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payee`);
      });
      it('cannot applyActionToExtensions of addPaymentAddress with payment address already given', () => {
        // 'must throw'
        expect(() => {
          ethereumInputData.applyActionToExtension(
            DataEthCreate.requestStateCreatedWithPaymentAndRefund.extensions,
            DataEthAddPaymentAddress.actionAddPaymentAddress,
            DataEthCreate.requestStateCreatedWithPaymentAndRefund,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`Payment address already given`);
      });
      it('cannot applyActionToExtensions of addPaymentAddress with payment address not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(
          DataEthAddPaymentAddress.actionAddPaymentAddress,
        );
        testnetPaymentAddress.parameters.paymentAddress = DataEthAddPaymentAddress.invalidAddress;
        // 'must throw'
        expect(() => {
          ethereumInputData.applyActionToExtension(
            DataEthCreate.requestStateCreatedEmpty.extensions,
            testnetPaymentAddress,
            DataEthCreate.requestStateCreatedEmpty,
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
          ethereumInputData.applyActionToExtension(
            DataEthCreate.requestStateCreatedEmpty.extensions,
            DataEthAddPaymentAddress.actionAddRefundAddress,
            DataEthCreate.requestStateCreatedEmpty,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DataEthAddPaymentAddress.extensionStateWithRefundAfterCreation);
      });
      it('cannot applyActionToExtensions of addRefundAddress without a previous state', () => {
        // 'must throw'
        expect(() => {
          ethereumInputData.applyActionToExtension(
            DataEthCreate.requestStateNoExtensions.extensions,
            DataEthAddPaymentAddress.actionAddRefundAddress,
            DataEthCreate.requestStateNoExtensions,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });
      it('cannot applyActionToExtensions of addRefundAddress without a payer', () => {
        const previousState = Utils.deepCopy(DataEthCreate.requestStateCreatedEmpty);
        previousState.payer = undefined;
        // 'must throw'
        expect(() => {
          ethereumInputData.applyActionToExtension(
            previousState.extensions,
            DataEthAddPaymentAddress.actionAddRefundAddress,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payer`);
      });
      it('cannot applyActionToExtensions of addRefundAddress signed by someone else than the payer', () => {
        const previousState = Utils.deepCopy(DataEthCreate.requestStateCreatedEmpty);
        // 'must throw'
        expect(() => {
          ethereumInputData.applyActionToExtension(
            previousState.extensions,
            DataEthAddPaymentAddress.actionAddRefundAddress,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payer`);
      });
      it('cannot applyActionToExtensions of addRefundAddress with payment address already given', () => {
        // 'must throw'
        expect(() => {
          ethereumInputData.applyActionToExtension(
            DataEthCreate.requestStateCreatedWithPaymentAndRefund.extensions,
            DataEthAddPaymentAddress.actionAddRefundAddress,
            DataEthCreate.requestStateCreatedWithPaymentAndRefund,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`Refund address already given`);
      });
      it('cannot applyActionToExtensions of addRefundAddress with refund address not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(
          DataEthAddPaymentAddress.actionAddRefundAddress,
        );
        testnetPaymentAddress.parameters.refundAddress = DataEthAddPaymentAddress.invalidAddress;
        // 'must throw'
        expect(() => {
          ethereumInputData.applyActionToExtension(
            DataEthCreate.requestStateCreatedEmpty.extensions,
            testnetPaymentAddress,
            DataEthCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('refundAddress is not a valid address');
      });
    });
  });
});
