import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import { deepCopy } from '@requestnetwork/utils';
import { CurrencyManager, UnsupportedCurrencyError } from '@requestnetwork/currency';

import * as DataConversionERC20FeeAddData from '../../utils/payment-network/erc20/any-to-erc20-proxy-add-data-generator';
import * as MetaCreate from '../../utils/payment-network/meta-pn-data-generator';
import * as TestData from '../../utils/test-data-generator';
import MetaPaymentNetwork from '../../../src/extensions/payment-network/meta';

const metaPn = new MetaPaymentNetwork(CurrencyManager.getDefault());
const baseParams = {
  feeAddress: '0x0000000000000000000000000000000000000001',
  feeAmount: '0',
  paymentAddress: '0x0000000000000000000000000000000000000002',
  refundAddress: '0x0000000000000000000000000000000000000003',
  salt: 'ea3bc7caf64110ca',
  network: 'rinkeby',
  acceptedTokens: ['0xFab46E002BbF0b4509813474841E0716E6730136'],
  maxRateTimespan: 1000000,
} as ExtensionTypes.PnAnyToErc20.ICreationParameters;
const otherBaseParams = {
  ...baseParams,
  salt: 'ea3bc7caf64110cb',
} as ExtensionTypes.PnAnyToErc20.ICreationParameters;

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('extensions/payment-network/meta', () => {
  describe('createCreationAction', () => {
    it('can create a create action with all parameters', () => {
      expect(
        metaPn.createCreationAction({
          [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY]: [baseParams, otherBaseParams],
        }),
      ).toEqual({
        action: 'create',
        id: ExtensionTypes.PAYMENT_NETWORK_ID.META,
        parameters: {
          [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY]: [baseParams, otherBaseParams],
        },
        version: '0.1.0',
      });
    });

    it('can create a create action without fee parameters', () => {
      expect(
        metaPn.createCreationAction({
          [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY]: [
            { ...baseParams, feeAddress: undefined, feeAmount: undefined },
            otherBaseParams,
          ],
        }),
      ).toEqual({
        action: 'create',
        id: ExtensionTypes.PAYMENT_NETWORK_ID.META,
        parameters: {
          [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY]: [
            { ...baseParams, feeAddress: undefined, feeAmount: undefined },
            otherBaseParams,
          ],
        },
        version: '0.1.0',
      });
    });

    it('cannot createCreationAction with duplicated salt', () => {
      expect(() => {
        metaPn.createCreationAction({
          [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY]: [baseParams, baseParams],
        });
      }).toThrowError('Duplicate payment network identifier (salt)');
    });

    it('cannot createCreationAction with payment address not an ethereum address', () => {
      expect(() => {
        metaPn.createCreationAction({
          [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY]: [
            { ...baseParams, paymentAddress: 'not an ethereum address' },
            otherBaseParams,
          ],
        });
      }).toThrowError("paymentAddress 'not an ethereum address' is not a valid address");
    });

    it('cannot createCreationAction with refund address not an ethereum address', () => {
      expect(() => {
        metaPn.createCreationAction({
          [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY]: [
            { ...baseParams, refundAddress: 'not an ethereum address' },
            otherBaseParams,
          ],
        });
      }).toThrowError("refundAddress 'not an ethereum address' is not a valid address");
    });

    it('cannot createCreationAction with fee address not an ethereum address', () => {
      expect(() => {
        metaPn.createCreationAction({
          [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY]: [
            { ...baseParams, feeAddress: 'not an ethereum address' },
            otherBaseParams,
          ],
        });
      }).toThrowError('feeAddress is not a valid address');
    });

    it('cannot createCreationAction with invalid fee amount', () => {
      expect(() => {
        metaPn.createCreationAction({
          [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY]: [
            { ...baseParams, feeAmount: '-2000' },
            otherBaseParams,
          ],
        });
      }).toThrowError('feeAmount is not a valid amount');
    });
  });

  describe('applyActionToExtension', () => {
    describe('applyActionToExtension/create', () => {
      it('can applyActionToExtensions of creation', () => {
        // 'new extension state wrong'
        expect(
          metaPn.applyActionToExtension(
            MetaCreate.requestStateNoExtensions.extensions,
            MetaCreate.actionCreationMultipleAnyToErc20,
            MetaCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(MetaCreate.extensionFullStateMultipleAnyToErc20);
      });

      it('cannot applyActionToExtensions of creation with a previous state', () => {
        expect(() => {
          metaPn.applyActionToExtension(
            MetaCreate.requestFullStateCreated.extensions,
            MetaCreate.actionCreationMultipleAnyToErc20,
            MetaCreate.requestFullStateCreated,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('This extension has already been created');
      });

      it('cannot applyActionToExtensions of creation on a non supported currency', () => {
        const requestCreatedNoExtension: RequestLogicTypes.IRequest = deepCopy(
          TestData.requestCreatedNoExtension,
        );
        requestCreatedNoExtension.currency = {
          type: RequestLogicTypes.CURRENCY.BTC,
          value: 'BTC',
        };

        expect(() => {
          metaPn.applyActionToExtension(
            TestData.requestCreatedNoExtension.extensions,
            MetaCreate.actionCreationMultipleAnyToErc20,
            requestCreatedNoExtension,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(
          'The currency (BTC-mainnet, 0x03049758a18d1589388d7a74fb71c3fcce11d286) of the request is not supported for this payment network.',
        );
      });

      it('cannot applyActionToExtensions of creation with payment address not valid', () => {
        const actionWithInvalidAddress = deepCopy(MetaCreate.actionCreationMultipleAnyToErc20);
        actionWithInvalidAddress.parameters[
          ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY
        ][0].paymentAddress = DataConversionERC20FeeAddData.invalidAddress;

        expect(() => {
          metaPn.applyActionToExtension(
            MetaCreate.requestStateNoExtensions.extensions,
            actionWithInvalidAddress,
            MetaCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(
          `paymentAddress '${DataConversionERC20FeeAddData.invalidAddress}' is not a valid address`,
        );
      });

      it('cannot applyActionToExtensions of creation with no tokens accepted', () => {
        const actionWithInvalidToken = deepCopy(MetaCreate.actionCreationMultipleAnyToErc20);
        actionWithInvalidToken.parameters[
          ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY
        ][0].acceptedTokens = [];

        expect(() => {
          metaPn.applyActionToExtension(
            MetaCreate.requestStateNoExtensions.extensions,
            actionWithInvalidToken,
            MetaCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('acceptedTokens is required');
      });

      it('cannot applyActionToExtensions of creation with token address not valid', () => {
        const actionWithInvalidToken = deepCopy(MetaCreate.actionCreationMultipleAnyToErc20);
        actionWithInvalidToken.parameters[
          ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY
        ][0].acceptedTokens = ['invalid address'];

        expect(() => {
          metaPn.applyActionToExtension(
            MetaCreate.requestStateNoExtensions.extensions,
            actionWithInvalidToken,
            MetaCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('acceptedTokens must contains only valid ethereum addresses');
      });

      it('cannot applyActionToExtensions of creation with refund address not valid', () => {
        const testnetRefundAddress = deepCopy(MetaCreate.actionCreationMultipleAnyToErc20);
        testnetRefundAddress.parameters[
          ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY
        ][0].refundAddress = DataConversionERC20FeeAddData.invalidAddress;

        expect(() => {
          metaPn.applyActionToExtension(
            MetaCreate.requestStateNoExtensions.extensions,
            testnetRefundAddress,
            MetaCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(
          `refundAddress '${DataConversionERC20FeeAddData.invalidAddress}' is not a valid address`,
        );
      });
      it('keeps the version used at creation', () => {
        const newState = metaPn.applyActionToExtension(
          {},
          { ...MetaCreate.actionCreationMultipleAnyToErc20, version: 'ABCD' },
          MetaCreate.requestStateNoExtensions,
          TestData.otherIdRaw.identity,
          TestData.arbitraryTimestamp,
        );
        expect(newState[metaPn.extensionId].version).toBe('ABCD');
      });

      it('requires a version at creation', () => {
        expect(() => {
          metaPn.applyActionToExtension(
            {},
            { ...MetaCreate.actionCreationMultipleAnyToErc20, version: '' },
            MetaCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError('version is required at creation');
      });
    });

    describe('applyActionToExtension/applyApplyActionToExtension', () => {
      it('can applyActionToExtensions of applyApplyActionToExtension for addPaymentAddress', () => {
        expect(
          metaPn.applyActionToExtension(
            MetaCreate.requestStateCreatedMissingAddress.extensions,
            MetaCreate.actionApplyActionToPn,
            MetaCreate.requestStateCreatedMissingAddress,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(MetaCreate.extensionStateWithApplyAddPaymentAddressAfterCreation);
      });

      it('cannot applyActionToExtensions of applyApplyActionToExtension for addPaymentAddress without a previous state', () => {
        expect(() => {
          metaPn.applyActionToExtension(
            MetaCreate.requestStateNoExtensions.extensions,
            MetaCreate.actionApplyActionToPn,
            MetaCreate.requestStateNoExtensions,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`No payment network with identifier ${MetaCreate.salt2}`);
      });

      it('cannot applyActionToExtensions of applyApplyActionToExtension for addPaymentAddress without a payee', () => {
        const previousState = deepCopy(MetaCreate.requestStateCreatedMissingAddress);
        previousState.payee = undefined;

        expect(() => {
          metaPn.applyActionToExtension(
            previousState.extensions,
            MetaCreate.actionApplyActionToPn,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The request must have a payee`);
      });

      it('cannot applyActionToExtensions of applyApplyActionToExtension for addPaymentAddress signed by someone else than the payee', () => {
        const previousState = deepCopy(MetaCreate.requestStateCreatedMissingAddress);

        expect(() => {
          metaPn.applyActionToExtension(
            previousState.extensions,
            MetaCreate.actionApplyActionToPn,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The signer must be the payee`);
      });

      it('cannot applyActionToExtensions of applyApplyActionToExtension for addPaymentAddress with payment address already given', () => {
        expect(() => {
          metaPn.applyActionToExtension(
            MetaCreate.requestFullStateCreated.extensions,
            MetaCreate.actionApplyActionToPn,
            MetaCreate.requestFullStateCreated,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`Payment address already given`);
      });

      it('cannot applyActionToExtensions of applyApplyActionToExtension for addPaymentAddress with payment address not valid', () => {
        const actionWithInvalidAddress = deepCopy(MetaCreate.actionApplyActionToPn);
        actionWithInvalidAddress.parameters.parameters.paymentAddress =
          DataConversionERC20FeeAddData.invalidAddress;

        expect(() => {
          metaPn.applyActionToExtension(
            MetaCreate.requestStateCreatedMissingAddress.extensions,
            actionWithInvalidAddress,
            MetaCreate.requestStateCreatedMissingAddress,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(
          `paymentAddress '${DataConversionERC20FeeAddData.invalidAddress}' is not a valid address`,
        );
      });

      it('cannot applyActionToExtensions applyApplyActionToExtension when the pn identifier is wrong', () => {
        const actionWithInvalidPnIdentifier = deepCopy(MetaCreate.actionApplyActionToPn);
        actionWithInvalidPnIdentifier.parameters.pnIdentifier = 'wrongId';

        expect(() => {
          metaPn.applyActionToExtension(
            MetaCreate.requestStateCreatedMissingAddress.extensions,
            actionWithInvalidPnIdentifier,
            MetaCreate.requestStateCreatedMissingAddress,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`No payment network with identifier wrongId`);
      });

      it('cannot applyActionToExtensions applyApplyActionToExtension when the action does not exists on the sub pn', () => {
        const actionWithInvalidPnAction = deepCopy(MetaCreate.actionApplyActionToPn);
        actionWithInvalidPnAction.parameters.action = 'wrongAction' as ExtensionTypes.ACTION;

        expect(() => {
          metaPn.applyActionToExtension(
            MetaCreate.requestStateCreatedMissingAddress.extensions,
            actionWithInvalidPnAction,
            MetaCreate.requestStateCreatedMissingAddress,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`Unknown action: wrongAction`);
      });
    });
  });

  describe('declarative tests', () => {
    describe('applyActionToExtension/declareSentPayment', () => {
      it('can applyActionToExtensions of declareSentPayment', () => {
        expect(
          metaPn.applyActionToExtension(
            MetaCreate.requestFullStateCreated.extensions,
            MetaCreate.actionDeclareSentPayment,
            MetaCreate.requestFullStateCreated,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          ),
        ).toEqual(MetaCreate.extensionStateWithDeclaredSent);
      });

      it('cannot applyActionToExtensions of declareSentPayment without a previous state', () => {
        expect(() => {
          metaPn.applyActionToExtension(
            MetaCreate.requestStateNoExtensions.extensions,
            MetaCreate.actionDeclareSentPayment,
            MetaCreate.requestStateNoExtensions,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }).toThrowError(`The extension should be created before receiving any other action`);
      });
    });
  });
});
