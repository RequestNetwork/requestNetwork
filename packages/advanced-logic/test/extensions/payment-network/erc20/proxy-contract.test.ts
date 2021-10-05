import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import Erc20ProxyContract from '../../../../src/extensions/payment-network/erc20/proxy-contract';

import * as DataERC20AddPaymentAddress from '../../../utils/payment-network/erc20/proxy-contract-add-payment-address-data-generator';
import * as DataERC20Create from '../../../utils/payment-network/erc20/proxy-contract-create-data-generator';
import * as TestData from '../../../utils/test-data-generator';

const erc20ProxyContract = new Erc20ProxyContract();

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('extensions/payment-network/erc20/proxy-contract', () => {
  describe('createCreationAction', () => {
    it('can create a create action', () => {
      // 'extensionsdata is wrong'
      expect(
        erc20ProxyContract.createCreationAction({
          paymentAddress: '0x0000000000000000000000000000000000000001',
          refundAddress: '0x0000000000000000000000000000000000000002',
          salt: 'ea3bc7caf64110ca',
        }),
      ).toEqual({
        action: 'create',
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT,
        parameters: {
          paymentAddress: '0x0000000000000000000000000000000000000001',
          refundAddress: '0x0000000000000000000000000000000000000002',
          salt: 'ea3bc7caf64110ca',
        },
        version: '0.1.0',
      });
    });

    it('can create a create action with only salt', () => {
      // 'extensionsdata is wrong'
      expect(
        erc20ProxyContract.createCreationAction({
          salt: 'ea3bc7caf64110ca',
        }),
      ).toEqual({
        action: 'create',
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT,
        parameters: {
          salt: 'ea3bc7caf64110ca',
        },
        version: '0.1.0',
      });
    });

    it('cannot createCreationAction with payment address not an ethereum address', () => {
      // 'must throw'
      expect(() => {
        erc20ProxyContract.createCreationAction({
          paymentAddress: 'not an ethereum address',
          refundAddress: '0x0000000000000000000000000000000000000002',
          salt: 'ea3bc7caf64110ca',
        });
      }).toThrowError("paymentAddress 'not an ethereum address' is not a valid address");
    });

    it('cannot createCreationAction with refund address not an ethereum address', () => {
      // 'must throw'
      expect(() => {
        erc20ProxyContract.createCreationAction({
          paymentAddress: '0x0000000000000000000000000000000000000001',
          refundAddress: 'not an ethereum address',
          salt: 'ea3bc7caf64110ca',
        });
      }).toThrowError("refundAddress 'not an ethereum address' is not a valid address");
    });
  });

  describe('createAddPaymentAddressAction', () => {
    it('can createAddPaymentAddressAction', () => {
      // 'extensionsdata is wrong'
      expect(
        erc20ProxyContract.createAddPaymentAddressAction({
          paymentAddress: '0x0000000000000000000000000000000000000001',
        }),
      ).toEqual({
        action: ExtensionTypes.PnReferenceBased.ACTION.ADD_PAYMENT_ADDRESS,
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT,
        parameters: {
          paymentAddress: '0x0000000000000000000000000000000000000001',
        },
      });
    });

    it('cannot createAddPaymentAddressAction with payment address not an ethereum address', () => {
      // 'must throw'
      expect(() => {
        erc20ProxyContract.createAddPaymentAddressAction({
          paymentAddress: 'not an ethereum address',
        });
      }).toThrowError("paymentAddress 'not an ethereum address' is not a valid address");
    });
  });

  describe('createAddRefundAddressAction', () => {
    it('can createAddRefundAddressAction', () => {
      // 'extensionsdata is wrong'
      expect(
        erc20ProxyContract.createAddRefundAddressAction({
          refundAddress: '0x0000000000000000000000000000000000000002',
        }),
      ).toEqual({
        action: ExtensionTypes.PnReferenceBased.ACTION.ADD_REFUND_ADDRESS,
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT,
        parameters: {
          refundAddress: '0x0000000000000000000000000000000000000002',
        },
      });
    });
    it('cannot createAddRefundAddressAction with payment address not an ethereum address', () => {
      // 'must throw'
      expect(() => {
        erc20ProxyContract.createAddRefundAddressAction({
          refundAddress: 'not an ethereum address',
        });
      }).toThrowError("refundAddress 'not an ethereum address' is not a valid address");
    });
  });

  describe('createDeclarePaymentAction', () => {
    it('can createDeclarePaymentAction', () => {
      expect(
        erc20ProxyContract.createDeclarePaymentAction({
          amount: '1000000000000',
          txHash: 'some-transaction-hash'
        }),
      ).toEqual({
        action: ExtensionTypes.PnReferenceBased.ACTION.DECLARE_PAYMENT,
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT,
        parameters: {
          amount: '1000000000000',
          txHash: 'some-transaction-hash',
        },
      });
    });

    it('cannot createDeclarePaymentAction if amount is empty', () => {
      expect(() => erc20ProxyContract.createDeclarePaymentAction({
          amount: '',
          txHash: 'some-transaction-hash'
        }),
      ).toThrowError('amount is required');
    });

    it('cannot createDeclarePaymentAction if amount is not valid', () => {
      expect(() => erc20ProxyContract.createDeclarePaymentAction({
        amount: 'this is not amount',
        txHash: 'some-transaction-hash'
      }),
    ).toThrowError('amount is not valid amount');
    });
  });

  describe('applyActionToExtension', () => {
    describe('applyActionToExtension/unknown action', () => {
      it('cannot applyActionToExtensions of unknown action', () => {
        const unknownAction = Utils.deepCopy(DataERC20AddPaymentAddress.actionAddPaymentAddress);
        unknownAction.action = 'unknown action' as any;
        // 'must throw'
        expect(() => {
          erc20ProxyContract.applyActionToExtension(
            DataERC20Create.requestStateCreatedEmpty.extensions,
            unknownAction,
            DataERC20Create.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('Unknown action: unknown action');
      });

      it('cannot applyActionToExtensions of unknown id', () => {
        const unknownAction = Utils.deepCopy(DataERC20AddPaymentAddress.actionAddPaymentAddress);
        unknownAction.id = 'unknown id' as any;
        // 'must throw'
        expect(() => {
          erc20ProxyContract.applyActionToExtension(
            DataERC20Create.requestStateCreatedEmpty.extensions,
            unknownAction,
            DataERC20Create.requestStateCreatedEmpty,
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
          erc20ProxyContract.applyActionToExtension(
            DataERC20Create.requestStateNoExtensions.extensions,
            DataERC20Create.actionCreationWithPaymentAndRefund,
            DataERC20Create.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DataERC20Create.extensionStateWithPaymentAndRefund);
      });

      it('cannot applyActionToExtensions of creation with a previous state', () => {
        // 'must throw'
        expect(() => {
          erc20ProxyContract.applyActionToExtension(
            DataERC20Create.requestStateCreatedWithPaymentAndRefund.extensions,
            DataERC20Create.actionCreationWithPaymentAndRefund,
            DataERC20Create.requestStateCreatedWithPaymentAndRefund,
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
          erc20ProxyContract.applyActionToExtension(
            TestData.requestCreatedNoExtension.extensions,
            DataERC20Create.actionCreationWithPaymentAndRefund,
            requestCreatedNoExtension,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('This extension can be used only on ERC20 requests');
      });

      it('cannot applyActionToExtensions of creation with payment address not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(
          DataERC20Create.actionCreationWithPaymentAndRefund,
        );
        testnetPaymentAddress.parameters.paymentAddress = DataERC20AddPaymentAddress.invalidAddress;
        // 'must throw'
        expect(() => {
          erc20ProxyContract.applyActionToExtension(
            DataERC20Create.requestStateNoExtensions.extensions,
            testnetPaymentAddress,
            DataERC20Create.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(
          `paymentAddress '${DataERC20AddPaymentAddress.invalidAddress}' is not a valid address`,
        );
      });

      it('cannot applyActionToExtensions of creation with refund address not valid', () => {
        const testnetRefundAddress = Utils.deepCopy(
          DataERC20Create.actionCreationWithPaymentAndRefund,
        );
        testnetRefundAddress.parameters.refundAddress = DataERC20AddPaymentAddress.invalidAddress;
        // 'must throw'
        expect(() => {
          erc20ProxyContract.applyActionToExtension(
            DataERC20Create.requestStateNoExtensions.extensions,
            testnetRefundAddress,
            DataERC20Create.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(
          `refundAddress '${DataERC20AddPaymentAddress.invalidAddress}' is not a valid address`,
        );
      });
    });

    describe('applyActionToExtension/addPaymentAddress', () => {
      it('can applyActionToExtensions of addPaymentAddress', () => {
        // 'new extension state wrong'
        expect(
          erc20ProxyContract.applyActionToExtension(
            DataERC20Create.requestStateCreatedEmpty.extensions,
            DataERC20AddPaymentAddress.actionAddPaymentAddress,
            DataERC20Create.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DataERC20AddPaymentAddress.extensionStateWithPaymentAfterCreation);
      });
      it('cannot applyActionToExtensions of addPaymentAddress without a previous state', () => {
        // 'must throw'
        expect(() => {
          erc20ProxyContract.applyActionToExtension(
            DataERC20Create.requestStateNoExtensions.extensions,
            DataERC20AddPaymentAddress.actionAddPaymentAddress,
            DataERC20Create.requestStateNoExtensions,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });
      it('cannot applyActionToExtensions of addPaymentAddress without a payee', () => {
        const previousState = Utils.deepCopy(DataERC20Create.requestStateCreatedEmpty);
        previousState.payee = undefined;
        // 'must throw'
        expect(() => {
          erc20ProxyContract.applyActionToExtension(
            previousState.extensions,
            DataERC20AddPaymentAddress.actionAddPaymentAddress,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payee`);
      });
      it('cannot applyActionToExtensions of addPaymentAddress signed by someone else than the payee', () => {
        const previousState = Utils.deepCopy(DataERC20Create.requestStateCreatedEmpty);
        // 'must throw'
        expect(() => {
          erc20ProxyContract.applyActionToExtension(
            previousState.extensions,
            DataERC20AddPaymentAddress.actionAddPaymentAddress,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payee`);
      });
      it('cannot applyActionToExtensions of addPaymentAddress with payment address already given', () => {
        // 'must throw'
        expect(() => {
          erc20ProxyContract.applyActionToExtension(
            DataERC20Create.requestStateCreatedWithPaymentAndRefund.extensions,
            DataERC20AddPaymentAddress.actionAddPaymentAddress,
            DataERC20Create.requestStateCreatedWithPaymentAndRefund,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`Payment address already given`);
      });
      it('cannot applyActionToExtensions of addPaymentAddress with payment address not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(
          DataERC20AddPaymentAddress.actionAddPaymentAddress,
        );
        testnetPaymentAddress.parameters.paymentAddress = DataERC20AddPaymentAddress.invalidAddress;
        // 'must throw'
        expect(() => {
          erc20ProxyContract.applyActionToExtension(
            DataERC20Create.requestStateCreatedEmpty.extensions,
            testnetPaymentAddress,
            DataERC20Create.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(
          `paymentAddress '${DataERC20AddPaymentAddress.invalidAddress}' is not a valid address`,
        );
      });
    });

    describe('applyActionToExtension/addRefundAddress', () => {
      it('can applyActionToExtensions of addRefundAddress', () => {
        // 'new extension state wrong'
        expect(
          erc20ProxyContract.applyActionToExtension(
            DataERC20Create.requestStateCreatedEmpty.extensions,
            DataERC20AddPaymentAddress.actionAddRefundAddress,
            DataERC20Create.requestStateCreatedEmpty,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DataERC20AddPaymentAddress.extensionStateWithRefundAfterCreation);
      });
      it('cannot applyActionToExtensions of addRefundAddress without a previous state', () => {
        // 'must throw'
        expect(() => {
          erc20ProxyContract.applyActionToExtension(
            DataERC20Create.requestStateNoExtensions.extensions,
            DataERC20AddPaymentAddress.actionAddRefundAddress,
            DataERC20Create.requestStateNoExtensions,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });
      it('cannot applyActionToExtensions of addRefundAddress without a payer', () => {
        const previousState = Utils.deepCopy(DataERC20Create.requestStateCreatedEmpty);
        previousState.payer = undefined;
        // 'must throw'
        expect(() => {
          erc20ProxyContract.applyActionToExtension(
            previousState.extensions,
            DataERC20AddPaymentAddress.actionAddRefundAddress,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payer`);
      });
      it('cannot applyActionToExtensions of addRefundAddress signed by someone else than the payer', () => {
        const previousState = Utils.deepCopy(DataERC20Create.requestStateCreatedEmpty);
        // 'must throw'
        expect(() => {
          erc20ProxyContract.applyActionToExtension(
            previousState.extensions,
            DataERC20AddPaymentAddress.actionAddRefundAddress,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payer`);
      });
      it('cannot applyActionToExtensions of addRefundAddress with payment address already given', () => {
        // 'must throw'
        expect(() => {
          erc20ProxyContract.applyActionToExtension(
            DataERC20Create.requestStateCreatedWithPaymentAndRefund.extensions,
            DataERC20AddPaymentAddress.actionAddRefundAddress,
            DataERC20Create.requestStateCreatedWithPaymentAndRefund,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`Refund address already given`);
      });
      it('cannot applyActionToExtensions of addRefundAddress with refund address not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(
          DataERC20AddPaymentAddress.actionAddRefundAddress,
        );
        testnetPaymentAddress.parameters.refundAddress = DataERC20AddPaymentAddress.invalidAddress;
        // 'must throw'
        expect(() => {
          erc20ProxyContract.applyActionToExtension(
            DataERC20Create.requestStateCreatedEmpty.extensions,
            testnetPaymentAddress,
            DataERC20Create.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('refundAddress is not a valid address');
      });
    });

    describe('applyActionToExtension/declarePayment', () => {
      it('can applyActionToExtensions of declarePayment', () => {
        expect(
          erc20ProxyContract.applyActionToExtension(
            DataERC20Create.requestStateCreatedEmpty.extensions,
            DataERC20Create.actionDeclarePayment,
            DataERC20Create.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DataERC20Create.extensionStateAfterDeclarePayment);
      });
  
      it('cannot applyActionToExtensions of declarePayment if payee is undefined', () => {
        const previousState = Utils.deepCopy(DataERC20Create.requestStateCreatedEmpty);
        previousState.payee = undefined;
  
        expect(() => erc20ProxyContract.applyActionToExtension(
            DataERC20Create.requestStateCreatedEmpty.extensions,
            DataERC20Create.actionDeclarePayment,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toThrowError('The request must have a payee');
      });
  
      it('cannot applyActionToExtensions of declarePayment if the signer is not the payee', () => {
        expect(() => erc20ProxyContract.applyActionToExtension(
            DataERC20Create.requestStateCreatedEmpty.extensions,
            DataERC20Create.actionDeclarePayment,
            DataERC20Create.requestStateCreatedEmpty,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toThrowError('The signer must be the payee');
      });
    });
  });
});
