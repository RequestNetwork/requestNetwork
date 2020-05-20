import 'mocha';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as spies from 'chai-spies';
import { Wallet } from 'ethers';
import { JsonRpcProvider } from 'ethers/providers';

import {
  ClientTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import { bigNumberify } from 'ethers/utils';
import {
  // TODO !
  // encodePayWithProxyEthRequest,
  payWithProxyEthInputDataRequest,
} from '../../src/payment/eth-proxy';
import { getRequestPaymentValues } from '../../src/payment/utils';

// tslint:disable: no-unused-expression
// tslint:disable: await-promise

const expect = chai.expect;
chai.use(chaiAsPromised);
chai.use(spies);
const sandbox = chai.spy.sandbox();

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
const paymentAddress = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
const provider = new JsonRpcProvider('http://localhost:8545');
const wallet = Wallet.fromMnemonic(mnemonic).connect(provider);

const validRequest: ClientTypes.IRequestData = {
  balance: {
    balance: '0',
    events: [],
  },
  contentData: {},
  creator: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: wallet.address,
  },
  currency: 'ETH',
  currencyInfo: {
    network: 'private',
    type: RequestLogicTypes.CURRENCY.ETH,
    value: RequestLogicTypes.CURRENCY.ETH,
  },

  events: [],
  expectedAmount: '100',
  extensions: {
    [PaymentTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA]: {
      events: [],
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        paymentAddress,
        salt: 'salt',
      },
      version: '1.0',
    },
  },
  extensionsData: [],
  meta: {
    transactionManagerMeta: {},
  },
  pending: null,
  requestId: 'abcd',
  state: RequestLogicTypes.STATE.CREATED,
  timestamp: 0,
  version: '2.0.3',
};

describe('getRequestPaymentValues', () => {
  it('handles ETH', () => {
    const values = getRequestPaymentValues(validRequest);
    expect(values.paymentAddress).to.eq(paymentAddress);
    expect(values.paymentReference).to.eq('86dfbccad783599a');
  });
});

describe('payWithProxyEthInputDataRequest', () => {
  it('should throw an error if the request is not erc20', async () => {
    const request = Utils.deepCopy(validRequest) as ClientTypes.IRequestData;
    request.currencyInfo.type = RequestLogicTypes.CURRENCY.ERC20;

    await expect(payWithProxyEthInputDataRequest(request, wallet)).to.eventually.be.rejectedWith(
      'request cannot be processed, or is not an pn-eth-input-data request',
    );
  });

  it('should throw an error if currencyInfo has no network', async () => {
    const request = Utils.deepCopy(validRequest);
    request.currencyInfo.network = '';
    await expect(payWithProxyEthInputDataRequest(request, wallet)).to.eventually.be.rejectedWith(
      'request cannot be processed, or is not an pn-eth-input-data request',
    );
  });

  it('should throw an error if request has no extension', async () => {
    const request = Utils.deepCopy(validRequest);
    request.extensions = [] as any;

    await expect(payWithProxyEthInputDataRequest(request, wallet)).to.eventually.be.rejectedWith(
      'request cannot be processed, or is not an pn-eth-input-data request',
    );
  });

  it('should consider override parameters', async () => {
    const spy = sandbox.on(wallet, 'sendTransaction', () => 0);
    await payWithProxyEthInputDataRequest(validRequest, wallet, undefined, {
      gasPrice: '20000000000',
    });
    expect(spy).to.have.been.called.with({
      data:
        '0xeb7d8df3000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b7320000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000',
      gasPrice: '20000000000',
      to: '0xf204a4Ef082f5c04bB89F7D5E6568B796096735a',
      value: bigNumberify('0x64'),
    });
    sandbox.restore();
  });

  it('should pay an ETH request', async () => {
    // get the balance to compare after payment
    const balanceEthBefore = await wallet.getBalance();

    const tx = await payWithProxyEthInputDataRequest(validRequest, wallet);
    const confirmedTx = await tx.wait(1);

    const balanceEthAfter = await wallet.getBalance();

    expect(confirmedTx.status).to.eq(1);
    expect(tx.hash).not.to.be.undefined;

    chai.assert.isTrue(balanceEthAfter.lte(balanceEthBefore), 'ETH balance should be lower');

    expect(balanceEthBefore.toString()).equal(
      balanceEthAfter
        .add(validRequest.expectedAmount)
        .add(confirmedTx.gasUsed!.mul(tx.gasPrice))
        .toString(),
    );
  });
});
