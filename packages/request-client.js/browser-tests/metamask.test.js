import { setup, getMockData } from './utils.js';

before(async function() {
  await setup();
});

describe('metamask', () => {
  it('signs a request', async () => {
    const signer = window.ethereum.selectedAddress;
    const { contentData, paymentNetwork, requestCreationHash } = getMockData(signer);

    // Initialize the signature provider
    const signatureProvider = new Web3SignatureProvider.Web3SignatureProvider(window.web3);

    // Initialize the library in local test mode
    const requestNetwork = new RequestNetwork.RequestNetwork({
      signatureProvider,
      // this is a test using the mock storage instead of a real request node
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

  it('is compatible with an older request', async () => {
    const requestNetwork = new RequestNetwork.RequestNetwork({
      nodeConnectionConfig: { baseURL: 'https://gateway-rinkeby.request.network/' },
    });

    const request = await requestNetwork.fromRequestId(
      '0112bed3e659b642335b3424e483ea93f2a12b921582a2116993a750ba7376a20c',
    );
    chai.expect(request.getData().contentData.reason).to.equal('hello multis');
  });

  it('broadcasts from the browser', async () => {
    const signer = window.ethereum.selectedAddress;

    const { contentData, paymentNetwork, requestCreationHash } = getMockData(signer);

    // Initialize the signature provider
    const signatureProvider = new Web3SignatureProvider.Web3SignatureProvider(window.web3);

    // Initialize the library in local test mode
    const requestNetwork = new RequestNetwork.RequestNetwork({
      signatureProvider,
      useLocalEthereumBroadcast: true,
      web3: window.web3,
    });

    // Create a request
    const request = await requestNetwork.createRequest({
      contentData,
      paymentNetwork,
      requestInfo: requestCreationHash,
      signer: {
        type: 'ethereumAddress',
        value: signer,
      },
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
