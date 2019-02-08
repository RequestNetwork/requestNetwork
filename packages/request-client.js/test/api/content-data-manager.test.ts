import { AdvancedLogic as AdvancedLogicTypes } from '@requestnetwork/types';

import ContentDataManager from '../../src/api/content-data-manager';

import * as TestData from './data-for-content-data-manager.test';

import 'chai';
import 'mocha';

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

let contentDataManager: ContentDataManager;

// Most of the tests are done as integration tests in ../index.test.ts
/* tslint:disable:no-unused-expression */
describe('api/content-data-manager', () => {
  beforeEach(() => {
    sandbox.restore();
    contentDataManager = new ContentDataManager(mockAdvancedLogic);
  });
  describe('createExtensionsDataForCreation', () => {
    it('can createExtensionsDataForCreation', async () => {
      const content = { what: 'ever', content: 'it', is: true };
      const spy = sandbox.on(mockAdvancedLogic.extensions.contentData, 'createCreationAction');

      contentDataManager.createExtensionsDataForCreation(content);

      expect(spy).to.have.been.called.once;
    });
    it('can createExtensionsDataForCreation with data format', async () => {
      const content = TestData;
      const spy = sandbox.on(mockAdvancedLogic.extensions.contentData, 'createCreationAction');

      contentDataManager.createExtensionsDataForCreation(content);

      expect(spy).to.have.been.called.once;
    });
    it('cannot createExtensionsDataForCreation with content data following data-format but wrong', async () => {
      const content = { meta: { format: 'rnf_invoice', version: '0.0.2' } };

      expect(() => {
        contentDataManager.createExtensionsDataForCreation(content);
      }).to.throw();
    });
  });
});
