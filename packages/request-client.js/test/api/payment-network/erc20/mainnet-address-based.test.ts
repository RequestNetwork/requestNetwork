import { AdvancedLogicTypes, ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import ERC20AddressedBased from '../../../../src/api/payment-network/erc20/mainnet-address-based';
import * as Types from '../../../../src/types';

import 'chai';
import 'mocha';

const chai = require('chai');
const spies = require('chai-spies');
const expect = chai.expect;
chai.use(spies);
const sandbox = chai.spy.sandbox();

let erc20AddressedBased: ERC20AddressedBased;

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

// Most of the tests are done as integration tests in ../index.test.ts
/* tslint:disable:no-unused-expression */
describe('api/erc20/mainnet-address-based', () => {
  beforeEach(() => {
    sandbox.restore();
    erc20AddressedBased = new ERC20AddressedBased(mockAdvancedLogic);
  });

  it('can createExtensionsDataForCreation', async () => {
    const spy = sandbox.on(mockAdvancedLogic.extensions.addressBasedErc20, 'createCreationAction');

    erc20AddressedBased.createExtensionsDataForCreation({ paymentAddress: 'ethereum address' });

    expect(spy).to.have.been.called.once;
  });

  it('can createExtensionsDataForAddPaymentInformation', async () => {
    const spy = sandbox.on(
      mockAdvancedLogic.extensions.addressBasedErc20,
      'createAddPaymentAddressAction',
    );

    erc20AddressedBased.createExtensionsDataForAddPaymentInformation({
      paymentAddress: 'ethereum address',
    });

    expect(spy).to.have.been.called.once;
  });

  it('can createExtensionsDataForAddRefundInformation', async () => {
    const spy = sandbox.on(
      mockAdvancedLogic.extensions.addressBasedErc20,
      'createAddRefundAddressAction',
    );

    erc20AddressedBased.createExtensionsDataForAddRefundInformation({
      refundAddress: 'ethereum address',
    });

    expect(spy).to.have.been.called.once;
  });

  it('can getBalance on a request', async () => {
    const mockRequest = {
      creator: { type: '', value: '0x2' },
      currency: {
        network: 'mainnet',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359', // DAI
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
    expect(balance.events[0].name).to.be.equal(Types.EVENTS_NAMES.PAYMENT);
    expect(balance.events[0].parameters.to).to.be.equal(
      '0x6A08D2C8f251AF1f17B5943f7f7Bb7078c50e29A',
    );
    expect(balance.events[0].parameters.from).to.be.equal(
      '0x708416775B69E3D3d6c634FfdF91778A161d30Bd',
    );
    expect(balance.events[0].parameters.value).to.be.equal('510000000000000000');
  }).timeout(5000);
});
