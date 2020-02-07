import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import EthInputData from '../../../../src/api/payment-network/eth/input-data';

import 'chai';
import 'mocha';

const chai = require('chai');
const spies = require('chai-spies');
const expect = chai.expect;
chai.use(spies);
const sandbox = chai.spy.sandbox();

let ethInputData: EthInputData;

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions(): any {
    return;
  },
  extensions: {
    ethereumInputData: {
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
describe('api/eth/input-data', () => {
  beforeEach(() => {
    sandbox.restore();
    ethInputData = new EthInputData({ advancedLogic: mockAdvancedLogic });
  });

  it('can createExtensionsDataForCreation', async () => {
    const spy = sandbox.on(mockAdvancedLogic.extensions.ethereumInputData, 'createCreationAction');

    ethInputData.createExtensionsDataForCreation({ paymentAddress: 'ethereum address' });

    expect(spy).to.have.been.called.once;
  });

  it('can createExtensionsDataForAddPaymentInformation', async () => {
    const spy = sandbox.on(
      mockAdvancedLogic.extensions.ethereumInputData,
      'createAddPaymentAddressAction',
    );

    ethInputData.createExtensionsDataForAddPaymentInformation({
      paymentAddress: 'ethereum address',
    });

    expect(spy).to.have.been.called.once;
  });

  it('can createExtensionsDataForAddRefundInformation', async () => {
    const spy = sandbox.on(
      mockAdvancedLogic.extensions.ethereumInputData,
      'createAddRefundAddressAction',
    );

    ethInputData.createExtensionsDataForAddRefundInformation({
      refundAddress: 'ethereum address',
    });

    expect(spy).to.have.been.called.once;
  });

  // TODO: unskip
  it.skip('can getBalance on a localhost request', async () => {
    const mockRequest = {
      creator: { type: '', value: '0x2' },
      currency: {
        network: 'private',
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
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

    const balance = await ethInputData.getBalance(mockRequest as RequestLogicTypes.IRequest);

    expect(balance.balance).to.be.equal('10');
    expect(balance.events).to.have.lengthOf(1);
    expect(balance.events[0].name).to.be.equal(PaymentTypes.EVENTS_NAMES.PAYMENT);
    // TODO: add to & from to parameters?
    // expect(balance.events[0].parameters!.to).to.be.equal(
    //   '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
    // );
    // expect(balance.events[0].parameters!.from).to.be.equal(
    //   '0x627306090abaB3A6e1400e9345bC60c78a8BEf57',
    // );
    expect(balance.events[0].amount).to.be.equal('10');
    expect(balance.events[0].timestamp).to.be.a('number');
  });
});
