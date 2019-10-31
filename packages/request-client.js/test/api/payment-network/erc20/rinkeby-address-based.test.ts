import { AdvancedLogicTypes, ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import RinkebyErc20AddressBased from '../../../../src/api/payment-network/erc20/rinkeby-address-based';
import * as Types from '../../../../src/types';

import 'chai';
import 'mocha';

const chai = require('chai');
const spies = require('chai-spies');
const expect = chai.expect;
chai.use(spies);
const sandbox = chai.spy.sandbox();

let erc20AddressedBased: RinkebyErc20AddressBased;

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions(): any {
    return;
  },
  extensions: {
    addressBasedRinkebyErc20: {
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
describe('api/erc20/rinkeby-address-based', () => {
  beforeEach(() => {
    sandbox.restore();
    erc20AddressedBased = new RinkebyErc20AddressBased(mockAdvancedLogic);
  });

  it('can createExtensionsDataForCreation', async () => {
    const spy = sandbox.on(
      mockAdvancedLogic.extensions.addressBasedRinkebyErc20,
      'createCreationAction',
    );

    erc20AddressedBased.createExtensionsDataForCreation({ paymentAddress: 'ethereum address' });

    expect(spy).to.have.been.called.once;
  });

  it('can createExtensionsDataForAddPaymentInformation', async () => {
    const spy = sandbox.on(
      mockAdvancedLogic.extensions.addressBasedRinkebyErc20,
      'createAddPaymentAddressAction',
    );

    erc20AddressedBased.createExtensionsDataForAddPaymentInformation({
      paymentAddress: 'ethereum address',
    });

    expect(spy).to.have.been.called.once;
  });

  it('can createExtensionsDataForAddRefundInformation', async () => {
    const spy = sandbox.on(
      mockAdvancedLogic.extensions.addressBasedRinkebyErc20,
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
        network: 'rinkeby',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0xFab46E002BbF0b4509813474841E0716E6730136', // FAU rinkeby token
      },
      events: [],
      expectedAmount: '0',
      extensions: {
        [ExtensionTypes.ID.PAYMENT_NETWORK_RINKEBY_ERC20_ADDRESS_BASED]: {
          events: [],
          id: '',
          type: '',
          values: {
            paymentAddress: '0x6A08D2C8f251AF1f17B5943f7f7Bb7078c50e29A',
          },
          version: '',
        },
      },
      extensionsData: [],
      requestId: '',
      state: '',
      timestamp: 0,
      version: '',
    };

    const balance = await erc20AddressedBased.getBalance(mockRequest as RequestLogicTypes.IRequest);

    expect(balance.balance).to.be.equal('1000000000000000000');
    expect(balance.events).to.have.lengthOf(1);
    expect(balance.events[0].name).to.be.equal(Types.EVENTS_NAMES.PAYMENT);
    expect(balance.events[0].parameters.to).to.be.equal(
      '0x6A08D2C8f251AF1f17B5943f7f7Bb7078c50e29A',
    );
    expect(balance.events[0].parameters.from).to.be.equal(
      '0x0000000000000000000000000000000000000000',
    );
    expect(balance.events[0].parameters.value).to.be.equal('1000000000000000000');
  }).timeout(5000);
});
