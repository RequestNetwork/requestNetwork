import { expect } from 'chai';
import 'mocha';

import { RequestLogic as Types } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import Request from '../../src/request';
import * as TestData from './utils/test-data-generator';

import Version from '../../src/version';
const CURRENT_VERSION = Version.currentVersion;

/* tslint:disable:no-unused-expression */
describe('Request', () => {
  describe('pushExtensionsData', () => {
    it('can pushExtensionsData with array extensionsData on virgin request', () => {
      const newRequest = Request.pushExtensionsData(
        Utils.deepCopy(TestData),
        TestData.twoExtensions,
      );
      expect(newRequest.extensionsData, 'newRequest extensionsData error').to.be.deep.equal(
        TestData.twoExtensions,
      );
    });
    it('can pushExtensionsData with array extensionsData on request with extensionsData', () => {
      const newRequest = Request.pushExtensionsData(
        Utils.deepCopy(TestData.requestCreatedWithExtensions),
        TestData.twoExtensions,
      );
      expect(newRequest.extensionsData, 'newRequest extensionsData error').to.be.deep.equal(
        TestData.oneExtension.concat(TestData.twoExtensions),
      );
    });

    it('can pushExtensionsData with undefined on virgin request', () => {
      const newRequest = Request.pushExtensionsData(
        Utils.deepCopy(TestData.requestCreatedNoExtension),
      );
      expect(newRequest.extensionsData, 'newRequest extensionsData error').to.be.undefined;
    });
    it('can pushExtensionsData with undefined on request with extension', () => {
      const newRequest = Request.pushExtensionsData(
        Utils.deepCopy(TestData.requestCreatedWithExtensions),
      );
      expect(newRequest.extensionsData, 'newRequest extensionsData error').to.be.deep.equal(
        TestData.oneExtension,
      );
    });
    it('can pushExtensionsData with empty array on virgin request', () => {
      const newRequest = Request.pushExtensionsData(
        Utils.deepCopy(TestData.requestCreatedNoExtension),
        [],
      );
      expect(newRequest.extensionsData, 'newRequest extensionsData error').to.be.deep.equal([]);
    });
    it('can pushExtensionsData with empty array on request with extension', () => {
      const newRequest = Request.pushExtensionsData(
        Utils.deepCopy(TestData.requestCreatedWithExtensions),
        [],
      );
      expect(newRequest.extensionsData, 'newRequest extensionsData error').to.be.deep.equal(
        TestData.oneExtension,
      );
    });
  });

  describe('getRoleInRequest', () => {
    it('can getRoleInRequest()', () => {
      expect(
        Request.getRoleInRequest(TestData.payeeRaw.identity, TestData.requestCreatedNoExtension),
        'getRoleInRequest() error',
      ).to.be.deep.equal(Types.REQUEST_LOGIC_ROLE.PAYEE);
      expect(
        Request.getRoleInRequest(TestData.payerRaw.identity, TestData.requestCreatedNoExtension),
        'getRoleInRequest() error',
      ).to.be.deep.equal(Types.REQUEST_LOGIC_ROLE.PAYER);
      expect(
        Request.getRoleInRequest(TestData.otherIdRaw.identity, TestData.requestCreatedNoExtension),
        'getRoleInRequest() error',
      ).to.be.deep.equal(Types.REQUEST_LOGIC_ROLE.THIRD_PARTY);
    });
  });

  describe('checkRequest', () => {
    it('can valid request', () => {
      const requestError = {
        creator: TestData.payeeRaw.identity,
        currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
        events: [],
        expectedAmount: TestData.arbitraryExpectedAmount,
        payee: TestData.payeeRaw.identity,
        requestId: TestData.requestIdMock,
        state: Types.REQUEST_LOGIC_STATE.CREATED,
        version: CURRENT_VERSION,
      };
      expect(Request.checkRequest(requestError), 'checkRequest() must be true').to.be.true;
    });
    it('cannot valid request with no payer and no payee', () => {
      try {
        const requestNoPayeeNoPayer = {
          creator: TestData.payeeRaw.identity,
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          events: [],
          expectedAmount: TestData.arbitraryExpectedAmount,
          requestId: TestData.requestIdMock,
          state: Types.REQUEST_LOGIC_STATE.CREATED,
          version: CURRENT_VERSION,
        };
        Request.checkRequest(requestNoPayeeNoPayer);
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'request.payee and request.payer are missing',
        );
      }
    });
    it('cannot valid request with no creator', () => {
      try {
        const requestError: any = {
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          events: [],
          expectedAmount: TestData.arbitraryExpectedAmount,
          payee: TestData.payeeRaw.identity,
          requestId: TestData.requestIdMock,
          state: Types.REQUEST_LOGIC_STATE.CREATED,
          version: CURRENT_VERSION,
        };
        Request.checkRequest(requestError);
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('request.creator is missing');
      }
    });

    it('cannot valid request with expected amount missing', () => {
      try {
        const requestError: any = {
          creator: TestData.payeeRaw.identity,
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          events: [],
          payee: TestData.payeeRaw.identity,
          requestId: TestData.requestIdMock,
          state: Types.REQUEST_LOGIC_STATE.CREATED,
          version: CURRENT_VERSION,
        };
        Request.checkRequest(requestError);
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'expectedAmount must be a positive integer',
        );
      }
    });
    it('cannot valid request with expected amount not valid', () => {
      try {
        const requestError = {
          creator: TestData.payeeRaw.identity,
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          events: [],
          expectedAmount: '-10000',
          payee: TestData.payeeRaw.identity,
          requestId: TestData.requestIdMock,
          state: Types.REQUEST_LOGIC_STATE.CREATED,
          version: CURRENT_VERSION,
        };
        Request.checkRequest(requestError);
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal(
          'expectedAmount must be a positive integer',
        );
      }
    });
    it('cannot valid request with creator identity type not supported', () => {
      try {
        const requestError: any = {
          creator: {
            type: 'not_supported_type',
            value: '0xaaaa',
          },
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          events: [],
          expectedAmount: TestData.arbitraryExpectedAmount,
          payee: TestData.payeeRaw.identity,
          requestId: TestData.requestIdMock,
          state: Types.REQUEST_LOGIC_STATE.CREATED,
          version: CURRENT_VERSION,
        };
        Request.checkRequest(requestError);
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('request.creator.type not supported');
      }
    });
    it('cannot valid request with payer identity type not supported', () => {
      try {
        const requestError: any = {
          creator: TestData.payeeRaw.identity,
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          events: [],
          expectedAmount: TestData.arbitraryExpectedAmount,
          payee: TestData.payeeRaw.identity,
          payer: {
            type: 'not_supported_type',
            value: '0xaaaa',
          },
          requestId: TestData.requestIdMock,
          state: Types.REQUEST_LOGIC_STATE.CREATED,
          version: CURRENT_VERSION,
        };
        Request.checkRequest(requestError);
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('request.payer.type not supported');
      }
    });
    it('cannot valid request with payee identity type not supported', () => {
      try {
        const requestError: any = {
          creator: TestData.payeeRaw.identity,
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          events: [],
          expectedAmount: TestData.arbitraryExpectedAmount,
          payee: {
            type: 'not_supported_type',
            value: '0xaaaa',
          },
          requestId: TestData.requestIdMock,
          state: Types.REQUEST_LOGIC_STATE.CREATED,
          version: CURRENT_VERSION,
        };
        Request.checkRequest(requestError);
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('request.payee.type not supported');
      }
    });

    it('cannot valid request with state missing', () => {
      try {
        const requestError: any = {
          creator: TestData.payeeRaw.identity,
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          events: [],
          expectedAmount: TestData.arbitraryExpectedAmount,
          payee: TestData.payeeRaw.identity,
          requestId: TestData.requestIdMock,
          version: CURRENT_VERSION,
        };
        Request.checkRequest(requestError);
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('request.state is missing');
      }
    });
    it('cannot valid request with version missing', () => {
      try {
        const requestError: any = {
          creator: TestData.payeeRaw.identity,
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          events: [],
          expectedAmount: TestData.arbitraryExpectedAmount,
          payee: TestData.payeeRaw.identity,
          requestId: TestData.requestIdMock,
          state: Types.REQUEST_LOGIC_STATE.CREATED,
        };
        Request.checkRequest(requestError);
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('request.version is missing');
      }
    });
    it('cannot valid request with currency missing', () => {
      try {
        const requestError: any = {
          creator: TestData.payeeRaw.identity,
          events: [],
          expectedAmount: TestData.arbitraryExpectedAmount,
          payee: TestData.payeeRaw.identity,
          requestId: TestData.requestIdMock,
          state: Types.REQUEST_LOGIC_STATE.CREATED,
          version: CURRENT_VERSION,
        };
        Request.checkRequest(requestError);
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('request.currency is missing');
      }
    });
    it('cannot valid request with requestId missing', () => {
      try {
        const requestError: any = {
          creator: TestData.payeeRaw.identity,
          currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
          events: [],
          expectedAmount: TestData.arbitraryExpectedAmount,
          payee: TestData.payeeRaw.identity,
          state: Types.REQUEST_LOGIC_STATE.CREATED,
          version: CURRENT_VERSION,
        };
        Request.checkRequest(requestError);
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('request.requestId is missing');
      }
    });
  });
});
