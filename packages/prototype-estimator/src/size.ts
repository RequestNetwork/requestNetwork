import { DataAccess } from '@requestnetwork/data-access';
import { RequestLogic } from '@requestnetwork/request-logic';
import {
  Identity as IdentityTypes,
  RequestLogic as RequestLogicTypes,
  Signature as SignatureTypes,
} from '@requestnetwork/types';
import MockStorage from './mock-storage';

const signatureInfo: SignatureTypes.ISignatureParameters = {
  method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
  privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
};

const requestCreationHash: RequestLogicTypes.IRequestLogicCreateParameters = {
  currency: RequestLogicTypes.REQUEST_LOGIC_CURRENCY.ETH,
  expectedAmount: '100000000000',
  payee: {
    type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
  },
  payer: {
    type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
  },
};

const topics = [
  '0x627306090abab3a6e1400e9345bc60c78a8bef57',
  '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
];

/**
 * Sets up the test environment: instanciate the layers, including a mock storage
 *
 * @returns {Promise<RequestLogic>}
 */
async function setup(): Promise<{ mockStorage: MockStorage; requestLogic: RequestLogic }> {
  const mockStorage = new MockStorage();

  // Data access setup
  const dataAccess = new DataAccess(mockStorage);
  await dataAccess.initialize();

  // Logic setup
  return { mockStorage, requestLogic: new RequestLogic(dataAccess) };
}

/**
 * Creates a request and returns the size in the storage
 *
 * @param {Boolean} actions.create Should it create a request?
 * @param {Boolean} actions.accept Should it accept a request?
 * @param {Boolean} actions.increase Should it increase the amount a request?
 * @param {Boolean} actions.reduce Should it reduce the amount a request?
 * @param {String} actions.content Content of the request
 * @returns
 */
async function getSizeOfRequest(
  actions: any = {
    create: true,
    accept: false,
    increase: false,
    reduce: false,
    content: '',
  },
) {
  const { requestLogic, mockStorage } = await setup();
  let requestId: string;
  if (actions.create) {
    if (actions.content) {
      // TODO
    }
    const resultCreation = await requestLogic.createRequest(
      requestCreationHash,
      signatureInfo,
      topics,
    );
    requestId = resultCreation.result.requestId;
    if (actions.accept) {
      await requestLogic.acceptRequest({ requestId }, signatureInfo);
    }
    if (actions.increase) {
      await requestLogic.increaseExpectedAmountRequest(
        { requestId, deltaAmount: 1000 },
        signatureInfo,
      );
    }
    if (actions.reduce) {
      await requestLogic.reduceExpectedAmountRequest(
        { requestId, deltaAmount: 1000 },
        signatureInfo,
      );
    }
  }
  const dataInStorage = await mockStorage.getAllData();
  return dataInStorage.result.data.reduce((totalSize, data) => totalSize + data.length, 0);
}

export default getSizeOfRequest;
