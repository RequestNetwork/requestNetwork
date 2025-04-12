import { CurrencyManager } from '@requestnetwork/currency';
import { AdvancedLogicTypes, ExtensionTypes } from '@requestnetwork/types';

import * as DataBTCCreate from './utils/payment-network/bitcoin/generator-data-create';
import * as DataDeclarativeCreate from './utils/payment-network/any/generator-data-create';
import * as DataTestnetBTCCreate from './utils/payment-network/bitcoin/testnet-generator-data-create';

import { deepCopy } from '@requestnetwork/utils';

import { AdvancedLogic } from '../src/index';

import * as TestData from './utils/test-data-generator';

let advancedLogic: AdvancedLogicTypes.IAdvancedLogic;

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('advanced-logic.ts', () => {
  beforeEach(() => {
    advancedLogic = new AdvancedLogic(CurrencyManager.getDefault());
  });
  describe('applyActionToExtensions', () => {
    it('can applyActionToExtensions', () => {
      const requestCreatedNoExtensionBefore = deepCopy(TestData.requestCreatedNoExtension);
      const previousState = {};

      const newExtensionState = advancedLogic.applyActionToExtensions(
        previousState,
        TestData.createContentDataExtensionData,
        requestCreatedNoExtensionBefore,
        TestData.payeeRaw.identity,
        TestData.arbitraryTimestamp,
      );

      // 'newExtensionState wrong'
      expect(newExtensionState).toEqual(TestData.expectedCreatedContentDataState);
      // 'previous extension state must not change'
      expect(previousState).toEqual({});
      // 'previous request state must not change'
      expect(requestCreatedNoExtensionBefore).toEqual(TestData.requestCreatedNoExtension);
    });

    it('can applyActionToExtensions with pn bitcoin address based', () => {
      const requestCreatedNoExtensionBefore = deepCopy(DataBTCCreate.requestStateNoExtensions);

      const newExtensionState = advancedLogic.applyActionToExtensions(
        requestCreatedNoExtensionBefore.extensions,
        DataBTCCreate.actionCreationWithPaymentAndRefund,
        requestCreatedNoExtensionBefore,
        TestData.payeeRaw.identity,
        TestData.arbitraryTimestamp,
      );

      // 'newExtensionState wrong'
      expect(newExtensionState).toStrictEqual(DataBTCCreate.extensionStateWithPaymentAndRefund);
      // 'previous extension state must not change'
      expect(requestCreatedNoExtensionBefore).toEqual(DataBTCCreate.requestStateNoExtensions);
    });

    it('can applyActionToExtensions with pn testnet bitcoin address based', () => {
      const requestCreatedNoExtensionBefore = deepCopy(
        DataTestnetBTCCreate.requestStateNoExtensions,
      );

      const newExtensionState = advancedLogic.applyActionToExtensions(
        requestCreatedNoExtensionBefore.extensions,
        DataTestnetBTCCreate.actionCreationWithPaymentAndRefund,
        requestCreatedNoExtensionBefore,
        TestData.payeeRaw.identity,
        TestData.arbitraryTimestamp,
      );

      // 'newExtensionState wrong'
      expect(newExtensionState).toEqual(DataTestnetBTCCreate.extensionStateWithPaymentAndRefund);
      // 'previous extension state must not change'
      expect(requestCreatedNoExtensionBefore).toEqual(
        DataTestnetBTCCreate.requestStateNoExtensions,
      );
    });

    it('can applyActionToExtensions with declarative payment network', () => {
      const requestCreatedNoExtensionBefore = deepCopy(
        DataDeclarativeCreate.requestStateNoExtensions,
      );

      const newExtensionState = advancedLogic.applyActionToExtensions(
        requestCreatedNoExtensionBefore.extensions,
        DataDeclarativeCreate.actionCreationWithPaymentAndRefund,
        requestCreatedNoExtensionBefore,
        TestData.payeeRaw.identity,
        TestData.arbitraryTimestamp,
      );

      // 'newExtensionState wrong'
      expect(newExtensionState).toEqual(DataDeclarativeCreate.extensionStateWithPaymentAndRefund);
      // 'previous extension state must not change'
      expect(requestCreatedNoExtensionBefore).toEqual(
        DataDeclarativeCreate.requestStateNoExtensions,
      );
    });

    it('cannot apply unknown extension to extensions state', () => {
      expect(() =>
        advancedLogic.applyActionToExtensions(
          {},
          {
            id: 'unknownExtension',
            parameters: {},
            type: ExtensionTypes.TYPE.CONTENT_DATA,
            version: '0.1.0',
          } as any,
          TestData.requestCreatedNoExtension,
          TestData.payeeRaw.identity,
          TestData.arbitraryTimestamp,
        ),
      ).toThrowError('extension not recognized, id: unknownExtension');
    });
  });
});
