import { CurrencyManager } from '@requestnetwork/currency';
import { IdentityTypes, PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';

import { EventEmitter } from 'events';
import { PaymentReferenceCalculator } from '@requestnetwork/payment-detection';

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
  paymentNetworkId: PaymentTypes.PAYMENT_NETWORK_ID.DECLARATIVE,

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
  paymentNetworkId: PaymentTypes.PAYMENT_NETWORK_ID.DECLARATIVE,
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

const currencyManager = CurrencyManager.getDefault();

// Most of the tests are done as integration tests in ../index.test.ts
/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('api/request', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('exists', async () => {
    expect(Request).toBeDefined();

    const request = new Request('1', mockRequestLogic, currencyManager);
    /* eslint-disable @typescript-eslint/unbound-method */
    expect(typeof request.accept).toBe('function');
    expect(typeof request.cancel).toBe('function');
    expect(typeof request.increaseExpectedAmountRequest).toBe('function');
    expect(typeof request.reduceExpectedAmountRequest).toBe('function');
    expect(typeof request.getData).toBe('function');
    /* eslint-enable @typescript-eslint/unbound-method */
  });

  it('emits error at the creation', async () => {
    const testingEmitter = new EventEmitter();
    const request = new Request('1', mockRequestLogic, currencyManager, {
      requestLogicCreateResult: testingEmitter as any,
    });

    // eslint-disable-next-line
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

      const request = new Request('1', mockRequestLogic, currencyManager);
      await request.accept(signatureIdentity);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('calls request-logic and payment network', async () => {
      const spyReqLog = jest.spyOn(mockRequestLogic, 'acceptRequest');
      const spyPayNet = jest.spyOn(
        mockPaymentNetwork,
        'createExtensionsDataForAddRefundInformation',
      );

      const request = new Request('1', mockRequestLogic, currencyManager, {
        paymentNetwork: mockPaymentNetwork,
      });
      await request.accept(signatureIdentity, { refundAddress: bitcoinAddress });

      expect(spyPayNet).toHaveBeenCalledTimes(1);
      expect(spyReqLog).toHaveBeenCalledTimes(1);
    });

    it('cannot call accept and add refund address without payment network', async () => {
      const request = new Request('1', mockRequestLogic, currencyManager);
      await expect(
        request.accept(signatureIdentity, { refundAddress: bitcoinAddress }),
      ).rejects.toThrowError('Cannot add refund information without payment network');
    });
  });

  describe('cancel', () => {
    it('calls request-logic', async () => {
      const spy = jest.spyOn(mockRequestLogic, 'cancelRequest');

      const request = new Request('1', mockRequestLogic, currencyManager);
      await request.cancel(signatureIdentity);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('calls request-logic and payment network', async () => {
      const spyReqLog = jest.spyOn(mockRequestLogic, 'cancelRequest');
      const spyPayNet = jest.spyOn(
        mockPaymentNetwork,
        'createExtensionsDataForAddRefundInformation',
      );

      const request = new Request('1', mockRequestLogic, currencyManager, {
        paymentNetwork: mockPaymentNetwork,
      });
      await request.cancel(signatureIdentity, { refundAddress: bitcoinAddress });

      expect(spyPayNet).toHaveBeenCalledTimes(1);
      expect(spyReqLog).toHaveBeenCalledTimes(1);
    });
    it('cannot call cancel and add refund address without payment network', async () => {
      const request = new Request('1', mockRequestLogic, currencyManager);

      await expect(
        request.cancel(signatureIdentity, { refundAddress: bitcoinAddress }),
      ).rejects.toThrowError('Cannot add refund information without payment network');
    });
  });

  describe('increaseExpectedAmountRequest', () => {
    it('calls request-logic', async () => {
      const spy = jest.spyOn(mockRequestLogic, 'increaseExpectedAmountRequest');

      const request = new Request('1', mockRequestLogic, currencyManager);
      await request.increaseExpectedAmountRequest(3, signatureIdentity);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('calls request-logic and payment network', async () => {
      const spyReqLog = jest.spyOn(mockRequestLogic, 'increaseExpectedAmountRequest');
      const spyPayNet = jest.spyOn(
        mockPaymentNetwork,
        'createExtensionsDataForAddRefundInformation',
      );

      const request = new Request('1', mockRequestLogic, currencyManager, {
        paymentNetwork: mockPaymentNetwork,
      });
      await request.increaseExpectedAmountRequest(3, signatureIdentity, {
        refundAddress: bitcoinAddress,
      });

      expect(spyPayNet).toHaveBeenCalledTimes(1);
      expect(spyReqLog).toHaveBeenCalledTimes(1);
    });

    it('cannot call increase and add refund address without payment network', async () => {
      const request = new Request('1', mockRequestLogic, currencyManager);
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

      const request = new Request('1', mockRequestLogic, currencyManager);
      await request.reduceExpectedAmountRequest(3, signatureIdentity);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('calls request-logic and payment network', async () => {
      const spyReqLog = jest.spyOn(mockRequestLogic, 'reduceExpectedAmountRequest');
      const spyPayNet = jest.spyOn(
        mockPaymentNetwork,
        'createExtensionsDataForAddPaymentInformation',
      );

      const request = new Request('1', mockRequestLogic, currencyManager, {
        paymentNetwork: mockPaymentNetwork,
      });
      await request.reduceExpectedAmountRequest(3, signatureIdentity, {
        refundAddress: bitcoinAddress,
      });

      expect(spyPayNet).toHaveBeenCalledTimes(1);
      expect(spyReqLog).toHaveBeenCalledTimes(1);
    });

    it('cannot call reduce and add payment address without payment network', async () => {
      const request = new Request('1', mockRequestLogic, currencyManager);
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

      const request = new Request('1', mockRequestLogic, currencyManager, {
        paymentNetwork: mockPaymentNetwork,
      });
      await request.addPaymentInformation({ paymentAddress: bitcoinAddress }, signatureIdentity);

      expect(spyPayNet).toHaveBeenCalledTimes(1);
      expect(spyReqLog).toHaveBeenCalledTimes(1);
    });

    it('cannot add payment address without payment network', async () => {
      const request = new Request('1', mockRequestLogic, currencyManager);
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

      const request = new Request('1', mockRequestLogic, currencyManager, {
        paymentNetwork: mockPaymentNetwork,
      });
      await request.addRefundInformation({ refundAddress: bitcoinAddress }, signatureIdentity);

      expect(spyPayNet).toHaveBeenCalledTimes(1);
      expect(spyReqLog).toHaveBeenCalledTimes(1);
    });

    it('cannot add payment address without payment network', async () => {
      const request = new Request('1', mockRequestLogic, currencyManager);
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

      const request = new Request('1', mockRequestLogic, currencyManager, {
        paymentNetwork: mockDeclarativePaymentNetwork,
      });
      await request.declareSentPayment('1000', 'sent', signatureIdentity);

      expect(spyPayNet).toHaveBeenCalledTimes(1);
      expect(spyReqLog).toHaveBeenCalledTimes(1);
    });

    it('cannot declare sent payment if no payment network', async () => {
      const request = new Request('1', mockRequestLogic, currencyManager);
      await expect(
        request.declareSentPayment('1000', 'sent', signatureIdentity),
      ).rejects.toThrowError('Cannot declare sent payment without payment network');
    });

    it('cannot declare sent payment if payment network is not declarative', async () => {
      const request = new Request('1', mockRequestLogic, currencyManager, {
        paymentNetwork: mockPaymentNetwork,
      });
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

      const request = new Request('1', mockRequestLogic, currencyManager, {
        paymentNetwork: mockDeclarativePaymentNetwork,
      });
      await request.declareSentRefund('1000', 'sent', signatureIdentity);

      expect(spyPayNet).toHaveBeenCalledTimes(1);
      expect(spyReqLog).toHaveBeenCalledTimes(1);
    });

    it('cannot declare sent refund if no payment network', async () => {
      const request = new Request('1', mockRequestLogic, currencyManager);
      await expect(
        request.declareSentRefund('1000', 'sent', signatureIdentity),
      ).rejects.toThrowError('Cannot declare sent refund without payment network');
    });

    it('cannot declare sent refund if payment network is not declarative', async () => {
      const request = new Request('1', mockRequestLogic, currencyManager, {
        paymentNetwork: mockPaymentNetwork,
      });
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

      const request = new Request('1', mockRequestLogic, currencyManager, {
        paymentNetwork: mockDeclarativePaymentNetwork,
      });
      await request.declareReceivedPayment('1000', 'received', signatureIdentity);

      expect(spyPayNet).toHaveBeenCalledTimes(1);
      expect(spyReqLog).toHaveBeenCalledTimes(1);
    });

    it('cannot declare received payment if no payment network', async () => {
      const request = new Request('1', mockRequestLogic, currencyManager);
      await expect(
        request.declareReceivedPayment('1000', 'received', signatureIdentity),
      ).rejects.toThrowError('Cannot declare received payment without payment network');
    });

    it('cannot declare received payment if payment network is not declarative', async () => {
      const request = new Request('1', mockRequestLogic, currencyManager, {
        paymentNetwork: mockPaymentNetwork,
      });
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

      const request = new Request('1', mockRequestLogic, currencyManager, {
        paymentNetwork: mockDeclarativePaymentNetwork,
      });
      await request.declareReceivedRefund('1000', 'received', signatureIdentity);

      expect(spyPayNet).toHaveBeenCalledTimes(1);
      expect(spyReqLog).toHaveBeenCalledTimes(1);
    });

    it('cannot declare received refund if no payment network', async () => {
      const request = new Request('1', mockRequestLogic, currencyManager);
      await expect(
        request.declareReceivedRefund('1000', 'received', signatureIdentity),
      ).rejects.toThrowError('Cannot declare received refund without payment network');
    });

    it('cannot declare received refund if payment network is not declarative', async () => {
      const request = new Request('1', mockRequestLogic, currencyManager, {
        paymentNetwork: mockPaymentNetwork,
      });
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

      const request = new Request('1', mockRequestLogicWithRequest, currencyManager);
      await request.refresh();

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
  describe('Gets escrow chain data', () => {
    it('fetches escrow onchain data from the smart contract', async () => {
      const request = new Request('1', mockRequestLogic, currencyManager);
      const reference = PaymentReferenceCalculator.calculate(
        '01d1a974cc48a045454c0070cbb033997c45a37b5106165f6cceaff47d694aba15',
        'f2827e01e021a90f',
        '0x5000EE9FB9c96A2A09D8efB695aC21D6C429fF11',
      );
      const escrowChainData = await request.getEscrowData(reference, 'rinkeby');
      expect(escrowChainData.payee).toEqual('0x5000EE9FB9c96A2A09D8efB695aC21D6C429fF11');
      expect(escrowChainData.payer).toEqual('0x186e7fE6c34Ea0ecA7F9C2Fd29651Fc0443e3F29');
      expect(escrowChainData.tokenAddress).toEqual('0xFab46E002BbF0b4509813474841E0716E6730136');
      expect(escrowChainData.amount.toString()).toEqual('1800000000000000000');
    });
  });
});
