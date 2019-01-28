import 'mocha';

import { Extension as ExtensionTypes } from '@requestnetwork/types';

import * as DataBTCCreate from './utils/payment-network/bitcoin/generator-data-create';

import Utils from '@requestnetwork/utils';

import { AdvancedLogic } from '../src/index';

import { expect } from 'chai';

import * as TestData from './utils/test-data-generator';

/* tslint:disable:no-unused-expression */
describe('advanced-logic.ts', () => {
  describe('applyActionToExtensions', () => {
    it('can applyActionToExtensions', () => {
      const requestCreatedNoExtensionBefore = Utils.deepCopy(TestData.requestCreatedNoExtension);
      const previousState = {};

      const newExtensionState = AdvancedLogic.applyActionToExtensions(
        previousState,
        TestData.createContentDataExtensionData,
        requestCreatedNoExtensionBefore,
        TestData.payeeRaw.identity,
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

      const newExtensionState = AdvancedLogic.applyActionToExtensions(
        requestCreatedNoExtensionBefore.extensions,
        DataBTCCreate.actionCreationWithPaymentAndRefund,
        requestCreatedNoExtensionBefore,
        TestData.payeeRaw.identity,
      );

      expect(newExtensionState, 'newExtensionState wrong').to.deep.equal(
        DataBTCCreate.extensionStateWithPaymentAndRefund,
      );
      expect(
        requestCreatedNoExtensionBefore,
        'previous extension state must not change',
      ).to.deep.equal(DataBTCCreate.requestStateNoExtensions);
    });

    it('cannot apply unknown extension to extensions state', () => {
      expect(() =>
        AdvancedLogic.applyActionToExtensions(
          {},
          {
            id: 'unknownExtension',
            parameters: {},
            type: ExtensionTypes.EXTENSION_TYPE.CONTENT_DATA,
            version: '0.1.0',
          } as any,
          TestData.requestCreatedNoExtension,
          TestData.payeeRaw.identity,
        ),
      ).to.throw('extension not recognized, id: unknownExtension');
    });
  });
});
