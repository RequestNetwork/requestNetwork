import { expect } from 'chai';
import 'mocha';

import { RequestLogic as Types } from '@requestnetwork/types';

import Request from '../../src/request';
import * as TestData from './utils/test-data-generator';

import Version from '../../src/version';
const CURRENT_VERSION = Version.currentVersion;

/* tslint:disable:no-unused-expression */
describe('Request', () => {
  describe('getRoleInRequest', () => {
    it('can getRoleInRequest()', () => {
      expect(
        Request.getRoleInRequest(TestData.payeeRaw.identity, TestData.requestCreatedNoExtension),
        'getRoleInRequest() error',
      ).to.be.deep.equal(Types.ROLE.PAYEE);
      expect(
        Request.getRoleInRequest(TestData.payerRaw.identity, TestData.requestCreatedNoExtension),
        'getRoleInRequest() error',
      ).to.be.deep.equal(Types.ROLE.PAYER);
      expect(
        Request.getRoleInRequest(TestData.otherIdRaw.identity, TestData.requestCreatedNoExtension),
        'getRoleInRequest() error',
      ).to.be.deep.equal(Types.ROLE.THIRD_PARTY);
    });
  });

  describe('checkRequest', () => {
    it('can valid request', () => {
      const requestError = {
        creator: TestData.payeeRaw.identity,
        currency: Types.CURRENCY.ETH,
        events: [],
        expectedAmount: TestData.arbitraryExpectedAmount,
        extensions: {},
        extensionsData: [],
        payee: TestData.payeeRaw.identity,
        requestId: TestData.requestIdMock,
        state: Types.STATE.CREATED,
        timestamp: 1544426030,
        version: CURRENT_VERSION,
      };
      expect(Request.checkRequest(requestError), 'checkRequest() must be true').to.be.true;
    });
    it('cannot valid request with no payer and no payee', () => {
      const requestNoPayeeNoPayer = {
        creator: TestData.payeeRaw.identity,
        currency: Types.CURRENCY.ETH,
        events: [],
        expectedAmount: TestData.arbitraryExpectedAmount,
        extensions: {},
        extensionsData: [],
        requestId: TestData.requestIdMock,
        state: Types.STATE.CREATED,
        timestamp: 1544426030,
        version: CURRENT_VERSION,
      };
      expect(() => Request.checkRequest(requestNoPayeeNoPayer)).to.throw(
        'request.payee and request.payer are missing',
      );
    });
    it('cannot valid request with no creator', () => {
      const requestError: any = {
        currency: Types.CURRENCY.ETH,
        events: [],
        expectedAmount: TestData.arbitraryExpectedAmount,
        payee: TestData.payeeRaw.identity,
        requestId: TestData.requestIdMock,
        state: Types.STATE.CREATED,
        version: CURRENT_VERSION,
      };
      expect(() => Request.checkRequest(requestError)).to.throw('request.creator is missing');
    });

    it('cannot valid request with expected amount missing', () => {
      const requestError: any = {
        creator: TestData.payeeRaw.identity,
        currency: Types.CURRENCY.ETH,
        events: [],
        payee: TestData.payeeRaw.identity,
        requestId: TestData.requestIdMock,
        state: Types.STATE.CREATED,
        version: CURRENT_VERSION,
      };
      expect(() => Request.checkRequest(requestError)).to.throw(
        'expectedAmount must be a positive integer',
      );
    });
    it('cannot valid request with expected amount not valid', () => {
      const requestError = {
        creator: TestData.payeeRaw.identity,
        currency: Types.CURRENCY.ETH,
        events: [],
        expectedAmount: '-10000',
        extensions: {},
        extensionsData: [],
        payee: TestData.payeeRaw.identity,
        requestId: TestData.requestIdMock,
        state: Types.STATE.CREATED,
        timestamp: 1544426030,
        version: CURRENT_VERSION,
      };
      expect(() => Request.checkRequest(requestError)).to.throw(
        'expectedAmount must be a positive integer',
      );
    });
    it('cannot valid request with creator identity type not supported', () => {
      const requestError: any = {
        creator: {
          type: 'not_supported_type',
          value: '0xaaaa',
        },
        currency: Types.CURRENCY.ETH,
        events: [],
        expectedAmount: TestData.arbitraryExpectedAmount,
        payee: TestData.payeeRaw.identity,
        requestId: TestData.requestIdMock,
        state: Types.STATE.CREATED,
        timestamp: 1544426030,
        version: CURRENT_VERSION,
      };
      expect(() => Request.checkRequest(requestError)).to.throw(
        'request.creator.type not supported',
      );
    });
    it('cannot valid request with payer identity type not supported', () => {
      const requestError: any = {
        creator: TestData.payeeRaw.identity,
        currency: Types.CURRENCY.ETH,
        events: [],
        expectedAmount: TestData.arbitraryExpectedAmount,
        payee: TestData.payeeRaw.identity,
        payer: {
          type: 'not_supported_type',
          value: '0xaaaa',
        },
        requestId: TestData.requestIdMock,
        state: Types.STATE.CREATED,
        version: CURRENT_VERSION,
      };
      expect(() => Request.checkRequest(requestError)).to.throw('request.payer.type not supported');
    });
    it('cannot valid request with payee identity type not supported', () => {
      const requestError: any = {
        creator: TestData.payeeRaw.identity,
        currency: Types.CURRENCY.ETH,
        events: [],
        expectedAmount: TestData.arbitraryExpectedAmount,
        payee: {
          type: 'not_supported_type',
          value: '0xaaaa',
        },
        requestId: TestData.requestIdMock,
        state: Types.STATE.CREATED,
        version: CURRENT_VERSION,
      };
      expect(() => Request.checkRequest(requestError)).to.throw('request.payee.type not supported');
    });

    it('cannot valid request with state missing', () => {
      const requestError: any = {
        creator: TestData.payeeRaw.identity,
        currency: Types.CURRENCY.ETH,
        events: [],
        expectedAmount: TestData.arbitraryExpectedAmount,
        payee: TestData.payeeRaw.identity,
        requestId: TestData.requestIdMock,
        version: CURRENT_VERSION,
      };
      expect(() => Request.checkRequest(requestError)).to.throw('request.state is missing');
    });
    it('cannot valid request with version missing', () => {
      const requestError: any = {
        creator: TestData.payeeRaw.identity,
        currency: Types.CURRENCY.ETH,
        events: [],
        expectedAmount: TestData.arbitraryExpectedAmount,
        payee: TestData.payeeRaw.identity,
        requestId: TestData.requestIdMock,
        state: Types.STATE.CREATED,
      };
      expect(() => Request.checkRequest(requestError)).to.throw('request.version is missing');
    });
    it('cannot valid request with currency missing', () => {
      const requestError: any = {
        creator: TestData.payeeRaw.identity,
        events: [],
        expectedAmount: TestData.arbitraryExpectedAmount,
        payee: TestData.payeeRaw.identity,
        requestId: TestData.requestIdMock,
        state: Types.STATE.CREATED,
        version: CURRENT_VERSION,
      };
      expect(() => Request.checkRequest(requestError)).to.throw('request.currency is missing');
    });
    it('cannot valid request with requestId missing', () => {
      const requestError: any = {
        creator: TestData.payeeRaw.identity,
        currency: Types.CURRENCY.ETH,
        events: [],
        expectedAmount: TestData.arbitraryExpectedAmount,
        payee: TestData.payeeRaw.identity,
        state: Types.STATE.CREATED,
        version: CURRENT_VERSION,
      };
      expect(() => Request.checkRequest(requestError)).to.throw('request.requestId is missing');
    });
  });
});
