import { Wallet, providers, BigNumber } from 'ethers';

import {
  ClientTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import { _getEthPaymentUrl, payEthInputDataRequest } from '../../src/payment/eth-input-data';
import { getRequestPaymentValues } from '../../src/payment/utils';

/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/await-thenable */

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
const paymentAddress = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
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
    value: '',
  },

  events: [],
  expectedAmount: '1',
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
  version: '1.0',
};

describe('getRequestPaymentValues', () => {
  it('handles ETH', () => {
    const values = getRequestPaymentValues(validRequest);
    expect(values.paymentAddress).toBe(paymentAddress);
    expect(values.paymentReference).toBe('86dfbccad783599a');
  });
});

describe('payEthInputDataRequest', () => {
  it('should throw an error if the request is not eth', async () => {
    const request = Utils.deepCopy(validRequest) as ClientTypes.IRequestData;
    request.currencyInfo.type = RequestLogicTypes.CURRENCY.ERC20;
    await expect(payEthInputDataRequest(request, wallet)).rejects.toThrowError(
      'request cannot be processed, or is not an pn-eth-input-data request',
    );
  });

  it('should throw an error if currencyInfo has no network', async () => {
    const request = Utils.deepCopy(validRequest);
    request.currencyInfo.network = '';
    await expect(payEthInputDataRequest(request, wallet)).rejects.toThrowError(
      'request cannot be processed, or is not an pn-eth-input-data request',
    );
  });

  it('should throw an error if request has no extension', async () => {
    const request = Utils.deepCopy(validRequest);
    request.extensions = [] as any;

    await expect(payEthInputDataRequest(request, wallet)).rejects.toThrowError(
      'no payment network found',
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  it('should consider override parameters', async () => {
    const spy = jest.fn();
    const originalSendTransaction = wallet.sendTransaction.bind(wallet);
    wallet.sendTransaction = spy;
    await payEthInputDataRequest(validRequest, wallet, undefined, {
      gasPrice: '20000000001',
    });
    expect(spy).toHaveBeenCalledWith({
      data: '0x86dfbccad783599a',
      gasPrice: '20000000001',
      to: '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
      value: BigNumber.from(1),
    });
    wallet.sendTransaction = originalSendTransaction;
  });

  it('processes a payment for a pn-eth-input-data request', async () => {
    const balanceBefore = await wallet.getBalance();
    expect(balanceBefore.gt(0));
    const tx = await payEthInputDataRequest(validRequest, wallet);
    const confirmedTx = await tx.wait(1);
    const balanceAfter = await wallet.getBalance();
    expect(confirmedTx.status).toBe(1);
    // new_balance = old_balance + amount + fees
    expect(balanceAfter).toEqual(
      balanceBefore
        .sub(validRequest.expectedAmount)
        .sub(confirmedTx.gasUsed.mul(2 * 10 ** 10) || 0),
    );
    expect(
      balanceAfter.eq(balanceBefore.sub(validRequest.expectedAmount).sub(confirmedTx.gasUsed || 0)),
    );
  });
});

describe('getEthPaymentUrl', () => {
  it('can get an ETH url', () => {
    expect(_getEthPaymentUrl(validRequest)).toBe(
      'ethereum:0xf17f52151EbEF6C7334FAD080c5704D77216b732?value=1&data=86dfbccad783599a',
    );
  });
});
