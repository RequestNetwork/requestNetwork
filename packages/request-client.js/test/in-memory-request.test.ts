import { RequestNetwork } from '../src/index';
import * as TestData from './data-test';

import { http, HttpResponse } from 'msw';
import { setupServer, SetupServer } from 'msw/node';
import config from '../src/http-config-defaults';

describe('handle in-memory request', () => {
  let requestNetwork: RequestNetwork;
  let spyPersistTransaction: jest.Mock;
  let mockServer: SetupServer;

  beforeAll(() => {
    spyPersistTransaction = jest.fn();

    mockServer = setupServer(
      http.post('*/persistTransaction', ({ request }) => {
        if (!request.headers.get(config.requestClientVersionHeader)) {
          throw new Error('Missing version header');
        }
        return HttpResponse.json(spyPersistTransaction());
      }),
      http.get('*/getTransactionsByChannelId', () =>
        HttpResponse.json({
          result: { transactions: [TestData.timestampedTransactionWithoutPaymentInfo] },
        }),
      ),
      http.post('*/ipfsAdd', () => HttpResponse.json({})),
      http.get('*/getConfirmedTransaction', () => HttpResponse.json({ result: {} })),
    );
    mockServer.listen({ onUnhandledRequest: 'bypass' });
  });

  beforeEach(() => {
    spyPersistTransaction.mockReturnValue({});
  });

  afterEach(() => {
    mockServer.resetHandlers();
  });

  afterAll(() => {
    mockServer.resetHandlers();
    mockServer.close();
  });

  const requestCreationParams = {
    paymentNetwork: TestData.declarativePaymentNetworkNoPaymentInfo,
    requestInfo: TestData.parametersWithoutExtensionsData,
    signer: TestData.payee.identity,
  };

  it('creates a request without persisting it.', async () => {
    requestNetwork = new RequestNetwork({
      skipPersistence: true,
      signatureProvider: TestData.fakeSignatureProvider,
    });

    const request = await requestNetwork.createRequest(requestCreationParams);

    expect(request).toBeDefined();
    expect(request.requestId).toBeDefined();
    expect(request.inMemoryInfo).toBeDefined();
    expect(request.inMemoryInfo?.paymentRequest).toBeDefined();
    expect(request.inMemoryInfo?.topics).toBeDefined();
    expect(request.inMemoryInfo?.transactionData).toBeDefined();
    expect(spyPersistTransaction).not.toHaveBeenCalled();
  });

  it('throws an error when trying to persist a request with skipPersistence as true', async () => {
    requestNetwork = new RequestNetwork({
      skipPersistence: true,
      signatureProvider: TestData.fakeSignatureProvider,
    });

    const request = await requestNetwork.createRequest(requestCreationParams);

    expect(request.inMemoryInfo).toBeDefined();
    expect(request.inMemoryInfo?.paymentRequest).toBeDefined();
    expect(request.inMemoryInfo?.topics).toBeDefined();
    expect(request.inMemoryInfo?.transactionData).toBeDefined();
    expect(request.requestId).toBeDefined();

    await expect(requestNetwork.persistRequest(request)).rejects.toThrow(
      'Cannot persist request when skipPersistence is enabled. Create a new instance of RequestNetwork without skipPersistence to persist the request.',
    );
  });

  it('throw an error when trying to persist a request without inMemoryInfo', async () => {
    requestNetwork = new RequestNetwork({
      signatureProvider: TestData.fakeSignatureProvider,
    });

    const request = await requestNetwork.createRequest(requestCreationParams);

    expect(request.inMemoryInfo).toBeNull();

    await expect(requestNetwork.persistRequest(request)).rejects.toThrow(
      'Cannot persist request without inMemoryInfo',
    );
  });

  it('persists a previously created in-memory request', async () => {
    requestNetwork = new RequestNetwork({
      skipPersistence: true,
      signatureProvider: TestData.fakeSignatureProvider,
    });

    const request = await requestNetwork.createRequest(requestCreationParams);

    expect(request.inMemoryInfo).toBeDefined();
    expect(request.inMemoryInfo?.paymentRequest).toBeDefined();
    expect(request.inMemoryInfo?.topics).toBeDefined();
    expect(request.inMemoryInfo?.transactionData).toBeDefined();
    expect(request.requestId).toBeDefined();

    const newRequestNetwork = new RequestNetwork({
      signatureProvider: TestData.fakeSignatureProvider,
    });

    const persistResult = await newRequestNetwork.persistRequest(request);

    expect(persistResult).toBeDefined();
    expect(spyPersistTransaction).toHaveBeenCalled();
  });
});
