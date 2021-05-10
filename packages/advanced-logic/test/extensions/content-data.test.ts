import { ExtensionTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import ContentData from '../../src/extensions/content-data';

import * as TestData from '../utils/test-data-generator';

const contentData = new ContentData();

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('content-data', () => {
  describe('applyActionToExtension', () => {
    it('can applyActionToExtensions', () => {
      const requestCreatedNoExtensionBefore = Utils.deepCopy(TestData.requestCreatedNoExtension);
      const previousState = {};
      const newExtensionState = contentData.applyActionToExtension(
        previousState,
        TestData.createContentDataExtensionData,
        requestCreatedNoExtensionBefore,
        TestData.otherIdRaw.identity,
        TestData.arbitraryTimestamp,
      );

      // 'newExtensionState wrong'
      expect(newExtensionState).toEqual(TestData.expectedCreatedContentDataState);

      // 'previous extension state must not change'
      expect(previousState).toEqual({});
      // 'previous request state must not change'
      expect(requestCreatedNoExtensionBefore).toEqual(TestData.requestCreatedNoExtension);
    });
    it('cannot create state if already state', () => {
      expect(() =>
        contentData.applyActionToExtension(
          TestData.expectedCreatedContentDataState,
          {
            action: ExtensionTypes.ContentData.ACTION.CREATE,
            id: ExtensionTypes.ID.CONTENT_DATA,
            parameters: { content: { what: 'ever', it: 'is' } },
            version: '0.1.0',
          },
          TestData.requestCreatedWithContentData,
          TestData.otherIdRaw.identity,
          TestData.arbitraryTimestamp,
        ),
      ).toThrowError('This extension has already been created');
    });

    it('cannot create state if action parameters do not have content', () => {
      expect(() =>
        contentData.applyActionToExtension(
          {},
          {
            action: ExtensionTypes.ContentData.ACTION.CREATE,
            id: ExtensionTypes.ID.CONTENT_DATA,
            parameters: {},
            version: '0.1.0',
          },
          TestData.requestCreatedNoExtension,
          TestData.otherIdRaw.identity,
          TestData.arbitraryTimestamp,
        ),
      ).toThrowError('No content has been given for the extension content-data');
    });

    it('cannot create state if action unknown', () => {
      // 'must throw'
      expect(() => {
        contentData.applyActionToExtension(
          {},
          {
            action: 'unknown action',
            id: ExtensionTypes.ID.CONTENT_DATA,
            parameters: {},
            version: '0.1.0',
          },
          TestData.requestCreatedNoExtension,
          TestData.otherIdRaw.identity,
          TestData.arbitraryTimestamp,
        );
      }).toThrowError('The extension should be created before receiving any other action');
    });
  });

  describe('createCreationAction', () => {
    it('can createCreationAction', () => {
      const extensionDataCreated = contentData.createCreationAction({
        content: { what: 'ever', it: 'is' },
      });

      // 'extensionDataCreated wrong'
      expect(extensionDataCreated).toEqual(TestData.createContentDataExtensionData);
    });
    it('cannot create extension data if parameters do not have content', () => {
      expect(() => contentData.createCreationAction({} as any)).toThrowError(
        'No content has been given for the extension content-data',
      );
    });
  });
});
