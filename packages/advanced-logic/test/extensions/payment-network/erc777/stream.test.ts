import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import Erc777StreamPaymentNetwork from '../../../../src/extensions/payment-network/erc777/stream';

import * as DataERC20FeeAddData from '../../../utils/payment-network/erc777/stream-add-data-generator';
import * as DataERC20FeeCreate from '../../../utils/payment-network/erc777/stream-create-data-generator';
import * as TestData from '../../../utils/test-data-generator';

const erc777StreamPaymentNetwork = new Erc777StreamPaymentNetwork();

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('extensions/payment-network/erc777/fee-proxy-contract', () => {
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
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT,
        parameters: {
          expectedFlowRate: '0x0000000000000000000000000000000000000001',
          expectedStartDate: '0',
          paymentAddress: '0x0000000000000000000000000000000000000002',
          refundAddress: '0x0000000000000000000000000000000000000003',
          salt: 'ea3bc7caf64110ca',
        },
        version: '0.2.0',
      });
    });

    it('can create a create action without fee parameters', () => {
      expect(
        erc777StreamPaymentNetwork.createCreationAction({
          paymentAddress: '0x0000000000000000000000000000000000000001',
          refundAddress: '0x0000000000000000000000000000000000000002',
          salt: 'ea3bc7caf64110ca',
        }),
      ).toEqual({
        action: 'create',
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT,
        parameters: {
          paymentAddress: '0x0000000000000000000000000000000000000001',
          refundAddress: '0x0000000000000000000000000000000000000002',
          salt: 'ea3bc7caf64110ca',
        },
        version: '0.2.0',
      });
    });

    it('can create a create action with only salt', () => {
      expect(
        erc777StreamPaymentNetwork.createCreationAction({
          salt: 'ea3bc7caf64110ca',
        }),
      ).toEqual({
        action: 'create',
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT,
        parameters: {
          salt: 'ea3bc7caf64110ca',
        },
        version: '0.2.0',
      });
    });

    it('cannot createCreationAction with payment address not an ethereum address', () => {
      // 'must throw'
      expect(() => {
        erc777StreamPaymentNetwork.createCreationAction({
          paymentAddress: 'not an ethereum address',
          refundAddress: '0x0000000000000000000000000000000000000002',
          salt: 'ea3bc7caf64110ca',
        });
      }).toThrowError("paymentAddress 'not an ethereum address' is not a valid address");
    });

    it('cannot createCreationAction with refund address not an ethereum address', () => {
      // 'must throw'
      expect(() => {
        erc777StreamPaymentNetwork.createCreationAction({
          paymentAddress: '0x0000000000000000000000000000000000000001',
          refundAddress: 'not an ethereum address',
          salt: 'ea3bc7caf64110ca',
        });
      }).toThrowError("refundAddress 'not an ethereum address' is not a valid address");
    });

    it('cannot createCreationAction with fee address not an ethereum address', () => {
      // 'must throw'
      expect(() => {
        erc777StreamPaymentNetwork.createCreationAction({
          expectedFlowRate: 'not an ethereum address',
          paymentAddress: '0x0000000000000000000000000000000000000001',
          salt: 'ea3bc7caf64110ca',
        });
      }).toThrowError('expectedFlowRate is not a valid address');
    });

    it('cannot createCreationAction with invalid fee amount', () => {
      // 'must throw'
      expect(() => {
        erc777StreamPaymentNetwork.createCreationAction({
          expectedStartDate: '-20000',
          paymentAddress: '0x0000000000000000000000000000000000000001',
          salt: 'ea3bc7caf64110ca',
        });
      }).toThrowError('expectedStartDate is not a valid amount');
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
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT,
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
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT,
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

  describe('createAddFeeAction', () => {
    it('can createAddFeeAction', () => {
      expect(
        erc777StreamPaymentNetwork.createAddFeeAction({
          expectedFlowRate: '0x0000000000000000000000000000000000000002',
          expectedStartDate: '2000',
        }),
      ).toEqual({
        action: ExtensionTypes.PnFeeReferenceBased.ACTION.ADD_FEE,
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT,
        parameters: {
          expectedFlowRate: '0x0000000000000000000000000000000000000002',
          expectedStartDate: '2000',
        },
      });
    });

    it('cannot createAddFeeAddressAction with payment address not an ethereum address', () => {
      // 'must throw'
      expect(() => {
        erc777StreamPaymentNetwork.createAddFeeAction({
          expectedFlowRate: 'not an ethereum address',
          expectedStartDate: '2000',
        });
      }).toThrowError('expectedFlowRate is not a valid address');
    });

    it('cannot createAddFeeAction with amount non positive integer', () => {
      // 'must throw'
      expect(() => {
        erc777StreamPaymentNetwork.createAddFeeAction({
          expectedFlowRate: '0x0000000000000000000000000000000000000002',
          expectedStartDate: '-30000',
        });
      }).toThrowError('expectedStartDate is not a valid amount');
    });
  });

  describe('applyActionToExtension', () => {
    describe('applyActionToExtension/unknown action', () => {
      it('cannot applyActionToExtensions of unknown action', () => {
        const unknownAction = Utils.deepCopy(DataERC20FeeAddData.actionAddPaymentAddress);
        unknownAction.action = 'unknown action' as any;
        // 'must throw'
        expect(() => {
          erc777StreamPaymentNetwork.applyActionToExtension(
            DataERC20FeeCreate.requestStateCreatedEmpty.extensions,
            unknownAction,
            DataERC20FeeCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('Unknown action: unknown action');
      });

      it('cannot applyActionToExtensions of unknown id', () => {
        const unknownAction = Utils.deepCopy(DataERC20FeeAddData.actionAddPaymentAddress);
        unknownAction.id = 'unknown id' as any;
        // 'must throw'
        expect(() => {
          erc777StreamPaymentNetwork.applyActionToExtension(
            DataERC20FeeCreate.requestStateCreatedEmpty.extensions,
            unknownAction,
            DataERC20FeeCreate.requestStateCreatedEmpty,
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
            DataERC20FeeCreate.requestStateNoExtensions.extensions,
            DataERC20FeeCreate.actionCreationFull,
            DataERC20FeeCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DataERC20FeeCreate.extensionFullState);
      });

      it('cannot applyActionToExtensions of creation with a previous state', () => {
        // 'must throw'
        expect(() => {
          erc777StreamPaymentNetwork.applyActionToExtension(
            DataERC20FeeCreate.requestFullStateCreated.extensions,
            DataERC20FeeCreate.actionCreationFull,
            DataERC20FeeCreate.requestFullStateCreated,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('This extension has already been created');
      });

      it('cannot applyActionToExtensions of creation on a non ERC20 request', () => {
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
            DataERC20FeeCreate.actionCreationFull,
            requestCreatedNoExtension,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('This extension can be used only on ERC20 requests');
      });

      it('cannot applyActionToExtensions of creation with payment address not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(DataERC20FeeCreate.actionCreationFull);
        testnetPaymentAddress.parameters.paymentAddress = DataERC20FeeAddData.invalidAddress;
        // 'must throw'
        expect(() => {
          erc777StreamPaymentNetwork.applyActionToExtension(
            DataERC20FeeCreate.requestStateNoExtensions.extensions,
            testnetPaymentAddress,
            DataERC20FeeCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(
          `paymentAddress '${DataERC20FeeAddData.invalidAddress}' is not a valid address`,
        );
      });

      it('cannot applyActionToExtensions of creation with refund address not valid', () => {
        const testnetRefundAddress = Utils.deepCopy(DataERC20FeeCreate.actionCreationFull);
        testnetRefundAddress.parameters.refundAddress = DataERC20FeeAddData.invalidAddress;
        // 'must throw'
        expect(() => {
          erc777StreamPaymentNetwork.applyActionToExtension(
            DataERC20FeeCreate.requestStateNoExtensions.extensions,
            testnetRefundAddress,
            DataERC20FeeCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(
          `refundAddress '${DataERC20FeeAddData.invalidAddress}' is not a valid address`,
        );
      });

      it('keeps the version used at creation', () => {
        const newState = erc777StreamPaymentNetwork.applyActionToExtension(
          {},
          { ...DataERC20FeeCreate.actionCreationFull, version: 'ABCD' },
          DataERC20FeeCreate.requestStateNoExtensions,
          TestData.otherIdRaw.identity,
          TestData.arbitraryTimestamp,
        );
        expect(newState[erc777StreamPaymentNetwork.extensionId].version).toBe('ABCD');
      });

      it('requires a version at creation', () => {
        expect(() => {
          erc777StreamPaymentNetwork.applyActionToExtension(
            {},
            { ...DataERC20FeeCreate.actionCreationFull, version: '' },
            DataERC20FeeCreate.requestStateNoExtensions,
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
            DataERC20FeeCreate.requestStateCreatedEmpty.extensions,
            DataERC20FeeAddData.actionAddPaymentAddress,
            DataERC20FeeCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DataERC20FeeAddData.extensionStateWithPaymentAfterCreation);
      });

      it('cannot applyActionToExtensions of addPaymentAddress without a previous state', () => {
        // 'must throw'
        expect(() => {
          erc777StreamPaymentNetwork.applyActionToExtension(
            DataERC20FeeCreate.requestStateNoExtensions.extensions,
            DataERC20FeeAddData.actionAddPaymentAddress,
            DataERC20FeeCreate.requestStateNoExtensions,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });

      it('cannot applyActionToExtensions of addPaymentAddress without a payee', () => {
        const previousState = Utils.deepCopy(DataERC20FeeCreate.requestStateCreatedEmpty);
        previousState.payee = undefined;
        // 'must throw'
        expect(() => {
          erc777StreamPaymentNetwork.applyActionToExtension(
            previousState.extensions,
            DataERC20FeeAddData.actionAddPaymentAddress,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payee`);
      });

      it('cannot applyActionToExtensions of addPaymentAddress signed by someone else than the payee', () => {
        const previousState = Utils.deepCopy(DataERC20FeeCreate.requestStateCreatedEmpty);
        // 'must throw'
        expect(() => {
          erc777StreamPaymentNetwork.applyActionToExtension(
            previousState.extensions,
            DataERC20FeeAddData.actionAddPaymentAddress,
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
            DataERC20FeeCreate.requestFullStateCreated.extensions,
            DataERC20FeeAddData.actionAddPaymentAddress,
            DataERC20FeeCreate.requestFullStateCreated,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`Payment address already given`);
      });

      it('cannot applyActionToExtensions of addPaymentAddress with payment address not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(DataERC20FeeAddData.actionAddPaymentAddress);
        testnetPaymentAddress.parameters.paymentAddress = DataERC20FeeAddData.invalidAddress;
        // 'must throw'
        expect(() => {
          erc777StreamPaymentNetwork.applyActionToExtension(
            DataERC20FeeCreate.requestStateCreatedEmpty.extensions,
            testnetPaymentAddress,
            DataERC20FeeCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(
          `paymentAddress '${DataERC20FeeAddData.invalidAddress}' is not a valid address`,
        );
      });
    });

    describe('applyActionToExtension/addRefundAddress', () => {
      it('can applyActionToExtensions of addRefundAddress', () => {
        // 'new extension state wrong'
        expect(
          erc777StreamPaymentNetwork.applyActionToExtension(
            DataERC20FeeCreate.requestStateCreatedEmpty.extensions,
            DataERC20FeeAddData.actionAddRefundAddress,
            DataERC20FeeCreate.requestStateCreatedEmpty,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DataERC20FeeAddData.extensionStateWithRefundAfterCreation);
      });

      it('cannot applyActionToExtensions of addRefundAddress without a previous state', () => {
        // 'must throw'
        expect(() => {
          erc777StreamPaymentNetwork.applyActionToExtension(
            DataERC20FeeCreate.requestStateNoExtensions.extensions,
            DataERC20FeeAddData.actionAddRefundAddress,
            DataERC20FeeCreate.requestStateNoExtensions,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });

      it('cannot applyActionToExtensions of addRefundAddress without a payer', () => {
        const previousState = Utils.deepCopy(DataERC20FeeCreate.requestStateCreatedEmpty);
        previousState.payer = undefined;
        // 'must throw'
        expect(() => {
          erc777StreamPaymentNetwork.applyActionToExtension(
            previousState.extensions,
            DataERC20FeeAddData.actionAddRefundAddress,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payer`);
      });

      it('cannot applyActionToExtensions of addRefundAddress signed by someone else than the payer', () => {
        const previousState = Utils.deepCopy(DataERC20FeeCreate.requestStateCreatedEmpty);
        // 'must throw'
        expect(() => {
          erc777StreamPaymentNetwork.applyActionToExtension(
            previousState.extensions,
            DataERC20FeeAddData.actionAddRefundAddress,
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
            DataERC20FeeCreate.requestFullStateCreated.extensions,
            DataERC20FeeAddData.actionAddRefundAddress,
            DataERC20FeeCreate.requestFullStateCreated,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`Refund address already given`);
      });

      it('cannot applyActionToExtensions of addRefundAddress with refund address not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(DataERC20FeeAddData.actionAddRefundAddress);
        testnetPaymentAddress.parameters.refundAddress = DataERC20FeeAddData.invalidAddress;
        // 'must throw'
        expect(() => {
          erc777StreamPaymentNetwork.applyActionToExtension(
            DataERC20FeeCreate.requestStateCreatedEmpty.extensions,
            testnetPaymentAddress,
            DataERC20FeeCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('refundAddress is not a valid address');
      });
    });

    describe('applyActionToExtension/addFee', () => {
      it('can applyActionToExtensions of addFee', () => {
        // 'new extension state wrong'
        expect(
          erc777StreamPaymentNetwork.applyActionToExtension(
            DataERC20FeeCreate.requestStateCreatedEmpty.extensions,
            DataERC20FeeAddData.actionAddFee,
            DataERC20FeeCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DataERC20FeeAddData.extensionStateWithFeeAfterCreation);
      });

      it('cannot applyActionToExtensions of addFee without a previous state', () => {
        // 'must throw'
        expect(() => {
          erc777StreamPaymentNetwork.applyActionToExtension(
            DataERC20FeeCreate.requestStateNoExtensions.extensions,
            DataERC20FeeAddData.actionAddFee,
            DataERC20FeeCreate.requestStateNoExtensions,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });

      it('cannot applyActionToExtensions of addFee without a payee', () => {
        const previousState = Utils.deepCopy(DataERC20FeeCreate.requestStateCreatedEmpty);
        previousState.payee = undefined;
        // 'must throw'
        expect(() => {
          erc777StreamPaymentNetwork.applyActionToExtension(
            previousState.extensions,
            DataERC20FeeAddData.actionAddFee,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payee`);
      });

      it('cannot applyActionToExtensions of addFee signed by someone else than the payee', () => {
        const previousState = Utils.deepCopy(DataERC20FeeCreate.requestStateCreatedEmpty);
        // 'must throw'
        expect(() => {
          erc777StreamPaymentNetwork.applyActionToExtension(
            previousState.extensions,
            DataERC20FeeAddData.actionAddFee,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payee`);
      });

      it('cannot applyActionToExtensions of addFee with fee data already given', () => {
        // 'must throw'
        expect(() => {
          erc777StreamPaymentNetwork.applyActionToExtension(
            DataERC20FeeCreate.requestFullStateCreated.extensions,
            DataERC20FeeAddData.actionAddFee,
            DataERC20FeeCreate.requestFullStateCreated,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`Fee address already given`);
      });

      it('cannot applyActionToExtensions of addFee with fee address not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(DataERC20FeeAddData.actionAddFee);
        testnetPaymentAddress.parameters.expectedFlowRate = DataERC20FeeAddData.invalidAddress;
        // 'must throw'
        expect(() => {
          erc777StreamPaymentNetwork.applyActionToExtension(
            DataERC20FeeCreate.requestStateCreatedEmpty.extensions,
            testnetPaymentAddress,
            DataERC20FeeCreate.requestStateCreatedEmpty,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('expectedFlowRate is not a valid address');
      });

      it('cannot applyActionToExtensions of addFee with fee amount not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(DataERC20FeeAddData.actionAddFee);
        testnetPaymentAddress.parameters.expectedStartDate = DataERC20FeeAddData.invalidAddress;
        // 'must throw'
        expect(() => {
          erc777StreamPaymentNetwork.applyActionToExtension(
            DataERC20FeeCreate.requestStateCreatedEmpty.extensions,
            testnetPaymentAddress,
            DataERC20FeeCreate.requestStateCreatedEmpty,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('expectedStartDate is not a valid amount');
      });
    });
  });
});
