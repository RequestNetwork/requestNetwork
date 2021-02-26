import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import { anyToErc20ProxyPaymentNetwork } from '../../../src/extensions/payment-network/any-to-erc20-proxy';
import * as DataConversionERC20FeeAddData from '../../utils/payment-network/erc20/any-to-erc20-proxy-add-data-generator';
import * as DataConversionERC20FeeCreate from '../../utils/payment-network/erc20/any-to-erc20-proxy-create-data-generator';
import * as TestData from '../../utils/test-data-generator';

/* tslint:disable:no-unused-expression */
describe('extensions/payment-network/erc20/any-to-erc20-fee-proxy-contract', () => {
  describe('createCreationAction', () => {
    it('can create a create action with all parameters', () => {
      // 'extension data is wrong'
      expect(
        new anyToErc20ProxyPaymentNetwork().createCreationAction({
          feeAddress: '0x0000000000000000000000000000000000000001',
          feeAmount: '0',
          paymentAddress: '0x0000000000000000000000000000000000000002',
          refundAddress: '0x0000000000000000000000000000000000000003',
          salt: 'ea3bc7caf64110ca',
          network: 'rinkeby',
          acceptedTokens: ['0xFab46E002BbF0b4509813474841E0716E6730136'],
          maxRateTimespan: 1000000,
        }),
      ).toEqual({
        action: 'create',
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY,
        parameters: {
          feeAddress: '0x0000000000000000000000000000000000000001',
          feeAmount: '0',
          paymentAddress: '0x0000000000000000000000000000000000000002',
          refundAddress: '0x0000000000000000000000000000000000000003',
          salt: 'ea3bc7caf64110ca',
          network: 'rinkeby',
          acceptedTokens: ['0xFab46E002BbF0b4509813474841E0716E6730136'],
          maxRateTimespan: 1000000,
        },
        version: '0.1.0',
      });
    });

    it('can create a create action without fee parameters', () => {
      // 'extension data is wrong'
      expect(
        new anyToErc20ProxyPaymentNetwork().createCreationAction({
          paymentAddress: '0x0000000000000000000000000000000000000001',
          refundAddress: '0x0000000000000000000000000000000000000002',
          salt: 'ea3bc7caf64110ca',
          network: 'rinkeby',
          acceptedTokens: ['0xFab46E002BbF0b4509813474841E0716E6730136'],
        }),
      ).toEqual({
        action: 'create',
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY,
        parameters: {
          paymentAddress: '0x0000000000000000000000000000000000000001',
          refundAddress: '0x0000000000000000000000000000000000000002',
          salt: 'ea3bc7caf64110ca',
          network: 'rinkeby',
          acceptedTokens: ['0xFab46E002BbF0b4509813474841E0716E6730136'],
        },
        version: '0.1.0',
      });
    });

    it('cannot createCreationAction with payment address not an ethereum address', () => {
      expect(() => {
        new anyToErc20ProxyPaymentNetwork().createCreationAction({
          paymentAddress: 'not an ethereum address',
          refundAddress: '0x0000000000000000000000000000000000000002',
          salt: 'ea3bc7caf64110ca',
          network: 'private',
          acceptedTokens: [DataConversionERC20FeeCreate.tokenAddress],
        });
      }).toThrowError('paymentAddress is not a valid ethereum address');
    });

    it('cannot createCreationAction with refund address not an ethereum address', () => {
      expect(() => {
        new anyToErc20ProxyPaymentNetwork().createCreationAction({
          paymentAddress: '0x0000000000000000000000000000000000000001',
          refundAddress: 'not an ethereum address',
          salt: 'ea3bc7caf64110ca',
          network: 'private',
          acceptedTokens: [DataConversionERC20FeeCreate.tokenAddress],
        });
      }).toThrowError('refundAddress is not a valid ethereum address');
    });

    it('cannot createCreationAction with fee address not an ethereum address', () => {
      expect(() => {
        new anyToErc20ProxyPaymentNetwork().createCreationAction({
          feeAddress: 'not an ethereum address',
          paymentAddress: '0x0000000000000000000000000000000000000001',
          salt: 'ea3bc7caf64110ca',
          network: 'private',
          acceptedTokens: [DataConversionERC20FeeCreate.tokenAddress],
        });
      }).toThrowError('feeAddress is not a valid ethereum address');
    });

    it('cannot createCreationAction with invalid fee amount', () => {
      expect(() => {
        new anyToErc20ProxyPaymentNetwork().createCreationAction({
          feeAmount: '-20000',
          paymentAddress: '0x0000000000000000000000000000000000000001',
          salt: 'ea3bc7caf64110ca',
          acceptedTokens: ['0xFab46E002BbF0b4509813474841E0716E6730136'],
          network: 'rinkeby',
        });
      }).toThrowError('feeAmount is not a valid amount');
    });

    it('cannot createCreationAction without acceptedTokens', () => {
      expect(() => {
        new anyToErc20ProxyPaymentNetwork().createCreationAction({
          paymentAddress: '0x0000000000000000000000000000000000000001',
          salt: 'ea3bc7caf64110ca',
          network: 'rinkeby',
        });
      }).toThrowError('acceptedTokens is required');
    });

    it('cannot createCreationAction with invalid tokens accepted', () => {
      expect(() => {
        new anyToErc20ProxyPaymentNetwork().createCreationAction({
          paymentAddress: '0x0000000000000000000000000000000000000001',
          salt: 'ea3bc7caf64110ca',
          network: 'rinkeby',
          acceptedTokens: ['0x0000000000000000000000000000000000000003', 'invalid address'],
        });
      }).toThrowError('acceptedTokens must contains only valid ethereum addresses');
    });

    it('cannot createCreationAction without network', () => {
      expect(() => {
        new anyToErc20ProxyPaymentNetwork().createCreationAction({
          paymentAddress: '0x0000000000000000000000000000000000000001',
          salt: 'ea3bc7caf64110ca',
          acceptedTokens: ['0xFab46E002BbF0b4509813474841E0716E6730136'],
        });
      }).toThrowError('network is required');
    });

    it('cannot createCreationAction with network not supported', () => {
      expect(() => {
        new anyToErc20ProxyPaymentNetwork().createCreationAction({
          paymentAddress: '0x0000000000000000000000000000000000000001',
          salt: 'ea3bc7caf64110ca',
          network: 'kovan',
          acceptedTokens: ['0x0000000000000000000000000000000000000003'],
        });
      }).toThrowError('network not supported');
    });

    it('cannot createCreationAction with tokens accepted not supported', () => {
      expect(() => {
        new anyToErc20ProxyPaymentNetwork().createCreationAction({
          paymentAddress: '0x0000000000000000000000000000000000000001',
          salt: 'ea3bc7caf64110ca',
          network: 'rinkeby',
          acceptedTokens: ['0x0000000000000000000000000000000000000003'],
        });
      }).toThrowError('acceptedTokens must contain only supported token addresses (ERC20 only)');
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
        DataConversionERC20FeeCreate.actionCreationFull,
      );
      action.parameters.network = 'invalid network';

      expect(() => {
        new anyToErc20ProxyPaymentNetwork().applyActionToExtension(
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
        DataConversionERC20FeeCreate.actionCreationFull,
      );

      expect(() => {
        new anyToErc20ProxyPaymentNetwork().applyActionToExtension(
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
        new anyToErc20ProxyPaymentNetwork().createAddPaymentAddressAction({
          paymentAddress: '0x0000000000000000000000000000000000000001',
        }),
      ).toEqual({
        action: ExtensionTypes.PnReferenceBased.ACTION.ADD_PAYMENT_ADDRESS,
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY,
        parameters: {
          paymentAddress: '0x0000000000000000000000000000000000000001',
        },
      });
    });

    it('cannot createAddPaymentAddressAction with payment address not an ethereum address', () => {
      expect(() => {
        new anyToErc20ProxyPaymentNetwork().createAddPaymentAddressAction({
          paymentAddress: 'not an ethereum address',
        });
      }).toThrowError('paymentAddress is not a valid ethereum address');
    });
  });

  describe('createAddRefundAddressAction', () => {
    it('can createAddRefundAddressAction', () => {
      // 'extension data is wrong'
      expect(
        new anyToErc20ProxyPaymentNetwork().createAddRefundAddressAction({
          refundAddress: '0x0000000000000000000000000000000000000002',
        }),
      ).toEqual({
        action: ExtensionTypes.PnReferenceBased.ACTION.ADD_REFUND_ADDRESS,
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY,
        parameters: {
          refundAddress: '0x0000000000000000000000000000000000000002',
        },
      });
    });

    it('cannot createAddRefundAddressAction with payment address not an ethereum address', () => {
      expect(() => {
        new anyToErc20ProxyPaymentNetwork().createAddRefundAddressAction({
          refundAddress: 'not an ethereum address',
        });
      }).toThrowError('refundAddress is not a valid ethereum address');
    });
  });

  describe('createAddFeeAction', () => {
    it('can createAddFeeAction', () => {
      // 'extension data is wrong'
      expect(
        new anyToErc20ProxyPaymentNetwork().createAddFeeAction({
          feeAddress: '0x0000000000000000000000000000000000000002',
          feeAmount: '2000',
        }),
      ).toEqual({
        action: ExtensionTypes.PnFeeReferenceBased.ACTION.ADD_FEE,
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY,
        parameters: {
          feeAddress: '0x0000000000000000000000000000000000000002',
          feeAmount: '2000',
        },
      });
    });

    it('cannot createAddFeeAddressAction with payment address not an ethereum address', () => {
      expect(() => {
        new anyToErc20ProxyPaymentNetwork().createAddFeeAction({
          feeAddress: 'not an ethereum address',
          feeAmount: '2000',
        });
      }).toThrowError('feeAddress is not a valid ethereum address');
    });

    it('cannot createAddFeeAction with amount non positive integer', () => {
      expect(() => {
        new anyToErc20ProxyPaymentNetwork().createAddFeeAction({
          feeAddress: '0x0000000000000000000000000000000000000002',
          feeAmount: '-30000',
        });
      }).toThrowError('feeAmount is not a valid amount');
    });
  });

  describe('applyActionToExtension', () => {
    describe('applyActionToExtension/unknown action', () => {
      it('cannot applyActionToExtensions of unknown action', () => {
        const unknownAction = Utils.deepCopy(DataConversionERC20FeeAddData.actionAddPaymentAddress);
        unknownAction.action = 'unknown action';
        expect(() => {
          new anyToErc20ProxyPaymentNetwork().applyActionToExtension(
            DataConversionERC20FeeCreate.requestStateCreatedEmpty.extensions,
            unknownAction,
            DataConversionERC20FeeCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('Unknown action: unknown action');
      });

      it('cannot applyActionToExtensions of unknown id', () => {
        const unknownAction = Utils.deepCopy(DataConversionERC20FeeAddData.actionAddPaymentAddress);
        unknownAction.id = 'unknown id';
        expect(() => {
          new anyToErc20ProxyPaymentNetwork().applyActionToExtension(
            DataConversionERC20FeeCreate.requestStateCreatedEmpty.extensions,
            unknownAction,
            DataConversionERC20FeeCreate.requestStateCreatedEmpty,
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
          new anyToErc20ProxyPaymentNetwork().applyActionToExtension(
            DataConversionERC20FeeCreate.requestStateNoExtensions.extensions,
            DataConversionERC20FeeCreate.actionCreationFull,
            DataConversionERC20FeeCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DataConversionERC20FeeCreate.extensionFullState);
      });

      it('cannot applyActionToExtensions of creation with a previous state', () => {
        expect(() => {
          new anyToErc20ProxyPaymentNetwork().applyActionToExtension(
            DataConversionERC20FeeCreate.requestFullStateCreated.extensions,
            DataConversionERC20FeeCreate.actionCreationFull,
            DataConversionERC20FeeCreate.requestFullStateCreated,
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
        expect(() => {
          new anyToErc20ProxyPaymentNetwork().applyActionToExtension(
            TestData.requestCreatedNoExtension.extensions,
            DataConversionERC20FeeCreate.actionCreationFull,
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
          DataConversionERC20FeeCreate.actionCreationFull,
        );
        testnetPaymentAddress.parameters.paymentAddress =
          DataConversionERC20FeeAddData.invalidAddress;
        expect(() => {
          new anyToErc20ProxyPaymentNetwork().applyActionToExtension(
            DataConversionERC20FeeCreate.requestStateNoExtensions.extensions,
            testnetPaymentAddress,
            DataConversionERC20FeeCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('paymentAddress is not a valid address');
      });

      it('cannot applyActionToExtensions of creation with no tokens accepted', () => {
        const testnetPaymentAddress = Utils.deepCopy(
          DataConversionERC20FeeCreate.actionCreationFull,
        );
        testnetPaymentAddress.parameters.acceptedTokens = [];
        expect(() => {
          new anyToErc20ProxyPaymentNetwork().applyActionToExtension(
            DataConversionERC20FeeCreate.requestStateNoExtensions.extensions,
            testnetPaymentAddress,
            DataConversionERC20FeeCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('acceptedTokens is required');
      });

      it('cannot applyActionToExtensions of creation with token address not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(
          DataConversionERC20FeeCreate.actionCreationFull,
        );
        testnetPaymentAddress.parameters.acceptedTokens = ['invalid address'];
        expect(() => {
          new anyToErc20ProxyPaymentNetwork().applyActionToExtension(
            DataConversionERC20FeeCreate.requestStateNoExtensions.extensions,
            testnetPaymentAddress,
            DataConversionERC20FeeCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('acceptedTokens must contains only valid ethereum addresses');
      });

      it('cannot applyActionToExtensions of creation with refund address not valid', () => {
        const testnetRefundAddress = Utils.deepCopy(
          DataConversionERC20FeeCreate.actionCreationFull,
        );
        testnetRefundAddress.parameters.refundAddress =
          DataConversionERC20FeeAddData.invalidAddress;
        expect(() => {
          new anyToErc20ProxyPaymentNetwork().applyActionToExtension(
            DataConversionERC20FeeCreate.requestStateNoExtensions.extensions,
            testnetRefundAddress,
            DataConversionERC20FeeCreate.requestStateNoExtensions,
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
          new anyToErc20ProxyPaymentNetwork().applyActionToExtension(
            DataConversionERC20FeeCreate.requestStateCreatedEmpty.extensions,
            DataConversionERC20FeeAddData.actionAddPaymentAddress,
            DataConversionERC20FeeCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DataConversionERC20FeeAddData.extensionStateWithPaymentAfterCreation);
      });

      it('cannot applyActionToExtensions of addPaymentAddress without a previous state', () => {
        expect(() => {
          new anyToErc20ProxyPaymentNetwork().applyActionToExtension(
            DataConversionERC20FeeCreate.requestStateNoExtensions.extensions,
            DataConversionERC20FeeAddData.actionAddPaymentAddress,
            DataConversionERC20FeeCreate.requestStateNoExtensions,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });

      it('cannot applyActionToExtensions of addPaymentAddress without a payee', () => {
        const previousState = Utils.deepCopy(DataConversionERC20FeeCreate.requestStateCreatedEmpty);
        previousState.payee = undefined;
        expect(() => {
          new anyToErc20ProxyPaymentNetwork().applyActionToExtension(
            previousState.extensions,
            DataConversionERC20FeeAddData.actionAddPaymentAddress,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payee`);
      });

      it('cannot applyActionToExtensions of addPaymentAddress signed by someone else than the payee', () => {
        const previousState = Utils.deepCopy(DataConversionERC20FeeCreate.requestStateCreatedEmpty);
        expect(() => {
          new anyToErc20ProxyPaymentNetwork().applyActionToExtension(
            previousState.extensions,
            DataConversionERC20FeeAddData.actionAddPaymentAddress,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payee`);
      });

      it('cannot applyActionToExtensions of addPaymentAddress with payment address already given', () => {
        expect(() => {
          new anyToErc20ProxyPaymentNetwork().applyActionToExtension(
            DataConversionERC20FeeCreate.requestFullStateCreated.extensions,
            DataConversionERC20FeeAddData.actionAddPaymentAddress,
            DataConversionERC20FeeCreate.requestFullStateCreated,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`Payment address already given`);
      });

      it('cannot applyActionToExtensions of addPaymentAddress with payment address not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(
          DataConversionERC20FeeAddData.actionAddPaymentAddress,
        );
        testnetPaymentAddress.parameters.paymentAddress =
          DataConversionERC20FeeAddData.invalidAddress;
        expect(() => {
          new anyToErc20ProxyPaymentNetwork().applyActionToExtension(
            DataConversionERC20FeeCreate.requestStateCreatedEmpty.extensions,
            testnetPaymentAddress,
            DataConversionERC20FeeCreate.requestStateCreatedEmpty,
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
          new anyToErc20ProxyPaymentNetwork().applyActionToExtension(
            DataConversionERC20FeeCreate.requestStateCreatedEmpty.extensions,
            DataConversionERC20FeeAddData.actionAddRefundAddress,
            DataConversionERC20FeeCreate.requestStateCreatedEmpty,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(DataConversionERC20FeeAddData.extensionStateWithRefundAfterCreation);
      });

      it('cannot applyActionToExtensions of addRefundAddress without a previous state', () => {
        expect(() => {
          new anyToErc20ProxyPaymentNetwork().applyActionToExtension(
            DataConversionERC20FeeCreate.requestStateNoExtensions.extensions,
            DataConversionERC20FeeAddData.actionAddRefundAddress,
            DataConversionERC20FeeCreate.requestStateNoExtensions,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });

      it('cannot applyActionToExtensions of addRefundAddress without a payer', () => {
        const previousState = Utils.deepCopy(DataConversionERC20FeeCreate.requestStateCreatedEmpty);
        previousState.payer = undefined;
        expect(() => {
          new anyToErc20ProxyPaymentNetwork().applyActionToExtension(
            previousState.extensions,
            DataConversionERC20FeeAddData.actionAddRefundAddress,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payer`);
      });

      it('cannot applyActionToExtensions of addRefundAddress signed by someone else than the payer', () => {
        const previousState = Utils.deepCopy(DataConversionERC20FeeCreate.requestStateCreatedEmpty);
        expect(() => {
          new anyToErc20ProxyPaymentNetwork().applyActionToExtension(
            previousState.extensions,
            DataConversionERC20FeeAddData.actionAddRefundAddress,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payer`);
      });

      it('cannot applyActionToExtensions of addRefundAddress with payment address already given', () => {
        expect(() => {
          new anyToErc20ProxyPaymentNetwork().applyActionToExtension(
            DataConversionERC20FeeCreate.requestFullStateCreated.extensions,
            DataConversionERC20FeeAddData.actionAddRefundAddress,
            DataConversionERC20FeeCreate.requestFullStateCreated,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`Refund address already given`);
      });

      it('cannot applyActionToExtensions of addRefundAddress with refund address not valid', () => {
        const testnetPaymentAddress = Utils.deepCopy(
          DataConversionERC20FeeAddData.actionAddRefundAddress,
        );
        testnetPaymentAddress.parameters.refundAddress =
          DataConversionERC20FeeAddData.invalidAddress;
        expect(() => {
          new anyToErc20ProxyPaymentNetwork().applyActionToExtension(
            DataConversionERC20FeeCreate.requestStateCreatedEmpty.extensions,
            testnetPaymentAddress,
            DataConversionERC20FeeCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('refundAddress is not a valid address');
      });
    });
  });

  describe('applyActionToExtension/addFee', () => {
    it('can applyActionToExtensions of addFee', () => {
      // 'new extension state wrong'
      expect(
        new anyToErc20ProxyPaymentNetwork().applyActionToExtension(
          DataConversionERC20FeeCreate.requestStateCreatedEmpty.extensions,
          DataConversionERC20FeeAddData.actionAddFee,
          DataConversionERC20FeeCreate.requestStateCreatedEmpty,
          TestData.payeeRaw.identity,
          TestData.arbitraryTimestamp,
        ),
      ).toEqual(DataConversionERC20FeeAddData.extensionStateWithFeeAfterCreation);
    });

    it('cannot applyActionToExtensions of addFee without a previous state', () => {
      expect(() => {
        new anyToErc20ProxyPaymentNetwork().applyActionToExtension(
          DataConversionERC20FeeCreate.requestStateNoExtensions.extensions,
          DataConversionERC20FeeAddData.actionAddFee,
          DataConversionERC20FeeCreate.requestStateNoExtensions,
          TestData.payeeRaw.identity,
          TestData.arbitraryTimestamp,
        );
      }).toThrowError(`The extension should be created before receiving any other action`);
    });

    it('cannot applyActionToExtensions of addFee without a payee', () => {
      const previousState = Utils.deepCopy(DataConversionERC20FeeCreate.requestStateCreatedEmpty);
      previousState.payee = undefined;
      expect(() => {
        new anyToErc20ProxyPaymentNetwork().applyActionToExtension(
          previousState.extensions,
          DataConversionERC20FeeAddData.actionAddFee,
          previousState,
          TestData.payeeRaw.identity,
          TestData.arbitraryTimestamp,
        );
      }).toThrowError(`The request must have a payee`);
    });

    it('cannot applyActionToExtensions of addFee signed by someone else than the payee', () => {
      const previousState = Utils.deepCopy(DataConversionERC20FeeCreate.requestStateCreatedEmpty);
      expect(() => {
        new anyToErc20ProxyPaymentNetwork().applyActionToExtension(
          previousState.extensions,
          DataConversionERC20FeeAddData.actionAddFee,
          previousState,
          TestData.payerRaw.identity,
          TestData.arbitraryTimestamp,
        );
      }).toThrowError(`The signer must be the payee`);
    });

    it('cannot applyActionToExtensions of addFee with fee data already given', () => {
      expect(() => {
        new anyToErc20ProxyPaymentNetwork().applyActionToExtension(
          DataConversionERC20FeeCreate.requestFullStateCreated.extensions,
          DataConversionERC20FeeAddData.actionAddFee,
          DataConversionERC20FeeCreate.requestFullStateCreated,
          TestData.payeeRaw.identity,
          TestData.arbitraryTimestamp,
        );
      }).toThrowError(`Fee address already given`);
    });

    it('cannot applyActionToExtensions of addFee with fee address not valid', () => {
      const testnetPaymentAddress = Utils.deepCopy(DataConversionERC20FeeAddData.actionAddFee);
      testnetPaymentAddress.parameters.feeAddress = DataConversionERC20FeeAddData.invalidAddress;
      expect(() => {
        new anyToErc20ProxyPaymentNetwork().applyActionToExtension(
          DataConversionERC20FeeCreate.requestStateCreatedEmpty.extensions,
          testnetPaymentAddress,
          DataConversionERC20FeeCreate.requestStateCreatedEmpty,
          TestData.payerRaw.identity,
          TestData.arbitraryTimestamp,
        );
      }).toThrowError('feeAddress is not a valid address');
    });

    it('cannot applyActionToExtensions of addFee with fee amount not valid', () => {
      const testnetPaymentAddress = Utils.deepCopy(DataConversionERC20FeeAddData.actionAddFee);
      testnetPaymentAddress.parameters.feeAmount = DataConversionERC20FeeAddData.invalidAddress;
      expect(() => {
        new anyToErc20ProxyPaymentNetwork().applyActionToExtension(
          DataConversionERC20FeeCreate.requestStateCreatedEmpty.extensions,
          testnetPaymentAddress,
          DataConversionERC20FeeCreate.requestStateCreatedEmpty,
          TestData.payerRaw.identity,
          TestData.arbitraryTimestamp,
        );
      }).toThrowError('feeAmount is not a valid amount');
    });
  });
});
