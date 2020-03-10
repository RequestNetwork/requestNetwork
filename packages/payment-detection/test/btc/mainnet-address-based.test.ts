import { AdvancedLogicTypes, PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';

import BTCAddressedBased from '../../src/btc/mainnet-address-based';

import 'chai';
import 'mocha';

const chai = require('chai');
const spies = require('chai-spies');
const expect = chai.expect;
chai.use(spies);
const sandbox = chai.spy.sandbox();

let btcAddressedBased: BTCAddressedBased;

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions(): any {
    return;
  },
  extensions: {
    addressBasedBtc: {
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
describe('api/btc/mainnet-address-based', () => {
  beforeEach(() => {
    sandbox.restore();
    btcAddressedBased = new BTCAddressedBased({ advancedLogic: mockAdvancedLogic });
  });

  it('can createExtensionsDataForCreation', async () => {
    const spy = sandbox.on(mockAdvancedLogic.extensions.addressBasedBtc, 'createCreationAction');

    btcAddressedBased.createExtensionsDataForCreation({ paymentAddress: 'address bitcoin' });

    expect(spy).to.have.been.called.once;
  });

  it('can createExtensionsDataForAddPaymentInformation', async () => {
    const spy = sandbox.on(
      mockAdvancedLogic.extensions.addressBasedBtc,
      'createAddPaymentAddressAction',
    );

    btcAddressedBased.createExtensionsDataForAddPaymentInformation({
      paymentAddress: 'address bitcoin',
    });

    expect(spy).to.have.been.called.once;
  });

  it('can createExtensionsDataForAddRefundInformation', async () => {
    const spy = sandbox.on(
      mockAdvancedLogic.extensions.addressBasedBtc,
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
        message: 'The request do not have the extension : pn-bitcoin-address-based',
      },
      events: [],
    });
  });
});
