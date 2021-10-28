import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import EthInputData from '../../src/eth/input-data';

let ethInputData: EthInputData;

const createAddPaymentAddressAction = jest.fn();
const createAddRefundAddressAction = jest.fn();
const createCreationAction = jest.fn();
const createAddPaymentInstructionAction = jest.fn();
const createAddRefundInstructionAction = jest.fn();

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions(): any {
    return;
  },
  extensions: {
    ethereumInputData: {
      createAddPaymentAddressAction,
      createAddRefundAddressAction,
      createCreationAction,
      supportedNetworks: ['mainnet', 'rinkeby'],
      // inherited from declarative
      createAddPaymentInstructionAction,
      createAddRefundInstructionAction,
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
    await ethInputData.createExtensionsDataForCreation({
      paymentAddress: 'ethereum address',
      salt: 'ea3bc7caf64110ca',
    });

    expect(createCreationAction).toHaveBeenCalledTimes(1);
  });

  it('can createExtensionsDataForAddPaymentAddress', async () => {
    ethInputData.createExtensionsDataForAddPaymentAddress({
      paymentAddress: 'ethereum address',
    });

    expect(createAddPaymentAddressAction).toHaveBeenCalledWith({
      paymentAddress: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddRefundAddress', async () => {
    ethInputData.createExtensionsDataForAddRefundAddress({
      refundAddress: 'ethereum address',
    });

    expect(createAddRefundAddressAction).toHaveBeenCalledWith({
      refundAddress: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddPaymentInformation', async () => {
    ethInputData.createExtensionsDataForAddPaymentInformation({
      paymentInfo: 'ethereum address',
    });

    expect(createAddPaymentInstructionAction).toHaveBeenCalledWith({
      paymentInfo: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddRefundInformation', async () => {
    ethInputData.createExtensionsDataForAddRefundInformation({
      refundInfo: 'ethereum address',
    });

    expect(createAddRefundInstructionAction).toHaveBeenCalledWith({
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

    expect(await ethInputData.getBalance(mockRequest as RequestLogicTypes.IRequest)).toMatchObject({
      balance: null,
      error: {
        code: PaymentTypes.BALANCE_ERROR_CODE.NETWORK_NOT_SUPPORTED,
        message: /Payment network wrong not supported by ETH payment detection\. Supported networks: mainnet, rinkeby, private.*/,
      },
      events: [],
    });
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
