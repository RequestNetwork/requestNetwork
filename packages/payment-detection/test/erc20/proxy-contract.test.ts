import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { CurrencyManager } from '@requestnetwork/currency';
import { ERC20ProxyPaymentDetector } from '../../src/erc20';
import { getTheGraphEvmClient } from '../../src';
import { mockAdvancedLogicBase } from '../utils';

let erc20ProxyContract: ERC20ProxyPaymentDetector;

const createAddPaymentAddressAction = jest.fn();
const createAddRefundAddressAction = jest.fn();
const createCreationAction = jest.fn();
const createAddPaymentInstructionAction = jest.fn();
const createAddRefundInstructionAction = jest.fn();

jest.mock('../../src/thegraph/client');
const theGraphClientMock = jest.mocked(getTheGraphEvmClient(''));
const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  ...mockAdvancedLogicBase,
  extensions: {
    proxyContractErc20: {
      createAddPaymentAddressAction,
      createAddRefundAddressAction,
      createCreationAction,
      // inheritance from declarative
      createAddPaymentInstructionAction,
      createAddRefundInstructionAction,
    },
  } as any as AdvancedLogicTypes.IAdvancedLogicExtensions,
};

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('api/erc20/proxy-contract', () => {
  beforeEach(() => {
    erc20ProxyContract = new ERC20ProxyPaymentDetector({
      advancedLogic: mockAdvancedLogic,
      currencyManager: CurrencyManager.getDefault(),
      getSubgraphClient: () => theGraphClientMock,
    });
  });

  it('can createExtensionsDataForCreation', async () => {
    await erc20ProxyContract.createExtensionsDataForCreation({
      paymentAddress: 'ethereum address',
      salt: 'ea3bc7caf64110ca',
    });

    expect(createCreationAction).toHaveBeenCalledWith({
      paymentAddress: 'ethereum address',
      refundAddress: undefined,
      salt: 'ea3bc7caf64110ca',
    });
  });

  it('can createExtensionsDataForCreation without salt', async () => {
    await erc20ProxyContract.createExtensionsDataForCreation({
      paymentAddress: 'ethereum address',
    });

    // Can't check parameters since salt is generated in createExtensionsDataForCreation
    expect(createCreationAction).toHaveBeenCalled();
  });

  it('can createExtensionsDataForAddPaymentAddress', async () => {
    erc20ProxyContract.createExtensionsDataForAddPaymentAddress({
      paymentAddress: 'ethereum address',
    });

    expect(createAddPaymentAddressAction).toHaveBeenCalledWith({
      paymentAddress: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddPaymentInformation', async () => {
    erc20ProxyContract.createExtensionsDataForAddPaymentInformation({
      paymentInfo: 'ethereum address',
    });

    expect(createAddPaymentInstructionAction).toHaveBeenCalledWith({
      paymentInfo: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddRefundAddress', async () => {
    erc20ProxyContract.createExtensionsDataForAddRefundAddress({
      refundAddress: 'ethereum address',
    });

    expect(createAddRefundAddressAction).toHaveBeenCalledWith({
      refundAddress: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddRefundInformation', async () => {
    erc20ProxyContract.createExtensionsDataForAddRefundInformation({
      refundInfo: 'ethereum address',
    });

    expect(createAddRefundInstructionAction).toHaveBeenCalledWith({
      refundInfo: 'ethereum address',
    });
  });

  it('should not throw when getBalance fail', async () => {
    expect(
      await erc20ProxyContract.getBalance({ extensions: {} } as RequestLogicTypes.IRequest),
    ).toEqual({
      balance: null,
      error: {
        code: PaymentTypes.BALANCE_ERROR_CODE.WRONG_EXTENSION,
        message: 'The request does not have the extension: pn-erc20-proxy-contract',
      },
      events: [],
    });
  });

  it('should handle not supported version error', async () => {
    const request: any = {
      requestId: 'abcd',
      currency: { network: 'mainnet' },
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT]: {
          values: {
            paymentAddress: '0xabcd',
            salt: 'ea3bc7caf64110ca',
          },
          version: 'WRONG',
        },
      },
    };
    await expect(erc20ProxyContract.getBalance(request)).resolves.toEqual({
      balance: null,
      error: {
        code: PaymentTypes.BALANCE_ERROR_CODE.VERSION_NOT_SUPPORTED,
        message: 'No contract matches payment network version: WRONG.',
      },
      events: [],
    });
  });

  it('should handle not supported network error', async () => {
    const request: any = {
      requestId: 'abcd',
      currency: { network: 'WRONG' },
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT]: {
          values: {
            paymentAddress: '0xabcd',
            salt: 'ea3bc7caf64110ca',
          },
          version: '0.1.0',
        },
      },
    };
    await expect(erc20ProxyContract.getBalance(request)).resolves.toEqual({
      balance: null,
      error: {
        code: PaymentTypes.BALANCE_ERROR_CODE.NETWORK_NOT_SUPPORTED,
        message: 'Network not supported for this payment network: WRONG',
      },
      events: [],
    });
  });

  it('should have gas info when fetching from thegraph', async () => {
    const mockRequest: any = {
      requestId: '01ae8d15bdff65a03271e36bb00d3f3bfb43c1ff95f8ac74338b95c069e62bb928',
      currency: {
        network: 'rinkeby',
        type: 'ERC20',
        value: '0xFab46E002BbF0b4509813474841E0716E6730136',
      },
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT]: {
          events: [
            {
              name: 'create',
              parameters: {
                paymentAddress: '0x0e8d9cb9e11278ad6e2ba1ca90385c7295dc6532',
                salt: '0944271041d2ee69',
              },
              timestamp: 1579705864,
            },
          ],
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT,
          type: 'payment-network',
          values: {
            paymentAddress: '0x0e8d9cb9e11278ad6e2ba1ca90385c7295dc6532',
            salt: '0944271041d2ee69',
          },
          version: '0.1.0',
        },
      },
    };

    theGraphClientMock.GetPaymentsAndEscrowState.mockResolvedValueOnce({
      payments: [
        {
          amount: '1000000000000000000',
          block: 5837728,
          txHash: '0xaace20feaca32b47f2174a11e319b784bbb261b05344a72b06c1e85d2ed48f81',
          feeAmount: null,
          feeAddress: null,
          from: '0x0e8d9cb9e11278ad6e2ba1ca90385c7295dc6532',
          gasUsed: '41013',
          gasPrice: '1000000000',
          timestamp: 1579705909,
          contractAddress: '0x162edb802fae75b9ee4288345735008ba51a4ec9',
          to: '0x0e8d9cb9e11278ad6e2ba1ca90385c7295dc6532',
        },
      ],
      escrowEvents: [],
    });

    const balance = await erc20ProxyContract.getBalance(mockRequest);
    const parameters = balance.events[0].parameters as any;
    expect(parameters.gasUsed).toBe('41013');
    expect(parameters.gasPrice).toBe('1000000000');
  });
});
