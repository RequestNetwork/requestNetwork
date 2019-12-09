import { AdvancedLogicTypes, RequestLogicTypes } from '@requestnetwork/types';
import ERC20ProxyContract from '../../../../src/api/payment-network/erc20/proxy-contract';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as spies from 'chai-spies';
import 'mocha';

const expect = chai.expect;
chai.use(chaiAsPromised);
chai.use(spies);
const sandbox = chai.spy.sandbox();

let erc20ProxyContract: ERC20ProxyContract;

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions(): any {
    return;
  },
  extensions: {
    erc20ProxyContract: {
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
describe('api/erc20/proxy-contract', () => {
  beforeEach(() => {
    sandbox.restore();
    erc20ProxyContract = new ERC20ProxyContract({ advancedLogic: mockAdvancedLogic });
  });

  it('can createExtensionsDataForCreation', async () => {
    const spy = sandbox.on(mockAdvancedLogic.extensions.erc20ProxyContract, 'createCreationAction');

    erc20ProxyContract.createExtensionsDataForCreation({
      paymentAddress: 'ethereum address',
      salt: 'ea3bc7caf64110ca',
    });

    expect(spy).to.have.been.called.once;
  });

  it('can createExtensionsDataForAddPaymentInformation', async () => {
    const spy = sandbox.on(
      mockAdvancedLogic.extensions.erc20ProxyContract,
      'createAddPaymentAddressAction',
    );

    erc20ProxyContract.createExtensionsDataForAddPaymentInformation({
      paymentAddress: 'ethereum address',
    });

    expect(spy).to.have.been.called.once;
  });

  it('can createExtensionsDataForAddRefundInformation', async () => {
    const spy = sandbox.on(
      mockAdvancedLogic.extensions.erc20ProxyContract,
      'createAddRefundAddressAction',
    );

    erc20ProxyContract.createExtensionsDataForAddRefundInformation({
      refundAddress: 'ethereum address',
    });

    expect(spy).to.have.been.called.once;
  });

  it('getBalance should not be implemented', async () => {
    const mockRequest = {};

    await expect(
      erc20ProxyContract.getBalance(mockRequest as RequestLogicTypes.IRequest),
    ).to.eventually.be.rejectedWith('Not yet implemented');
  });
});
