import { expect } from 'chai';
import 'mocha';
const bigNumber: any = require('bn.js');

import Utils from '@requestnetwork/utils';
import * as RequestEnum from '../../src/enum';
import Request from '../../src/request';
import * as TestData from './utils/test-data-generator';

import Version from '../../src/version';
const CURRENT_VERSION = Version.currentVersion;

/* tslint:disable:no-unused-expression */
describe('Request', () => {
  describe('pushExtensions', () => {
    it('can pushExtensions with array extensions on virgin request', () => {
      const newRequest = Request.pushExtensions(Utils.deepCopy(TestData), TestData.twoExtensions);
      expect(newRequest.extensions, 'newRequest extensions error').to.be.deep.equal(
        TestData.twoExtensions,
      );
    });
    it('can pushExtensions with array extensions on request with extensions', () => {
      const newRequest = Request.pushExtensions(
        Utils.deepCopy(TestData.requestCreatedWithExtensions),
        TestData.twoExtensions,
      );
      expect(newRequest.extensions, 'newRequest extensions error').to.be.deep.equal(
        TestData.oneExtension.concat(TestData.twoExtensions),
      );
    });

    it('can pushExtensions with undefined on virgin request', () => {
      const newRequest = Request.pushExtensions(Utils.deepCopy(TestData.requestCreatedNoExtension));
      expect(newRequest.extensions, 'newRequest extensions error').to.be.undefined;
    });
    it('can pushExtensions with undefined on request with extension', () => {
      const newRequest = Request.pushExtensions(
        Utils.deepCopy(TestData.requestCreatedWithExtensions),
      );
      expect(newRequest.extensions, 'newRequest extensions error').to.be.deep.equal(
        TestData.oneExtension,
      );
    });
    it('can pushExtensions with empty array on virgin request', () => {
      const newRequest = Request.pushExtensions(
        Utils.deepCopy(TestData.requestCreatedNoExtension),
        [],
      );
      expect(newRequest.extensions, 'newRequest extensions error').to.be.deep.equal([]);
    });
    it('can pushExtensions with empty array on request with extension', () => {
      const newRequest = Request.pushExtensions(
        Utils.deepCopy(TestData.requestCreatedWithExtensions),
        [],
      );
      expect(newRequest.extensions, 'newRequest extensions error').to.be.deep.equal(
        TestData.oneExtension,
      );
    });
  });

  describe('getRoleInRequest', () => {
    it('can getRoleInRequest()', () => {
      expect(
        Request.getRoleInRequest(TestData.payeeRaw.identity, TestData.requestCreatedNoExtension),
        'getRoleInTransaction() error',
      ).to.be.deep.equal(RequestEnum.REQUEST_LOGIC_ROLE.PAYEE);
      expect(
        Request.getRoleInRequest(TestData.payerRaw.identity, TestData.requestCreatedNoExtension),
        'getRoleInTransaction() error',
      ).to.be.deep.equal(RequestEnum.REQUEST_LOGIC_ROLE.PAYER);
      expect(
        Request.getRoleInRequest(TestData.otherIdRaw.identity, TestData.requestCreatedNoExtension),
        'getRoleInTransaction() error',
      ).to.be.deep.equal(RequestEnum.REQUEST_LOGIC_ROLE.THIRD_PARTY);
    });
  });

  describe('checkRequest', () => {
    it('can valid request', () => {
      const requestError = {
        creator: TestData.payeeRaw.identity,
        currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
        expectedAmount: TestData.arbitraryExpectedAmount,
        payee: TestData.payeeRaw.identity,
        requestId: TestData.requestIdMock,
        state: RequestEnum.REQUEST_LOGIC_STATE.CREATED,
        version: CURRENT_VERSION,
      };
      expect(Request.checkRequest(requestError), 'checkRequest() must be true').to.be.true;
    });
    it('cannot valid request with no payer and no payee', () => {
      try {
        const requestNoPayeeNoPayer = {
          creator: TestData.payeeRaw.identity,
          currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
          expectedAmount: TestData.arbitraryExpectedAmount,
          requestId: TestData.requestIdMock,
          state: RequestEnum.REQUEST_LOGIC_STATE.CREATED,
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
        // parse/stringify to avoid typescript check on type
        const requestError = JSON.parse(
          JSON.stringify({
            currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
            expectedAmount: TestData.arbitraryExpectedAmount,
            payee: TestData.payeeRaw.identity,
            requestId: TestData.requestIdMock,
            state: RequestEnum.REQUEST_LOGIC_STATE.CREATED,
            version: CURRENT_VERSION,
          }),
        );
        Request.checkRequest(requestError);
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('request.creator is missing');
      }
    });

    it('cannot valid request with expected amount missing', () => {
      try {
        // parse/stringify to avoid typescript check on type
        const requestError = JSON.parse(
          JSON.stringify({
            creator: TestData.payeeRaw.identity,
            currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
            payee: TestData.payeeRaw.identity,
            requestId: TestData.requestIdMock,
            state: RequestEnum.REQUEST_LOGIC_STATE.CREATED,
            version: CURRENT_VERSION,
          }),
        );
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
        // parse/stringify to avoid typescript check on type
        const requestError = {
          creator: TestData.payeeRaw.identity,
          currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
          expectedAmount: '-10000',
          payee: TestData.payeeRaw.identity,
          requestId: TestData.requestIdMock,
          state: RequestEnum.REQUEST_LOGIC_STATE.CREATED,
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
        // parse/stringify to avoid typescript check on type
        const requestError = JSON.parse(
          JSON.stringify({
            creator: {
              type: 'not_supported_type',
              value: '0xaaaa',
            },
            currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
            expectedAmount: TestData.arbitraryExpectedAmount,
            payee: TestData.payeeRaw.identity,
            requestId: TestData.requestIdMock,
            state: RequestEnum.REQUEST_LOGIC_STATE.CREATED,
            version: CURRENT_VERSION,
          }),
        );
        Request.checkRequest(requestError);
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('request.creator.type not supported');
      }
    });
    it('cannot valid request with payer identity type not supported', () => {
      try {
        // parse/stringify to avoid typescript check on type
        const requestError = JSON.parse(
          JSON.stringify({
            creator: TestData.payeeRaw.identity,
            currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
            expectedAmount: TestData.arbitraryExpectedAmount,
            payee: TestData.payeeRaw.identity,
            payer: {
              type: 'not_supported_type',
              value: '0xaaaa',
            },
            requestId: TestData.requestIdMock,
            state: RequestEnum.REQUEST_LOGIC_STATE.CREATED,
            version: CURRENT_VERSION,
          }),
        );
        Request.checkRequest(requestError);
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('request.payer.type not supported');
      }
    });
    it('cannot valid request with payee identity type not supported', () => {
      try {
        // parse/stringify to avoid typescript check on type
        const requestError = JSON.parse(
          JSON.stringify({
            creator: TestData.payeeRaw.identity,
            currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
            expectedAmount: TestData.arbitraryExpectedAmount,
            payee: {
              type: 'not_supported_type',
              value: '0xaaaa',
            },
            requestId: TestData.requestIdMock,
            state: RequestEnum.REQUEST_LOGIC_STATE.CREATED,
            version: CURRENT_VERSION,
          }),
        );
        Request.checkRequest(requestError);
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('request.payee.type not supported');
      }
    });

    it('cannot valid request with state missing', () => {
      try {
        // parse/stringify to avoid typescript check on type
        const requestError = JSON.parse(
          JSON.stringify({
            creator: TestData.payeeRaw.identity,
            currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
            expectedAmount: TestData.arbitraryExpectedAmount,
            payee: TestData.payeeRaw.identity,
            requestId: TestData.requestIdMock,
            version: CURRENT_VERSION,
          }),
        );
        Request.checkRequest(requestError);
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('request.state is missing');
      }
    });
    it('cannot valid request with version missing', () => {
      try {
        // parse/stringify to avoid typescript check on type
        const requestError = JSON.parse(
          JSON.stringify({
            creator: TestData.payeeRaw.identity,
            currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
            expectedAmount: TestData.arbitraryExpectedAmount,
            payee: TestData.payeeRaw.identity,
            requestId: TestData.requestIdMock,
            state: RequestEnum.REQUEST_LOGIC_STATE.CREATED,
          }),
        );
        Request.checkRequest(requestError);
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('request.version is missing');
      }
    });
    it('cannot valid request with currency missing', () => {
      try {
        // parse/stringify to avoid typescript check on type
        const requestError = JSON.parse(
          JSON.stringify({
            creator: TestData.payeeRaw.identity,
            expectedAmount: TestData.arbitraryExpectedAmount,
            payee: TestData.payeeRaw.identity,
            requestId: TestData.requestIdMock,
            state: RequestEnum.REQUEST_LOGIC_STATE.CREATED,
            version: CURRENT_VERSION,
          }),
        );
        Request.checkRequest(requestError);
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('request.currency is missing');
      }
    });
    it('cannot valid request with requestId missing', () => {
      try {
        // parse/stringify to avoid typescript check on type
        const requestError = JSON.parse(
          JSON.stringify({
            creator: TestData.payeeRaw.identity,
            currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
            expectedAmount: TestData.arbitraryExpectedAmount,
            payee: TestData.payeeRaw.identity,
            state: RequestEnum.REQUEST_LOGIC_STATE.CREATED,
            version: CURRENT_VERSION,
          }),
        );
        Request.checkRequest(requestError);
        expect(false, 'exception not thrown').to.be.true;
      } catch (e) {
        expect(e.message, 'exception not right').to.be.equal('request.requestId is missing');
      }
    });
  });
});
