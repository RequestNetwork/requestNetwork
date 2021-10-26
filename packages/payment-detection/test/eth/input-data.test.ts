import { AdvancedLogicTypes, ExtensionTypes, PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';
import EthInputData from '../../src/eth/input-data';
import TheGraphInfoRetriever from '../../dist/erc20/thegraph-info-retriever';
import { EVENTS_NAMES } from '@requestnetwork/types/dist/payment-types';

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
    }
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

  it('can extract events from theGraph', async () => {
    const graphData = {
      "amount": "1000000000000000",
      "contractAddress": "0x9c6c7817e3679c4b3f9ef9486001eae5aaed25ff",
      "from": "0xd8a4fb78214297c3044d344808bfb0e217ed27eb",
      "id": "0x17f896e375793d956f2b6ebfb13231f1ef6c0f275e0479ed16eef57c37f76066",
      "reference": "0x800d501693feda2226878e1ec7869eef8919dbc5bd10c2bcd031b94d73492860",
      "to": "0x6076677a8a163b7308896ad24ac4fd1987985c05",
      "tokenAddress": null,
      "txHash": "0x6eb0739fe71f376c90b2f26865c957d024a421f27a4c2cc2daad8f50b9d76a17"
    };
    const infoRetriever = new TheGraphInfoRetriever(
        graphData.reference,
        graphData.contractAddress,
        'ETH',
        graphData.to,
        EVENTS_NAMES.PAYMENT,
        'rinkeby',
      );
    const events = await infoRetriever.getTransferEvents();
    expect(events.length).toBeGreaterThan(0);
  });
});
