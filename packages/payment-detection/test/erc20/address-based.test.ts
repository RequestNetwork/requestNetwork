import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import ERC20AddressedBased from '../../src/erc20/address-based';

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
describe('api/erc20/address-based', () => {
  beforeEach(() => {
    sandbox.restore();
    erc20AddressedBased = new ERC20AddressedBased({ advancedLogic: mockAdvancedLogic });
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

  it('can getBalance on a localhost request', async () => {
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
        [ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_ADDRESS_BASED]: {
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

    expect(balance.balance).to.be.equal('10');
    expect(balance.events).to.have.lengthOf(1);
    expect(balance.events[0].name).to.be.equal(PaymentTypes.EVENTS_NAMES.PAYMENT);
    expect(balance.events[0].amount).to.be.equal('10');
    expect(balance.events[0].timestamp).to.be.a('number');
    expect(balance.events[0].parameters!.to).to.be.equal(
      '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
    );
    expect(balance.events[0].parameters!.from).to.be.equal(
      '0x627306090abaB3A6e1400e9345bC60c78a8BEf57',
    );
    expect(balance.events[0].parameters!.block).to.be.a('number');
    expect(balance.events[0].parameters!.txHash).to.be.a('string');
  });

  it('should not throw when getBalance fail', async () => {
    expect(
      await erc20AddressedBased.getBalance({
        currency: { network: 'wrong' },
      } as RequestLogicTypes.IRequest),
    ).to.deep.equal({
      balance: null,
      error: {
        code: PaymentTypes.BALANCE_ERROR_CODE.NETWORK_NOT_SUPPORTED,
        message:
          'Payment network wrong not supported by ERC20 payment detection. Supported networks: mainnet, rinkeby, private',
      },
      events: [],
    });
  });
});
