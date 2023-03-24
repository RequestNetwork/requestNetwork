import { ethers } from 'ethers';
import {
  AdvancedLogicTypes,
  CurrencyTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { CurrencyManager } from '@requestnetwork/currency';
import { ERC20__factory } from '@requestnetwork/smart-contracts/types';
import { AnyToERC20PaymentDetector, getTheGraphClient } from '../../src';
import { mocked } from 'ts-jest/utils';
import { mockAdvancedLogicBase } from '../utils';

jest.mock('../../src/thegraph/client');
const theGraphClientMock = mocked(getTheGraphClient(''));

let anyToErc20Proxy: AnyToERC20PaymentDetector;
const currencyManager = CurrencyManager.getDefault();

const createAddPaymentAddressAction = jest.fn();
const createAddRefundAddressAction = jest.fn();
const createCreationAction = jest.fn();
const createAddFeeAction = jest.fn();
const createAddPaymentInstructionAction = jest.fn();
const createAddRefundInstructionAction = jest.fn();

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  ...mockAdvancedLogicBase,
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
  } as any as AdvancedLogicTypes.IAdvancedLogicExtensions,
};

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('api/any/conversion-fee-proxy-contract', () => {
  beforeEach(() => {
    anyToErc20Proxy = new AnyToERC20PaymentDetector({
      advancedLogic: mockAdvancedLogic,
      currencyManager,
      getSubgraphClient: () => theGraphClientMock,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const testSuite = (network: CurrencyTypes.EvmChainName) => {
    it(`can createExtensionsDataForCreation on ${network}`, async () => {
      await anyToErc20Proxy.createExtensionsDataForCreation({
        paymentAddress: 'ethereum address',
        salt: 'ea3bc7caf64110ca',
        acceptedTokens: ['ethereum address2'],
        network: network,
        maxRateTimespan: 1000,
      });

      expect(createCreationAction).toHaveBeenCalledWith({
        feeAddress: undefined,
        feeAmount: undefined,
        paymentAddress: 'ethereum address',
        refundAddress: undefined,
        salt: 'ea3bc7caf64110ca',
        acceptedTokens: ['ethereum address2'],
        network: network,
        maxRateTimespan: 1000,
      });
    });

    it(`can createExtensionsDataForCreation with fee amount and address on ${network}`, async () => {
      await anyToErc20Proxy.createExtensionsDataForCreation({
        feeAddress: 'fee address',
        feeAmount: '2000',
        paymentAddress: 'ethereum address',
        salt: 'ea3bc7caf64110ca',
        acceptedTokens: ['ethereum address2'],
        network: network,
      });

      expect(createCreationAction).toHaveBeenCalledWith({
        feeAddress: 'fee address',
        feeAmount: '2000',
        paymentAddress: 'ethereum address',
        refundAddress: undefined,
        salt: 'ea3bc7caf64110ca',
        acceptedTokens: ['ethereum address2'],
        network: network,
      });
    });
  };

  testSuite('rinkeby');
  testSuite('goerli');

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
        message: 'The request does not have the extension: pn-any-to-erc20-proxy',
      },
      events: [],
    });
  });

  it('can get the fees out of payment events, and payment & refund work even with the wrong feeAddress while feeBalance sum only if feeAddress is fine', async () => {
    const mockRequest: RequestLogicTypes.IRequest = {
      creator: { type: IdentityTypes.TYPE.ETHEREUM_ADDRESS, value: '0x2' },
      currency: {
        type: RequestLogicTypes.CURRENCY.ISO4217,
        value: 'EUR',
      },
      events: [],
      expectedAmount: '1000',
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY]: {
          events: [],
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {
            feeAddress: '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef',
            feeAmount: '5',
            paymentAddress: '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
            refundAddress: '0x666666151EbEF6C7334FAD080c5704D77216b732',
            acceptedTokens: ['0x9FBDa871d559710256a2502A2517b794B482Db40'],
            network: 'rinkeby',
            salt: 'abcd',
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

    const mockExtractEvents = (eventName: PaymentTypes.EVENTS_NAMES) => {
      if (eventName === PaymentTypes.EVENTS_NAMES.PAYMENT) {
        return Promise.resolve({
          paymentEvents: [
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
          ],
        });
      }
      return Promise.resolve({
        paymentEvents: [
          // Wrong fee address
          {
            amount: '100',
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
        ],
      });
    };
    jest
      .spyOn(anyToErc20Proxy as any, 'extractEvents')
      .mockImplementation(mockExtractEvents as any);

    const balance = await anyToErc20Proxy.getBalance(mockRequest);
    expect(balance.error).toBeUndefined();
    // Payments: 100 + 500 + 500
    // Refunds: 100 + 100 + 100
    expect(balance.balance).toBe('800');
    // Payments: 5 (correct fee address)
    // Refunds: 5 (correct fee address)
    expect(
      mockRequest.extensions[ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY].values.feeBalance
        .balance,
    ).toBe('10');
  });

  it('can retrieve the decimals from a contract if unknown', async () => {
    const spy = jest.spyOn(ERC20__factory, 'connect').mockImplementation(() => {
      return {
        decimals: () => Promise.resolve(42),
        symbol: () => Promise.resolve('FAKE'),
      } as any;
    });

    expect(
      await (anyToErc20Proxy as any).getCurrency({
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

  it('should get gas info from the graph', async () => {
    const mockRequest: RequestLogicTypes.IRequest = {
      creator: { type: IdentityTypes.TYPE.ETHEREUM_ADDRESS, value: '0x2' },
      currency: {
        type: RequestLogicTypes.CURRENCY.ISO4217,
        value: 'EUR',
      },
      events: [],
      expectedAmount: '100',
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY]: {
          events: [],
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {
            feeAddress: '0x35d0e078755Cd84D3E0656cAaB417Dee1d7939c7',
            feeAmount: '0',
            paymentAddress: '0x98F32171D88F9511b397809534eE42ACFCe4F640',
            salt: 'a9c4f042874e24b7',
            network: 'rinkeby',
            acceptedTokens: ['0xFab46E002BbF0b4509813474841E0716E6730136'],
          },
          version: '0.1.0',
        },
      },
      extensionsData: [],
      requestId: '01cbe434720b58051f5150ec8d414aead2f1e04fca4d69c9401da0cc3e733f1646',
      state: RequestLogicTypes.STATE.CREATED,
      timestamp: 0,
      version: '0.2',
    };

    theGraphClientMock.GetAnyToFungiblePayments.mockResolvedValue({
      payments: [
        {
          amount: '100000000',
          block: 8404818,
          txHash: '0xc672ce6704182e710b92919e88b38904a27fd17ea1036269147e4ddff352ab4d',
          feeAmount: '0',
          feeAddress: '0x35d0e078755cd84d3e0656caab417dee1d7939c7',
          from: '0x98f32171d88f9511b397809534ee42acfce4f640',
          timestamp: 1618306072,
          tokenAddress: '0xfab46e002bbf0b4509813474841e0716e6730136',
          currency: '0x17b4158805772ced11225e77339f90beb5aae968',
          amountInCrypto: '1190282493338176476',
          feeAmountInCrypto: '0',
          maxRateTimespan: 0,
          gasUsed: '130259',
          gasPrice: '73500000000',
          contractAddress: '0x78334ed20da456e89cd7e5a90de429d705f5bc88',
          to: '0x98f32171d88f9511b397809534ee42acfce4f640',
        },
      ],
    });

    const balance = await anyToErc20Proxy.getBalance(mockRequest);
    expect(balance.error).toBeUndefined();
    const parameters = balance.events[0].parameters as any;
    expect(parameters.gasUsed).toBe('130259');
    expect(parameters.gasPrice).toBe('73500000000');
  });
});
