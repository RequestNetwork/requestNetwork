import { AdvancedLogic } from '@requestnetwork/advanced-logic';
import { DataAccess } from '@requestnetwork/data-access';
import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';
import { RequestLogic } from '@requestnetwork/request-logic';
import { TransactionManager } from '@requestnetwork/transaction-manager';
import { IdentityTypes, RequestLogicTypes, SignatureTypes } from '@requestnetwork/types';
import MockStorage from './mock-storage';

const signatureInfo: SignatureTypes.ISignatureParameters = {
  method: SignatureTypes.METHOD.ECDSA,
  privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
};
const signerIdentity: IdentityTypes.IIdentity = {
  type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
  value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
};

const requestCreationHash: RequestLogicTypes.ICreateParameters = {
  currency: {
    network: 'mainnet',
    type: RequestLogicTypes.CURRENCY.ETH,
    value: 'ETH',
  },
  expectedAmount: '100000000000',
  payee: signerIdentity,
  payer: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
  },
};

// Signature provider setup
const signatureProvider = new EthereumPrivateKeySignatureProvider(signatureInfo);

// Advanced logic setup
const advancedLogic = new AdvancedLogic();

/**
 * Sets up the test environment: instantiate the layers, including a mock storage
 *
 * @returns {Promise<RequestLogic>}
 */
async function setup(): Promise<{ mockStorage: MockStorage; requestLogic: RequestLogic }> {
  const mockStorage = new MockStorage();

  // Data access setup
  const dataAccess = new DataAccess(mockStorage);
  await dataAccess.initialize();

  // Logic setup
  return {
    mockStorage,
    requestLogic: new RequestLogic(
      new TransactionManager(dataAccess),
      signatureProvider,
      advancedLogic,
    ),
  };
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
  // tslint:disable:object-literal-sort-keys
  actions: any = {
    create: true,
    accept: false,
    increase: false,
    reduce: false,
    content: '',
  },
): Promise<number> {
  let _requestCreationHash = requestCreationHash;
  const { requestLogic, mockStorage } = await setup();
  let requestId: string;
  if (actions.create) {
    if (actions.content) {
      _requestCreationHash = Object.assign({}, requestCreationHash, {
        extensionsData: [
          advancedLogic.extensions.contentData.createCreationAction({ content: actions.content }),
        ],
      });
    }
    const resultCreation = await requestLogic.createRequest(_requestCreationHash, signerIdentity);
    requestId = resultCreation.result.requestId;
    if (actions.accept) {
      await requestLogic.acceptRequest({ requestId }, signerIdentity);
    }
    if (actions.increase) {
      await requestLogic.increaseExpectedAmountRequest(
        { requestId, deltaAmount: 1000 },
        signerIdentity,
      );
    }
    if (actions.reduce) {
      await requestLogic.reduceExpectedAmountRequest(
        { requestId, deltaAmount: 1000 },
        signerIdentity,
      );
    }
  }
  const dataInStorage = await mockStorage.getData();
  return dataInStorage.entries.reduce((totalSize, { content }) => totalSize + content.length, 0);
}

export default getSizeOfRequest;
