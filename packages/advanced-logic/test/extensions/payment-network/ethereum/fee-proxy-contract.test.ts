import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import EthereumFeeProxyContract from '../../../../src/extensions/payment-network/ethereum/fee-proxy-contract';

import * as DataEthFeeAddData from '../../../utils/payment-network/ethereum/fee-proxy-contract-add-data-generator';
import * as DataEthFeeCreate from '../../../utils/payment-network/ethereum/fee-proxy-contract-create-data-generator';
import * as TestData from '../../../utils/test-data-generator';

const ethFeeProxyContract = new EthereumFeeProxyContract();

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('extensions/payment-network/ethereum/fee-proxy-contract', () => {
  describe('createCreationAction', () => {
    it('can create a create action with all parameters', () => {
      // 'extension data is wrong'
      expect(
        ethFeeProxyContract.createCreationAction({
          feeAddress: '0x0000000000000000000000000000000000000001',
          feeAmount: '0',
          paymentAddress: '0x0000000000000000000000000000000000000002',
          refundAddress: '0x0000000000000000000000000000000000000003',
          salt: 'ea3bc7caf64110ca',
        }),
      ).toEqual({
        action: 'create',
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ETH_FEE_PROXY_CONTRACT,
        parameters: {
          feeAddress: '0x0000000000000000000000000000000000000001',
          feeAmount: '0',
          paymentAddress: '0x0000000000000000000000000000000000000002',
          refundAddress: '0x0000000000000000000000000000000000000003',
          salt: 'ea3bc7caf64110ca',
        },
        version: '0.1.0',
      });
    });

    it('can create a create action without fee parameters', () => {
      // 'extension data is wrong'
      expect(
        ethFeeProxyContract.createCreationAction({
          paymentAddress: '0x0000000000000000000000000000000000000001',
          refundAddress: '0x0000000000000000000000000000000000000002',
          salt: 'ea3bc7caf64110ca',
        }),
      ).toEqual({
        action: 'create',
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ETH_FEE_PROXY_CONTRACT,
        parameters: {
          paymentAddress: '0x0000000000000000000000000000000000000001',
          refundAddress: '0x0000000000000000000000000000000000000002',
          salt: 'ea3bc7caf64110ca',
        },
        version: '0.1.0',
      });
    });

    it('can create a create action with only salt', () => {
      // 'extension data is wrong'
      expect(
        ethFeeProxyContract.createCreationAction({
          salt: 'ea3bc7caf64110ca',
        }),
      ).toEqual({
        action: 'create',
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ETH_FEE_PROXY_CONTRACT,
        parameters: {
          salt: 'ea3bc7caf64110ca',
        },
        version: '0.1.0',
      });
    });

    it('cannot createCreationAction with payment address not an ethereum address', () => {
      // 'must throw'
      expect(() => {
        ethFeeProxyContract.createCreationAction({
          paymentAddress: 'not an ethereum address',
          refundAddress: '0x0000000000000000000000000000000000000002',
          salt: 'ea3bc7caf64110ca',
        });
      }).toThrowError("paymentAddress 'not an ethereum address' is not a valid address");
    });

    it('cannot createCreationAction with refund address not an ethereum address', () => {
      // 'must throw'
      expect(() => {
        ethFeeProxyContract.createCreationAction({
          paymentAddress: '0x0000000000000000000000000000000000000001',
          refundAddress: 'not an ethereum address',
          salt: 'ea3bc7caf64110ca',
        });
      }).toThrowError("refundAddress 'not an ethereum address' is not a valid address");
    });

    it('cannot createCreationAction with fee address not an ethereum address', () => {
      // 'must throw'
      expect(() => {
        ethFeeProxyContract.createCreationAction({
          feeAddress: 'not an ethereum address',
          paymentAddress: '0x0000000000000000000000000000000000000001',
          salt: 'ea3bc7caf64110ca',
        });
      }).toThrowError('feeAddress is not a valid address');
    });

    it('cannot createCreationAction with invalid fee amount', () => {
      // 'must throw'
      expect(() => {
        ethFeeProxyContract.createCreationAction({
          feeAmount: '-20000',
          paymentAddress: '0x0000000000000000000000000000000000000001',
          salt: 'ea3bc7caf64110ca',
        });
      }).toThrowError('feeAmount is not a valid amount');
    });
  });

  describe('createAddPaymentAddressAction', () => {
    it('can createAddPaymentAddressAction', () => {
      // 'extension data is wrong'
      expect(
        ethFeeProxyContract.createAddPaymentAddressAction({
          paymentAddress: '0x0000000000000000000000000000000000000001',
        }),
      ).toEqual({
        action: ExtensionTypes.PnReferenceBased.ACTION.ADD_PAYMENT_ADDRESS,
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ETH_FEE_PROXY_CONTRACT,
        parameters: {
          paymentAddress: '0x0000000000000000000000000000000000000001',
        },
      });
    });

    it('cannot createAddPaymentAddressAction with payment address not an ethereum address', () => {
      // 'must throw'
      expect(() => {
        ethFeeProxyContract.createAddPaymentAddressAction({
          paymentAddress: 'not an ethereum address',
        });
      }).toThrowError("paymentAddress 'not an ethereum address' is not a valid address");
    });
  });

  describe('createAddRefundAddressAction', () => {
    it('can createAddRefundAddressAction', () => {
      // 'extension data is wrong'
      expect(
        ethFeeProxyContract.createAddRefundAddressAction({
          refundAddress: '0x0000000000000000000000000000000000000002',
        }),
      ).toEqual({
        action: ExtensionTypes.PnReferenceBased.ACTION.ADD_REFUND_ADDRESS,
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ETH_FEE_PROXY_CONTRACT,
        parameters: {
          refundAddress: '0x0000000000000000000000000000000000000002',
        },
      });
    });

    it('cannot createAddRefundAddressAction with payment address not an ethereum address', () => {
      // 'must throw'
      expect(() => {
        ethFeeProxyContract.createAddRefundAddressAction({
          refundAddress: 'not an ethereum address',
        });
      }).toThrowError("refundAddress 'not an ethereum address' is not a valid address");
    });
  });

  describe('createAddFeeAction', () => {
    it('can createAddFeeAction', () => {
      // 'extension data is wrong'
      expect(
        ethFeeProxyContract.createAddFeeAction({
          feeAddress: '0x0000000000000000000000000000000000000002',
          feeAmount: '2000',
        }),
      ).toEqual({
        action: ExtensionTypes.PnFeeReferenceBased.ACTION.ADD_FEE,
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ETH_FEE_PROXY_CONTRACT,
        parameters: {
          feeAddress: '0x0000000000000000000000000000000000000002',
          feeAmount: '2000',
        },
      });
    });

    it('cannot createAddFeeAddressAction with payment address not an ethereum address', () => {
      // 'must throw'
      expect(() => {
        ethFeeProxyContract.createAddFeeAction({
          feeAddress: 'not an ethereum address',
          feeAmount: '2000',
        });
      }).toThrowError('feeAddress is not a valid address');
    });

    it('cannot createAddFeeAction with amount non positive integer', () => {
      // 'must throw'
      expect(() => {
        ethFeeProxyContract.createAddFeeAction({
          feeAddress: '0x0000000000000000000000000000000000000002',
          feeAmount: '-30000',
        });
      }).toThrowError('feeAmount is not a valid amount');
    });
  });

  describe('applyActionToExtension', () => {
    describe('applyActionToExtension/unknown action', () => {
      it('cannot applyActionToExtensions of unknown action', () => {
        const unknownAction = Utils.deepCopy(DataEthFeeAddData.actionAddPaymentAddress);
        unknownAction.action = 'unknown action' as any;
        // 'must throw'
        expect(() => {
          ethFeeProxyContract.applyActionToExtension(
            DataEthFeeCreate.requestStateCreatedEmpty.extensions,
            unknownAction,
            DataEthFeeCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('Unknown action: unknown action');
      });

      it('cannot applyActionToExtensions of unknown id', () => {
        const unknownAction = Utils.deepCopy(DataEthFeeAddData.actionAddPaymentAddress);
        unknownAction.id = 'unknown id' as any;
        // 'must throw'
        expect(() => {
          ethFeeProxyContract.applyActionToExtension(
            DataEthFeeCreate.requestStateCreatedEmpty.extensions,
            unknownAction,
            DataEthFeeCreate.requestStateCreatedEmpty,
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
          ethFeeProxyContract.applyActionToExtension(
            DataEthFeeCreate.requestStateNoExtensions.extensions,
            DataEthFeeCreate.actionCreationFull,
            DataEthFeeCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DataEthFeeCreate.extensionFullState);
      });

      it('cannot applyActionToExtensions of creation with a previous state', () => {
        // 'must throw'
        expect(() => {
          ethFeeProxyContract.applyActionToExtension(
            DataEthFeeCreate.requestFullStateCreated.extensions,
            DataEthFeeCreate.actionCreationFull,
            DataEthFeeCreate.requestFullStateCreated,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('This extension has already been created');
      });

      it('cannot applyActionToExtensions of creation on a non ETH request', () => {
        const requestCreatedNoExtension: RequestLogicTypes.IRequest = Utils.deepCopy(
          TestData.requestCreatedNoExtension,
        );
        requestCreatedNoExtension.currency = {
          type: RequestLogicTypes.CURRENCY.BTC,
          value: 'BTC',
        };
        // 'must throw'
        expect(() => {
          ethFeeProxyContract.applyActionToExtension(
            TestData.requestCreatedNoExtension.extensions,
            DataEthFeeCreate.actionCreationFull,
            requestCreatedNoExtension,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('This extension can be used only on ETH requests');
      });

      it('cannot applyActionToExtensions of creation with payment address not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(DataEthFeeCreate.actionCreationFull);
        testnetPaymentAddress.parameters.paymentAddress = DataEthFeeAddData.invalidAddress;
        // 'must throw'
        expect(() => {
          ethFeeProxyContract.applyActionToExtension(
            DataEthFeeCreate.requestStateNoExtensions.extensions,
            testnetPaymentAddress,
            DataEthFeeCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(
          `paymentAddress '${DataEthFeeAddData.invalidAddress}' is not a valid address`,
        );
      });

      it('cannot applyActionToExtensions of creation with refund address not valid', () => {
        const testnetRefundAddress = Utils.deepCopy(DataEthFeeCreate.actionCreationFull);
        testnetRefundAddress.parameters.refundAddress = DataEthFeeAddData.invalidAddress;
        // 'must throw'
        expect(() => {
          ethFeeProxyContract.applyActionToExtension(
            DataEthFeeCreate.requestStateNoExtensions.extensions,
            testnetRefundAddress,
            DataEthFeeCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(
          `refundAddress '${DataEthFeeAddData.invalidAddress}' is not a valid address`,
        );
      });

      it('keeps the version used at creation', () => {
        const newState = ethFeeProxyContract.applyActionToExtension(
          {},
          { ...DataEthFeeCreate.actionCreationFull, version: 'ABCD' },
          DataEthFeeCreate.requestStateNoExtensions,
          TestData.otherIdRaw.identity,
          TestData.arbitraryTimestamp,
        );
        expect(newState[ethFeeProxyContract.extensionId].version).toBe('ABCD');
      });

      it('requires a version at creation', () => {
        expect(() => {
          ethFeeProxyContract.applyActionToExtension(
            {},
            { ...DataEthFeeCreate.actionCreationFull, version: '' },
            DataEthFeeCreate.requestStateNoExtensions,
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
          ethFeeProxyContract.applyActionToExtension(
            DataEthFeeCreate.requestStateCreatedEmpty.extensions,
            DataEthFeeAddData.actionAddPaymentAddress,
            DataEthFeeCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DataEthFeeAddData.extensionStateWithPaymentAfterCreation);
      });

      it('cannot applyActionToExtensions of addPaymentAddress without a previous state', () => {
        // 'must throw'
        expect(() => {
          ethFeeProxyContract.applyActionToExtension(
            DataEthFeeCreate.requestStateNoExtensions.extensions,
            DataEthFeeAddData.actionAddPaymentAddress,
            DataEthFeeCreate.requestStateNoExtensions,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });

      it('cannot applyActionToExtensions of addPaymentAddress without a payee', () => {
        const previousState = Utils.deepCopy(DataEthFeeCreate.requestStateCreatedEmpty);
        previousState.payee = undefined;
        // 'must throw'
        expect(() => {
          ethFeeProxyContract.applyActionToExtension(
            previousState.extensions,
            DataEthFeeAddData.actionAddPaymentAddress,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payee`);
      });

      it('cannot applyActionToExtensions of addPaymentAddress signed by someone else than the payee', () => {
        const previousState = Utils.deepCopy(DataEthFeeCreate.requestStateCreatedEmpty);
        // 'must throw'
        expect(() => {
          ethFeeProxyContract.applyActionToExtension(
            previousState.extensions,
            DataEthFeeAddData.actionAddPaymentAddress,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payee`);
      });

      it('cannot applyActionToExtensions of addPaymentAddress with payment address already given', () => {
        // 'must throw'
        expect(() => {
          ethFeeProxyContract.applyActionToExtension(
            DataEthFeeCreate.requestFullStateCreated.extensions,
            DataEthFeeAddData.actionAddPaymentAddress,
            DataEthFeeCreate.requestFullStateCreated,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`Payment address already given`);
      });

      it('cannot applyActionToExtensions of addPaymentAddress with payment address not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(DataEthFeeAddData.actionAddPaymentAddress);
        testnetPaymentAddress.parameters.paymentAddress = DataEthFeeAddData.invalidAddress;
        // 'must throw'
        expect(() => {
          ethFeeProxyContract.applyActionToExtension(
            DataEthFeeCreate.requestStateCreatedEmpty.extensions,
            testnetPaymentAddress,
            DataEthFeeCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(
          `paymentAddress '${DataEthFeeAddData.invalidAddress}' is not a valid address`,
        );
      });
    });

    describe('applyActionToExtension/addRefundAddress', () => {
      it('can applyActionToExtensions of addRefundAddress', () => {
        // 'new extension state wrong'
        expect(
          ethFeeProxyContract.applyActionToExtension(
            DataEthFeeCreate.requestStateCreatedEmpty.extensions,
            DataEthFeeAddData.actionAddRefundAddress,
            DataEthFeeCreate.requestStateCreatedEmpty,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DataEthFeeAddData.extensionStateWithRefundAfterCreation);
      });

      it('cannot applyActionToExtensions of addRefundAddress without a previous state', () => {
        // 'must throw'
        expect(() => {
          ethFeeProxyContract.applyActionToExtension(
            DataEthFeeCreate.requestStateNoExtensions.extensions,
            DataEthFeeAddData.actionAddRefundAddress,
            DataEthFeeCreate.requestStateNoExtensions,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });

      it('cannot applyActionToExtensions of addRefundAddress without a payer', () => {
        const previousState = Utils.deepCopy(DataEthFeeCreate.requestStateCreatedEmpty);
        previousState.payer = undefined;
        // 'must throw'
        expect(() => {
          ethFeeProxyContract.applyActionToExtension(
            previousState.extensions,
            DataEthFeeAddData.actionAddRefundAddress,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payer`);
      });

      it('cannot applyActionToExtensions of addRefundAddress signed by someone else than the payer', () => {
        const previousState = Utils.deepCopy(DataEthFeeCreate.requestStateCreatedEmpty);
        // 'must throw'
        expect(() => {
          ethFeeProxyContract.applyActionToExtension(
            previousState.extensions,
            DataEthFeeAddData.actionAddRefundAddress,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payer`);
      });

      it('cannot applyActionToExtensions of addRefundAddress with payment address already given', () => {
        // 'must throw'
        expect(() => {
          ethFeeProxyContract.applyActionToExtension(
            DataEthFeeCreate.requestFullStateCreated.extensions,
            DataEthFeeAddData.actionAddRefundAddress,
            DataEthFeeCreate.requestFullStateCreated,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`Refund address already given`);
      });

      it('cannot applyActionToExtensions of addRefundAddress with refund address not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(DataEthFeeAddData.actionAddRefundAddress);
        testnetPaymentAddress.parameters.refundAddress = DataEthFeeAddData.invalidAddress;
        // 'must throw'
        expect(() => {
          ethFeeProxyContract.applyActionToExtension(
            DataEthFeeCreate.requestStateCreatedEmpty.extensions,
            testnetPaymentAddress,
            DataEthFeeCreate.requestStateCreatedEmpty,
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
          ethFeeProxyContract.applyActionToExtension(
            DataEthFeeCreate.requestStateCreatedEmpty.extensions,
            DataEthFeeAddData.actionAddFee,
            DataEthFeeCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DataEthFeeAddData.extensionStateWithFeeAfterCreation);
      });

      it('cannot applyActionToExtensions of addFee without a previous state', () => {
        // 'must throw'
        expect(() => {
          ethFeeProxyContract.applyActionToExtension(
            DataEthFeeCreate.requestStateNoExtensions.extensions,
            DataEthFeeAddData.actionAddFee,
            DataEthFeeCreate.requestStateNoExtensions,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });

      it('cannot applyActionToExtensions of addFee without a payee', () => {
        const previousState = Utils.deepCopy(DataEthFeeCreate.requestStateCreatedEmpty);
        previousState.payee = undefined;
        // 'must throw'
        expect(() => {
          ethFeeProxyContract.applyActionToExtension(
            previousState.extensions,
            DataEthFeeAddData.actionAddFee,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payee`);
      });

      it('cannot applyActionToExtensions of addFee signed by someone else than the payee', () => {
        const previousState = Utils.deepCopy(DataEthFeeCreate.requestStateCreatedEmpty);
        // 'must throw'
        expect(() => {
          ethFeeProxyContract.applyActionToExtension(
            previousState.extensions,
            DataEthFeeAddData.actionAddFee,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payee`);
      });

      it('cannot applyActionToExtensions of addFee with fee data already given', () => {
        // 'must throw'
        expect(() => {
          ethFeeProxyContract.applyActionToExtension(
            DataEthFeeCreate.requestFullStateCreated.extensions,
            DataEthFeeAddData.actionAddFee,
            DataEthFeeCreate.requestFullStateCreated,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`Fee address already given`);
      });

      it('cannot applyActionToExtensions of addFee with fee address not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(DataEthFeeAddData.actionAddFee);
        testnetPaymentAddress.parameters.feeAddress = DataEthFeeAddData.invalidAddress;
        // 'must throw'
        expect(() => {
          ethFeeProxyContract.applyActionToExtension(
            DataEthFeeCreate.requestStateCreatedEmpty.extensions,
            testnetPaymentAddress,
            DataEthFeeCreate.requestStateCreatedEmpty,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('feeAddress is not a valid address');
      });

      it('cannot applyActionToExtensions of addFee with fee amount not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(DataEthFeeAddData.actionAddFee);
        testnetPaymentAddress.parameters.feeAmount = DataEthFeeAddData.invalidAddress;
        // 'must throw'
        expect(() => {
          ethFeeProxyContract.applyActionToExtension(
            DataEthFeeCreate.requestStateCreatedEmpty.extensions,
            testnetPaymentAddress,
            DataEthFeeCreate.requestStateCreatedEmpty,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('feeAmount is not a valid amount');
      });
    });
  });
});
