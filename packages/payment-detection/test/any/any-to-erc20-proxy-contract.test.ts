import { ethers } from 'ethers';
import {
  AdvancedLogicTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { CurrencyManager } from '@requestnetwork/currency';
import { ERC20__factory } from '@requestnetwork/smart-contracts/types';
import { AnyToERC20PaymentDetector } from '../../src/any/any-to-erc20-proxy';

let anyToErc20Proxy: AnyToERC20PaymentDetector;
const currencyManager = CurrencyManager.getDefault();

const createAddPaymentAddressAction = jest.fn();
const createAddRefundAddressAction = jest.fn();
const createCreationAction = jest.fn();
const createAddFeeAction = jest.fn();
const createAddPaymentInstructionAction = jest.fn();
const createAddRefundInstructionAction = jest.fn();

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions(): any {
    return;
  },
  extensions: {
    anyToErc20Proxy: {
      createAddPaymentAddressAction,
      createAddRefundAddressAction,
      createCreationAction,
      createAddFeeAction,
      // inherited from declarative
      createAddPaymentInstructionAction,
      createAddRefundInstructionAction,
    },
  },
};

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('api/any/conversion-fee-proxy-contract', () => {
  beforeEach(() => {
    anyToErc20Proxy = new AnyToERC20PaymentDetector({
      advancedLogic: mockAdvancedLogic,
      currencyManager,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('can createExtensionsDataForCreation', async () => {
    await anyToErc20Proxy.createExtensionsDataForCreation({
      paymentAddress: 'ethereum address',
      salt: 'ea3bc7caf64110ca',
      acceptedTokens: ['ethereum address2'],
      network: 'rinkeby',
      maxRateTimespan: 1000,
    });

    expect(createCreationAction).toHaveBeenCalledWith({
      feeAddress: undefined,
      feeAmount: undefined,
      paymentAddress: 'ethereum address',
      refundAddress: undefined,
      salt: 'ea3bc7caf64110ca',
      acceptedTokens: ['ethereum address2'],
      network: 'rinkeby',
      maxRateTimespan: 1000,
    });
  });

  it('can createExtensionsDataForCreation with fee amount and address', async () => {
    await anyToErc20Proxy.createExtensionsDataForCreation({
      feeAddress: 'fee address',
      feeAmount: '2000',
      paymentAddress: 'ethereum address',
      salt: 'ea3bc7caf64110ca',
      acceptedTokens: ['ethereum address2'],
      network: 'rinkeby',
    });

    expect(createCreationAction).toHaveBeenCalledWith({
      feeAddress: 'fee address',
      feeAmount: '2000',
      paymentAddress: 'ethereum address',
      refundAddress: undefined,
      salt: 'ea3bc7caf64110ca',
      acceptedTokens: ['ethereum address2'],
      network: 'rinkeby',
    });
  });

  it('can createExtensionsDataForCreation without salt', async () => {
    await anyToErc20Proxy.createExtensionsDataForCreation({
      paymentAddress: 'ethereum address',
    });

    // Can't check parameters since salt is generated in createExtensionsDataForCreation
    expect(createCreationAction).toHaveBeenCalled();
  });

  it('can createExtensionsDataForAddPaymentAddress', async () => {
    anyToErc20Proxy.createExtensionsDataForAddPaymentAddress({
      paymentAddress: 'ethereum address',
    });

    expect(createAddPaymentAddressAction).toHaveBeenCalledWith({
      paymentAddress: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddPaymentInformation', async () => {
    anyToErc20Proxy.createExtensionsDataForAddPaymentInformation({
      paymentInfo: 'ethereum address',
    });

    expect(createAddPaymentInstructionAction).toHaveBeenCalledWith({
      paymentInfo: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddRefundAddress', async () => {
    anyToErc20Proxy.createExtensionsDataForAddRefundAddress({
      refundAddress: 'ethereum address',
    });

    expect(createAddRefundAddressAction).toHaveBeenCalledWith({
      refundAddress: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddRefundInformation', async () => {
    anyToErc20Proxy.createExtensionsDataForAddRefundInformation({
      refundInfo: 'ethereum address',
    });

    expect(createAddRefundInstructionAction).toHaveBeenCalledWith({
      refundInfo: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddFeeInformation', async () => {
    anyToErc20Proxy.createExtensionsDataForAddFeeInformation({
      feeAddress: 'ethereum address',
      feeAmount: '2000',
    });

    expect(createAddFeeAction).toHaveBeenCalledWith({
      feeAddress: 'ethereum address',
      feeAmount: '2000',
    });
  });

  it('should not throw when getBalance fail', async () => {
    expect(
      await anyToErc20Proxy.getBalance({ extensions: {} } as RequestLogicTypes.IRequest),
    ).toEqual({
      balance: null,
      error: {
        code: PaymentTypes.BALANCE_ERROR_CODE.WRONG_EXTENSION,
        message: 'The request does not have the extension : pn-any-to-erc20-proxy',
      },
      events: [],
    });
  });

  it('can get the fees out of payment events', async () => {
    const mockRequest: RequestLogicTypes.IRequest = {
      creator: { type: IdentityTypes.TYPE.ETHEREUM_ADDRESS, value: '0x2' },
      currency: {
        type: RequestLogicTypes.CURRENCY.ISO4217,
        value: 'EUR',
      },
      events: [],
      expectedAmount: '1000',
      extensions: {
        [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY]: {
          events: [],
          id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {
            feeAddress: '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef',
            feeAmount: '5',
            paymentAddress: '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
            refundAddress: '0x666666151EbEF6C7334FAD080c5704D77216b732',
            acceptedTokens: ['0x9FBDa871d559710256a2502A2517b794B482Db40'],
            network: 'rinkeby',
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

    const mockExtractBalanceAndEvents = (
      _request: RequestLogicTypes.IRequest,
      _salt: string,
      _toAddress: string,
      eventName: PaymentTypes.EVENTS_NAMES,
    ) => {
      if (eventName === PaymentTypes.EVENTS_NAMES.PAYMENT) {
        return Promise.resolve([
          // Wrong fee address
          {
            amount: '100',
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
          // Payment token not accepted
          {
            amount: '500',
            name: PaymentTypes.EVENTS_NAMES.PAYMENT,
            parameters: {
              block: 1,
              feeAddress: '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef',
              feeAmount: '5',
              to: '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
              txHash: '0xABCD',
              //tokenAddress: ['ethereum address2'],
            },
            timestamp: 11,
          },
        ]);
      }
      return Promise.resolve([
        // Wrong fee address
        {
          amount: '1000',
          name: PaymentTypes.EVENTS_NAMES.REFUND,
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
          amount: '100',
          name: PaymentTypes.EVENTS_NAMES.REFUND,
          parameters: {
            block: 1,
            feeAddress: '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef',
            feeAmount: '5',
            to: '0x666666151EbEF6C7334FAD080c5704D77216b732',
            txHash: '0xABCD',
          },
          timestamp: 11,
        },
        // No fee
        {
          amount: '100',
          name: PaymentTypes.EVENTS_NAMES.REFUND,
          parameters: {
            block: 1,
            feeAddress: '',
            feeAmount: '0',
            to: '0x666666151EbEF6C7334FAD080c5704D77216b732',
            txHash: '0xABCDE',
          },
          timestamp: 12,
        },
      ]);
    };
    anyToErc20Proxy = new AnyToERC20PaymentDetector({
      advancedLogic: mockAdvancedLogic,
      currencyManager,
    });
    jest.spyOn(anyToErc20Proxy, 'extractEvents').mockImplementation(mockExtractBalanceAndEvents);

    const balance = await anyToErc20Proxy.getBalance(mockRequest);
    expect(balance.balance).toBe('800');
    expect(
      mockRequest.extensions[ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY].values.feeBalance
        .balance,
    ).toBe('15');
  });

  it('can retrieve the decimals from a contract if unknown', async () => {
    const anyToErc20Proxy = new AnyToERC20PaymentDetector({
      advancedLogic: mockAdvancedLogic,
      currencyManager,
    }) as any;

    const spy = jest.spyOn(ERC20__factory, 'connect').mockImplementation(() => {
      return {
        decimals: () => Promise.resolve(42),
        symbol: () => Promise.resolve('FAKE'),
      } as any;
    });

    expect(
      await anyToErc20Proxy.getCurrency({
        type: 'ERC20',
        network: 'mainnet',
        value: ethers.constants.AddressZero,
      }),
    ).toMatchObject({
      decimals: 42,
      symbol: 'FAKE',
    });

    expect(spy).toHaveBeenCalledWith(ethers.constants.AddressZero, expect.anything());
  });
});
