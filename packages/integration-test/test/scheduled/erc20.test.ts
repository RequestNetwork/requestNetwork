// tslint:disable: no-magic-numbers
// tslint:disable: no-invalid-this
import { Erc20PaymentNetwork } from '@requestnetwork/payment-detection';
import ERC20AddressBasedInfoRetriever from '@requestnetwork/payment-detection/src/erc20/address-based-info-retriever';

import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { account, tokens } from './erc20-mainnet-test-data';

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions(): any {
    return;
  },
  extensions: {
    addressBasedErc20: {
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

describe('ERC20 detection test-suite', () => {
  describe('check mainnet payment detection', () => {
    Object.entries(tokens).forEach(([symbol, { address, amount }]) => {
      it(`can detect the balance of ${symbol}`, async () => {
        const infoRetriever = new ERC20AddressBasedInfoRetriever(
          address,
          account,
          PaymentTypes.EVENTS_NAMES.PAYMENT,
          'mainnet',
        );
        const events = await infoRetriever.getTransferEvents();

        // if this assert fails it means this address received another transaction
        expect(events).toHaveLength(1);
        const event = events[0];
        expect(event.name).toBe('payment');
        expect(event.amount).toBe(amount);
        expect(typeof event.timestamp).toBe('number');
        expect(event.parameters!.to).toBe(account);
        expect(typeof event.parameters!.from).toBe('string');
        expect(typeof event.parameters!.block).toBe('number');
        expect(typeof event.parameters!.txHash).toBe('string');
      });
    });
  });

  it('can getBalance on a mainnet request', async () => {
    const erc20AddressedBased = new Erc20PaymentNetwork.AddressBased({
      advancedLogic: mockAdvancedLogic,
    });
    const mockRequest = {
      creator: { type: '', value: '0x2' },
      currency: {
        network: 'mainnet',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359', // SAI
      },
      events: [],
      expectedAmount: '0',
      extensions: {
        [ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_ADDRESS_BASED]: {
          events: [],
          id: '0',
          type: 'none',
          values: {
            paymentAddress: '0x6A08D2C8f251AF1f17B5943f7f7Bb7078c50e29A',
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

    expect(balance.balance).toBe('510000000000000000');
    expect(balance.events).toHaveLength(1);
    expect(balance.events[0].name).toBe('payment');
    expect(balance.events[0].parameters!.to).toBe('0x6A08D2C8f251AF1f17B5943f7f7Bb7078c50e29A');
    expect(balance.events[0].parameters!.from).toBe('0x708416775B69E3D3d6c634FfdF91778A161d30Bd');
    expect(balance.events[0].amount).toBe('510000000000000000');
    expect(typeof balance.events[0].timestamp).toBe('number');
  });
});
