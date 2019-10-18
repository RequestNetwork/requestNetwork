import { AdvancedLogicTypes } from '@requestnetwork/types';

import RinkebyErc20AddressBased from '../../../../src/api/payment-network/erc20/rinkeby-address-based';

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
});
