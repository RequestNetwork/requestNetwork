import { setup, getMockData } from './utils.js';

before(async function() {
  this.timeout(10000);
  await setup();
});

describe('encryption', () => {
  it('signs an encrypted request', async () => {
    const signer = window.ethereum.selectedAddress;

    const {
      contentData,
      decryptionParameters,
      encryptionParameters,
      paymentNetwork,
      requestCreationHash,
    } = getMockData(signer);

    // Initialize the signature provider
    const signatureProvider = new Web3SignatureProvider.Web3SignatureProvider(window.web3);

    // Initialize the decryption provider
    const decryptionProvider = new EthereumPrivateKeyDecryptionProvider.EthereumPrivateKeyDecryptionProvider(
      decryptionParameters,
    );

    // Initialize the library in local test mode
    const requestNetwork = new RequestNetwork.RequestNetwork({
      signatureProvider,
      decryptionProvider,
      // this is a test using the mock storage instead of a real request node
      useMockStorage: true,
    });

    // Create an encrypted request
    const request = await requestNetwork._createEncryptedRequest(
      {
        contentData,
        paymentNetwork,
        requestInfo: requestCreationHash,
        signer: requestCreationHash.payee,
      },
      [encryptionParameters],
    );

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
