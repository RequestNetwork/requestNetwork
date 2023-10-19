import {
  AdvancedLogicTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { CurrencyManager } from '@requestnetwork/currency';
import { Erc20PaymentNetwork } from '../../src.js';
import { mockAdvancedLogicBase } from '../utils.js';

let erc20FeeProxyDetector: Erc20PaymentNetwork.ERC20FeeProxyPaymentDetector;

const createAddPaymentAddressAction = jest.fn();
const createAddRefundAddressAction = jest.fn();
const createCreationAction = jest.fn();
const createAddFeeAction = jest.fn();
const createAddPaymentInstructionAction = jest.fn();
const createAddRefundInstructionAction = jest.fn();

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  ...mockAdvancedLogicBase,
  extensions: {
    feeProxyContractErc20: {
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

const currencyManager = CurrencyManager.getDefault();

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('api/erc20/escrow-proxy-contract', () => {
  beforeEach(() => {
    erc20FeeProxyDetector = new Erc20PaymentNetwork.ERC20FeeProxyPaymentDetector({
      advancedLogic: mockAdvancedLogic,
      currencyManager,
      getSubgraphClient: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('can createExtensionsDataForCreation', async () => {
    await erc20FeeProxyDetector.createExtensionsDataForCreation({
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
    await erc20FeeProxyDetector.createExtensionsDataForCreation({
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
    await erc20FeeProxyDetector.createExtensionsDataForCreation({
      paymentAddress: 'ethereum address',
    });

    // Can't check parameters since salt is generated in createExtensionsDataForCreation
    expect(createCreationAction).toHaveBeenCalled();
  });

  it('can createExtensionsDataForAddPaymentInformation', async () => {
    erc20FeeProxyDetector.createExtensionsDataForAddPaymentInformation({
      paymentInfo: 'ethereum address',
    });

    expect(createAddPaymentInstructionAction).toHaveBeenCalledWith({
      paymentInfo: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddPaymentAddress', async () => {
    erc20FeeProxyDetector.createExtensionsDataForAddPaymentAddress({
      paymentAddress: 'ethereum address',
    });

    expect(createAddPaymentAddressAction).toHaveBeenCalledWith({
      paymentAddress: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddRefundAddress', async () => {
    erc20FeeProxyDetector.createExtensionsDataForAddRefundAddress({
      refundAddress: 'ethereum address',
    });

    expect(createAddRefundAddressAction).toHaveBeenCalledWith({
      refundAddress: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddRefundInformation', async () => {
    erc20FeeProxyDetector.createExtensionsDataForAddRefundInformation({
      refundInfo: 'ethereum address',
    });

    expect(createAddRefundInstructionAction).toHaveBeenCalledWith({
      refundInfo: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddFeeInformation', async () => {
    erc20FeeProxyDetector.createExtensionsDataForAddFeeInformation({
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
      await erc20FeeProxyDetector.getBalance({ extensions: {} } as RequestLogicTypes.IRequest),
    ).toEqual({
      balance: null,
      error: {
        code: PaymentTypes.BALANCE_ERROR_CODE.WRONG_EXTENSION,
        message: 'The request does not have the extension: pn-erc20-fee-proxy-contract',
      },
      events: [],
    });
  });

  it('can get the fees out of payment events', async () => {
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
        [ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT]: {
          events: [],
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
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
            // wrong fee address, but still counts as refund
            {
              amount: '10',
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
                feeAmount: '0',
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
    erc20FeeProxyDetector = new Erc20PaymentNetwork.ERC20FeeProxyPaymentDetector({
      advancedLogic: mockAdvancedLogic,
      currencyManager,
      getSubgraphClient: jest.fn(),
    });

    jest
      .spyOn(erc20FeeProxyDetector as any, 'extractEvents')
      .mockImplementation(mockExtractTransferEvents);

    const balance = await erc20FeeProxyDetector.getBalance(mockRequest);

    expect(balance.error).toBeUndefined();
    // 500 + 500 + 100 (3 payments) - 10 - 10 (2 refunds) = 1100 - 20 = 1080
    expect(balance.balance).toBe('1080');
    expect(
      mockRequest.extensions[ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT].values
        .feeBalance.balance,
    ).toBe('5');
  });
});
