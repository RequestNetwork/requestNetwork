import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { ERC20ProxyPaymentDetector } from '../../src/erc20/proxy-contract';

let erc20ProxyContract: ERC20ProxyPaymentDetector;

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
    proxyContractErc20: {
      supportedNetworks: ['mainnet'],
      createAddPaymentAddressAction,
      createAddRefundAddressAction,
      createCreationAction,
      // inheritance from declarative
      createAddPaymentInstructionAction,
      createAddRefundInstructionAction,
    },
  },
};

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('api/erc20/proxy-contract', () => {
  beforeEach(() => {
    erc20ProxyContract = new ERC20ProxyPaymentDetector({ advancedLogic: mockAdvancedLogic });
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
        [ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT]: {
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
        [ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT]: {
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
        message:
          'Payment network WRONG not supported by pn-erc20-proxy-contract payment detection. Supported networks: mainnet',
      },
      events: [],
    });
  });
});
