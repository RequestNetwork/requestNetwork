import { AdvancedLogicTypes, ExtensionTypes } from '@requestnetwork/types';

import * as DataBTCCreate from './utils/payment-network/bitcoin/generator-data-create';
import * as DataDeclarativeCreate from './utils/payment-network/any/generator-data-create';
import * as DataTestnetBTCCreate from './utils/payment-network/bitcoin/testnet-generator-data-create';

import Utils from '@requestnetwork/utils';

import { AdvancedLogic } from '../src/index';

import { expect } from 'chai';

import * as TestData from './utils/test-data-generator';

let advancedLogic: AdvancedLogicTypes.IAdvancedLogic;

/* tslint:disable:no-unused-expression */
describe('advanced-logic.ts', () => {
  beforeEach(() => {
    advancedLogic = new AdvancedLogic();
  });
  describe('applyActionToExtensions', () => {
    it('can applyActionToExtensions', () => {
      const requestCreatedNoExtensionBefore = Utils.deepCopy(TestData.requestCreatedNoExtension);
      const previousState = {};

      const newExtensionState = advancedLogic.applyActionToExtensions(
        previousState,
        TestData.createContentDataExtensionData,
        requestCreatedNoExtensionBefore,
        TestData.payeeRaw.identity,
        TestData.arbitraryTimestamp,
      );

      expect(newExtensionState, 'newExtensionState wrong').to.deep.equal(
        TestData.expectedCreatedContentDataState,
      );
      expect(previousState, 'previous extension state must not change').to.deep.equal({});
      expect(
        requestCreatedNoExtensionBefore,
        'previous request state must not change',
      ).to.deep.equal(TestData.requestCreatedNoExtension);
    });

    it('can applyActionToExtensions with pn bitcoin address based', () => {
      const requestCreatedNoExtensionBefore = Utils.deepCopy(
        DataBTCCreate.requestStateNoExtensions,
      );

      const newExtensionState = advancedLogic.applyActionToExtensions(
        requestCreatedNoExtensionBefore.extensions,
        DataBTCCreate.actionCreationWithPaymentAndRefund,
        requestCreatedNoExtensionBefore,
        TestData.payeeRaw.identity,
        TestData.arbitraryTimestamp,
      );

      expect(newExtensionState, 'newExtensionState wrong').to.deep.equal(
        DataBTCCreate.extensionStateWithPaymentAndRefund,
      );
      expect(
        requestCreatedNoExtensionBefore,
        'previous extension state must not change',
      ).to.deep.equal(DataBTCCreate.requestStateNoExtensions);
    });

    it(
      'can applyActionToExtensions with pn testnet bitcoin address based',
      () => {
        const requestCreatedNoExtensionBefore = Utils.deepCopy(
          DataTestnetBTCCreate.requestStateNoExtensions,
        );

        const newExtensionState = advancedLogic.applyActionToExtensions(
          requestCreatedNoExtensionBefore.extensions,
          DataTestnetBTCCreate.actionCreationWithPaymentAndRefund,
          requestCreatedNoExtensionBefore,
          TestData.payeeRaw.identity,
          TestData.arbitraryTimestamp,
        );

        expect(newExtensionState, 'newExtensionState wrong').to.deep.equal(
          DataTestnetBTCCreate.extensionStateWithPaymentAndRefund,
        );
        expect(
          requestCreatedNoExtensionBefore,
          'previous extension state must not change',
        ).to.deep.equal(DataTestnetBTCCreate.requestStateNoExtensions);
      }
    );

    it('can applyActionToExtensions with declarative payment network', () => {
      const requestCreatedNoExtensionBefore = Utils.deepCopy(
        DataDeclarativeCreate.requestStateNoExtensions,
      );

      const newExtensionState = advancedLogic.applyActionToExtensions(
        requestCreatedNoExtensionBefore.extensions,
        DataDeclarativeCreate.actionCreationWithPaymentAndRefund,
        requestCreatedNoExtensionBefore,
        TestData.payeeRaw.identity,
        TestData.arbitraryTimestamp,
      );

      expect(newExtensionState, 'newExtensionState wrong').to.deep.equal(
        DataDeclarativeCreate.extensionStateWithPaymentAndRefund,
      );
      expect(
        requestCreatedNoExtensionBefore,
        'previous extension state must not change',
      ).to.deep.equal(DataDeclarativeCreate.requestStateNoExtensions);
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
      ).to.throw('extension not recognized, id: unknownExtension');
    });
  });
});
