import { AdvancedLogicTypes, RequestLogicTypes } from '@requestnetwork/types';
import ERC20ProxyContract from '../../../../src/api/payment-network/erc20/proxy-contract';

import * as chai from 'chai';
import * as spies from 'chai-spies';
import 'mocha';

const expect = chai.expect;
chai.use(spies);
const sandbox = chai.spy.sandbox();

let erc20ProxyContract: ERC20ProxyContract;

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions(): any {
    return;
  },
  extensions: {
    proxyContractErc20: {
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
describe('api/erc20/proxy-contract', () => {
  beforeEach(() => {
    sandbox.restore();
    erc20ProxyContract = new ERC20ProxyContract({ advancedLogic: mockAdvancedLogic });
  });

  it('can createExtensionsDataForCreation', async () => {
    const spy = sandbox.on(mockAdvancedLogic.extensions.proxyContractErc20, 'createCreationAction');

    erc20ProxyContract.createExtensionsDataForCreation({
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
    const spy = sandbox.on(mockAdvancedLogic.extensions.proxyContractErc20, 'createCreationAction');

    erc20ProxyContract.createExtensionsDataForCreation({
      paymentAddress: 'ethereum address',
    });

    // Can't check parameters since salt is generated in createExtensionsDataForCreation
    expect(spy).to.have.been.called;
  });

  it('can createExtensionsDataForAddPaymentInformation', async () => {
    const spy = sandbox.on(
      mockAdvancedLogic.extensions.proxyContractErc20,
      'createAddPaymentAddressAction',
    );

    erc20ProxyContract.createExtensionsDataForAddPaymentInformation({
      paymentAddress: 'ethereum address',
    });

    expect(spy).to.have.been.called.with({
      paymentAddress: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddRefundInformation', async () => {
    const spy = sandbox.on(
      mockAdvancedLogic.extensions.proxyContractErc20,
      'createAddRefundAddressAction',
    );

    erc20ProxyContract.createExtensionsDataForAddRefundInformation({
      refundAddress: 'ethereum address',
    });

    expect(spy).to.have.been.called.with({
      refundAddress: 'ethereum address',
    });
  });

  it('getBalance should not be implemented', async () => {
    const mockRequest = {};

    const balance = await erc20ProxyContract.getBalance(mockRequest as RequestLogicTypes.IRequest);
    expect(balance.balance).to.be.equal('');
    expect(balance.events).to.have.lengthOf(0);
  });
});
