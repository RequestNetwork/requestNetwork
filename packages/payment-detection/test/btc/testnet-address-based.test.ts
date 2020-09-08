import { AdvancedLogicTypes, PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';

import AddressBasedTestnetBtc from '../../src/btc/testnet-address-based';

import 'chai';

const chai = require('chai');
const spies = require('chai-spies');
const expect = chai.expect;
chai.use(spies);
const sandbox = chai.spy.sandbox();

let btcAddressedBased: AddressBasedTestnetBtc;

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions(): any {
    return;
  },
  extensions: {
    addressBasedTestnetBtc: {
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
describe('api/btc/testnet-address-based', () => {
  beforeEach(() => {
    sandbox.restore();
    btcAddressedBased = new AddressBasedTestnetBtc({ advancedLogic: mockAdvancedLogic });
  });

  it('can createExtensionsDataForCreation', async () => {
    const spy = sandbox.on(
      mockAdvancedLogic.extensions.addressBasedTestnetBtc,
      'createCreationAction',
    );

    await btcAddressedBased.createExtensionsDataForCreation({ paymentAddress: 'address bitcoin' });

    expect(spy).to.have.been.called.once;
  });

  it('can createExtensionsDataForAddPaymentInformation', async () => {
    const spy = sandbox.on(
      mockAdvancedLogic.extensions.addressBasedTestnetBtc,
      'createAddPaymentAddressAction',
    );

    btcAddressedBased.createExtensionsDataForAddPaymentInformation({
      paymentAddress: 'address bitcoin',
    });

    expect(spy).to.have.been.called.once;
  });

  it('can createExtensionsDataForAddRefundInformation', async () => {
    const spy = sandbox.on(
      mockAdvancedLogic.extensions.addressBasedTestnetBtc,
      'createAddRefundAddressAction',
    );

    btcAddressedBased.createExtensionsDataForAddRefundInformation({
      refundAddress: 'address bitcoin',
    });

    expect(spy).to.have.been.called.once;
  });

  it('should not throw when getBalance fail', async () => {
    expect(
      await btcAddressedBased.getBalance({ extensions: {} } as RequestLogicTypes.IRequest),
    ).to.deep.equal({
      balance: null,
      error: {
        code: PaymentTypes.BALANCE_ERROR_CODE.WRONG_EXTENSION,
        message: 'The request does not have the extension: pn-testnet-bitcoin-address-based',
      },
      events: [],
    });
  });
});
