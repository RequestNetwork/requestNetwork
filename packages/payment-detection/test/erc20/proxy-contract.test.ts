import { AdvancedLogicTypes, PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';
import ERC20ProxyContract from '../../src/erc20/proxy-contract';

import * as chai from 'chai';
import * as spies from 'chai-spies';

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

    await erc20ProxyContract.createExtensionsDataForCreation({
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

    await erc20ProxyContract.createExtensionsDataForCreation({
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

  it('should not throw when getBalance fail', async () => {
    expect(
      await erc20ProxyContract.getBalance({ extensions: {} } as RequestLogicTypes.IRequest),
    ).to.deep.equal({
      balance: null,
      error: {
        code: PaymentTypes.BALANCE_ERROR_CODE.WRONG_EXTENSION,
        message: 'The request does not have the extension : pn-erc20-proxy-contract',
      },
      events: [],
    });
  });
});
