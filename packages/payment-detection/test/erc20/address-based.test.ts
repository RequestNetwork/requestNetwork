import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { ERC20AddressBasedPaymentDetector } from '../../src/erc20';
import { mockAdvancedLogicBase } from '../utils';
import { AdvancedLogic } from '@requestnetwork/advanced-logic';
import { CurrencyManager } from '@requestnetwork/currency';

jest.setTimeout(10000);

let erc20AddressedBased: ERC20AddressBasedPaymentDetector;

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  ...mockAdvancedLogicBase,
  extensions: {
    addressBasedErc20: {
      createAddPaymentAddressAction: jest.fn(),
      createAddRefundAddressAction: jest.fn(),
      createCreationAction: jest.fn(),
    } as any,
  } as AdvancedLogicTypes.IAdvancedLogicExtensions,
};

// Most of the tests are done as integration tests in ../index.test.ts
/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('api/erc20/address-based', () => {
  beforeEach(() => {
    erc20AddressedBased = new ERC20AddressBasedPaymentDetector({
      advancedLogic: mockAdvancedLogic,
    });
  });

  it('can createExtensionsDataForCreation', async () => {
    const spy = jest.spyOn(mockAdvancedLogic.extensions.addressBasedErc20, 'createCreationAction');

    await erc20AddressedBased.createExtensionsDataForCreation({
      paymentAddress: 'ethereum address',
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('can createExtensionsDataForAddPaymentInformation', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.addressBasedErc20,
      'createAddPaymentAddressAction',
    );

    erc20AddressedBased.createExtensionsDataForAddPaymentInformation({
      paymentAddress: 'ethereum address',
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('can createExtensionsDataForAddRefundInformation', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.addressBasedErc20,
      'createAddRefundAddressAction',
    );

    erc20AddressedBased.createExtensionsDataForAddRefundInformation({
      refundAddress: 'ethereum address',
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('can getBalance on a localhost request', async () => {
    // This test relies on the transfer of 10 TestERC20 in the contract constructor
    const mockRequest = {
      creator: { type: '', value: '0x2' },
      currency: {
        network: 'private',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x9FBDa871d559710256a2502A2517b794B482Db40', // local ERC20 token
      },
      events: [],
      expectedAmount: '0',
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_ADDRESS_BASED]: {
          events: [],
          id: '0',
          type: 'none',
          values: {
            paymentAddress: '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
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

    const balance = await erc20AddressedBased.getBalance(mockRequest as RequestLogicTypes.IRequest);

    expect(balance.balance).toBe('10');
    expect(balance.events).toHaveLength(1);
    expect(balance.events[0].name).toBe(PaymentTypes.EVENTS_NAMES.PAYMENT);
    expect(balance.events[0].amount).toBe('10');
    expect(typeof balance.events[0].timestamp).toBe('number');
    expect(balance.events[0].parameters!.to).toBe('0xf17f52151EbEF6C7334FAD080c5704D77216b732');
    expect(balance.events[0].parameters!.from).toBe('0x627306090abaB3A6e1400e9345bC60c78a8BEf57');
    expect(typeof balance.events[0].parameters!.block).toBe('number');
    expect(typeof balance.events[0].parameters!.txHash).toBe('string');
  });

  it('should not throw when getBalance fail', async () => {
    erc20AddressedBased = new ERC20AddressBasedPaymentDetector({
      advancedLogic: new AdvancedLogic(CurrencyManager.getDefault()),
    });
    await expect(
      erc20AddressedBased.getBalance({
        currency: { network: 'wrong' },
      } as unknown as RequestLogicTypes.IRequest),
    ).resolves.not.toThrowError();
  });
});
