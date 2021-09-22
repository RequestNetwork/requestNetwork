import { Wallet, providers } from 'ethers';

import {
  ClientTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import { encodePayEthFeeProxyRequest, payEthFeeProxyRequest } from '../../src/payment/eth-fee-proxy';
import { getRequestPaymentValues } from '../../src/payment/utils';

/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/await-thenable */

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
const paymentAddress = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
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
    expect(values.paymentAddress).toBe(paymentAddress);
    expect(values.paymentReference).toBe('86dfbccad783599a');
  });
});

describe('payEthFeeProxyRequest', () => {
  it('should throw an error if the request is not eth', async () => {
    const request = Utils.deepCopy(validRequest) as ClientTypes.IRequestData;
    request.currencyInfo.type = RequestLogicTypes.CURRENCY.ERC20;

    await expect(payEthFeeProxyRequest(request, wallet)).rejects.toThrowError(
      'request cannot be processed, or is not an pn-eth-fee-proxy-contract request',
    );
  });

  it('should throw an error if currencyInfo has no network', async () => {
    const request = Utils.deepCopy(validRequest);
    request.currencyInfo.network = '';
    await expect(payEthFeeProxyRequest(request, wallet)).rejects.toThrowError(
      'request cannot be processed, or is not an pn-eth-fee-proxy-contract request',
    );
  });

  it('should throw an error if request has no extension', async () => {
    const request = Utils.deepCopy(validRequest);
    request.extensions = [] as any;

    await expect(payEthFeeProxyRequest(request, wallet)).rejects.toThrowError(
      'no payment network found',
    );
  });

  it('should pay an ETH request', async () => {
    // get the balance to compare after payment
    const balanceEthBefore = await wallet.getBalance();
    const balanceFeeEthBefore = await provider.getBalance(feeAddress);
    const balancePayeeEthBefore = await provider.getBalance(paymentAddress);

    const tx = await payEthFeeProxyRequest(validRequest, wallet);
    const confirmedTx = await tx.wait(1);

    const balanceEthAfter = await wallet.getBalance();
    const balanceFeeEthAfter = await provider.getBalance(feeAddress);
    const balancePayeeEthAfter = await provider.getBalance(paymentAddress);

    expect(confirmedTx.status).toBe(1);
    expect(tx.hash).not.toBeUndefined();

    expect(balanceEthAfter.lte(balanceEthBefore)).toBeTruthy(); // 'ETH balance should be lower'

    expect(balanceEthBefore.toString()).toBe(
      balanceEthAfter
        .add(validRequest.expectedAmount)
        .add('2')
        .add(confirmedTx.gasUsed?.mul(tx?.gasPrice ?? 1))
        .toString(),
    );
    expect(balanceFeeEthAfter.toString()).toBe(
        balanceFeeEthBefore
          .add('2')
          .toString(),
    );
    expect(balancePayeeEthAfter.toString()).toBe(
        balancePayeeEthBefore
          .add('100')
          .toString(),
    );

  });
});

describe('encodePayEthFeeProxyRequest', () => {
  it('should encode pay for an ETH request', async () => {
    expect(await encodePayEthFeeProxyRequest(validRequest, wallet)).toBe(
      '0xb868980b000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b73200000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fef000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000',
    );
  });
});
