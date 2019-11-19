// tslint:disable: no-magic-numbers
// tslint:disable: no-invalid-this
import ERC20AddressedBased from '@requestnetwork/request-client.js/src/api/payment-network/erc20/address-based';
import ERC20InfoRetriever from '@requestnetwork/request-client.js/src/api/payment-network/erc20/info-retriever';
import { AdvancedLogicTypes, ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import { account, tokens } from './erc20-mainnet-test-data';

import { expect } from 'chai';
import 'mocha';

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

describe('ERC20 detection test-suite', function(): void {
  this.timeout(10000);

  describe('check mainnet payment detection', () => {
    Object.entries(tokens).forEach(([symbol, { address, amount, decimals }]) => {
      it(`can detect the balance of ${symbol}`, async () => {
        const balanceObject = await ERC20InfoRetriever(address, account, 'mainnet');

        expect(balanceObject.decimals).to.be.equal(decimals);
        // if this assert fails it means this address received another transaction
        expect(balanceObject.tokenEvents).to.have.lengthOf(1);
        const event = balanceObject.tokenEvents[0];
        delete event.from;
        expect(event).to.deep.equal({
          to: account,
          value: amount,
        });
      });
    });
  });

  it('can getBalance on a mainnet request', async () => {
    const erc20AddressedBased = new ERC20AddressedBased({ advancedLogic: mockAdvancedLogic });
    const mockRequest = {
      creator: { type: '', value: '0x2' },
      currency: {
        network: 'mainnet',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359', // DAI
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

    expect(balance.balance).to.be.equal('510000000000000000');
    expect(balance.events).to.have.lengthOf(1);
    expect(balance.events[0].name).to.be.equal('payment');
    expect(balance.events[0].parameters.to).to.be.equal(
      '0x6A08D2C8f251AF1f17B5943f7f7Bb7078c50e29A',
    );
    expect(balance.events[0].parameters.from).to.be.equal(
      '0x708416775B69E3D3d6c634FfdF91778A161d30Bd',
    );
    expect(balance.events[0].parameters.value).to.be.equal('510000000000000000');
  });
});
