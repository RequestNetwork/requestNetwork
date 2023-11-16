import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';

import * as DataERC20FeeAddData from '../../../utils/payment-network/erc20/fee-proxy-contract-add-data-generator';
import * as DataERC20FeeCreate from '../../../utils/payment-network/erc20/fee-proxy-contract-create-data-generator';
import * as DataNearERC20FeeCreate from '../../../utils/payment-network/erc20/near-fee-proxy-contract';
import * as TestData from '../../../utils/test-data-generator';
import { deepCopy } from '@requestnetwork/utils';
import { AdvancedLogic } from '../../../../src';
import { CurrencyManager } from '@requestnetwork/currency';

const advancedLogic = new AdvancedLogic(CurrencyManager.getDefault());

const erc20FeeProxyContract = advancedLogic.getFeeProxyContractErc20ForNetwork();

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('extensions/payment-network/erc20/fee-proxy-contract', () => {
  describe('createCreationAction', () => {
    it('can create a create action with all parameters', () => {
      expect(
        erc20FeeProxyContract.createCreationAction({
          feeAddress: '0x0000000000000000000000000000000000000001',
          feeAmount: '0',
          paymentAddress: '0x0000000000000000000000000000000000000002',
          refundAddress: '0x0000000000000000000000000000000000000003',
          salt: 'ea3bc7caf64110ca',
        }),
      ).toEqual({
        action: 'create',
        id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
        parameters: {
          feeAddress: '0x0000000000000000000000000000000000000001',
          feeAmount: '0',
          paymentAddress: '0x0000000000000000000000000000000000000002',
          refundAddress: '0x0000000000000000000000000000000000000003',
          salt: 'ea3bc7caf64110ca',
        },
        version: '0.2.0',
      });
    });

    it('can create a create action without fee parameters', () => {
      expect(
        erc20FeeProxyContract.createCreationAction({
          paymentAddress: '0x0000000000000000000000000000000000000001',
          refundAddress: '0x0000000000000000000000000000000000000002',
          salt: 'ea3bc7caf64110ca',
        }),
      ).toEqual({
        action: 'create',
        id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
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
        erc20FeeProxyContract.createCreationAction({
          salt: 'ea3bc7caf64110ca',
        }),
      ).toEqual({
        action: 'create',
        id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
        parameters: {
          salt: 'ea3bc7caf64110ca',
        },
        version: '0.2.0',
      });
    });

    it('cannot createCreationAction with an invalid payment address', () => {
      // 'must throw'
      expect(() => {
        erc20FeeProxyContract.createCreationAction({
          paymentAddress: 'not an ethereum address',
          refundAddress: '0x0000000000000000000000000000000000000002',
          salt: 'ea3bc7caf64110ca',
        });
      }).toThrowError("paymentAddress 'not an ethereum address' is not a valid address");
    });

    it('cannot createCreationAction with refund address not an ethereum address', () => {
      // 'must throw'
      expect(() => {
        erc20FeeProxyContract.createCreationAction({
          paymentAddress: '0x0000000000000000000000000000000000000001',
          refundAddress: 'not an ethereum address',
          salt: 'ea3bc7caf64110ca',
        });
      }).toThrowError("refundAddress 'not an ethereum address' is not a valid address");
    });

    it('cannot createCreationAction with fee address not an ethereum address', () => {
      // 'must throw'
      expect(() => {
        erc20FeeProxyContract.createCreationAction({
          feeAddress: 'not an ethereum address',
          paymentAddress: '0x0000000000000000000000000000000000000001',
          salt: 'ea3bc7caf64110ca',
        });
      }).toThrowError('feeAddress is not a valid address');
    });

    it('cannot createCreationAction with invalid fee amount', () => {
      // 'must throw'
      expect(() => {
        erc20FeeProxyContract.createCreationAction({
          feeAmount: '-20000',
          paymentAddress: '0x0000000000000000000000000000000000000001',
          salt: 'ea3bc7caf64110ca',
        });
      }).toThrowError('feeAmount is not a valid amount');
    });

    describe('on Near testnet', () => {
      const extension = advancedLogic.getFeeProxyContractErc20ForNetwork('near-testnet');
      it('can create a create action with all parameters', () => {
        expect(
          extension.createCreationAction({
            feeAddress: 'buidler.reqnetwork.testnet',
            feeAmount: '0',
            paymentAddress: 'issuer.reqnetwork.testnet',
            refundAddress: 'payer.reqnetwork.testnet',
            salt: 'ea3bc7caf64110ca',
          }),
        ).toEqual({
          action: 'create',
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
          parameters: {
            feeAddress: 'buidler.reqnetwork.testnet',
            feeAmount: '0',
            paymentAddress: 'issuer.reqnetwork.testnet',
            refundAddress: 'payer.reqnetwork.testnet',
            salt: 'ea3bc7caf64110ca',
          },
          version: 'NEAR-0.1.0',
        });
      });

      it('cannot createCreationAction with an invalid payment address', () => {
        expect(() => {
          extension.createCreationAction({
            paymentAddress: '0x0000000000000000000000000000000000000002',
            refundAddress: 'payer.reqnetwork.testnet',
            salt: 'ea3bc7caf64110ca',
          });
        }).toThrowError(
          "paymentAddress '0x0000000000000000000000000000000000000002' is not a valid address",
        );
      });
    });
  });

  describe('createAddPaymentAddressAction', () => {
    it('can createAddPaymentAddressAction', () => {
      expect(
        erc20FeeProxyContract.createAddPaymentAddressAction({
          paymentAddress: '0x0000000000000000000000000000000000000001',
        }),
      ).toEqual({
        action: ExtensionTypes.PnReferenceBased.ACTION.ADD_PAYMENT_ADDRESS,
        id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
        parameters: {
          paymentAddress: '0x0000000000000000000000000000000000000001',
        },
      });
    });

    it('cannot createAddPaymentAddressAction with payment address not an ethereum address', () => {
      // 'must throw'
      expect(() => {
        erc20FeeProxyContract.createAddPaymentAddressAction({
          paymentAddress: 'not an ethereum address',
        });
      }).toThrowError("paymentAddress 'not an ethereum address' is not a valid address");
    });
  });

  describe('createAddRefundAddressAction', () => {
    it('can createAddRefundAddressAction', () => {
      expect(
        erc20FeeProxyContract.createAddRefundAddressAction({
          refundAddress: '0x0000000000000000000000000000000000000002',
        }),
      ).toEqual({
        action: ExtensionTypes.PnReferenceBased.ACTION.ADD_REFUND_ADDRESS,
        id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
        parameters: {
          refundAddress: '0x0000000000000000000000000000000000000002',
        },
      });
    });

    it('cannot createAddRefundAddressAction with payment address not an ethereum address', () => {
      // 'must throw'
      expect(() => {
        erc20FeeProxyContract.createAddRefundAddressAction({
          refundAddress: 'not an ethereum address',
        });
      }).toThrowError("refundAddress 'not an ethereum address' is not a valid address");
    });
  });

  describe('createAddFeeAction', () => {
    it('can createAddFeeAction', () => {
      expect(
        erc20FeeProxyContract.createAddFeeAction({
          feeAddress: '0x0000000000000000000000000000000000000002',
          feeAmount: '2000',
        }),
      ).toEqual({
        action: ExtensionTypes.PnFeeReferenceBased.ACTION.ADD_FEE,
        id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
        parameters: {
          feeAddress: '0x0000000000000000000000000000000000000002',
          feeAmount: '2000',
        },
      });
    });

    it('cannot createAddFeeAddressAction with payment address not an ethereum address', () => {
      // 'must throw'
      expect(() => {
        erc20FeeProxyContract.createAddFeeAction({
          feeAddress: 'not an ethereum address',
          feeAmount: '2000',
        });
      }).toThrowError('feeAddress is not a valid address');
    });

    it('cannot createAddFeeAction with amount non positive integer', () => {
      // 'must throw'
      expect(() => {
        erc20FeeProxyContract.createAddFeeAction({
          feeAddress: '0x0000000000000000000000000000000000000002',
          feeAmount: '-30000',
        });
      }).toThrowError('feeAmount is not a valid amount');
    });
  });

  describe('applyActionToExtension', () => {
    describe('applyActionToExtension/unknown action', () => {
      it('cannot applyActionToExtensions of unknown action', () => {
        const unknownAction = deepCopy(DataERC20FeeAddData.actionAddPaymentAddress);
        unknownAction.action = 'unknown action' as any;
        // 'must throw'
        expect(() => {
          erc20FeeProxyContract.applyActionToExtension(
            DataERC20FeeCreate.requestStateCreatedEmpty.extensions,
            unknownAction,
            DataERC20FeeCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('Unknown action: unknown action');
      });

      it('cannot applyActionToExtensions of unknown id', () => {
        const unknownAction = deepCopy(DataERC20FeeAddData.actionAddPaymentAddress);
        unknownAction.id = 'unknown id' as any;
        // 'must throw'
        expect(() => {
          erc20FeeProxyContract.applyActionToExtension(
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
          erc20FeeProxyContract.applyActionToExtension(
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
          erc20FeeProxyContract.applyActionToExtension(
            DataERC20FeeCreate.requestFullStateCreated.extensions,
            DataERC20FeeCreate.actionCreationFull,
            DataERC20FeeCreate.requestFullStateCreated,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('This extension has already been created');
      });

      it('cannot applyActionToExtensions of creation on a non ERC20 request', () => {
        const requestCreatedNoExtension: RequestLogicTypes.IRequest = deepCopy(
          TestData.requestCreatedNoExtension,
        );
        requestCreatedNoExtension.currency = {
          type: RequestLogicTypes.CURRENCY.BTC,
          value: 'BTC',
        };
        // 'must throw'
        expect(() => {
          erc20FeeProxyContract.applyActionToExtension(
            TestData.requestCreatedNoExtension.extensions,
            DataERC20FeeCreate.actionCreationFull,
            requestCreatedNoExtension,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('This extension can be used only on ERC20 requests');
      });

      it('cannot applyActionToExtensions of creation with payment address not valid', () => {
        const testnetPaymentAddress = deepCopy(DataERC20FeeCreate.actionCreationFull);
        testnetPaymentAddress.parameters.paymentAddress = DataERC20FeeAddData.invalidAddress;
        // 'must throw'
        expect(() => {
          erc20FeeProxyContract.applyActionToExtension(
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
        const testnetRefundAddress = deepCopy(DataERC20FeeCreate.actionCreationFull);
        testnetRefundAddress.parameters.refundAddress = DataERC20FeeAddData.invalidAddress;
        // 'must throw'
        expect(() => {
          erc20FeeProxyContract.applyActionToExtension(
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
        const newState = erc20FeeProxyContract.applyActionToExtension(
          {},
          { ...DataERC20FeeCreate.actionCreationFull, version: 'ABCD' },
          DataERC20FeeCreate.requestStateNoExtensions,
          TestData.otherIdRaw.identity,
          TestData.arbitraryTimestamp,
        );
        expect(newState[erc20FeeProxyContract.extensionId].version).toBe('ABCD');
      });

      it('requires a version at creation', () => {
        expect(() => {
          erc20FeeProxyContract.applyActionToExtension(
            {},
            { ...DataERC20FeeCreate.actionCreationFull, version: '' },
            DataERC20FeeCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('version is required at creation');
      });

      describe('on Near testnet', () => {
        const extension = advancedLogic.getFeeProxyContractErc20ForNetwork('near-testnet');
        it('can applyActionToExtensions of creation', () => {
          expect(
            extension.applyActionToExtension(
              DataNearERC20FeeCreate.requestStateNoExtensions.extensions,
              DataNearERC20FeeCreate.actionCreationFull,
              DataNearERC20FeeCreate.requestStateNoExtensions,
              TestData.otherIdRaw.identity,
              TestData.arbitraryTimestamp,
            ),
          ).toEqual(DataNearERC20FeeCreate.extensionFullState);
        });
        it('cannot applyActionToExtensions of creation', () => {
          // 'new extension state wrong'
          expect(() =>
            extension.applyActionToExtension(
              // State with currency on the wrong network
              DataERC20FeeCreate.requestStateNoExtensions.extensions,
              DataNearERC20FeeCreate.actionCreationFull,
              DataERC20FeeCreate.requestStateNoExtensions,
              TestData.otherIdRaw.identity,
              TestData.arbitraryTimestamp,
            ),
          ).toThrowError(
            "Payment network 'mainnet' is not supported by this extension (only near-testnet)",
          );
        });
      });
    });

    describe('applyActionToExtension/addPaymentAddress', () => {
      it('can applyActionToExtensions of addPaymentAddress', () => {
        // 'new extension state wrong'
        expect(
          erc20FeeProxyContract.applyActionToExtension(
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
          erc20FeeProxyContract.applyActionToExtension(
            DataERC20FeeCreate.requestStateNoExtensions.extensions,
            DataERC20FeeAddData.actionAddPaymentAddress,
            DataERC20FeeCreate.requestStateNoExtensions,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });

      it('cannot applyActionToExtensions of addPaymentAddress without a payee', () => {
        const previousState = deepCopy(DataERC20FeeCreate.requestStateCreatedEmpty);
        previousState.payee = undefined;
        // 'must throw'
        expect(() => {
          erc20FeeProxyContract.applyActionToExtension(
            previousState.extensions,
            DataERC20FeeAddData.actionAddPaymentAddress,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payee`);
      });

      it('cannot applyActionToExtensions of addPaymentAddress signed by someone else than the payee', () => {
        const previousState = deepCopy(DataERC20FeeCreate.requestStateCreatedEmpty);
        // 'must throw'
        expect(() => {
          erc20FeeProxyContract.applyActionToExtension(
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
          erc20FeeProxyContract.applyActionToExtension(
            DataERC20FeeCreate.requestFullStateCreated.extensions,
            DataERC20FeeAddData.actionAddPaymentAddress,
            DataERC20FeeCreate.requestFullStateCreated,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`Payment address already given`);
      });

      it('cannot applyActionToExtensions of addPaymentAddress with payment address not valid', () => {
        const testnetPaymentAddress = deepCopy(DataERC20FeeAddData.actionAddPaymentAddress);
        testnetPaymentAddress.parameters.paymentAddress = DataERC20FeeAddData.invalidAddress;
        // 'must throw'
        expect(() => {
          erc20FeeProxyContract.applyActionToExtension(
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
          erc20FeeProxyContract.applyActionToExtension(
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
          erc20FeeProxyContract.applyActionToExtension(
            DataERC20FeeCreate.requestStateNoExtensions.extensions,
            DataERC20FeeAddData.actionAddRefundAddress,
            DataERC20FeeCreate.requestStateNoExtensions,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });

      it('cannot applyActionToExtensions of addRefundAddress without a payer', () => {
        const previousState = deepCopy(DataERC20FeeCreate.requestStateCreatedEmpty);
        previousState.payer = undefined;
        // 'must throw'
        expect(() => {
          erc20FeeProxyContract.applyActionToExtension(
            previousState.extensions,
            DataERC20FeeAddData.actionAddRefundAddress,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payer`);
      });

      it('cannot applyActionToExtensions of addRefundAddress signed by someone else than the payer', () => {
        const previousState = deepCopy(DataERC20FeeCreate.requestStateCreatedEmpty);
        // 'must throw'
        expect(() => {
          erc20FeeProxyContract.applyActionToExtension(
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
          erc20FeeProxyContract.applyActionToExtension(
            DataERC20FeeCreate.requestFullStateCreated.extensions,
            DataERC20FeeAddData.actionAddRefundAddress,
            DataERC20FeeCreate.requestFullStateCreated,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`Refund address already given`);
      });

      it('cannot applyActionToExtensions of addRefundAddress with refund address not valid', () => {
        const testnetPaymentAddress = deepCopy(DataERC20FeeAddData.actionAddRefundAddress);
        testnetPaymentAddress.parameters.refundAddress = DataERC20FeeAddData.invalidAddress;
        // 'must throw'
        expect(() => {
          erc20FeeProxyContract.applyActionToExtension(
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
          erc20FeeProxyContract.applyActionToExtension(
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
          erc20FeeProxyContract.applyActionToExtension(
            DataERC20FeeCreate.requestStateNoExtensions.extensions,
            DataERC20FeeAddData.actionAddFee,
            DataERC20FeeCreate.requestStateNoExtensions,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });

      it('cannot applyActionToExtensions of addFee without a payee', () => {
        const previousState = deepCopy(DataERC20FeeCreate.requestStateCreatedEmpty);
        previousState.payee = undefined;
        // 'must throw'
        expect(() => {
          erc20FeeProxyContract.applyActionToExtension(
            previousState.extensions,
            DataERC20FeeAddData.actionAddFee,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payee`);
      });

      it('cannot applyActionToExtensions of addFee signed by someone else than the payee', () => {
        const previousState = deepCopy(DataERC20FeeCreate.requestStateCreatedEmpty);
        // 'must throw'
        expect(() => {
          erc20FeeProxyContract.applyActionToExtension(
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
          erc20FeeProxyContract.applyActionToExtension(
            DataERC20FeeCreate.requestFullStateCreated.extensions,
            DataERC20FeeAddData.actionAddFee,
            DataERC20FeeCreate.requestFullStateCreated,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`Fee address already given`);
      });

      it('cannot applyActionToExtensions of addFee with fee address not valid', () => {
        const testnetPaymentAddress = deepCopy(DataERC20FeeAddData.actionAddFee);
        testnetPaymentAddress.parameters.feeAddress = DataERC20FeeAddData.invalidAddress;
        // 'must throw'
        expect(() => {
          erc20FeeProxyContract.applyActionToExtension(
            DataERC20FeeCreate.requestStateCreatedEmpty.extensions,
            testnetPaymentAddress,
            DataERC20FeeCreate.requestStateCreatedEmpty,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('feeAddress is not a valid address');
      });

      it('cannot applyActionToExtensions of addFee with fee amount not valid', () => {
        const testnetPaymentAddress = deepCopy(DataERC20FeeAddData.actionAddFee);
        testnetPaymentAddress.parameters.feeAmount = DataERC20FeeAddData.invalidAddress;
        // 'must throw'
        expect(() => {
          erc20FeeProxyContract.applyActionToExtension(
            DataERC20FeeCreate.requestStateCreatedEmpty.extensions,
            testnetPaymentAddress,
            DataERC20FeeCreate.requestStateCreatedEmpty,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('feeAmount is not a valid amount');
      });
    });
  });
});
