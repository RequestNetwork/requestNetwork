/* eslint-disable spellcheck/spell-checker */
import { IdentityTypes, PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';

import { EventEmitter } from 'events';

import Request from '../../src/api/request';

const mockRequestLogic: RequestLogicTypes.IRequestLogic = {
  async createRequest(): Promise<any> {
    return;
  },
  async createEncryptedRequest(): Promise<any> {
    return;
  },
  async computeRequestId(): Promise<any> {
    return;
  },
  async acceptRequest(): Promise<any> {
    return Object.assign(new EventEmitter(), { meta: {} });
  },
  async cancelRequest(): Promise<any> {
    return Object.assign(new EventEmitter(), { meta: {} });
  },
  async increaseExpectedAmountRequest(): Promise<any> {
    return Object.assign(new EventEmitter(), { meta: {} });
  },
  async reduceExpectedAmountRequest(): Promise<any> {
    return Object.assign(new EventEmitter(), { meta: {} });
  },
  async addExtensionsDataRequest(): Promise<any> {
    return Object.assign(new EventEmitter(), { meta: {} });
  },
  async getRequestFromId(): Promise<any> {
    return { meta: {}, result: { request: { requestId: '1' }, pending: null } };
  },
  async getRequestsByTopic(): Promise<any> {
    return {
      meta: {},
      result: {
        requests: [],
      },
    };
  },
  async getRequestsByMultipleTopics(): Promise<any> {
    return {
      meta: {},
      result: {
        requests: [],
      },
    };
  },
};

const mockPaymentNetwork: PaymentTypes.IPaymentNetwork = {
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

const mockDeclarativePaymentNetwork: PaymentTypes.IPaymentNetwork = {
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
} as PaymentTypes.IPaymentNetwork;

const signatureIdentity: IdentityTypes.IIdentity = {
  type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
  value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
};
const bitcoinAddress = 'mgPKDuVmuS9oeE2D9VPiCQriyU14wxWS1v';

// Most of the tests are done as integration tests in ../index.test.ts
/* tslint:disable:no-unused-expression */
describe('api/request', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('exists', async () => {
    expect(Request).toBeDefined();

    const request = new Request('1', mockRequestLogic);
    // tslint:disable: no-unbound-method
    expect(typeof request.accept).toBe('function');
    expect(typeof request.cancel).toBe('function');
    expect(typeof request.increaseExpectedAmountRequest).toBe('function');
    expect(typeof request.reduceExpectedAmountRequest).toBe('function');
    expect(typeof request.getData).toBe('function');
    // tslint:enable: no-unbound-method
  });

  it('emits error at the creation', async () => {
    const testingEmitter = new EventEmitter();
    const request = new Request('1', mockRequestLogic, {
      requestLogicCreateResult: testingEmitter as any,
    });

    // tslint:disable-next-line:typedef
    const handleError = jest.fn((error: any) => {
      expect(error).toBe('error for test purpose');
    });
    request.on('error', handleError);

    testingEmitter.emit('error', 'error for test purpose');
    // 'error must be emitted'
    expect(handleError).toHaveBeenCalled();
  });

  describe('accept', () => {
    it('calls request-logic', async () => {
      const spy = jest.spyOn(mockRequestLogic, 'acceptRequest');

      const request = new Request('1', mockRequestLogic);
      await request.accept(signatureIdentity);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('calls request-logic and payment network', async () => {
      const spyReqLog = jest.spyOn(mockRequestLogic, 'acceptRequest');
      const spyPayNet = jest.spyOn(
        mockPaymentNetwork,
        'createExtensionsDataForAddRefundInformation',
      );

      const request = new Request('1', mockRequestLogic, { paymentNetwork: mockPaymentNetwork });
      await request.accept(signatureIdentity, { refundAddress: bitcoinAddress });

      expect(spyPayNet).toHaveBeenCalledTimes(1);
      expect(spyReqLog).toHaveBeenCalledTimes(1);
    });

    it('cannot call accept and add refund address without payment network', async () => {
      const request = new Request('1', mockRequestLogic);
      await expect(
        request.accept(signatureIdentity, { refundAddress: bitcoinAddress }),
      ).rejects.toThrowError('Cannot add refund information without payment network');
    });
  });

  describe('cancel', () => {
    it('calls request-logic', async () => {
      const spy = jest.spyOn(mockRequestLogic, 'cancelRequest');

      const request = new Request('1', mockRequestLogic);
      await request.cancel(signatureIdentity);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('calls request-logic and payment network', async () => {
      const spyReqLog = jest.spyOn(mockRequestLogic, 'cancelRequest');
      const spyPayNet = jest.spyOn(
        mockPaymentNetwork,
        'createExtensionsDataForAddRefundInformation',
      );

      const request = new Request('1', mockRequestLogic, { paymentNetwork: mockPaymentNetwork });
      await request.cancel(signatureIdentity, { refundAddress: bitcoinAddress });

      expect(spyPayNet).toHaveBeenCalledTimes(1);
      expect(spyReqLog).toHaveBeenCalledTimes(1);
    });
    it('cannot call cancel and add refund address without payment network', async () => {
      const request = new Request('1', mockRequestLogic);

      await expect(
        request.cancel(signatureIdentity, { refundAddress: bitcoinAddress }),
      ).rejects.toThrowError('Cannot add refund information without payment network');
    });
  });

  describe('increaseExpectedAmountRequest', () => {
    it('calls request-logic', async () => {
      const spy = jest.spyOn(mockRequestLogic, 'increaseExpectedAmountRequest');

      const request = new Request('1', mockRequestLogic);
      await request.increaseExpectedAmountRequest(3, signatureIdentity);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('calls request-logic and payment network', async () => {
      const spyReqLog = jest.spyOn(mockRequestLogic, 'increaseExpectedAmountRequest');
      const spyPayNet = jest.spyOn(
        mockPaymentNetwork,
        'createExtensionsDataForAddRefundInformation',
      );

      const request = new Request('1', mockRequestLogic, { paymentNetwork: mockPaymentNetwork });
      await request.increaseExpectedAmountRequest(3, signatureIdentity, {
        refundAddress: bitcoinAddress,
      });

      expect(spyPayNet).toHaveBeenCalledTimes(1);
      expect(spyReqLog).toHaveBeenCalledTimes(1);
    });

    it('cannot call increase and add refund address without payment network', async () => {
      const request = new Request('1', mockRequestLogic);
      await expect(
        request.increaseExpectedAmountRequest(3, signatureIdentity, {
          refundAddress: bitcoinAddress,
        }),
      ).rejects.toThrowError('Cannot add refund information without payment network');
    });
  });

  describe('reduceExpectedAmountRequest', () => {
    it('calls request-logic', async () => {
      const spy = jest.spyOn(mockRequestLogic, 'reduceExpectedAmountRequest');

      const request = new Request('1', mockRequestLogic);
      await request.reduceExpectedAmountRequest(3, signatureIdentity);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('calls request-logic and payment network', async () => {
      const spyReqLog = jest.spyOn(mockRequestLogic, 'reduceExpectedAmountRequest');
      const spyPayNet = jest.spyOn(
        mockPaymentNetwork,
        'createExtensionsDataForAddPaymentInformation',
      );

      const request = new Request('1', mockRequestLogic, { paymentNetwork: mockPaymentNetwork });
      await request.reduceExpectedAmountRequest(3, signatureIdentity, {
        refundAddress: bitcoinAddress,
      });

      expect(spyPayNet).toHaveBeenCalledTimes(1);
      expect(spyReqLog).toHaveBeenCalledTimes(1);
    });

    it('cannot call reduce and add payment address without payment network', async () => {
      const request = new Request('1', mockRequestLogic);
      await expect(
        request.reduceExpectedAmountRequest('1', signatureIdentity, {
          paymentInformation: bitcoinAddress,
        }),
      ).rejects.toThrowError('Cannot add payment information without payment network');
    });
  });

  describe('addPaymentInformation', () => {
    it('calls request-logic and payment network', async () => {
      const spyReqLog = jest.spyOn(mockRequestLogic, 'addExtensionsDataRequest');
      const spyPayNet = jest.spyOn(
        mockPaymentNetwork,
        'createExtensionsDataForAddPaymentInformation',
      );

      const request = new Request('1', mockRequestLogic, { paymentNetwork: mockPaymentNetwork });
      await request.addPaymentInformation({ paymentAddress: bitcoinAddress }, signatureIdentity);

      expect(spyPayNet).toHaveBeenCalledTimes(1);
      expect(spyReqLog).toHaveBeenCalledTimes(1);
    });

    it('cannot add payment address without payment network', async () => {
      const request = new Request('1', mockRequestLogic);
      await expect(
        request.addPaymentInformation({ paymentAddress: bitcoinAddress }, signatureIdentity),
      ).rejects.toThrowError('Cannot add payment information without payment network');
    });
  });

  describe('addRefundInformation', () => {
    it('calls request-logic and payment network', async () => {
      const spyReqLog = jest.spyOn(mockRequestLogic, 'addExtensionsDataRequest');
      const spyPayNet = jest.spyOn(
        mockPaymentNetwork,
        'createExtensionsDataForAddRefundInformation',
      );

      const request = new Request('1', mockRequestLogic, { paymentNetwork: mockPaymentNetwork });
      await request.addRefundInformation({ refundAddress: bitcoinAddress }, signatureIdentity);

      expect(spyPayNet).toHaveBeenCalledTimes(1);
      expect(spyReqLog).toHaveBeenCalledTimes(1);
    });

    it('cannot add payment address without payment network', async () => {
      const request = new Request('1', mockRequestLogic);
      await expect(
        request.addRefundInformation({ refundAddress: bitcoinAddress }, signatureIdentity),
      ).rejects.toThrowError('Cannot add refund information without payment network');
    });
  });

  describe('declareSentPayment', () => {
    it('calls request-logic and payment network', async () => {
      const spyReqLog = jest.spyOn(mockRequestLogic, 'addExtensionsDataRequest');
      const spyPayNet = jest.spyOn(
        mockDeclarativePaymentNetwork as any,
        'createExtensionsDataForDeclareSentPayment',
      );

      const request = new Request('1', mockRequestLogic, {
        paymentNetwork: mockDeclarativePaymentNetwork,
      });
      await request.declareSentPayment('1000', 'sent', signatureIdentity);

      expect(spyPayNet).toHaveBeenCalledTimes(1);
      expect(spyReqLog).toHaveBeenCalledTimes(1);
    });

    it('cannot declare sent payment if no payment network', async () => {
      const request = new Request('1', mockRequestLogic);
      await expect(
        request.declareSentPayment('1000', 'sent', signatureIdentity),
      ).rejects.toThrowError('Cannot declare sent payment without payment network');
    });

    it('cannot declare sent payment if payment network is not declarative', async () => {
      const request = new Request('1', mockRequestLogic, { paymentNetwork: mockPaymentNetwork });
      await expect(
        request.declareSentPayment('1000', 'sent', signatureIdentity),
      ).rejects.toThrowError('Cannot declare sent payment without declarative payment network');
    });
  });

  describe('declareSentRefund', () => {
    it('calls request-logic and payment network', async () => {
      const spyReqLog = jest.spyOn(mockRequestLogic, 'addExtensionsDataRequest');
      const spyPayNet = jest.spyOn(
        mockDeclarativePaymentNetwork as any,
        'createExtensionsDataForDeclareSentRefund',
      );

      const request = new Request('1', mockRequestLogic, {
        paymentNetwork: mockDeclarativePaymentNetwork,
      });
      await request.declareSentRefund('1000', 'sent', signatureIdentity);

      expect(spyPayNet).toHaveBeenCalledTimes(1);
      expect(spyReqLog).toHaveBeenCalledTimes(1);
    });

    it('cannot declare sent refund if no payment network', async () => {
      const request = new Request('1', mockRequestLogic);
      await expect(
        request.declareSentRefund('1000', 'sent', signatureIdentity),
      ).rejects.toThrowError('Cannot declare sent refund without payment network');
    });

    it('cannot declare sent refund if payment network is not declarative', async () => {
      const request = new Request('1', mockRequestLogic, { paymentNetwork: mockPaymentNetwork });
      await expect(
        request.declareSentRefund('1000', 'sent', signatureIdentity),
      ).rejects.toThrowError('Cannot declare sent refund without declarative payment network');
    });
  });

  describe('declareReceivedPayment', () => {
    it('calls request-logic and payment network', async () => {
      const spyReqLog = jest.spyOn(mockRequestLogic, 'addExtensionsDataRequest');
      const spyPayNet = jest.spyOn(
        mockDeclarativePaymentNetwork as any,
        'createExtensionsDataForDeclareReceivedPayment',
      );

      const request = new Request('1', mockRequestLogic, {
        paymentNetwork: mockDeclarativePaymentNetwork,
      });
      await request.declareReceivedPayment('1000', 'received', signatureIdentity);

      expect(spyPayNet).toHaveBeenCalledTimes(1);
      expect(spyReqLog).toHaveBeenCalledTimes(1);
    });

    it('cannot declare received payment if no payment network', async () => {
      const request = new Request('1', mockRequestLogic);
      await expect(
        request.declareReceivedPayment('1000', 'received', signatureIdentity),
      ).rejects.toThrowError('Cannot declare received payment without payment network');
    });

    it('cannot declare received payment if payment network is not declarative', async () => {
      const request = new Request('1', mockRequestLogic, { paymentNetwork: mockPaymentNetwork });
      await expect(
        request.declareReceivedPayment('1000', 'received', signatureIdentity),
      ).rejects.toThrowError('Cannot declare received payment without declarative payment network');
    });
  });

  describe('declareReceivedRefund', () => {
    it('calls request-logic and payment network', async () => {
      const spyReqLog = jest.spyOn(mockRequestLogic, 'addExtensionsDataRequest');
      const spyPayNet = jest.spyOn(
        mockDeclarativePaymentNetwork as any,
        'createExtensionsDataForDeclareReceivedRefund',
      );

      const request = new Request('1', mockRequestLogic, {
        paymentNetwork: mockDeclarativePaymentNetwork,
      });
      await request.declareReceivedRefund('1000', 'received', signatureIdentity);

      expect(spyPayNet).toHaveBeenCalledTimes(1);
      expect(spyReqLog).toHaveBeenCalledTimes(1);
    });

    it('cannot declare received refund if no payment network', async () => {
      const request = new Request('1', mockRequestLogic);
      await expect(
        request.declareReceivedRefund('1000', 'received', signatureIdentity),
      ).rejects.toThrowError('Cannot declare received refund without payment network');
    });

    it('cannot declare received refund if payment network is not declarative', async () => {
      const request = new Request('1', mockRequestLogic, { paymentNetwork: mockPaymentNetwork });
      await expect(
        request.declareReceivedRefund('1000', 'received', signatureIdentity),
      ).rejects.toThrowError('Cannot declare received refund without declarative payment network');
    });
  });

  describe('refresh', () => {
    it('calls request-logic', async () => {
      const mockRequestLogicWithRequest: RequestLogicTypes.IRequestLogic = {
        async createRequest(): Promise<any> {
          return;
        },
        async createEncryptedRequest(): Promise<any> {
          return;
        },
        async computeRequestId(): Promise<any> {
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
              pending: {},
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
        async getRequestsByMultipleTopics(): Promise<any> {
          return {
            meta: {},
            result: {
              requests: [],
            },
          };
        },
      };
      const spy = jest.spyOn(mockRequestLogicWithRequest, 'getRequestFromId');

      const request = new Request('1', mockRequestLogicWithRequest);
      await request.refresh();

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
