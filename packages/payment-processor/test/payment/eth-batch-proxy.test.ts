import { Wallet, providers, BigNumber } from 'ethers';

import {
  ClientTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import { payBatchProxyRequest, encodePayBatchRequest } from '../../src/payment/batch-proxy';
import { getRequestPaymentValues } from '../../src/payment/utils';

/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/await-thenable */

const batchFee = 10;
const batchVersion = '0.1.0';
const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
const paymentAddress1 = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
const paymentAddress2 = '0x821aEa9a577a9b44299B9c15c88cf3087F3b5544';
const feeAddress = '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef';
const provider = new providers.JsonRpcProvider('http://localhost:8545');
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
    [PaymentTypes.PAYMENT_NETWORK_ID.ETH_FEE_PROXY_CONTRACT]: {
      events: [],
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ETH_FEE_PROXY_CONTRACT,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        feeAddress,
        feeAmount: '2',
        paymentAddress: paymentAddress1,
        salt: 'salt',
      },
      version: '0.1.0',
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

const validRequest2: ClientTypes.IRequestData = {
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
        feeAddress,
        feeAmount: '2',
        paymentAddress: paymentAddress2,
        salt: 'salt',
      },
      version: '0.1.0',
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
    expect(values.paymentAddress).toBe(paymentAddress1);
    expect(values.paymentReference).toBe('86dfbccad783599a');
  });
});

describe('payBatchProxyRequest', () => {
  it('should throw an error if one request is not eth', async () => {
    const request = Utils.deepCopy(validRequest) as ClientTypes.IRequestData;
    request.currencyInfo.type = RequestLogicTypes.CURRENCY.ERC20;

    await expect(
      payBatchProxyRequest([validRequest, request], batchVersion, wallet, batchFee),
    ).rejects.toThrowError(
      'request cannot be processed, or is not an pn-eth-fee-proxy-contract request',
    );
  });

  it('should throw an error if in one request, currencyInfo has no network', async () => {
    const request = Utils.deepCopy(validRequest);
    request.currencyInfo.network = '';
    await expect(
      payBatchProxyRequest([validRequest, request], batchVersion, wallet, batchFee),
    ).rejects.toThrowError(
      'request cannot be processed, or is not an pn-eth-fee-proxy-contract request',
    );
  });

  it('should throw an error if one request has no extension', async () => {
    const request = Utils.deepCopy(validRequest);
    request.extensions = [] as any;

    await expect(
      payBatchProxyRequest([validRequest, request], batchVersion, wallet, batchFee),
    ).rejects.toThrowError('no payment network found');
  });

  it('should pay an ETH batch of 2 requests and pay fee & batch fee', async () => {
    const balanceEthBefore = await wallet.getBalance();
    const balanceFeeEthBefore = await provider.getBalance(feeAddress);
    const balancePayeeEthBefore1 = await provider.getBalance(paymentAddress1);

    const tx = await payBatchProxyRequest(
      [validRequest, validRequest],
      batchVersion,
      wallet,
      batchFee,
    );
    const confirmedTx = await tx.wait(1);

    const balanceEthAfter = await wallet.getBalance();
    const balanceFeeEthAfter = await provider.getBalance(feeAddress);
    const balancePayeeEthAfter1 = await provider.getBalance(paymentAddress1);

    expect(confirmedTx.status).toBe(1);
    expect(tx.hash).not.toBeUndefined();

    expect(balanceEthAfter.lte(balanceEthBefore)).toBeTruthy(); // 'ETH balance should be lower'

    // check every balance: payer, feeAddress, payee1
    expect(balanceEthBefore.toString()).toBe(
      balanceEthAfter
        .add(BigNumber.from(validRequest.expectedAmount).mul(2).toString()) // 2 is Nb_txs
        .add('6') // = (2 + 1) * Nb_txs, and Nb_txs = 2 -> (fee + batchFee) * Nb_txs
        .add(confirmedTx.gasUsed?.mul(tx?.gasPrice ?? 1))
        .toString(),
    );
    expect(balanceFeeEthAfter.toString()).toBe(balanceFeeEthBefore.add('6').toString()); // = (fee+ batchFee) * Nb_txs <=> (2 + 1) * 2
    expect(balancePayeeEthAfter1.toString()).toBe(balancePayeeEthBefore1.add('200').toString()); // = 100 * Nb_txs, and Nb_txs = 2
  });

  it('should pay an ETH batch of 2 requests with different receiverAddress and pay fee & batch fee and payment network id', async () => {
    const balanceEthBefore = await wallet.getBalance();
    const balanceFeeEthBefore = await provider.getBalance(feeAddress);
    const balancePayeeEthBefore1 = await provider.getBalance(paymentAddress1);
    const balancePayeeEthBefore2 = await provider.getBalance(paymentAddress2);

    const tx = await payBatchProxyRequest(
      [validRequest, validRequest2],
      batchVersion,
      wallet,
      batchFee,
    );
    const confirmedTx = await tx.wait(1);

    const balanceEthAfter = await wallet.getBalance();
    const balanceFeeEthAfter = await provider.getBalance(feeAddress);
    const balancePayeeEthAfter1 = await provider.getBalance(paymentAddress1);
    const balancePayeeEthAfter2 = await provider.getBalance(paymentAddress2);

    expect(confirmedTx.status).toBe(1);
    expect(tx.hash).not.toBeUndefined();

    expect(balanceEthAfter.lte(balanceEthBefore)).toBeTruthy(); // 'ETH balance should be lower'

    // check every balance: payer, feeAddress, payee1, payee2
    expect(balanceEthBefore.toString()).toBe(
      balanceEthAfter
        .add(BigNumber.from(validRequest.expectedAmount).mul(2).toString())
        .add('6')
        .add(confirmedTx.gasUsed?.mul(tx?.gasPrice ?? 1))
        .toString(),
    );
    expect(balanceFeeEthAfter.toString()).toBe(balanceFeeEthBefore.add('6').toString());
    expect(balancePayeeEthAfter1.toString()).toBe(balancePayeeEthBefore1.add('100').toString());
    expect(balancePayeeEthAfter2.toString()).toBe(balancePayeeEthBefore2.add('100').toString());
  });
});

describe('encodePayEthBatchRequest', () => {
  it('should encode pay for an ETH batch of 2 requests', async () => {
    expect(encodePayBatchRequest([validRequest, validRequest])).toBe(
      '0x73535e5500000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000240000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fef0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b732000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b732000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002',
    );
  });
});