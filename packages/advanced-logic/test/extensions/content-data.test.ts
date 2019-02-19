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
        TestData.otherIdRaw.identity,
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
            action: ExtensionTypes.ContentData.ACTION.CREATE,
            id: ExtensionTypes.ID.CONTENT_DATA,
            parameters: { content: { what: 'ever', it: 'is' } },
            version: '0.1.0',
          },
          TestData.requestCreatedWithContentData,
          TestData.otherIdRaw.identity,
        ),
      ).to.throw('This extension have already been created');
    });

    it('cannot create state if action parameters do not have content', () => {
      expect(() =>
        ContentData.applyActionToExtension(
          {},
          {
            action: ExtensionTypes.ContentData.ACTION.CREATE,
            id: ExtensionTypes.ID.CONTENT_DATA,
            parameters: {},
            version: '0.1.0',
          },
          TestData.requestCreatedNoExtension,
          TestData.otherIdRaw.identity,
        ),
      ).to.throw('No content has been given for the extension content-data');
    });

    it('cannot create state if action unknown', () => {
      expect(() => {
        ContentData.applyActionToExtension(
          {},
          {
            action: 'unknown action',
            id: ExtensionTypes.ID.CONTENT_DATA,
            parameters: {},
            version: '0.1.0',
          },
          TestData.requestCreatedNoExtension,
          TestData.otherIdRaw.identity,
        );
      }, 'must throw').to.throw('Unknown action: unknown action');
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
