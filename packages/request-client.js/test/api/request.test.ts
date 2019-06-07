import {
  IdentityTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';

import { assert } from 'chai';
import 'mocha';
import Request from '../../src/api/request';
import * as Types from '../../src/types';

const chaiAsPromised = require('chai-as-promised');
const chai = require('chai');
const spies = require('chai-spies');
const expect = chai.expect;
chai.use(spies);
chai.use(chaiAsPromised);
const sandbox = chai.spy.sandbox();

const mockRequestLogic: RequestLogicTypes.IRequestLogic = {
  async createRequest(): Promise<any> {
    return;
  },
  async acceptRequest(): Promise<any> {
    return { meta: {} };
  },
  async cancelRequest(): Promise<any> {
    return { meta: {} };
  },
  async increaseExpectedAmountRequest(): Promise<any> {
    return { meta: {} };
  },
  async reduceExpectedAmountRequest(): Promise<any> {
    return { meta: {} };
  },
  async addExtensionsDataRequest(): Promise<any> {
    return { meta: {}, result: {} };
  },
  async getRequestFromId(): Promise<any> {
    return { meta: {}, result: { request: { requestId: '1' } } };
  },
  async getRequestsByTopic(): Promise<any> {
    return {
      meta: {},
      result: {
        requests: [],
      },
    };
  },
};

const mockPaymentNetwork: Types.IPaymentNetwork = {
  async createExtensionsDataForCreation(): Promise<any> {
    return;
  },
  async createExtensionsDataForAddPaymentInformation(): Promise<any> {
    return { meta: {} };
  },
  async createExtensionsDataForAddRefundInformation(): Promise<any> {
    return { meta: {} };
  },
  async getBalance(): Promise<any> {
    return;
  },
};

const mockDeclarativePaymentNetwork: Types.IPaymentNetwork = {
  async createExtensionsDataForCreation(): Promise<any> {
    return;
  },
  async createExtensionsDataForAddPaymentInformation(): Promise<any> {
    return { meta: {} };
  },
  async createExtensionsDataForAddRefundInformation(): Promise<any> {
    return { meta: {} };
  },
  async createExtensionsDataForDeclareReceivedPayment(): Promise<any> {
    return;
  },
  async createExtensionsDataForDeclareReceivedRefund(): Promise<any> {
    return;
  },
  async createExtensionsDataForDeclareSentPayment(): Promise<any> {
    return;
  },
  async createExtensionsDataForDeclareSentRefund(): Promise<any> {
    return;
  },
  async getBalance(): Promise<any> {
    return;
  },
} as Types.IPaymentNetwork;

const signatureIdentity: IdentityTypes.IIdentity = {
  type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
  value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
};
const bitcoinAddress = 'mgPKDuVmuS9oeE2D9VPiCQriyU14wxWS1v';

// Most of the tests are done as integration tests in ../index.test.ts
/* tslint:disable:no-unused-expression */
describe('api/request', () => {
  afterEach(() => {
    sandbox.restore();
  });

  it('exists', async () => {
    assert.exists(Request);

    const requestNetwork = new Request(mockRequestLogic, '1');
    assert.isFunction(requestNetwork.accept);
    assert.isFunction(requestNetwork.cancel);
    assert.isFunction(requestNetwork.increaseExpectedAmountRequest);
    assert.isFunction(requestNetwork.reduceExpectedAmountRequest);
    assert.isFunction(requestNetwork.getData);
    assert.isFunction(requestNetwork.pay);
    assert.isFunction(requestNetwork.refund);
    assert.isFunction(requestNetwork.getHistory);
  });

  describe('accept', () => {
    it('calls request-logic', async () => {
      const spy = sandbox.on(mockRequestLogic, 'acceptRequest');

      const request = new Request(mockRequestLogic, '1');
      await request.accept(signatureIdentity);

      expect(spy).to.have.been.called.once;
    });

    it('calls request-logic and payment network', async () => {
      const spyReqLog = sandbox.on(mockRequestLogic, 'acceptRequest');
      const spyPayNet = sandbox.on(
        mockPaymentNetwork,
        'createExtensionsDataForAddRefundInformation',
      );

      const request = new Request(mockRequestLogic, '1', mockPaymentNetwork);
      await request.accept(signatureIdentity, { refundAddress: bitcoinAddress });

      expect(spyPayNet).to.have.been.called.once;
      expect(spyReqLog).to.have.been.called.once;
    });

    it('cannot call accept and add refund address without payment network', async () => {
      const request = new Request(mockRequestLogic, '1');
      try {
        await request.accept(signatureIdentity, { refundAddress: bitcoinAddress });
        expect(false, 'should throw').to.be.true;
      } catch (e) {
        expect(e.message).to.equal('Cannot add refund information without payment network');
      }
    });
  });

  describe('cancel', () => {
    it('calls request-logic', async () => {
      const spy = sandbox.on(mockRequestLogic, 'cancelRequest');

      const request = new Request(mockRequestLogic, '1');
      await request.cancel(signatureIdentity);

      expect(spy).to.have.been.called.once;
    });

    it('calls request-logic and payment network', async () => {
      const spyReqLog = sandbox.on(mockRequestLogic, 'cancelRequest');
      const spyPayNet = sandbox.on(
        mockPaymentNetwork,
        'createExtensionsDataForAddRefundInformation',
      );

      const request = new Request(mockRequestLogic, '1', mockPaymentNetwork);
      await request.cancel(signatureIdentity, { refundAddress: bitcoinAddress });

      expect(spyPayNet).to.have.been.called.once;
      expect(spyReqLog).to.have.been.called.once;
    });
    it('cannot call cancel and add refund address without payment network', async () => {
      const request = new Request(mockRequestLogic, '1');
      try {
        await request.cancel(signatureIdentity, { refundAddress: bitcoinAddress });
        expect(false, 'should throw').to.be.true;
      } catch (e) {
        expect(e.message).to.equal('Cannot add refund information without payment network');
      }
    });
  });

  describe('increaseExpectedAmountRequest', () => {
    it('calls request-logic', async () => {
      const spy = sandbox.on(mockRequestLogic, 'increaseExpectedAmountRequest');

      const request = new Request(mockRequestLogic, '1');
      await request.increaseExpectedAmountRequest(3, signatureIdentity);

      expect(spy).to.have.been.called.once;
    });

    it('calls request-logic and payment network', async () => {
      const spyReqLog = sandbox.on(mockRequestLogic, 'increaseExpectedAmountRequest');
      const spyPayNet = sandbox.on(
        mockPaymentNetwork,
        'createExtensionsDataForAddRefundInformation',
      );

      const request = new Request(mockRequestLogic, '1', mockPaymentNetwork);
      await request.increaseExpectedAmountRequest(3, signatureIdentity, {
        refundAddress: bitcoinAddress,
      });

      expect(spyPayNet).to.have.been.called.once;
      expect(spyReqLog).to.have.been.called.once;
    });

    it('cannot call increase and add refund address without payment network', async () => {
      const request = new Request(mockRequestLogic, '1');
      try {
        await request.increaseExpectedAmountRequest(3, signatureIdentity, {
          refundAddress: bitcoinAddress,
        });
        expect(false, 'should throw').to.be.true;
      } catch (e) {
        expect(e.message).to.equal('Cannot add refund information without payment network');
      }
    });
  });

  describe('reduceExpectedAmountRequest', () => {
    it('calls request-logic', async () => {
      const spy = sandbox.on(mockRequestLogic, 'reduceExpectedAmountRequest');

      const request = new Request(mockRequestLogic, '1');
      await request.reduceExpectedAmountRequest(3, signatureIdentity);

      expect(spy).to.have.been.called.once;
    });

    it('calls request-logic and payment network', async () => {
      const spyReqLog = sandbox.on(mockRequestLogic, 'reduceExpectedAmountRequest');
      const spyPayNet = sandbox.on(
        mockPaymentNetwork,
        'createExtensionsDataForAddPaymentInformation',
      );

      const request = new Request(mockRequestLogic, '1', mockPaymentNetwork);
      await request.reduceExpectedAmountRequest(3, signatureIdentity, {
        refundAddress: bitcoinAddress,
      });

      expect(spyPayNet).to.have.been.called.once;
      expect(spyReqLog).to.have.been.called.once;
    });

    it('cannot call reduce and add payment address without payment network', async () => {
      const request = new Request(mockRequestLogic, '1');
      try {
        await request.reduceExpectedAmountRequest('1', signatureIdentity, {
          paymentInformation: bitcoinAddress,
        });
        expect(false, 'should throw').to.be.true;
      } catch (e) {
        expect(e.message).to.equal('Cannot add payment information without payment network');
      }
    });
  });

  describe('addPaymentInformation', () => {
    it('calls request-logic and payment network', async () => {
      const spyReqLog = sandbox.on(mockRequestLogic, 'addExtensionsDataRequest');
      const spyPayNet = sandbox.on(
        mockPaymentNetwork,
        'createExtensionsDataForAddPaymentInformation',
      );

      const request = new Request(mockRequestLogic, '1', mockPaymentNetwork);
      await request.addPaymentInformation({ paymentAddress: bitcoinAddress }, signatureIdentity);

      expect(spyPayNet).to.have.been.called.once;
      expect(spyReqLog).to.have.been.called.once;
    });

    it('cannot add payment address without payment network', async () => {
      const request = new Request(mockRequestLogic, '1');
      try {
        await request.addPaymentInformation({ paymentAddress: bitcoinAddress }, signatureIdentity);
        expect(false, 'should throw').to.be.true;
      } catch (e) {
        expect(e.message).to.equal('Cannot add payment information without payment network');
      }
    });
  });

  describe('addRefundInformation', () => {
    it('calls request-logic and payment network', async () => {
      const spyReqLog = sandbox.on(mockRequestLogic, 'addExtensionsDataRequest');
      const spyPayNet = sandbox.on(
        mockPaymentNetwork,
        'createExtensionsDataForAddRefundInformation',
      );

      const request = new Request(mockRequestLogic, '1', mockPaymentNetwork);
      await request.addRefundInformation({ refundAddress: bitcoinAddress }, signatureIdentity);

      expect(spyPayNet).to.have.been.called.once;
      expect(spyReqLog).to.have.been.called.once;
    });

    it('cannot add payment address without payment network', async () => {
      const request = new Request(mockRequestLogic, '1');
      try {
        await request.addRefundInformation({ refundAddress: bitcoinAddress }, signatureIdentity);
        expect(false, 'should throw').to.be.true;
      } catch (e) {
        expect(e.message).to.equal('Cannot add refund information without payment network');
      }
    });
  });

  describe('declareSentPayment', () => {
    it('calls request-logic and payment network', async () => {
      const spyReqLog = sandbox.on(mockRequestLogic, 'addExtensionsDataRequest');
      const spyPayNet = sandbox.on(
        mockDeclarativePaymentNetwork,
        'createExtensionsDataForDeclareSentPayment',
      );

      const request = new Request(mockRequestLogic, '1', mockDeclarativePaymentNetwork);
      await request.declareSentPayment('1000', 'sent', signatureIdentity);

      expect(spyPayNet).to.have.been.called.once;
      expect(spyReqLog).to.have.been.called.once;
    });

    it('cannot declare sent payment if no payment network', async () => {
      const request = new Request(mockRequestLogic, '1');
      try {
        await request.declareSentPayment('1000', 'sent', signatureIdentity);
        expect(false, 'should throw').to.be.true;
      } catch (e) {
        expect(e.message).to.equal('Cannot declare sent payment without payment network');
      }
    });

    it('cannot declare sent payment if payment network is not declarative', async () => {
      const request = new Request(mockRequestLogic, '1', mockPaymentNetwork);
      try {
        await request.declareSentPayment('1000', 'sent', signatureIdentity);
        expect(false, 'should throw').to.be.true;
      } catch (e) {
        expect(e.message).to.equal('Cannot declare sent payment without declarative payment network');
      }
    });
  });

  describe('declareSentRefund', () => {
    it('calls request-logic and payment network', async () => {
      const spyReqLog = sandbox.on(mockRequestLogic, 'addExtensionsDataRequest');
      const spyPayNet = sandbox.on(
        mockDeclarativePaymentNetwork,
        'createExtensionsDataForDeclareSentRefund',
      );

      const request = new Request(mockRequestLogic, '1', mockDeclarativePaymentNetwork);
      await request.declareSentRefund('1000', 'sent', signatureIdentity);

      expect(spyPayNet).to.have.been.called.once;
      expect(spyReqLog).to.have.been.called.once;
    });

    it('cannot declare sent refund if no payment network', async () => {
      const request = new Request(mockRequestLogic, '1');
      try {
        await request.declareSentRefund('1000', 'sent', signatureIdentity);
        expect(false, 'should throw').to.be.true;
      } catch (e) {
        expect(e.message).to.equal('Cannot declare sent refund without payment network');
      }
    });

    it('cannot declare sent refund if payment network is not declarative', async () => {
      const request = new Request(mockRequestLogic, '1', mockPaymentNetwork);
      try {
        await request.declareSentRefund('1000', 'sent', signatureIdentity);
        expect(false, 'should throw').to.be.true;
      } catch (e) {
        expect(e.message).to.equal('Cannot declare sent refund without declarative payment network');
      }
    });
  });

  describe('declareReceivedPayment', () => {
    it('calls request-logic and payment network', async () => {
      const spyReqLog = sandbox.on(mockRequestLogic, 'addExtensionsDataRequest');
      const spyPayNet = sandbox.on(
        mockDeclarativePaymentNetwork,
        'createExtensionsDataForDeclareReceivedPayment',
      );

      const request = new Request(mockRequestLogic, '1', mockDeclarativePaymentNetwork);
      await request.declareReceivedPayment('1000', 'received', signatureIdentity);

      expect(spyPayNet).to.have.been.called.once;
      expect(spyReqLog).to.have.been.called.once;
    });

    it('cannot declare received payment if no payment network', async () => {
      const request = new Request(mockRequestLogic, '1');
      try {
        await request.declareReceivedPayment('1000', 'received', signatureIdentity);
        expect(false, 'should throw').to.be.true;
      } catch (e) {
        expect(e.message).to.equal('Cannot declare received payment without payment network');
      }
    });

    it('cannot declare received payment if payment network is not declarative', async () => {
      const request = new Request(mockRequestLogic, '1', mockPaymentNetwork);
      try {
        await request.declareReceivedPayment('1000', 'received', signatureIdentity);
        expect(false, 'should throw').to.be.true;
      } catch (e) {
        expect(e.message).to.equal('Cannot declare received payment without declarative payment network');
      }
    });
  });

  describe('declareReceivedRefund', () => {
    it('calls request-logic and payment network', async () => {
      const spyReqLog = sandbox.on(mockRequestLogic, 'addExtensionsDataRequest');
      const spyPayNet = sandbox.on(
        mockDeclarativePaymentNetwork,
        'createExtensionsDataForDeclareReceivedRefund',
      );

      const request = new Request(mockRequestLogic, '1', mockDeclarativePaymentNetwork);
      await request.declareReceivedRefund('1000', 'received', signatureIdentity);

      expect(spyPayNet).to.have.been.called.once;
      expect(spyReqLog).to.have.been.called.once;
    });

    it('cannot declare received refund if no payment network', async () => {
      const request = new Request(mockRequestLogic, '1');
      try {
        await request.declareReceivedRefund('1000', 'received', signatureIdentity);
        expect(false, 'should throw').to.be.true;
      } catch (e) {
        expect(e.message).to.equal('Cannot declare received refund without payment network');
      }
    });

    it('cannot declare received refund if payment network is not declarative', async () => {
      const request = new Request(mockRequestLogic, '1', mockPaymentNetwork);
      try {
        await request.declareReceivedRefund('1000', 'received', signatureIdentity);
        expect(false, 'should throw').to.be.true;
      } catch (e) {
        expect(e.message).to.equal('Cannot declare received refund without declarative payment network');
      }
    });
  });

  describe('refresh', () => {
    it('calls request-logic', async () => {
      const mockRequestLogicWithRequest: RequestLogicTypes.IRequestLogic = {
        async createRequest(): Promise<any> {
          return;
        },
        async acceptRequest(): Promise<any> {
          return { meta: {} };
        },
        async cancelRequest(): Promise<any> {
          return { meta: {} };
        },
        async increaseExpectedAmountRequest(): Promise<any> {
          return { meta: {} };
        },
        async reduceExpectedAmountRequest(): Promise<any> {
          return { meta: {} };
        },
        async addExtensionsDataRequest(): Promise<any> {
          return { meta: {}, result: {} };
        },
        async getRequestFromId(): Promise<any> {
          return {
            meta: {},
            result: {
              request: {},
            },
          };
        },
        async getRequestsByTopic(): Promise<any> {
          return {
            meta: {},
            result: {
              requests: [],
            },
          };
        },
      };
      const spy = sandbox.on(mockRequestLogicWithRequest, 'getRequestFromId');

      const request = new Request(mockRequestLogicWithRequest, '1');
      await request.refresh();

      expect(spy).to.have.been.called.once;
    });
  });

  describe('pay', () => {
    it('is not implemented yet', async () => {
      const request = new Request(mockRequestLogic, '1');
      assert.isUndefined(request.pay());
    });
  });

  describe('refund', () => {
    it('is not implemented yet', async () => {
      const request = new Request(mockRequestLogic, '1');
      assert.isUndefined(request.refund());
    });
  });

  describe('getHistory', () => {
    it('is not implemented yet', async () => {
      const request = new Request(mockRequestLogic, '1');
      assert.isUndefined(request.getHistory());
    });
  });
});
