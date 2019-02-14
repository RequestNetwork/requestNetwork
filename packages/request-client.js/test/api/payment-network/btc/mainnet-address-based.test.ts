import { AdvancedLogic as AdvancedLogicTypes } from '@requestnetwork/types';

import BTCAddressedBased from '../../../../src/api/payment-network/btc/mainnet-address-based';

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
    btcAddressedBased = new BTCAddressedBased(mockAdvancedLogic);
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
});
