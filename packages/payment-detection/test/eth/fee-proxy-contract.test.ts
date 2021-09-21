import {
  AdvancedLogicTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { CurrencyManager } from '@requestnetwork/currency';
import ETHFeeProxyContract from '../../src/eth/fee-proxy-contract';

let ethFeeProxyContract: ETHFeeProxyContract;

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions(): any {
    return;
  },
  extensions: {
    feeProxyContractEth: {
      createAddPaymentAddressAction(): any {
        return;
      },
      createAddRefundAddressAction(): any {
        return;
      },
      createCreationAction(): any {
        return;
      },
      createAddFeeAction(): any {
        return;
      },
    },
  },
};

const currencyManager = CurrencyManager.getDefault();

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('api/eth/fee-proxy-contract', () => {
  beforeEach(() => {
    ethFeeProxyContract = new ETHFeeProxyContract({
      advancedLogic: mockAdvancedLogic,
      currencyManager,
    });
  });

  it('can createExtensionsDataForCreation', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.feeProxyContractEth,
      'createCreationAction',
    );

    await ethFeeProxyContract.createExtensionsDataForCreation({
      paymentAddress: 'ethereum address',
      salt: 'ea3bc7caf64110ca',
    });

    expect(spy).toHaveBeenCalledWith({
      feeAddress: undefined,
      feeAmount: undefined,
      paymentAddress: 'ethereum address',
      refundAddress: undefined,
      salt: 'ea3bc7caf64110ca',
    });
  });

  it('can createExtensionsDataForCreation with fee amount and address', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.feeProxyContractEth,
      'createCreationAction',
    );

    await ethFeeProxyContract.createExtensionsDataForCreation({
      feeAddress: 'fee address',
      feeAmount: '2000',
      paymentAddress: 'ethereum address',
      salt: 'ea3bc7caf64110ca',
    });

    expect(spy).toHaveBeenCalledWith({
      feeAddress: 'fee address',
      feeAmount: '2000',
      paymentAddress: 'ethereum address',
      refundAddress: undefined,
      salt: 'ea3bc7caf64110ca',
    });
  });

  it('can createExtensionsDataForCreation without salt', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.feeProxyContractEth,
      'createCreationAction',
    );

    await ethFeeProxyContract.createExtensionsDataForCreation({
      paymentAddress: 'ethereum address',
    });

    // Can't check parameters since salt is generated in createExtensionsDataForCreation
    expect(spy).toHaveBeenCalled();
  });

  it('can createExtensionsDataForAddPaymentInformation', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.feeProxyContractEth,
      'createAddPaymentAddressAction',
    );

    ethFeeProxyContract.createExtensionsDataForAddPaymentInformation({
      paymentAddress: 'ethereum address',
    });

    expect(spy).toHaveBeenCalledWith({
      paymentAddress: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddRefundInformation', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.feeProxyContractEth,
      'createAddRefundAddressAction',
    );

    ethFeeProxyContract.createExtensionsDataForAddRefundInformation({
      refundAddress: 'ethereum address',
    });

    expect(spy).toHaveBeenCalledWith({
      refundAddress: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddFeeInformation', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.feeProxyContractEth,
      'createAddFeeAction',
    );

    ethFeeProxyContract.createExtensionsDataForAddFeeInformation({
      feeAddress: 'ethereum address',
      feeAmount: '2000',
    });

    expect(spy).toHaveBeenCalledWith({
      feeAddress: 'ethereum address',
      feeAmount: '2000',
    });
  });

  it('should not throw when getBalance fail', async () => {
    expect(
      await ethFeeProxyContract.getBalance({ extensions: {} } as RequestLogicTypes.IRequest),
    ).toEqual({
      balance: null,
      error: {
        code: PaymentTypes.BALANCE_ERROR_CODE.WRONG_EXTENSION,
        message: 'The request does not have the extension : pn-eth-fee-proxy-contract',
      },
      events: [],
    });
  });

  it('can get the fees out of payment events', async () => {
    const mockRequest: RequestLogicTypes.IRequest = {
      creator: { type: IdentityTypes.TYPE.ETHEREUM_ADDRESS, value: '0x2' },
      currency: {
        network: 'private',
        type: RequestLogicTypes.CURRENCY.ETH,
        value: '0x9FBDa871d559710256a2502A2517b794B482Db40', // local ETH token
      },
      events: [],
      expectedAmount: '1000',
      extensions: {
        [ExtensionTypes.ID.PAYMENT_NETWORK_ETH_FEE_PROXY_CONTRACT]: {
          events: [],
          id: ExtensionTypes.ID.PAYMENT_NETWORK_ETH_FEE_PROXY_CONTRACT,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {
            feeAddress: '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef',
            feeAmount: '5',
            paymentAddress: '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
          },
          version: '0',
        },
      },
      extensionsData: [],
      requestId: '0x1',
      state: RequestLogicTypes.STATE.CREATED,
      timestamp: 0,
      version: '0.2',
    };

    const mockExtractBalanceAndEvents = () => {
      return Promise.resolve({
        balance: '1000',
        events: [
          // Wrong fee address
          {
            amount: '0',
            name: PaymentTypes.EVENTS_NAMES.PAYMENT,
            parameters: {
              block: 1,
              feeAddress: 'fee address',
              feeAmount: '5',
              to: '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
              txHash: '0xABC',
            },
            timestamp: 10,
          },
          // Correct fee address and a fee value
          {
            amount: '500',
            name: PaymentTypes.EVENTS_NAMES.PAYMENT,
            parameters: {
              block: 1,
              feeAddress: '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef',
              feeAmount: '5',
              to: '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
              txHash: '0xABCD',
            },
            timestamp: 11,
          },
          // No fee
          {
            amount: '500',
            name: PaymentTypes.EVENTS_NAMES.PAYMENT,
            parameters: {
              block: 1,
              feeAddress: '',
              feeAmount: '0',
              to: '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
              txHash: '0xABCDE',
            },
            timestamp: 12,
          },
        ],
      });
    };
    ethFeeProxyContract = new ETHFeeProxyContract({
      advancedLogic: mockAdvancedLogic,
      currencyManager,
    });
    ethFeeProxyContract.extractBalanceAndEvents = mockExtractBalanceAndEvents;

    const balance = await ethFeeProxyContract.getBalance(mockRequest);

    expect(balance.balance).toBe('1000');
    expect(
      mockRequest.extensions[ExtensionTypes.ID.PAYMENT_NETWORK_ETH_FEE_PROXY_CONTRACT].values
        .feeBalance.balance,
    ).toBe('5');
  });
});
