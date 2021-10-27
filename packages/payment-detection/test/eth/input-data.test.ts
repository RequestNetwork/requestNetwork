import { AdvancedLogicTypes, ExtensionTypes, PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';
import EthInputData from '../../src/eth/input-data';
import TheGraphInfoRetriever from '../../src/erc20/thegraph-info-retriever';
import { EVENTS_NAMES } from '@requestnetwork/types/dist/payment-types';
import { BigNumber } from 'ethers';

let ethInputData: EthInputData;

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions(): any {
    return;
  },
  extensions: {
    ethereumInputData: {
      createAddPaymentAddressAction(): any {
        return;
      },
      createAddRefundAddressAction(): any {
        return;
      },
      createCreationAction(): any {
        return;
      },
      supportedNetworks: ['mainnet', 'rinkeby'],
    },
    declarative: {
      createAddPaymentInstructionAction(): any {
        return;
      },
      createAddRefundInstructionAction(): any {
        return;
      },
    },
  },
};

// Most of the tests are done as integration tests in ../index.test.ts
/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('api/eth/input-data', () => {
  beforeEach(() => {
    ethInputData = new EthInputData({ advancedLogic: mockAdvancedLogic });
  });

  it('can createExtensionsDataForCreation', async () => {
    const spy = jest.spyOn(mockAdvancedLogic.extensions.ethereumInputData, 'createCreationAction');

    await ethInputData.createExtensionsDataForCreation({
      paymentAddress: 'ethereum address',
      salt: 'ea3bc7caf64110ca',
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('can createExtensionsDataForAddPaymentAddress', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.ethereumInputData,
      'createAddPaymentAddressAction',
    );

    ethInputData.createExtensionsDataForAddPaymentAddress({
      paymentAddress: 'ethereum address',
    });

    expect(spy).toHaveBeenCalledWith({
      paymentAddress: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddRefundAddress', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.ethereumInputData,
      'createAddRefundAddressAction',
    );

    ethInputData.createExtensionsDataForAddRefundAddress({
      refundAddress: 'ethereum address',
    });

    expect(spy).toHaveBeenCalledWith({
      refundAddress: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddPaymentInformation', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.declarative,
      'createAddPaymentInstructionAction',
    );

    ethInputData.createExtensionsDataForAddPaymentInformation({
      paymentInfo: 'ethereum address',
    });

    expect(spy).toHaveBeenCalledWith({
      paymentInfo: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddRefundInformation', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.declarative,
      'createAddRefundInstructionAction',
    );

    ethInputData.createExtensionsDataForAddRefundInformation({
      refundInfo: 'ethereum address',
    });

    expect(spy).toHaveBeenCalledWith({
      refundInfo: 'ethereum address',
    });
  });

  // Skip because input-data cannot be used without etherscan
  it.skip('can getBalance on a localhost request', async () => {
    const mockRequest = {
      creator: { type: '', value: '0x2' },
      currency: {
        network: 'private',
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      },
      events: [],
      expectedAmount: '0',
      extensions: {
        [ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA]: {
          events: [],
          id: '0',
          type: 'none',
          values: {
            paymentAddress: '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
            salt: 'ea3bc7caf64110ca',
          },
          version: '0',
        },
      },
      extensionsData: [],
      requestId: '0x1',
      state: 'Good',
      timestamp: 0,
      version: '0.2',
    };

    const balance = await ethInputData.getBalance(mockRequest as RequestLogicTypes.IRequest);

    expect(balance.balance).toBe('10');
    expect(balance.events).toHaveLength(1);
    expect(balance.events[0].name).toBe(PaymentTypes.EVENTS_NAMES.PAYMENT);
    expect(balance.events[0].amount).toBe('10');
    expect(typeof balance.events[0].timestamp).toBe('number');
  });

  it('should not throw when getBalance fail', async () => {
    const mockRequest = {
      creator: { type: '', value: '0x2' },
      currency: {
        network: 'wrong',
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      },
      events: [],
      expectedAmount: '0',
      extensions: {
        [ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA]: {
          events: [],
          id: '0',
          type: 'none',
          values: {
            paymentAddress: '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
            salt: 'ea3bc7caf64110ca',
          },
          version: '0',
        },
      },
      extensionsData: [],
      requestId: '0x1',
      state: 'Good',
      timestamp: 0,
      version: '0.2',
    };

    expect(
      await ethInputData.getBalance(mockRequest as RequestLogicTypes.IRequest),
    ).toMatchObject({
      balance: null,
      error: {
        code: PaymentTypes.BALANCE_ERROR_CODE.NETWORK_NOT_SUPPORTED,
        message: /Payment network wrong not supported by ETH payment detection\. Supported networks: mainnet, rinkeby, private.*/,
      },
      events: [],
    });
  });

  it('can extract native payment events from rinkeby subgraph', async () => {
    const graphData = {
      'amount': '1000000000000000',
      'contractAddress': '0x9c6c7817e3679c4b3f9ef9486001eae5aaed25ff',
      'from': '0xd8a4fb78214297c3044d344808bfb0e217ed27eb',
      'id': '0x17f896e375793d956f2b6ebfb13231f1ef6c0f275e0479ed16eef57c37f76066',
      'reference': '800d501693feda2226878e1ec7869eef8919dbc5bd10c2bcd031b94d73492860',
      'to': '0x6076677a8a163b7308896ad24ac4fd1987985c05',
      'tokenAddress': null,
      'txHash': '0x6eb0739fe71f376c90b2f26865c957d024a421f27a4c2cc2daad8f50b9d76a17',
    };
    const infoRetriever = new TheGraphInfoRetriever(
      graphData.reference,
      graphData.contractAddress,
      '',
      graphData.to,
      EVENTS_NAMES.PAYMENT,
      'rinkeby',
    );

    const events = await infoRetriever.getTransferEvents();
    const balance = events
      .reduce((acc, event) => acc.add(BigNumber.from(event.amount)), BigNumber.from(0))
      .toString();

    expect(balance).toBe('1000000000000000');
    expect(events).toHaveLength(1);
  });

  it('can get balance from rinkeby subgraph', async () => {
    const rinkebyRequest = {
      'currency': {
        network: 'rinkeby',
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      },
      'expectedAmount': '80000000000000000',
      'payee': {
        'type': 'ethereumAddress',
        'value': '0x1D274D164937465B7A7259347AD3f1aaEEEaC8e1',
      },
      'payer': {
        'type': 'ethereumAddress',
        'value': '0x5e7D193321A4CCB091038d01755a10d143cb2Dc8',
      },
      'timestamp': 1620207049,
      'extensionsData': [
        {
          'action': 'create',
          'id': 'pn-eth-input-data',
          'parameters': {
            'paymentAddress': '0x8400b234e7B113686bD584af9b1041E5a233E754',
            'salt': '2334c5f6691a9131',
          },
          'version': '0.2.0',
        },
        {
          'action': 'create',
          'id': 'content-data',
          'parameters': {
            'content': {
              'meta': {
                'format': 'rnf_invoice',
                'version': '0.0.3',
              },
              'creationDate': '2021-05-05T09:30:22.613Z',
              'invoiceItems': [
                {
                  'currency': 'ETH',
                  'name': 'Paid on MM',
                  'quantity': 1,
                  'tax': {
                    'type': 'percentage',
                    'amount': '0',
                  },
                  'unitPrice': '80000000000000000',
                },
              ],
              'invoiceNumber': '18',
              'buyerInfo': {
                'address': {
                  'country-name': 'France',
                  'street-address': 'Nobel Prize street',
                  'locality': '',
                },
                'businessName': 'CRISPR Charpentier',
                'email': 'yoann.marion+payer@request.network',
              },
              'miscellaneous': {
                'builderId': 'request-team',
                'createdWith': 'baguette-invoicing.request.network',
              },
              'paymentTerms': {
                'dueDate': '2021-06-04T21:59:59.999Z',
              },
              'sellerInfo': {
                'businessName': 'Planet Earth ltd.',
                'address': {
                  'country-name': 'France',
                  'street-address': '13, rue Louise Michel',
                  'extended-address': '',
                  'postal-code': '38000',
                  'region': '',
                  'locality': 'Grenoble',
                },
                'email': 'yoann.marion+issuer@request.network',
                'firstName': 'Iss',
                'lastName': 'Uer',
                'taxRegistration': 'TX-31415',
              },
            },
          },
          'version': '0.1.0',
        },
      ],
      'extensions': {
        'pn-eth-input-data': {
          'events': [
            {
              'name': 'create',
              'parameters': {
                'paymentAddress': '0x8400b234e7B113686bD584af9b1041E5a233E754',
                'salt': '2334c5f6691a9131',
              },
              'timestamp': 1620207051,
            },
          ],
          'id': 'pn-eth-input-data',
          'type': 'payment-network',
          'values': {
            'paymentAddress': '0x8400b234e7B113686bD584af9b1041E5a233E754',
            'salt': '2334c5f6691a9131',
          },
          'version': '0.2.0',
        },
      },
      'requestId': '0110e7eaba7a3ff2e2239081497308db70e4c66362100d747903ffa5c83d290d5d',
      'version': '2.0.3',
      'events': [
        {
          'actionSigner': {
            'type': 'ethereumAddress',
            'value': '0x1D274D164937465B7A7259347AD3f1aaEEEaC8e1',
          },
          'name': 'create',
          'parameters': {
            'expectedAmount': '80000000000000000',
            'extensionsDataLength': 2,
            'isSignedRequest': false,
          },
          'timestamp': 1620207051,
        },
      ],
      'state': 'created',
      'creator': {
        'type': 'ethereumAddress',
        'value': '0x1D274D164937465B7A7259347AD3f1aaEEEaC8e1',
      },
    };

    const balance = await ethInputData.getBalance(rinkebyRequest as RequestLogicTypes.IRequest);

    expect(balance.balance).toBe('80000000000000000');
    expect(balance.events).toHaveLength(1);
    expect(balance.events[0].name).toBe(PaymentTypes.EVENTS_NAMES.PAYMENT);
    expect(balance.events[0].amount).toBe('80000000000000000');
    expect(typeof balance.events[0].timestamp).toBe('number');
  });

});
