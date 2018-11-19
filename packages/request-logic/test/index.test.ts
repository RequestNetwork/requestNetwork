// import { expect } from 'chai';
import 'mocha';

import { RequestLogic as Types } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import { RequestLogic } from '../src/index';
import * as TestData from './unit/utils/test-data-generator';

import Version from '../src/version';
const CURRENT_VERSION = Version.currentVersion;

const chai = require('chai');
const spies = require('chai-spies');
const expect = chai.expect;

chai.use(spies);

const createParams = {
  currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
  expectedAmount: TestData.arbitraryExpectedAmount,
  payee: TestData.payeeRaw.identity,
  payer: TestData.payerRaw.identity,
};
const requestId = '0x145ee74b7aebc87c60c0f20094a9b9c1b382796199abf59143daade72f1e1f9e';

const fakeDataAccess = {
  get: chai.spy(),
  persist: chai.spy(),
};

describe('index', () => {
  describe('createRequest', () => {
    it('can createRequest', () => {
      const requestLogic = new RequestLogic(fakeDataAccess);

      const result = requestLogic.createRequest(createParams, {
        method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
        privateKey: TestData.payeeRaw.privateKey,
      });

      expect(fakeDataAccess.persist).to.have.been.called.with(
        '{"transaction":{"action":"create","parameters":{"currency":"ETH","expectedAmount":"123400000000000000","payee":{"type":"ethereumAddress","value":"0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce"},"payer":{"type":"ethereumAddress","value":"0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6"}},"version":"0.1.0"},"signature":{"method":"ecdsa","value":"0xfbbe97a8c095d1379db035dc96ccdfdd7bc633b30dc8b6a6b4a97bb60a855a8172972cba0ab2dd817ec6786b0e70c413f279a1ce406cc155ddecefbf2048502b1b"}}',
        [requestId],
      );
    });
  });

  describe('acceptRequest', () => {
    it('can acceptRequest', () => {
      const acceptParams = {
        requestId,
      };
      const requestLogic = new RequestLogic(fakeDataAccess);

      const result = requestLogic.acceptRequest(acceptParams, {
        method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
        privateKey: TestData.payerRaw.privateKey,
      });
      expect(fakeDataAccess.persist).to.have.been.called.with(
        '{"transaction":{"action":"accept","parameters":{"requestId":"0x145ee74b7aebc87c60c0f20094a9b9c1b382796199abf59143daade72f1e1f9e"},"version":"0.1.0"},"signature":{"method":"ecdsa","value":"0x37373183e0431865a8488516c2a08eccdbc4103307c838cf2eb2a2658233fdc35e1938b7393b0d595ffe61c1a2b8f5230e400541f85e5aa036d744fbdeb1c90e1b"}}',
        [requestId],
      );
    });
  });

  describe('cancelRequest', () => {
    it('can cancelRequest', () => {
      const cancelRequest = {
        requestId,
      };
      const requestLogic = new RequestLogic(fakeDataAccess);

      const result = requestLogic.cancelRequest(cancelRequest, {
        method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
        privateKey: TestData.payeeRaw.privateKey,
      });
      expect(fakeDataAccess.persist).to.have.been.called.with(
        '{"transaction":{"action":"cancel","parameters":{"requestId":"0x145ee74b7aebc87c60c0f20094a9b9c1b382796199abf59143daade72f1e1f9e"},"version":"0.1.0"},"signature":{"method":"ecdsa","value":"0xb94a853bcc0cd491d7b1a08fa21f32303f22c912d28df2f17fe303719776434266eb759b425288570826791970ba6148ccb69314676ff14f6ae9e05abb1aa2bd1c"}}',
        [requestId],
      );
    });
  });

  describe('increaseExpectecAmountRequest', () => {
    it('can increaseExpectecAmountRequest', () => {
      const increaseRequest = {
        deltaAmount: '1000',
        requestId,
      };
      const requestLogic = new RequestLogic(fakeDataAccess);

      const result = requestLogic.increaseExpectecAmountRequest(increaseRequest, {
        method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
        privateKey: TestData.payerRaw.privateKey,
      });
      expect(fakeDataAccess.persist).to.have.been.called.with(
        '{"transaction":{"action":"increaseExpectedAmount","parameters":{"deltaAmount":"1000","requestId":"0x145ee74b7aebc87c60c0f20094a9b9c1b382796199abf59143daade72f1e1f9e"},"version":"0.1.0"},"signature":{"method":"ecdsa","value":"0x70717148f184924c5d4787cb4a05894efe7d23ac0ceb0203a443495112d0f71e3e73c67a44fc0835269363bde8e15ec86bc1562251c9a3c89e580051be1d55a11c"}}',
        [requestId],
      );
    });
  });

  describe('reduceExpectecAmountRequest', () => {
    it('can reduceExpectecAmountRequest', () => {
      const reduceRequest = {
        deltaAmount: '1000',
        requestId,
      };
      const requestLogic = new RequestLogic(fakeDataAccess);

      const result = requestLogic.reduceExpectecAmountRequest(reduceRequest, {
        method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
        privateKey: TestData.payeeRaw.privateKey,
      });
      expect(fakeDataAccess.persist).to.have.been.called.with(
        '{"transaction":{"action":"reduceExpectedAmount","parameters":{"deltaAmount":"1000","requestId":"0x145ee74b7aebc87c60c0f20094a9b9c1b382796199abf59143daade72f1e1f9e"},"version":"0.1.0"},"signature":{"method":"ecdsa","value":"0x2687ea8ea1c61241bba7c3520a31dd66b4ceae14230d1f39385bf83084a73d3f314a9db576f89f2624bd91a1e8c387b5891e2cf1e6b9c3026f87e194c1f746b11b"}}',
        [requestId],
      );
    });
  });

  describe('getRequestById', () => {
    it('can getRequestById', () => {
      const txCreate = {
        signature: {
          method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          value:
            '0xfbbe97a8c095d1379db035dc96ccdfdd7bc633b30dc8b6a6b4a97bb60a855a8172972cba0ab2dd817ec6786b0e70c413f279a1ce406cc155ddecefbf2048502b1b',
        },
        transaction: {
          action: Types.REQUEST_LOGIC_ACTION.CREATE,
          parameters: {
            currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
            expectedAmount: '123400000000000000',
            payee: TestData.payeeRaw.identity,
            payer: TestData.payerRaw.identity,
          },
          version: CURRENT_VERSION,
        },
      };
      const txAccept = {
        signature: {
          method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          value:
            '0x37373183e0431865a8488516c2a08eccdbc4103307c838cf2eb2a2658233fdc35e1938b7393b0d595ffe61c1a2b8f5230e400541f85e5aa036d744fbdeb1c90e1b',
        },
        transaction: {
          action: Types.REQUEST_LOGIC_ACTION.ACCEPT,
          parameters: {
            requestId,
          },
          version: CURRENT_VERSION,
        },
      };
      const rxReduce = {
        signature: {
          method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          value:
            '0x2687ea8ea1c61241bba7c3520a31dd66b4ceae14230d1f39385bf83084a73d3f314a9db576f89f2624bd91a1e8c387b5891e2cf1e6b9c3026f87e194c1f746b11b',
        },
        transaction: {
          action: Types.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT,
          parameters: {
            deltaAmount: '1000',
            requestId,
          },
          version: CURRENT_VERSION,
        },
      };
      const fakeDataAccessGet = {
        get: (index: string) => [txCreate, txAccept, rxReduce],
        persist: (tx: string) => {
          return tx;
        },
      };
      const requestLogic = new RequestLogic(fakeDataAccessGet);
      const request = requestLogic.getRequestById(requestId);

      expect(request, 'request result is wrong').to.deep.equal({
        creator: TestData.payeeRaw.identity,
        currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
        events: [
          {
            name: Types.REQUEST_LOGIC_ACTION.CREATE,
            parameters: {
              expectedAmount: '123400000000000000',
              extensionsLength: 0,
              isSignedRequest: false,
            },
            transactionSigner: TestData.payeeRaw.identity,
          },
          {
            name: Types.REQUEST_LOGIC_ACTION.ACCEPT,
            parameters: {
              extensionsLength: 0,
            },
            transactionSigner: TestData.payerRaw.identity,
          },
          {
            name: Types.REQUEST_LOGIC_ACTION.REDUCE_EXPECTED_AMOUNT,
            parameters: {
              deltaAmount: '1000',
              extensionsLength: 0,
            },
            transactionSigner: TestData.payeeRaw.identity,
          },
        ],
        expectedAmount: '123399999999999000',
        payee: TestData.payeeRaw.identity,
        payer: TestData.payerRaw.identity,
        requestId,
        state: Types.REQUEST_LOGIC_STATE.ACCEPTED,
        version: CURRENT_VERSION,
      });
    });
  });
});
