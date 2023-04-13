import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import { deepCopy } from '@requestnetwork/utils';
import { PaymentReferenceCalculator } from '@requestnetwork/payment-detection';

import * as nearUtils from '../../src/payment/utils-near';
import { payNearFungibleRequest } from '../../src/payment/near-fungible';

/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/await-thenable */

const fau = {
  type: RequestLogicTypes.CURRENCY.ERC20,
  value: 'fau.reqnetwork.testnet',
  network: 'aurora-testnet',
};

const salt = 'a6475e4c3d45feb6';
const paymentAddress = 'issuer.testnet';
const feeAddress = 'fee.testnet';
const network = 'aurora-testnet';
const feeAmount = '5';
const request: any = {
  requestId: '0x123',
  expectedAmount: '100',
  currencyInfo: fau,
  extensions: {
    [ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT]: {
      events: [],
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_NATIVE_TOKEN,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        salt,
        paymentAddress,
        feeAddress,
        network,
        feeAmount,
      },
      version: '0.1.0',
    },
  },
};
let paymentSpy: ReturnType<typeof jest.spyOn>;

describe('payNearFungibleRequest', () => {
  beforeEach(() => {
    // A mock is used to bypass Near wallet connection for address validation and contract interaction
    paymentSpy = jest
      .spyOn(nearUtils, 'processNearFungiblePayment')
      .mockReturnValue(Promise.resolve());
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  it('pays a FAU-near request (with mock)', async () => {
    jest.spyOn(nearUtils, 'isReceiverReady').mockReturnValue(Promise.resolve(true));
    const mockedNearWalletConnection = {
      account: () => ({
        functionCall: () => true,
      }),
    } as any;

    const paymentReference = PaymentReferenceCalculator.calculate(
      request.requestId,
      salt,
      paymentAddress,
    );

    await payNearFungibleRequest(request, mockedNearWalletConnection, undefined, {
      callbackUrl: 'https://some.callback.url',
      meta: 'param',
    });
    expect(paymentSpy).toHaveBeenCalledWith(
      expect.anything(),
      'aurora-testnet',
      '100',
      paymentAddress,
      paymentReference,
      'fau.reqnetwork.testnet',
      feeAddress,
      feeAmount,
      {
        callbackUrl: 'https://some.callback.url',
        meta: 'param',
      },
    );
  });

  it('throws when trying to pay if the recipient has no storage deposit', async () => {
    jest
      .spyOn(nearUtils, 'isReceiverReady')
      .mockImplementation((_walletConnection, _tokenAddress, address) =>
        Promise.resolve(address !== paymentAddress),
      );
    const mockedNearWalletConnection = {
      account: () => ({
        functionCall: () => true,
        account: { viewFunction: () => 'payer.testnet' },
      }),
    } as any;

    await expect(async () => {
      await payNearFungibleRequest(request, mockedNearWalletConnection, undefined, {
        callbackUrl: 'https://some.callback.url',
        meta: 'param',
      });
    }).rejects.toThrowError(
      'The paymentAddress is not registered for the token fau.reqnetwork.testnet',
    );
    expect(paymentSpy).not.toHaveBeenCalled();
  });

  it('throws when trying to pay if the proxy has no storage deposit', async () => {
    jest
      .spyOn(nearUtils, 'isReceiverReady')
      .mockImplementation((_walletConnection, _tokenAddress, address) =>
        Promise.resolve(address !== 'pay.reqnetwork.testnet'),
      );
    const mockedNearWalletConnection = {
      account: () => ({
        functionCall: () => true,
        account: { viewFunction: () => 'payer.testnet' },
      }),
    } as any;

    await expect(async () => {
      await payNearFungibleRequest(request, mockedNearWalletConnection, undefined, {
        callbackUrl: 'https://some.callback.url',
        meta: 'param',
      });
    }).rejects.toThrowError('The proxy is not registered for the token fau.reqnetwork.testnet');
    expect(paymentSpy).not.toHaveBeenCalled();
  });

  it('throws when trying to pay another payment extension', async () => {
    // A mock is used to bypass Near wallet connection for address validation and contract interaction
    const paymentSpy = jest
      .spyOn(nearUtils, 'processNearFungiblePayment')
      .mockReturnValue(Promise.resolve());
    const mockedNearWalletConnection = {
      account: () => ({
        functionCall: () => true,
        // state: () => Promise.resolve({ amount: 100 }),
      }),
    } as any;
    let invalidRequest = deepCopy(request);
    invalidRequest = {
      ...invalidRequest,
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ETH_PROXY]: {
          ...invalidRequest.extensions[ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT],
        },
      },
    };

    await expect(
      payNearFungibleRequest(invalidRequest, mockedNearWalletConnection, undefined, undefined),
    ).rejects.toThrowError(
      'request cannot be processed, or is not an pn-erc20-fee-proxy-contract request',
    );
    expect(paymentSpy).not.toHaveBeenCalled();
  });

  it('throws when trying to pay with a native token', async () => {
    const mockedNearWalletConnection = {
      account: () => ({
        functionCall: () => true,
        state: () => Promise.resolve({ amount: 100 }),
      }),
    } as any;
    let invalidRequest = deepCopy(request);
    invalidRequest = {
      ...invalidRequest,
      currencyInfo: {
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'NEAR',
        network: 'aurora',
      },
    };

    await expect(
      payNearFungibleRequest(invalidRequest, mockedNearWalletConnection),
    ).rejects.toThrowError(
      'request cannot be processed, or is not an pn-erc20-fee-proxy-contract request',
    );
    expect(paymentSpy).not.toHaveBeenCalled();
  });
});
