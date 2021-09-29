import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import AnyToEthProxy from '../../../src/extensions/payment-network/any-to-eth-proxy';
import * as DataConversionETHFeeAddData from '../../utils/payment-network/ethereum/any-to-eth-proxy-add-data-generator';
import * as DataConversionETHFeeCreate from '../../utils/payment-network/ethereum/any-to-eth-proxy-create-data-generator';
import * as TestData from '../../utils/test-data-generator';

const anyToEthProxy = new AnyToEthProxy();

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('extensions/payment-network/ethereum/any-to-eth-fee-proxy-contract', () => {
  describe('createCreationAction', () => {
    it('can create a create action with all parameters', () => {
      // 'extension data is wrong'
      expect(
        anyToEthProxy.createCreationAction({
          feeAddress: '0x0000000000000000000000000000000000000001',
          feeAmount: '0',
          paymentAddress: '0x0000000000000000000000000000000000000002',
          refundAddress: '0x0000000000000000000000000000000000000003',
          salt: 'ea3bc7caf64110ca',
          network: 'rinkeby',
          maxRateTimespan: 1000000,
        }),
      ).toEqual({
        action: 'create',
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ETH_PROXY,
        parameters: {
          feeAddress: '0x0000000000000000000000000000000000000001',
          feeAmount: '0',
          paymentAddress: '0x0000000000000000000000000000000000000002',
          refundAddress: '0x0000000000000000000000000000000000000003',
          salt: 'ea3bc7caf64110ca',
          network: 'rinkeby',
          maxRateTimespan: 1000000,
        },
        version: '0.1.0',
      });
    });

    it('can create a create action without fee parameters', () => {
      // 'extension data is wrong'
      expect(
        anyToEthProxy.createCreationAction({
          paymentAddress: '0x0000000000000000000000000000000000000001',
          refundAddress: '0x0000000000000000000000000000000000000002',
          salt: 'ea3bc7caf64110ca',
          network: 'rinkeby',
          
        }),
      ).toEqual({
        action: 'create',
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ETH_PROXY,
        parameters: {
          paymentAddress: '0x0000000000000000000000000000000000000001',
          refundAddress: '0x0000000000000000000000000000000000000002',
          salt: 'ea3bc7caf64110ca',
          network: 'rinkeby',
          
        },
        version: '0.1.0',
      });
    });

    it('cannot createCreationAction with payment address not an ethereum address', () => {
      // 'must throw'
      expect(() => {
        anyToEthProxy.createCreationAction({
          paymentAddress: 'not an ethereum address',
          refundAddress: '0x0000000000000000000000000000000000000002',
          
          network: 'rinkeby',
          salt: 'ea3bc7caf64110ca',
        });
      }).toThrowError("paymentAddress 'not an ethereum address' is not a valid address");
    });

    it('cannot createCreationAction with refund address not an ethereum address', () => {
      // 'must throw'
      expect(() => {
        anyToEthProxy.createCreationAction({
          paymentAddress: '0x0000000000000000000000000000000000000001',
          
          network: 'rinkeby',
          refundAddress: 'not an ethereum address',
          salt: 'ea3bc7caf64110ca',
        });
      }).toThrowError("refundAddress 'not an ethereum address' is not a valid address");
    });

    it('cannot createCreationAction with fee address not an ethereum address', () => {
      // 'must throw'
      expect(() => {
        anyToEthProxy.createCreationAction({
          feeAddress: 'not an ethereum address',
          paymentAddress: '0x0000000000000000000000000000000000000001',
          
          network: 'rinkeby',
          salt: 'ea3bc7caf64110ca',
        });
      }).toThrowError('feeAddress is not a valid address');
    });

    it('cannot createCreationAction with invalid fee amount', () => {
      // 'must throw'
      expect(() => {
        anyToEthProxy.createCreationAction({
          feeAmount: '-20000',
          paymentAddress: '0x0000000000000000000000000000000000000001',
          
          network: 'rinkeby',
          salt: 'ea3bc7caf64110ca',
        });
      }).toThrowError('feeAmount is not a valid amount');
    });

    it('cannot createCreationAction with network not supported', () => {
      // 'must throw'
      expect(() => {
        anyToEthProxy.createCreationAction({
          paymentAddress: '0x0000000000000000000000000000000000000001',
          salt: 'ea3bc7caf64110ca',
          network: 'kovan',
        });
      }).toThrowError('network kovan not supported');
    });

    it('cannot applyActionToExtensions of creation on a non supported currency', () => {
      const requestCreatedNoExtension: RequestLogicTypes.IRequest = Utils.deepCopy(
        TestData.requestCreatedNoExtension,
      );
      requestCreatedNoExtension.currency = {
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      };

      const action: ExtensionTypes.IAction = Utils.deepCopy(
        DataConversionETHFeeCreate.actionCreationFull,
      );
      action.parameters.network = 'invalid network';

      // 'must throw'
      expect(() => {
        anyToEthProxy.applyActionToExtension(
          TestData.requestCreatedNoExtension.extensions,
          action,
          requestCreatedNoExtension,
          TestData.otherIdRaw.identity,
          TestData.arbitraryTimestamp,
        );
      }).toThrowError(`The network (invalid network) is not supported for this payment network.`);
    });

    it('cannot applyActionToExtensions of creation on a non supported currency', () => {
      const requestCreatedNoExtension: RequestLogicTypes.IRequest = Utils.deepCopy(
        TestData.requestCreatedNoExtension,
      );
      requestCreatedNoExtension.currency = {
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'invalid value',
      };

      const action: ExtensionTypes.IAction = Utils.deepCopy(
        DataConversionETHFeeCreate.actionCreationFull,
      );

      // 'must throw'
      expect(() => {
        anyToEthProxy.applyActionToExtension(
          TestData.requestCreatedNoExtension.extensions,
          action,
          requestCreatedNoExtension,
          TestData.otherIdRaw.identity,
          TestData.arbitraryTimestamp,
        );
      }).toThrowError(
        `The currency (invalid value) of the request is not supported for this payment network.`,
      );
    });
  });

  describe('createAddPaymentAddressAction', () => {
    it('can createAddPaymentAddressAction', () => {
      // 'extension data is wrong'
      expect(
        anyToEthProxy.createAddPaymentAddressAction({
          paymentAddress: '0x0000000000000000000000000000000000000001',
        }),
      ).toEqual({
        action: ExtensionTypes.PnReferenceBased.ACTION.ADD_PAYMENT_ADDRESS,
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ETH_PROXY,
        parameters: {
          paymentAddress: '0x0000000000000000000000000000000000000001',
        },
      });
    });

    it('cannot createAddPaymentAddressAction with payment address not an ethereum address', () => {
      // 'must throw'
      expect(() => {
        anyToEthProxy.createAddPaymentAddressAction({
          paymentAddress: 'not an ethereum address',
        });
      }).toThrowError("paymentAddress 'not an ethereum address' is not a valid address");
    });
  });

  describe('createAddRefundAddressAction', () => {
    it('can createAddRefundAddressAction', () => {
      // 'extension data is wrong'
      expect(
        anyToEthProxy.createAddRefundAddressAction({
          refundAddress: '0x0000000000000000000000000000000000000002',
        }),
      ).toEqual({
        action: ExtensionTypes.PnReferenceBased.ACTION.ADD_REFUND_ADDRESS,
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ETH_PROXY,
        parameters: {
          refundAddress: '0x0000000000000000000000000000000000000002',
        },
      });
    });

    it('cannot createAddRefundAddressAction with payment address not an ethereum address', () => {
      // 'must throw'
      expect(() => {
        anyToEthProxy.createAddRefundAddressAction({
          refundAddress: 'not an ethereum address',
        });
      }).toThrowError("refundAddress 'not an ethereum address' is not a valid address");
    });
  });

  describe('createAddFeeAction', () => {
    it('can createAddFeeAction', () => {
      // 'extension data is wrong'
      expect(
        anyToEthProxy.createAddFeeAction({
          feeAddress: '0x0000000000000000000000000000000000000002',
          feeAmount: '2000',
        }),
      ).toEqual({
        action: ExtensionTypes.PnFeeReferenceBased.ACTION.ADD_FEE,
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ETH_PROXY,
        parameters: {
          feeAddress: '0x0000000000000000000000000000000000000002',
          feeAmount: '2000',
        },
      });
    });

    it('cannot createAddFeeAddressAction with payment address not an ethereum address', () => {
      // 'must throw'
      expect(() => {
        anyToEthProxy.createAddFeeAction({
          feeAddress: 'not an ethereum address',
          feeAmount: '2000',
        });
      }).toThrowError('feeAddress is not a valid address');
    });

    it('cannot createAddFeeAction with amount non positive integer', () => {
      // 'must throw'
      expect(() => {
        anyToEthProxy.createAddFeeAction({
          feeAddress: '0x0000000000000000000000000000000000000002',
          feeAmount: '-30000',
        });
      }).toThrowError('feeAmount is not a valid amount');
    });
  });

  describe('applyActionToExtension', () => {
    describe('applyActionToExtension/unknown action', () => {
      it('cannot applyActionToExtensions of unknown action', () => {
        const unknownAction = Utils.deepCopy(DataConversionETHFeeAddData.actionAddPaymentAddress);
        unknownAction.action = 'unknown action' as any;
        // 'must throw'
        expect(() => {
          anyToEthProxy.applyActionToExtension(
            DataConversionETHFeeCreate.requestStateCreatedEmpty.extensions,
            unknownAction,
            DataConversionETHFeeCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('Unknown action: unknown action');
      });

      it('cannot applyActionToExtensions of unknown id', () => {
        const unknownAction = Utils.deepCopy(DataConversionETHFeeAddData.actionAddPaymentAddress);
        unknownAction.id = 'unknown id' as any;
        // 'must throw'
        expect(() => {
          anyToEthProxy.applyActionToExtension(
            DataConversionETHFeeCreate.requestStateCreatedEmpty.extensions,
            unknownAction,
            DataConversionETHFeeCreate.requestStateCreatedEmpty,
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
          anyToEthProxy.applyActionToExtension(
            DataConversionETHFeeCreate.requestStateNoExtensions.extensions,
            DataConversionETHFeeCreate.actionCreationFull,
            DataConversionETHFeeCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DataConversionETHFeeCreate.extensionFullState);
      });

      it('can applyActionToExtensions of creation when address is checksumed', () => {
        const request = Utils.deepCopy(DataConversionETHFeeCreate.requestStateNoExtensions);

        request.currency = {
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x4E15361FD6b4BB609Fa63C81A2be19d873717870', // FTM
          network: 'mainnet',
        };

        expect(
          anyToEthProxy.applyActionToExtension(
            request.extensions,
            DataConversionETHFeeCreate.actionCreationFull,
            request,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DataConversionETHFeeCreate.extensionFullState);
      });

      it('cannot applyActionToExtensions of creation with a previous state', () => {
        // 'must throw'
        expect(() => {
          anyToEthProxy.applyActionToExtension(
            DataConversionETHFeeCreate.requestFullStateCreated.extensions,
            DataConversionETHFeeCreate.actionCreationFull,
            DataConversionETHFeeCreate.requestFullStateCreated,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('This extension has already been created');
      });

      it('cannot applyActionToExtensions of creation on a non supported currency', () => {
        const requestCreatedNoExtension: RequestLogicTypes.IRequest = Utils.deepCopy(
          TestData.requestCreatedNoExtension,
        );
        requestCreatedNoExtension.currency = {
          type: RequestLogicTypes.CURRENCY.BTC,
          value: 'BTC',
        };
        // 'must throw'
        expect(() => {
          anyToEthProxy.applyActionToExtension(
            TestData.requestCreatedNoExtension.extensions,
            DataConversionETHFeeCreate.actionCreationFull,
            requestCreatedNoExtension,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(
          'The currency (BTC) of the request is not supported for this payment network.',
        );
      });

      it('cannot applyActionToExtensions of creation with payment address not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(
          DataConversionETHFeeCreate.actionCreationFull,
        );
        testnetPaymentAddress.parameters.paymentAddress =
          DataConversionETHFeeAddData.invalidAddress;
        // 'must throw'
        expect(() => {
          anyToEthProxy.applyActionToExtension(
            DataConversionETHFeeCreate.requestStateNoExtensions.extensions,
            testnetPaymentAddress,
            DataConversionETHFeeCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(
          `paymentAddress '${DataConversionETHFeeAddData.invalidAddress}' is not a valid address`,
        );
      });

      it('cannot applyActionToExtensions of creation with refund address not valid', () => {
        const testnetRefundAddress = Utils.deepCopy(
          DataConversionETHFeeCreate.actionCreationFull,
        );
        testnetRefundAddress.parameters.refundAddress =
          DataConversionETHFeeAddData.invalidAddress;
        // 'must throw'
        expect(() => {
          anyToEthProxy.applyActionToExtension(
            DataConversionETHFeeCreate.requestStateNoExtensions.extensions,
            testnetRefundAddress,
            DataConversionETHFeeCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(
          `refundAddress '${DataConversionETHFeeAddData.invalidAddress}' is not a valid address`,
        );
      });
      it('keeps the version used at creation', () => {
        const newState = anyToEthProxy.applyActionToExtension(
          {},
          { ...DataConversionETHFeeCreate.actionCreationFull, version: 'ABCD' },
          DataConversionETHFeeCreate.requestStateNoExtensions,
          TestData.otherIdRaw.identity,
          TestData.arbitraryTimestamp,
        );
        expect(newState[anyToEthProxy.extensionId].version).toBe('ABCD');
      });

      it('requires a version at creation', () => {
        expect(() => {
          anyToEthProxy.applyActionToExtension(
            {},
            { ...DataConversionETHFeeCreate.actionCreationFull, version: '' },
            DataConversionETHFeeCreate.requestStateNoExtensions,
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
          anyToEthProxy.applyActionToExtension(
            DataConversionETHFeeCreate.requestStateCreatedEmpty.extensions,
            DataConversionETHFeeAddData.actionAddPaymentAddress,
            DataConversionETHFeeCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DataConversionETHFeeAddData.extensionStateWithPaymentAfterCreation);
      });

      it('cannot applyActionToExtensions of addPaymentAddress without a previous state', () => {
        // 'must throw'
        expect(() => {
          anyToEthProxy.applyActionToExtension(
            DataConversionETHFeeCreate.requestStateNoExtensions.extensions,
            DataConversionETHFeeAddData.actionAddPaymentAddress,
            DataConversionETHFeeCreate.requestStateNoExtensions,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });

      it('cannot applyActionToExtensions of addPaymentAddress without a payee', () => {
        const previousState = Utils.deepCopy(DataConversionETHFeeCreate.requestStateCreatedEmpty);
        previousState.payee = undefined;
        // 'must throw'
        expect(() => {
          anyToEthProxy.applyActionToExtension(
            previousState.extensions,
            DataConversionETHFeeAddData.actionAddPaymentAddress,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payee`);
      });

      it('cannot applyActionToExtensions of addPaymentAddress signed by someone else than the payee', () => {
        const previousState = Utils.deepCopy(DataConversionETHFeeCreate.requestStateCreatedEmpty);
        // 'must throw'
        expect(() => {
          anyToEthProxy.applyActionToExtension(
            previousState.extensions,
            DataConversionETHFeeAddData.actionAddPaymentAddress,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payee`);
      });

      it('cannot applyActionToExtensions of addPaymentAddress with payment address already given', () => {
        // 'must throw'
        expect(() => {
          anyToEthProxy.applyActionToExtension(
            DataConversionETHFeeCreate.requestFullStateCreated.extensions,
            DataConversionETHFeeAddData.actionAddPaymentAddress,
            DataConversionETHFeeCreate.requestFullStateCreated,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`Payment address already given`);
      });

      it('cannot applyActionToExtensions of addPaymentAddress with payment address not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(
          DataConversionETHFeeAddData.actionAddPaymentAddress,
        );
        testnetPaymentAddress.parameters.paymentAddress =
          DataConversionETHFeeAddData.invalidAddress;
        // 'must throw'
        expect(() => {
          anyToEthProxy.applyActionToExtension(
            DataConversionETHFeeCreate.requestStateCreatedEmpty.extensions,
            testnetPaymentAddress,
            DataConversionETHFeeCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(
          `paymentAddress '${DataConversionETHFeeAddData.invalidAddress}' is not a valid address`,
        );
      });
    });

    describe('applyActionToExtension/addRefundAddress', () => {
      it('can applyActionToExtensions of addRefundAddress', () => {
        // 'new extension state wrong'
        expect(
          anyToEthProxy.applyActionToExtension(
            DataConversionETHFeeCreate.requestStateCreatedEmpty.extensions,
            DataConversionETHFeeAddData.actionAddRefundAddress,
            DataConversionETHFeeCreate.requestStateCreatedEmpty,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DataConversionETHFeeAddData.extensionStateWithRefundAfterCreation);
      });

      it('cannot applyActionToExtensions of addRefundAddress without a previous state', () => {
        // 'must throw'
        expect(() => {
          anyToEthProxy.applyActionToExtension(
            DataConversionETHFeeCreate.requestStateNoExtensions.extensions,
            DataConversionETHFeeAddData.actionAddRefundAddress,
            DataConversionETHFeeCreate.requestStateNoExtensions,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });

      it('cannot applyActionToExtensions of addRefundAddress without a payer', () => {
        const previousState = Utils.deepCopy(DataConversionETHFeeCreate.requestStateCreatedEmpty);
        previousState.payer = undefined;
        // 'must throw'
        expect(() => {
          anyToEthProxy.applyActionToExtension(
            previousState.extensions,
            DataConversionETHFeeAddData.actionAddRefundAddress,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payer`);
      });

      it('cannot applyActionToExtensions of addRefundAddress signed by someone else than the payer', () => {
        const previousState = Utils.deepCopy(DataConversionETHFeeCreate.requestStateCreatedEmpty);
        // 'must throw'
        expect(() => {
          anyToEthProxy.applyActionToExtension(
            previousState.extensions,
            DataConversionETHFeeAddData.actionAddRefundAddress,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payer`);
      });

      it('cannot applyActionToExtensions of addRefundAddress with payment address already given', () => {
        // 'must throw'
        expect(() => {
          anyToEthProxy.applyActionToExtension(
            DataConversionETHFeeCreate.requestFullStateCreated.extensions,
            DataConversionETHFeeAddData.actionAddRefundAddress,
            DataConversionETHFeeCreate.requestFullStateCreated,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`Refund address already given`);
      });

      it('cannot applyActionToExtensions of addRefundAddress with refund address not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(
          DataConversionETHFeeAddData.actionAddRefundAddress,
        );
        testnetPaymentAddress.parameters.refundAddress =
          DataConversionETHFeeAddData.invalidAddress;
        // 'must throw'
        expect(() => {
          anyToEthProxy.applyActionToExtension(
            DataConversionETHFeeCreate.requestStateCreatedEmpty.extensions,
            testnetPaymentAddress,
            DataConversionETHFeeCreate.requestStateCreatedEmpty,
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
          anyToEthProxy.applyActionToExtension(
            DataConversionETHFeeCreate.requestStateCreatedEmpty.extensions,
            DataConversionETHFeeAddData.actionAddFee,
            DataConversionETHFeeCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DataConversionETHFeeAddData.extensionStateWithFeeAfterCreation);
      });

      it('cannot applyActionToExtensions of addFee without a previous state', () => {
        expect(() => {
          anyToEthProxy.applyActionToExtension(
            DataConversionETHFeeCreate.requestStateNoExtensions.extensions,
            DataConversionETHFeeAddData.actionAddFee,
            DataConversionETHFeeCreate.requestStateNoExtensions,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });

      it('cannot applyActionToExtensions of addFee without a payee', () => {
        const previousState = Utils.deepCopy(DataConversionETHFeeCreate.requestStateCreatedEmpty);
        previousState.payee = undefined;
        expect(() => {
          anyToEthProxy.applyActionToExtension(
            previousState.extensions,
            DataConversionETHFeeAddData.actionAddFee,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payee`);
      });

      it('cannot applyActionToExtensions of addFee signed by someone else than the payee', () => {
        const previousState = Utils.deepCopy(DataConversionETHFeeCreate.requestStateCreatedEmpty);
        expect(() => {
          anyToEthProxy.applyActionToExtension(
            previousState.extensions,
            DataConversionETHFeeAddData.actionAddFee,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payee`);
      });

      it('cannot applyActionToExtensions of addFee with fee data already given', () => {
        expect(() => {
          anyToEthProxy.applyActionToExtension(
            DataConversionETHFeeCreate.requestFullStateCreated.extensions,
            DataConversionETHFeeAddData.actionAddFee,
            DataConversionETHFeeCreate.requestFullStateCreated,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`Fee address already given`);
      });

      it('cannot applyActionToExtensions of addFee with fee address not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(DataConversionETHFeeAddData.actionAddFee);
        testnetPaymentAddress.parameters.feeAddress = DataConversionETHFeeAddData.invalidAddress;
        expect(() => {
          anyToEthProxy.applyActionToExtension(
            DataConversionETHFeeCreate.requestStateCreatedEmpty.extensions,
            testnetPaymentAddress,
            DataConversionETHFeeCreate.requestStateCreatedEmpty,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('feeAddress is not a valid address');
      });

      it('cannot applyActionToExtensions of addFee with fee amount not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(DataConversionETHFeeAddData.actionAddFee);
        testnetPaymentAddress.parameters.feeAmount = 'invalid amount';
        expect(() => {
          anyToEthProxy.applyActionToExtension(
            DataConversionETHFeeCreate.requestStateCreatedEmpty.extensions,
            testnetPaymentAddress,
            DataConversionETHFeeCreate.requestStateCreatedEmpty,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('feeAmount is not a valid amount');
      });
    });
  });
});
