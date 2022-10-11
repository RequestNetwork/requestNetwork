import {
  AdvancedLogicTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { CurrencyManager } from '@requestnetwork/currency';
import { ERC20FeeProxyPaymentDetector } from '../../src/erc20/fee-proxy-contract';
let erc20FeeProxyContract: ERC20FeeProxyPaymentDetector;

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
    feeProxyContractErc20: {
      supportedNetworks: ['mainnet', 'private', 'rinkeby', 'goerli'],
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

const currencyManager = CurrencyManager.getDefault();

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('api/erc20/fee-proxy-contract', () => {
  beforeEach(() => {
    erc20FeeProxyContract = new ERC20FeeProxyPaymentDetector({
      advancedLogic: mockAdvancedLogic,
      currencyManager,
      getSubgraphClient: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('can createExtensionsDataForCreation', async () => {
    await erc20FeeProxyContract.createExtensionsDataForCreation({
      paymentAddress: 'ethereum address',
      salt: 'ea3bc7caf64110ca',
    });

    expect(createCreationAction).toHaveBeenCalledWith({
      feeAddress: undefined,
      feeAmount: undefined,
      paymentAddress: 'ethereum address',
      refundAddress: undefined,
      salt: 'ea3bc7caf64110ca',
    });
  });

  it('can createExtensionsDataForCreation with fee amount and address', async () => {
    await erc20FeeProxyContract.createExtensionsDataForCreation({
      feeAddress: 'fee address',
      feeAmount: '2000',
      paymentAddress: 'ethereum address',
      salt: 'ea3bc7caf64110ca',
    });

    expect(createCreationAction).toHaveBeenCalledWith({
      feeAddress: 'fee address',
      feeAmount: '2000',
      paymentAddress: 'ethereum address',
      refundAddress: undefined,
      salt: 'ea3bc7caf64110ca',
    });
  });

  it('can createExtensionsDataForCreation without salt', async () => {
    await erc20FeeProxyContract.createExtensionsDataForCreation({
      paymentAddress: 'ethereum address',
    });

    // Can't check parameters since salt is generated in createExtensionsDataForCreation
    expect(createCreationAction).toHaveBeenCalled();
  });

  it('can createExtensionsDataForAddPaymentInformation', async () => {
    erc20FeeProxyContract.createExtensionsDataForAddPaymentInformation({
      paymentInfo: 'ethereum address',
    });

    expect(createAddPaymentInstructionAction).toHaveBeenCalledWith({
      paymentInfo: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddPaymentAddress', async () => {
    erc20FeeProxyContract.createExtensionsDataForAddPaymentAddress({
      paymentAddress: 'ethereum address',
    });

    expect(createAddPaymentAddressAction).toHaveBeenCalledWith({
      paymentAddress: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddRefundAddress', async () => {
    erc20FeeProxyContract.createExtensionsDataForAddRefundAddress({
      refundAddress: 'ethereum address',
    });

    expect(createAddRefundAddressAction).toHaveBeenCalledWith({
      refundAddress: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddRefundInformation', async () => {
    erc20FeeProxyContract.createExtensionsDataForAddRefundInformation({
      refundInfo: 'ethereum address',
    });

    expect(createAddRefundInstructionAction).toHaveBeenCalledWith({
      refundInfo: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddFeeInformation', async () => {
    erc20FeeProxyContract.createExtensionsDataForAddFeeInformation({
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
      await erc20FeeProxyContract.getBalance({ extensions: {} } as RequestLogicTypes.IRequest),
    ).toEqual({
      balance: null,
      error: {
        code: PaymentTypes.BALANCE_ERROR_CODE.WRONG_EXTENSION,
        message: 'The request does not have the extension: pn-erc20-fee-proxy-contract',
      },
      events: [],
    });
  });

  it('can get the fees out of payment events, and payment & refund work even with the wrong feeAddress while feeBalance sum only if feeAddress is fine', async () => {
    const mockRequest: RequestLogicTypes.IRequest = {
      creator: { type: IdentityTypes.TYPE.ETHEREUM_ADDRESS, value: '0x2' },
      currency: {
        network: 'private',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x9FBDa871d559710256a2502A2517b794B482Db40', // local ERC20 token
      },
      events: [],
      expectedAmount: '1000',
      extensions: {
        [ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT]: {
          events: [],
          id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {
            feeAddress: '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef',
            feeAmount: '5',
            paymentAddress: '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
            refundAddress: '0xrefundAddress',
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

    const mockExtractTransferEvents = (eventName: any) => {
      if (eventName === 'refund') {
        return Promise.resolve({
          paymentEvents: [
            // wrong fee address
            {
              amount: '5',
              name: PaymentTypes.EVENTS_NAMES.REFUND,
              parameters: {
                block: 1,
                feeAddress: 'fee address',
                feeAmount: '0',
                to: '0xrefundAddress',
              },
            },
            // valid refund
            {
              amount: '10',
              name: PaymentTypes.EVENTS_NAMES.REFUND,
              parameters: {
                block: 1,
                feeAddress: '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef',
                feeAmount: '2',
                to: '0xrefundAddress',
              },
            },
          ],
        });
      }
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
            amount: '400',
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
    erc20FeeProxyContract = new ERC20FeeProxyPaymentDetector({
      advancedLogic: mockAdvancedLogic,
      currencyManager,
      getSubgraphClient: jest.fn(),
    });

    jest
      .spyOn(erc20FeeProxyContract as any, 'extractEvents')
      .mockImplementation(mockExtractTransferEvents);

    const balance = await erc20FeeProxyContract.getBalance(mockRequest);

    expect(balance.error).toBeUndefined();
    // 100 + 500 + 400 (3 payments) - 10 - 5 (2 refunds) = 985
    expect(balance.balance).toBe('985');
    // Payments: 5 (correct fee address)
    // Refunds: 2 (correct fee address)
    expect(
      mockRequest.extensions[ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT].values
        .feeBalance.balance,
    ).toBe('7');
  });

  it('should have gasFee & gasUsed in the payment event', async () => {
    const mockRequest: RequestLogicTypes.IRequest = {
      creator: { type: IdentityTypes.TYPE.ETHEREUM_ADDRESS, value: '0x2' },
      currency: {
        network: 'rinkeby',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0xFab46E002BbF0b4509813474841E0716E6730136', // local ERC20 token
      },
      events: [],
      expectedAmount: '1000000000000000000',
      extensions: {
        [ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT]: {
          events: [
            {
              name: 'create',
              parameters: {
                feeAddress: '0x35d0e078755Cd84D3E0656cAaB417Dee1d7939c7',
                feeAmount: '1000000000000000',
                paymentAddress: '0x6d69c636c825263Aa71a3D86D32D0E4897a7a580',
                salt: '4f43d8b97ae1f63d',
              },
              timestamp: 1655883560,
            },
          ],
          id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {
            feeAddress: '0x35d0e078755Cd84D3E0656cAaB417Dee1d7939c7',
            feeAmount: '1000000000000000',
            paymentAddress: '0x6d69c636c825263Aa71a3D86D32D0E4897a7a580',
            salt: '4f43d8b97ae1f63d',
          },
          version: '0.2.0',
        },
      },
      extensionsData: [],
      requestId: '01036165cd1608f6ec52acc6349535c44fec6865cfa930d321394db28a69dfd950',
      state: RequestLogicTypes.STATE.CREATED,
      timestamp: 0,
      version: '0.2',
    };

    erc20FeeProxyContract = new ERC20FeeProxyPaymentDetector({
      advancedLogic: mockAdvancedLogic,
      currencyManager,
      getSubgraphClient: jest.fn(),
    });

    const mockExtractEvents = (eventName: any) => {
      if (eventName !== 'payment') return Promise.resolve({ paymentEvents: [] });

      return Promise.resolve({
        paymentEvents: [
          {
            amount: '1000000000000000000',
            name: 'payment',
            parameters: {
              to: '0x6d69c636c825263Aa71a3D86D32D0E4897a7a580',
              txHash: '0xb3355cf69d9ef047b73ca13eb7aeb06ce5e5b8658a1baac9b2bc743190e65fda',
              block: 10897333,
              feeAddress: '0x35d0e078755Cd84D3E0656cAaB417Dee1d7939c7',
              feeAmount: '1000000000000000',
              gasUsed: '79220',
              gasPrice: '1500000011',
            },
            timestamp: 1655912433,
          },
        ],
        escrowEvents: [],
      });
    };
    jest.spyOn(erc20FeeProxyContract as any, 'extractEvents').mockImplementation(mockExtractEvents);

    const balance = await erc20FeeProxyContract.getBalance(mockRequest);

    expect(balance.error).toBeUndefined();
    expect(balance.events.length).toEqual(1);
    const parameters = balance.events[0].parameters as any;
    expect(parameters.gasUsed).toBe('79220');
    expect(parameters.gasPrice).toBe('1500000011');
  });
});
