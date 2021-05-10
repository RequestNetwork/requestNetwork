import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import ERC20ProxyContract from '../../src/erc20/proxy-contract';

let erc20ProxyContract: ERC20ProxyContract;

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions(): any {
    return;
  },
  extensions: {
    proxyContractErc20: {
      createAddPaymentAddressAction(): any {
        return;
      },
      createAddRefundAddressAction(): any {
        return;
      },
      createCreationAction(): any {
        return;
      },
    },
  },
};

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('api/erc20/proxy-contract', () => {
  beforeEach(() => {
    erc20ProxyContract = new ERC20ProxyContract({ advancedLogic: mockAdvancedLogic });
  });

  it('can createExtensionsDataForCreation', async () => {
    const spy = jest.spyOn(mockAdvancedLogic.extensions.proxyContractErc20, 'createCreationAction');

    await erc20ProxyContract.createExtensionsDataForCreation({
      paymentAddress: 'ethereum address',
      salt: 'ea3bc7caf64110ca',
    });

    expect(spy).toHaveBeenCalledWith({
      paymentAddress: 'ethereum address',
      refundAddress: undefined,
      salt: 'ea3bc7caf64110ca',
    });
  });

  it('can createExtensionsDataForCreation without salt', async () => {
    const spy = jest.spyOn(mockAdvancedLogic.extensions.proxyContractErc20, 'createCreationAction');

    await erc20ProxyContract.createExtensionsDataForCreation({
      paymentAddress: 'ethereum address',
    });

    // Can't check parameters since salt is generated in createExtensionsDataForCreation
    expect(spy).toHaveBeenCalled();
  });

  it('can createExtensionsDataForAddPaymentInformation', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.proxyContractErc20,
      'createAddPaymentAddressAction',
    );

    erc20ProxyContract.createExtensionsDataForAddPaymentInformation({
      paymentAddress: 'ethereum address',
    });

    expect(spy).toHaveBeenCalledWith({
      paymentAddress: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddRefundInformation', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.proxyContractErc20,
      'createAddRefundAddressAction',
    );

    erc20ProxyContract.createExtensionsDataForAddRefundInformation({
      refundAddress: 'ethereum address',
    });

    expect(spy).toHaveBeenCalledWith({
      refundAddress: 'ethereum address',
    });
  });

  it('should not throw when getBalance fail', async () => {
    expect(
      await erc20ProxyContract.getBalance({ extensions: {} } as RequestLogicTypes.IRequest),
    ).toEqual({
      balance: null,
      error: {
        code: PaymentTypes.BALANCE_ERROR_CODE.WRONG_EXTENSION,
        message: 'The request does not have the extension : pn-erc20-proxy-contract',
      },
      events: [],
    });
  });

  it('should handle not supported version error', async () => {
    const request: any = {
      currency: { network: 'mainnet' },
      extensions: {
        [ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT]: {
          values: {
            paymentAddress: '0xabcd',
          },
          version: 'WRONG',
        },
      },
    };
    await expect(erc20ProxyContract.getBalance(request)).resolves.toEqual({
      balance: null,
      error: {
        code: PaymentTypes.BALANCE_ERROR_CODE.VERSION_NOT_SUPPORTED,
        message: 'Payment network version not supported: WRONG',
      },
      events: [],
    });
  });

  it('should handle not supported network error', async () => {
    const request: any = {
      currency: { network: 'WRONG' },
      extensions: {
        [ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT]: {
          values: {
            paymentAddress: '0xabcd',
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
});
