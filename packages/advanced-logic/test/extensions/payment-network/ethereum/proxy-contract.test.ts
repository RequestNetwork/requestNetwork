import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import 'mocha';

import ethereumProxyContract from '../../../../src/extensions/payment-network/ethereum/proxy-contract';

import { expect } from 'chai';

import * as DataETHAddPaymentAddress from '../../../utils/payment-network/ethereum/proxy-contract-add-payment-address-data-generator';
import * as DataETHCreate from '../../../utils/payment-network/ethereum/proxy-contract-create-data-generator';
import * as TestData from '../../../utils/test-data-generator';

/* tslint:disable:no-unused-expression */
describe('extensions/payment-network/ethereum/proxy-contract', () => {
  describe('createCreationAction', () => {
    it('can create a create action', () => {
      expect(
        ethereumProxyContract.createCreationAction({
          paymentAddress: '0x0000000000000000000000000000000000000001',
          refundAddress: '0x0000000000000000000000000000000000000002',
          salt: 'ea3bc7caf64110ca',
        }),
        'extensionsdata is wrong',
      ).to.deep.equal({
        action: 'create',
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ETH_PROXY_CONTRACT,
        parameters: {
          paymentAddress: '0x0000000000000000000000000000000000000001',
          refundAddress: '0x0000000000000000000000000000000000000002',
          salt: 'ea3bc7caf64110ca',
        },
        version: '0.1.0',
      });
    });

    it('can create a create action with only salt', () => {
      expect(
        ethereumProxyContract.createCreationAction({
          salt: 'ea3bc7caf64110ca',
        }),
        'extensionsdata is wrong',
      ).to.deep.equal({
        action: 'create',
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ETH_PROXY_CONTRACT,
        parameters: {
          salt: 'ea3bc7caf64110ca',
        },
        version: '0.1.0',
      });
    });

    it('cannot createCreationAction with payment address not an ethereum address', () => {
      expect(() => {
        ethereumProxyContract.createCreationAction({
          paymentAddress: 'not an ethereum address',
          refundAddress: '0x0000000000000000000000000000000000000002',
          salt: 'ea3bc7caf64110ca',
        });
      }, 'must throw').to.throw('paymentAddress is not a valid ethereum address');
    });

    it('cannot createCreationAction with refund address not an ethereum address', () => {
      expect(() => {
        ethereumProxyContract.createCreationAction({
          paymentAddress: '0x0000000000000000000000000000000000000001',
          refundAddress: 'not an ethereum address',
          salt: 'ea3bc7caf64110ca',
        });
      }, 'must throw').to.throw('refundAddress is not a valid ethereum address');
    });
  });

  describe('createAddPaymentAddressAction', () => {
    it('can createAddPaymentAddressAction', () => {
      expect(
        ethereumProxyContract.createAddPaymentAddressAction({
          paymentAddress: '0x0000000000000000000000000000000000000001',
        }),
        'extensionsdata is wrong',
      ).to.deep.equal({
        action: ExtensionTypes.PnReferenceBased.ACTION.ADD_PAYMENT_ADDRESS,
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ETH_PROXY_CONTRACT,
        parameters: {
          paymentAddress: '0x0000000000000000000000000000000000000001',
        },
      });
    });

    it('cannot createAddPaymentAddressAction with payment address not an ethereum address', () => {
      expect(() => {
        ethereumProxyContract.createAddPaymentAddressAction({
          paymentAddress: 'not an ethereum address',
        });
      }, 'must throw').to.throw('paymentAddress is not a valid ethereum address');
    });
  });

  describe('createAddRefundAddressAction', () => {
    it('can createAddRefundAddressAction', () => {
      expect(
        ethereumProxyContract.createAddRefundAddressAction({
          refundAddress: '0x0000000000000000000000000000000000000002',
        }),
        'extensionsdata is wrong',
      ).to.deep.equal({
        action: ExtensionTypes.PnReferenceBased.ACTION.ADD_REFUND_ADDRESS,
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ETH_PROXY_CONTRACT,
        parameters: {
          refundAddress: '0x0000000000000000000000000000000000000002',
        },
      });
    });
    it('cannot createAddRefundAddressAction with payment address not an ethereum address', () => {
      expect(() => {
        ethereumProxyContract.createAddRefundAddressAction({
          refundAddress: 'not an ethereum address',
        });
      }, 'must throw').to.throw('refundAddress is not a valid ethereum address');
    });
  });

  describe('applyActionToExtension', () => {
    describe('applyActionToExtension/unknown action', () => {
      it('cannot applyActionToExtensions of unknown action', () => {
        const unknownAction = Utils.deepCopy(DataETHAddPaymentAddress.actionAddPaymentAddress);
        unknownAction.action = 'unknown action';
        expect(() => {
          ethereumProxyContract.applyActionToExtension(
            DataETHCreate.requestStateCreatedEmpty.extensions,
            unknownAction,
            DataETHCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw('Unknown action: unknown action');
      });

      it('cannot applyActionToExtensions of unknown id', () => {
        const unknownAction = Utils.deepCopy(DataETHAddPaymentAddress.actionAddPaymentAddress);
        unknownAction.id = 'unknown id';
        expect(() => {
          ethereumProxyContract.applyActionToExtension(
            DataETHCreate.requestStateCreatedEmpty.extensions,
            unknownAction,
            DataETHCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(
          'The extension should be created before receiving any other action',
        );
      });
    });

    describe('applyActionToExtension/create', () => {
      it('can applyActionToExtensions of creation', () => {
        expect(
          ethereumProxyContract.applyActionToExtension(
            DataETHCreate.requestStateNoExtensions.extensions,
            DataETHCreate.actionCreationWithPaymentAndRefund,
            DataETHCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          ),
          'new extension state wrong',
        ).to.deep.equal(DataETHCreate.extensionStateWithPaymentAndRefund);
      });

      it('cannot applyActionToExtensions of creation with a previous state', () => {
        expect(() => {
          ethereumProxyContract.applyActionToExtension(
            DataETHCreate.requestStateCreatedWithPaymentAndRefund.extensions,
            DataETHCreate.actionCreationWithPaymentAndRefund,
            DataETHCreate.requestStateCreatedWithPaymentAndRefund,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw('This extension has already been created');
      });

      it('cannot applyActionToExtensions of creation on a not Eth request', () => {
        const requestCreatedNoExtension: RequestLogicTypes.IRequest = Utils.deepCopy(
          TestData.requestCreatedNoExtension,
        );
        requestCreatedNoExtension.currency = {
          type: RequestLogicTypes.CURRENCY.BTC,
          value: 'BTC',
        };
        expect(() => {
          ethereumProxyContract.applyActionToExtension(
            TestData.requestCreatedNoExtension.extensions,
            DataETHCreate.actionCreationWithPaymentAndRefund,
            requestCreatedNoExtension,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(
          'This extension can be used only on Ethereum requests and on supported networks mainnet, rinkeby, private',
        );
      });

      it('cannot applyActionToExtensions of creation with payment address not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(
          DataETHCreate.actionCreationWithPaymentAndRefund,
        );
        testnetPaymentAddress.parameters.paymentAddress = DataETHAddPaymentAddress.invalidAddress;
        expect(() => {
          ethereumProxyContract.applyActionToExtension(
            DataETHCreate.requestStateNoExtensions.extensions,
            testnetPaymentAddress,
            DataETHCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw('paymentAddress is not a valid address');
      });

      it('cannot applyActionToExtensions of creation with refund address not valid', () => {
        const testnetRefundAddress = Utils.deepCopy(
          DataETHCreate.actionCreationWithPaymentAndRefund,
        );
        testnetRefundAddress.parameters.refundAddress = DataETHAddPaymentAddress.invalidAddress;
        expect(() => {
          ethereumProxyContract.applyActionToExtension(
            DataETHCreate.requestStateNoExtensions.extensions,
            testnetRefundAddress,
            DataETHCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw('refundAddress is not a valid address');
      });
    });

    describe('applyActionToExtension/addPaymentAddress', () => {
      it('can applyActionToExtensions of addPaymentAddress', () => {
        expect(
          ethereumProxyContract.applyActionToExtension(
            DataETHCreate.requestStateCreatedEmpty.extensions,
            DataETHAddPaymentAddress.actionAddPaymentAddress,
            DataETHCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          ),
          'new extension state wrong',
        ).to.deep.equal(DataETHAddPaymentAddress.extensionStateWithPaymentAfterCreation);
      });
      it('cannot applyActionToExtensions of addPaymentAddress without a previous state', () => {
        expect(() => {
          ethereumProxyContract.applyActionToExtension(
            DataETHCreate.requestStateNoExtensions.extensions,
            DataETHAddPaymentAddress.actionAddPaymentAddress,
            DataETHCreate.requestStateNoExtensions,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(
          `The extension should be created before receiving any other action`,
        );
      });
      it('cannot applyActionToExtensions of addPaymentAddress without a payee', () => {
        const previousState = Utils.deepCopy(DataETHCreate.requestStateCreatedEmpty);
        previousState.payee = undefined;
        expect(() => {
          ethereumProxyContract.applyActionToExtension(
            previousState.extensions,
            DataETHAddPaymentAddress.actionAddPaymentAddress,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(`The request must have a payee`);
      });
      it('cannot applyActionToExtensions of addPaymentAddress signed by someone else than the payee', () => {
        const previousState = Utils.deepCopy(DataETHCreate.requestStateCreatedEmpty);
        expect(() => {
          ethereumProxyContract.applyActionToExtension(
            previousState.extensions,
            DataETHAddPaymentAddress.actionAddPaymentAddress,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(`The signer must be the payee`);
      });
      it('cannot applyActionToExtensions of addPaymentAddress with payment address already given', () => {
        expect(() => {
          ethereumProxyContract.applyActionToExtension(
            DataETHCreate.requestStateCreatedWithPaymentAndRefund.extensions,
            DataETHAddPaymentAddress.actionAddPaymentAddress,
            DataETHCreate.requestStateCreatedWithPaymentAndRefund,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(`Payment address already given`);
      });
      it('cannot applyActionToExtensions of addPaymentAddress with payment address not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(
          DataETHAddPaymentAddress.actionAddPaymentAddress,
        );
        testnetPaymentAddress.parameters.paymentAddress = DataETHAddPaymentAddress.invalidAddress;
        expect(() => {
          ethereumProxyContract.applyActionToExtension(
            DataETHCreate.requestStateCreatedEmpty.extensions,
            testnetPaymentAddress,
            DataETHCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw('paymentAddress is not a valid address');
      });
    });

    describe('applyActionToExtension/addRefundAddress', () => {
      it('can applyActionToExtensions of addRefundAddress', () => {
        expect(
          ethereumProxyContract.applyActionToExtension(
            DataETHCreate.requestStateCreatedEmpty.extensions,
            DataETHAddPaymentAddress.actionAddRefundAddress,
            DataETHCreate.requestStateCreatedEmpty,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          ),
          'new extension state wrong',
        ).to.deep.equal(DataETHAddPaymentAddress.extensionStateWithRefundAfterCreation);
      });
      it('cannot applyActionToExtensions of addRefundAddress without a previous state', () => {
        expect(() => {
          ethereumProxyContract.applyActionToExtension(
            DataETHCreate.requestStateNoExtensions.extensions,
            DataETHAddPaymentAddress.actionAddRefundAddress,
            DataETHCreate.requestStateNoExtensions,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(
          `The extension should be created before receiving any other action`,
        );
      });
      it('cannot applyActionToExtensions of addRefundAddress without a payer', () => {
        const previousState = Utils.deepCopy(DataETHCreate.requestStateCreatedEmpty);
        previousState.payer = undefined;
        expect(() => {
          ethereumProxyContract.applyActionToExtension(
            previousState.extensions,
            DataETHAddPaymentAddress.actionAddRefundAddress,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(`The request must have a payer`);
      });
      it('cannot applyActionToExtensions of addRefundAddress signed by someone else than the payer', () => {
        const previousState = Utils.deepCopy(DataETHCreate.requestStateCreatedEmpty);
        expect(() => {
          ethereumProxyContract.applyActionToExtension(
            previousState.extensions,
            DataETHAddPaymentAddress.actionAddRefundAddress,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(`The signer must be the payer`);
      });
      it('cannot applyActionToExtensions of addRefundAddress with payment address already given', () => {
        expect(() => {
          ethereumProxyContract.applyActionToExtension(
            DataETHCreate.requestStateCreatedWithPaymentAndRefund.extensions,
            DataETHAddPaymentAddress.actionAddRefundAddress,
            DataETHCreate.requestStateCreatedWithPaymentAndRefund,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(`Refund address already given`);
      });
      it('cannot applyActionToExtensions of addRefundAddress with refund address not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(
          DataETHAddPaymentAddress.actionAddRefundAddress,
        );
        testnetPaymentAddress.parameters.refundAddress = DataETHAddPaymentAddress.invalidAddress;
        expect(() => {
          ethereumProxyContract.applyActionToExtension(
            DataETHCreate.requestStateCreatedEmpty.extensions,
            testnetPaymentAddress,
            DataETHCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw('refundAddress is not a valid address');
      });
    });
  });
});
