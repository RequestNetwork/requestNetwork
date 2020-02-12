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

import {
  approveErc20,
  getErc20Balance,
  getErc20PaymentUrl,
  hasErc20Approval,
  payErc20ProxyRequest,
} from '../../src/payment/erc20-proxy';
import { getRequestPaymentValues } from '../../src/payment/utils';

// tslint:disable: no-unused-expression
// tslint:disable: await-promise

const expect = chai.expect;
chai.use(chaiAsPromised);
chai.use(spies);

const erc20ContractAddress = '0x9FBDa871d559710256a2502A2517b794B482Db40';

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
  currency: 'DAI',
  currencyInfo: {
    network: 'private',
    type: RequestLogicTypes.CURRENCY.ERC20,
    value: erc20ContractAddress,
  },

  events: [],
  expectedAmount: '100',
  extensions: {
    [PaymentTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT]: {
      events: [],
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT,
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
  version: '1.0',
};

describe('getRequestPaymentValues', () => {
  it('handles ERC20', () => {
    const values = getRequestPaymentValues(validRequest);
    expect(values.paymentAddress).to.eq(paymentAddress);
    expect(values.paymentReference).to.eq('86dfbccad783599a');
  });
});

describe('getErc20Balance', () => {
  it('should read the balance', async () => {
    const balance = await getErc20Balance(validRequest, wallet.address, provider);
    chai.assert.isTrue(balance.gte('100'));
  });
});

describe('hasErc20Approval & approveErc20', () => {
  it('can check and approve', async () => {
    // use another address so it doesn't mess with other tests.
    const otherWallet = new Wallet(
      '0x8d5366123cb560bb606379f90a0bfd4769eecc0557f1b362dcae9012b548b1e5',
    ).connect(provider);
    let hasApproval = await hasErc20Approval(validRequest, otherWallet.address, provider);
    // Warning: this test can run only once!
    expect(hasApproval, 'already has approval').to.be.false;
    await approveErc20(validRequest, otherWallet);
    hasApproval = await hasErc20Approval(validRequest, otherWallet.address, provider);
    expect(hasApproval, 'approval did not succeed').to.be.true;
  });
});

describe('payErc20ProxyRequest', () => {
  it('should throw an error if the request is not erc20', async () => {
    const request = Utils.deepCopy(validRequest) as ClientTypes.IRequestData;
    request.currencyInfo.type = RequestLogicTypes.CURRENCY.ETH;

    await expect(payErc20ProxyRequest(request, wallet)).to.eventually.be.rejectedWith(
      'request cannot be processed, or is not an pn-erc20-proxy-contract request',
    );
  });

  it('should throw an error if the currencyInfo has no value', async () => {
    const request = Utils.deepCopy(validRequest);
    request.currencyInfo.value = '';
    await expect(payErc20ProxyRequest(request, wallet)).to.eventually.be.rejectedWith(
      'request cannot be processed, or is not an pn-erc20-proxy-contract request',
    );
  });

  it('should throw an error if currencyInfo has no network', async () => {
    const request = Utils.deepCopy(validRequest);
    request.currencyInfo.network = '';
    await expect(payErc20ProxyRequest(request, wallet)).to.eventually.be.rejectedWith(
      'request cannot be processed, or is not an pn-erc20-proxy-contract request',
    );
  });

  it('should throw an error if request has no extension', async () => {
    const request = Utils.deepCopy(validRequest);
    request.extensions = [] as any;

    await expect(payErc20ProxyRequest(request, wallet)).to.eventually.be.rejectedWith(
      'request cannot be processed, or is not an pn-erc20-proxy-contract request',
    );
  });

  it('should pay an ERC20 request', async () => {
    // first approve the contract
    const approvalTx = await approveErc20(validRequest, wallet);
    await approvalTx.wait(1);

    // get the balance to compare after payment

    const balanceEthBefore = await wallet.getBalance();
    const balanceErc20Before = await getErc20Balance(validRequest, wallet.address, provider);

    const tx = await payErc20ProxyRequest(validRequest, wallet);
    const confirmedTx = await tx.wait(1);

    const balanceEthAfter = await wallet.getBalance();
    const balanceErc20After = await getErc20Balance(validRequest, wallet.address, provider);

    expect(confirmedTx.status).to.eq(1);
    expect(tx.hash).not.to.be.undefined;

    chai.assert.isTrue(balanceEthAfter.lte(balanceEthBefore), 'ETH balance should be lower');
    chai.assert.isTrue(balanceErc20After.lte(balanceErc20Before), 'ERC20 balance should be lower');

    expect(balanceErc20Before.toString()).equal(
      balanceErc20After.add(validRequest.expectedAmount).toString(),
    );
  });
});

describe('getErc20PaymentUrl', () => {
  it('can get an ERC20 url', () => {
    expect(getErc20PaymentUrl(validRequest)).to.eq(
      'ethereum:0x2c2b9c9a4a25e24b174f26114e8926a9f2128fe4/transferFromWithReference?address=0x9FBDa871d559710256a2502A2517b794B482Db40&address=0xf17f52151EbEF6C7334FAD080c5704D77216b732&uint256=100&bytes=86dfbccad783599a',
    );
  });
});
