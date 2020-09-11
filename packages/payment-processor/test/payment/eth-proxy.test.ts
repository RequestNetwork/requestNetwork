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
import { encodePayEthProxyRequest, payEthProxyRequest } from '../../src/payment/eth-proxy';
import { getRequestPaymentValues } from '../../src/payment/utils';

// tslint:disable: no-unused-expression
// tslint:disable: await-promise

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
    expect(values.paymentAddress).toBe(paymentAddress);
    expect(values.paymentReference).toBe('86dfbccad783599a');
  });
});

describe('payEthProxyRequest', () => {
  it('should throw an error if the request is not erc20', async () => {
    const request = Utils.deepCopy(validRequest) as ClientTypes.IRequestData;
    request.currencyInfo.type = RequestLogicTypes.CURRENCY.ERC20;

    await expect(payEthProxyRequest(request, wallet)).rejects.toThrowError(
      'request cannot be processed, or is not an pn-eth-input-data request',
    );
  });

  it('should throw an error if currencyInfo has no network', async () => {
    const request = Utils.deepCopy(validRequest);
    request.currencyInfo.network = '';
    await expect(payEthProxyRequest(request, wallet)).rejects.toThrowError(
      'request cannot be processed, or is not an pn-eth-input-data request',
    );
  });

  it('should throw an error if request has no extension', async () => {
    const request = Utils.deepCopy(validRequest);
    request.extensions = [] as any;

    await expect(payEthProxyRequest(request, wallet)).rejects.toThrowError(
      'request cannot be processed, or is not an pn-eth-input-data request',
    );
  });

  it('should consider override parameters', async () => {
    const spy = jest.fn();
    const originalSendTransaction = wallet.sendTransaction.bind(wallet);
    wallet.sendTransaction = spy;
    await payEthProxyRequest(validRequest, wallet, undefined, {
      gasPrice: '20000000000',
    });
    expect(spy).toHaveBeenCalledWith({
      data:
        '0xeb7d8df3000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b7320000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000',
      gasPrice: '20000000000',
      to: '0xf204a4Ef082f5c04bB89F7D5E6568B796096735a',
      value: bigNumberify('0x64'),
    });
    wallet.sendTransaction = originalSendTransaction;
  });

  it('should pay an ETH request', async () => {
    // get the balance to compare after payment
    const balanceEthBefore = await wallet.getBalance();

    const tx = await payEthProxyRequest(validRequest, wallet);
    const confirmedTx = await tx.wait(1);

    const balanceEthAfter = await wallet.getBalance();

    expect(confirmedTx.status).toBe(1);
    expect(tx.hash).not.toBeUndefined();

    expect(balanceEthAfter.lte(balanceEthBefore)).toBeTruthy(); // 'ETH balance should be lower'

    expect(balanceEthBefore.toString()).toBe(
      balanceEthAfter
        .add(validRequest.expectedAmount)
        .add(confirmedTx.gasUsed!.mul(tx.gasPrice))
        .toString(),
    );
  });
});

describe('encodePayEthProxyRequest', () => {
  it('should encode pay for an ETH request', async () => {
    expect(await encodePayEthProxyRequest(validRequest, wallet)).toBe(
      '0xeb7d8df3000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b7320000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000',
    );
  });
});
