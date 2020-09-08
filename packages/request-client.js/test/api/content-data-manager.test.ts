import { AdvancedLogicTypes } from '@requestnetwork/types';

import ContentDataExtension from '../../src/api/content-data-extension';

import * as TestData from './data-for-content-data-extension.test';

import 'chai';

const chai = require('chai');
const spies = require('chai-spies');
const expect = chai.expect;
chai.use(spies);
const sandbox = chai.spy.sandbox();

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions(): any {
    return;
  },
  extensions: {
    contentData: {
      createCreationAction(): any {
        return;
      },
    },
  },
};

let contentDataExtension: ContentDataExtension;

// Most of the tests are done as integration tests in ../index.test.ts
/* tslint:disable:no-unused-expression */
describe('api/content-data-extension', () => {
  beforeEach(() => {
    sandbox.restore();
    contentDataExtension = new ContentDataExtension(mockAdvancedLogic);
  });
  describe('createExtensionsDataForCreation', () => {
    it('can createExtensionsDataForCreation', async () => {
      const content = { what: 'ever', content: 'it', is: true };
      const spy = sandbox.on(mockAdvancedLogic.extensions.contentData, 'createCreationAction');

      contentDataExtension.createExtensionsDataForCreation(content);

      expect(spy).to.have.been.called.once;
    });
    it('can createExtensionsDataForCreation with data format', async () => {
      const content = TestData;
      const spy = sandbox.on(mockAdvancedLogic.extensions.contentData, 'createCreationAction');

      contentDataExtension.createExtensionsDataForCreation(content);

      expect(spy).to.have.been.called.once;
    });
    it(
      'cannot createExtensionsDataForCreation with content data following data-format but wrong',
      async () => {
        const content = { meta: { format: 'rnf_invoice', version: '0.0.2' } };

        expect(() => {
          contentDataExtension.createExtensionsDataForCreation(content);
        }).to.throw();
      }
    );
  });
});
