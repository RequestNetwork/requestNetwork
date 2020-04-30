import { getMockData, setup } from './utils.js';

before(async () => {
  await setup();
});

describe('basic', () => {
  it('creates a request', async () => {
    const { contentData, paymentNetwork, requestCreationHash, signatureInfo } = getMockData();

    // Initialize the signature provider
    const signatureProvider = new EthereumPrivateKeySignatureProvider.EthereumPrivateKeySignatureProvider(
      signatureInfo,
    );

    // Initialize the library in local test mode
    const requestNetwork = new RequestNetwork.RequestNetwork({
      signatureProvider,
      useMockStorage: true,
    });

    // Create a request
    const request = await requestNetwork.createRequest({
      contentData,
      paymentNetwork,
      requestInfo: requestCreationHash,
      signer: requestCreationHash.payee,
    });

    await request.waitForConfirmation();

    // Retrieve the previously created request from its ID
    const requestFromId = await requestNetwork.fromRequestId(request.requestId);

    // At any time, you can refresh the request data to check if there are changes
    // await requestFromId.refresh();

    // Get the data of the request
    const requestData = requestFromId.getData();

    chai.expect(requestData.expectedAmount).to.equal('100000000000');
    chai.expect(requestData.currency).to.equal('EUR');
    chai.expect(requestData.balance.balance).to.equal('0');
    chai.expect(requestData.contentData).to.deep.equal({
      it: 'is',
      some: 'content',
      true: true,
    });
  });
});
