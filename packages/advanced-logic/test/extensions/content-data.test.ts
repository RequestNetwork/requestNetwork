import 'mocha';

import { Extension as ExtensionTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import ContentData from '../../src/extensions/content-data';

import { expect } from 'chai';

import * as TestData from '../utils/test-data-generator';

/* tslint:disable:no-unused-expression */
describe('content-data', () => {
  describe('applyActionToExtension', () => {
    it('can applyActionToExtensions', () => {
      const requestCreatedNoExtensionBefore = Utils.deepCopy(TestData.requestCreatedNoExtension);
      const previousState = {};
      const newExtensionState = ContentData.applyActionToExtension(
        previousState,
        TestData.createContentDataExtensionData,
        requestCreatedNoExtensionBefore,
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
    it('cannot create state if already state', () => {
      expect(() =>
        ContentData.applyActionToExtension(
          TestData.expectedCreatedContentDataState,
          {
            id: ExtensionTypes.EXTENSION_ID.CONTENT_DATA,
            parameters: { content: { what: 'ever', it: 'is' } },
            type: ExtensionTypes.EXTENSION_TYPE.CONTENT_DATA,
            version: '0.1.0',
          } as any,
          TestData.requestCreatedWithContentData,
        ),
      ).to.throw('This extension have already been created');
    });

    it('cannot create state if action parameters do not have content', () => {
      expect(() =>
        ContentData.applyActionToExtension(
          {},
          {
            id: ExtensionTypes.EXTENSION_ID.CONTENT_DATA,
            parameters: {},
            type: ExtensionTypes.EXTENSION_TYPE.CONTENT_DATA,
            version: '0.1.0',
          } as any,
          TestData.requestCreatedNoExtension,
        ),
      ).to.throw('No content has been given for the extension content-data');
    });
  });

  describe('createCreationAction', () => {
    it('can createCreationAction', () => {
      const extensionDataCreated = ContentData.createCreationAction({
        content: { what: 'ever', it: 'is' },
      });

      expect(extensionDataCreated, 'extensionDataCreated wrong').to.deep.equal(
        TestData.createContentDataExtensionData,
      );
    });
    it('cannot create extension data if parameters do not have content', () => {
      expect(() => ContentData.createCreationAction({} as any)).to.throw(
        'No content has been given for the extension content-data',
      );
    });
  });
});
