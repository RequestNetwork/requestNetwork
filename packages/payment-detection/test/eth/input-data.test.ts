import { mocked } from 'ts-jest/utils';
import { CurrencyManager } from '@requestnetwork/currency';
import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { getTheGraphClient } from '../../src/thegraph';
import { EthInputDataPaymentDetector } from '../../src/eth/input-data';
import { mockAdvancedLogicBase } from '../utils';

jest.mock('../../src/thegraph/client');
const theGraphClientMock = mocked(getTheGraphClient(''));

let ethInputData: EthInputDataPaymentDetector;

const createAddPaymentAddressAction = jest.fn();
const createAddRefundAddressAction = jest.fn();
const createCreationAction = jest.fn();
const createAddPaymentInstructionAction = jest.fn();
const createAddRefundInstructionAction = jest.fn();

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  ...mockAdvancedLogicBase,
  extensions: {
    ethereumInputData: {
      createAddPaymentAddressAction,
      createAddRefundAddressAction,
      createCreationAction,
      // inherited from declarative
      createAddPaymentInstructionAction,
      createAddRefundInstructionAction,
    },
  } as any as AdvancedLogicTypes.IAdvancedLogicExtensions,
};

// Most of the tests are done as integration tests in ../index.test.ts
/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('api/eth/input-data', () => {
  beforeEach(() => {
    ethInputData = new EthInputDataPaymentDetector({
      advancedLogic: mockAdvancedLogic,
      currencyManager: CurrencyManager.getDefault(),
      explorerApiKeys: {},
      getSubgraphClient: () => theGraphClientMock,
    });
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
        [ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA]: {
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
        [ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA]: {
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
        code: PaymentTypes.BALANCE_ERROR_CODE.UNKNOWN,
        message: /invalid network/,
      },
      events: [],
    });
  });

  it('can get balance from rinkeby subgraph', async () => {
    const rinkebyRequest = {
      currency: {
        network: 'rinkeby',
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      },
      expectedAmount: '80000000000000000',
      payee: {
        type: 'ethereumAddress',
        value: '0x1D274D164937465B7A7259347AD3f1aaEEEaC8e1',
      },
      payer: {
        type: 'ethereumAddress',
        value: '0x5e7D193321A4CCB091038d01755a10d143cb2Dc8',
      },
      timestamp: 1620207049,
      extensionsData: [
        {
          action: 'create',
          id: 'pn-eth-input-data',
          parameters: {
            paymentAddress: '0x8400b234e7B113686bD584af9b1041E5a233E754',
            salt: '2334c5f6691a9131',
          },
          version: '0.2.0',
        },
      ],
      extensions: {
        'pn-eth-input-data': {
          events: [
            {
              name: 'create',
              parameters: {
                paymentAddress: '0x8400b234e7B113686bD584af9b1041E5a233E754',
                salt: '2334c5f6691a9131',
              },
              timestamp: 1620207051,
            },
          ],
          id: 'pn-eth-input-data',
          type: 'payment-network',
          values: {
            paymentAddress: '0x8400b234e7B113686bD584af9b1041E5a233E754',
            salt: '2334c5f6691a9131',
          },
          version: '0.2.0',
        },
      },
      requestId: '0110e7eaba7a3ff2e2239081497308db70e4c66362100d747903ffa5c83d290d5d',
      version: '2.0.3',
      events: [
        {
          actionSigner: {
            type: 'ethereumAddress',
            value: '0x1D274D164937465B7A7259347AD3f1aaEEEaC8e1',
          },
          name: 'create',
          parameters: {
            expectedAmount: '80000000000000000',
            extensionsDataLength: 2,
            isSignedRequest: false,
          },
          timestamp: 1620207051,
        },
      ],
      state: 'created',
      creator: {
        type: 'ethereumAddress',
        value: '0x1D274D164937465B7A7259347AD3f1aaEEEaC8e1',
      },
    };

    theGraphClientMock.GetPaymentsAndEscrowState.mockResolvedValue({
      payments: [
        {
          amount: '80000000000000000',
          block: 8538429,
          txHash: '0x837793a46b6be3986a362a67e9d34b345c95799bce14b7e95d6ac74f4662f484',
          feeAmount: null,
          feeAddress: null,
          from: '0x61076da38517be36d433e3ff8d6875b87880ba56',
          gasUsed: '74480',
          gasPrice: '2000000000',
          timestamp: 1620311313,
          contractAddress: '0x9c6c7817e3679c4b3f9ef9486001eae5aaed25ff',
          to: '0x8400b234e7b113686bd584af9b1041e5a233e754',
          tokenAddress: null,
          currency: null,
          amountInCrypto: null,
          feeAmountInCrypto: null,
          maxRateTimespan: null,
        },
      ],
      escrowEvents: [],
    });

    const balance = await ethInputData.getBalance(rinkebyRequest as RequestLogicTypes.IRequest);
    expect(balance.error).toBeUndefined();
    expect(balance.balance).toBe('80000000000000000');
    expect(balance.events).toHaveLength(1);
    expect(balance.events[0].name).toBe(PaymentTypes.EVENTS_NAMES.PAYMENT);
    expect(balance.events[0].amount).toBe('80000000000000000');
    expect(typeof balance.events[0].timestamp).toBe('number');
  });
});
