import { RequestLogicTypes } from '@requestnetwork/types';

import Request from '../../src/request';
import * as TestData from './utils/test-data-generator';

import Version from '../../src/version';
const CURRENT_VERSION = Version.currentVersion;

/* tslint:disable:no-unused-expression */
describe('Request', () => {
  describe('getRoleInRequest', () => {
    it('can getRoleInRequest()', () => {
      // 'getRoleInRequest() error'
      expect(
        Request.getRoleInRequest(TestData.payeeRaw.identity, TestData.requestCreatedNoExtension)
      ).toEqual(RequestLogicTypes.ROLE.PAYEE);
      // 'getRoleInRequest() error'
      expect(
        Request.getRoleInRequest(TestData.payerRaw.identity, TestData.requestCreatedNoExtension)
      ).toEqual(RequestLogicTypes.ROLE.PAYER);
      // 'getRoleInRequest() error'
      expect(
        Request.getRoleInRequest(TestData.otherIdRaw.identity, TestData.requestCreatedNoExtension)
      ).toEqual(RequestLogicTypes.ROLE.THIRD_PARTY);
    });
  });

  describe('checkRequest', () => {
    it('can valid request', () => {
      const requestError = {
        creator: TestData.payeeRaw.identity,
        currency: {
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
        events: [],
        expectedAmount: TestData.arbitraryExpectedAmount,
        extensions: {},
        extensionsData: [],
        payee: TestData.payeeRaw.identity,
        requestId: TestData.requestIdMock,
        state: RequestLogicTypes.STATE.CREATED,
        timestamp: 1544426030,
        version: CURRENT_VERSION,
      };
      // 'checkRequest() must be true'
      expect(Request.checkRequest(requestError)).toBe(true);
    });
    it('cannot valid request with no payer and no payee', () => {
      const requestNoPayeeNoPayer = {
        creator: TestData.payeeRaw.identity,
        currency: {
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
        events: [],
        expectedAmount: TestData.arbitraryExpectedAmount,
        extensions: {},
        extensionsData: [],
        requestId: TestData.requestIdMock,
        state: RequestLogicTypes.STATE.CREATED,
        timestamp: 1544426030,
        version: CURRENT_VERSION,
      };
      expect(() => Request.checkRequest(requestNoPayeeNoPayer)).toThrowError('request.payee and request.payer are missing');
    });
    it('cannot valid request with no creator', () => {
      const requestError: any = {
        currency: {
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
        events: [],
        expectedAmount: TestData.arbitraryExpectedAmount,
        payee: TestData.payeeRaw.identity,
        requestId: TestData.requestIdMock,
        state: RequestLogicTypes.STATE.CREATED,
        version: CURRENT_VERSION,
      };
      expect(() => Request.checkRequest(requestError)).toThrowError('request.creator is missing');
    });

    it('cannot valid request with expected amount missing', () => {
      const requestError: any = {
        creator: TestData.payeeRaw.identity,
        currency: {
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
        events: [],
        payee: TestData.payeeRaw.identity,
        requestId: TestData.requestIdMock,
        state: RequestLogicTypes.STATE.CREATED,
        version: CURRENT_VERSION,
      };
      expect(() => Request.checkRequest(requestError)).toThrowError('expectedAmount must be a positive integer');
    });
    it('cannot valid request with expected amount not valid', () => {
      const requestError = {
        creator: TestData.payeeRaw.identity,
        currency: {
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
        events: [],
        expectedAmount: '-10000',
        extensions: {},
        extensionsData: [],
        payee: TestData.payeeRaw.identity,
        requestId: TestData.requestIdMock,
        state: RequestLogicTypes.STATE.CREATED,
        timestamp: 1544426030,
        version: CURRENT_VERSION,
      };
      expect(() => Request.checkRequest(requestError)).toThrowError('expectedAmount must be a positive integer');
    });
    it('cannot valid request with creator identity type not supported', () => {
      const requestError: any = {
        creator: {
          type: 'not_supported_type',
          value: '0xaaaa',
        },
        currency: {
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
        events: [],
        expectedAmount: TestData.arbitraryExpectedAmount,
        payee: TestData.payeeRaw.identity,
        requestId: TestData.requestIdMock,
        state: RequestLogicTypes.STATE.CREATED,
        timestamp: 1544426030,
        version: CURRENT_VERSION,
      };
      expect(() => Request.checkRequest(requestError)).toThrowError('request.creator.type not supported');
    });
    it('cannot valid request with payer identity type not supported', () => {
      const requestError: any = {
        creator: TestData.payeeRaw.identity,
        currency: {
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
        events: [],
        expectedAmount: TestData.arbitraryExpectedAmount,
        payee: TestData.payeeRaw.identity,
        payer: {
          type: 'not_supported_type',
          value: '0xaaaa',
        },
        requestId: TestData.requestIdMock,
        state: RequestLogicTypes.STATE.CREATED,
        version: CURRENT_VERSION,
      };
      expect(() => Request.checkRequest(requestError)).toThrowError('request.payer.type not supported');
    });
    it('cannot valid request with payee identity type not supported', () => {
      const requestError: any = {
        creator: TestData.payeeRaw.identity,
        currency: {
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
        events: [],
        expectedAmount: TestData.arbitraryExpectedAmount,
        payee: {
          type: 'not_supported_type',
          value: '0xaaaa',
        },
        requestId: TestData.requestIdMock,
        state: RequestLogicTypes.STATE.CREATED,
        version: CURRENT_VERSION,
      };
      expect(() => Request.checkRequest(requestError)).toThrowError('request.payee.type not supported');
    });

    it('cannot valid request with state missing', () => {
      const requestError: any = {
        creator: TestData.payeeRaw.identity,
        currency: {
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
        events: [],
        expectedAmount: TestData.arbitraryExpectedAmount,
        payee: TestData.payeeRaw.identity,
        requestId: TestData.requestIdMock,
        version: CURRENT_VERSION,
      };
      expect(() => Request.checkRequest(requestError)).toThrowError('request.state is missing');
    });
    it('cannot valid request with version missing', () => {
      const requestError: any = {
        creator: TestData.payeeRaw.identity,
        currency: {
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
        events: [],
        expectedAmount: TestData.arbitraryExpectedAmount,
        payee: TestData.payeeRaw.identity,
        requestId: TestData.requestIdMock,
        state: RequestLogicTypes.STATE.CREATED,
      };
      expect(() => Request.checkRequest(requestError)).toThrowError('request.version is missing');
    });
    it('cannot valid request with currency missing', () => {
      const requestError: any = {
        creator: TestData.payeeRaw.identity,
        events: [],
        expectedAmount: TestData.arbitraryExpectedAmount,
        payee: TestData.payeeRaw.identity,
        requestId: TestData.requestIdMock,
        state: RequestLogicTypes.STATE.CREATED,
        version: CURRENT_VERSION,
      };
      expect(() => Request.checkRequest(requestError)).toThrowError('request.currency is missing');
    });
    it('cannot valid request with requestId missing', () => {
      const requestError: any = {
        creator: TestData.payeeRaw.identity,
        currency: {
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
        events: [],
        expectedAmount: TestData.arbitraryExpectedAmount,
        payee: TestData.payeeRaw.identity,
        state: RequestLogicTypes.STATE.CREATED,
        version: CURRENT_VERSION,
      };
      expect(() => Request.checkRequest(requestError)).toThrowError('request.requestId is missing');
    });
  });
});
