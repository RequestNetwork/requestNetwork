import { AdvancedLogicTypes } from '@requestnetwork/types';
import ETHProxyContract from '../../src/eth/proxy-contract';

import * as chai from 'chai';
import * as spies from 'chai-spies';
import 'mocha';

const expect = chai.expect;
chai.use(spies);
const sandbox = chai.spy.sandbox();

let ethProxyContract: ETHProxyContract;

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions(): any {
    return;
  },
  extensions: {
    proxyContractEthereum: {
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

/* tslint:disable:no-unused-expression */
describe('api/eth/proxy-contract', () => {
  beforeEach(() => {
    sandbox.restore();
    ethProxyContract = new ETHProxyContract({ advancedLogic: mockAdvancedLogic });
  });

  it('can createExtensionsDataForCreation', async () => {
    const spy = sandbox.on(
      mockAdvancedLogic.extensions.proxyContractEthereum,
      'createCreationAction',
    );

    ethProxyContract.createExtensionsDataForCreation({
      paymentAddress: 'ethereum address',
      salt: 'ea3bc7caf64110ca',
    });

    expect(spy).to.have.been.called.with({
      paymentAddress: 'ethereum address',
      refundAddress: undefined,
      salt: 'ea3bc7caf64110ca',
    });
  });

  it('can createExtensionsDataForCreation without salt', async () => {
    const spy = sandbox.on(
      mockAdvancedLogic.extensions.proxyContractEthereum,
      'createCreationAction',
    );

    ethProxyContract.createExtensionsDataForCreation({
      paymentAddress: 'ethereum address',
    });

    // Can't check parameters since salt is generated in createExtensionsDataForCreation
    expect(spy).to.have.been.called;
  });

  it('can createExtensionsDataForAddPaymentInformation', async () => {
    const spy = sandbox.on(
      mockAdvancedLogic.extensions.proxyContractEthereum,
      'createAddPaymentAddressAction',
    );

    ethProxyContract.createExtensionsDataForAddPaymentInformation({
      paymentAddress: 'ethereum address',
    });

    expect(spy).to.have.been.called.with({
      paymentAddress: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddRefundInformation', async () => {
    const spy = sandbox.on(
      mockAdvancedLogic.extensions.proxyContractEthereum,
      'createAddRefundAddressAction',
    );

    ethProxyContract.createExtensionsDataForAddRefundInformation({
      refundAddress: 'ethereum address',
    });

    expect(spy).to.have.been.called.with({
      refundAddress: 'ethereum address',
    });
  });
});
