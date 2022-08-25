import { Wallet, BigNumber, providers } from 'ethers';

import {
  ClientTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import { batchPaymentsArtifact } from '@requestnetwork/smart-contracts';

import { getErc20Balance } from '../../src/payment/erc20';
import { getRequestPaymentValues } from '../../src/payment/utils';
import {
  payBatchProxyRequest,
  approveErc20BatchIfNeeded,
  prepareBatchPaymentTransaction,
  getBatchProxyAddress,
} from '../../src/payment/batch-proxy';

/* eslint-disable no-magic-numbers */
/* eslint-disable @typescript-eslint/no-unused-expressions */

const batchFee = 10;
const batchVersion = '0.1.0';
const DAITokenAddress = '0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35';
const FAUTokenAddress = '0x9FBDa871d559710256a2502A2517b794B482Db40'; // TestERC20 address
const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
const paymentAddress1 = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
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
  currency: 'DAI',
  currencyInfo: {
    network: 'private',
    type: RequestLogicTypes.CURRENCY.ERC20 as any,
    value: DAITokenAddress,
  },
  events: [],
  expectedAmount: '1000',
  extensions: {
    [PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT]: {
      events: [],
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT,
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
  version: '1.0',
};

const fauValidRequest = Utils.deepCopy(validRequest) as ClientTypes.IRequestData;
fauValidRequest.currencyInfo = {
  network: 'private',
  type: RequestLogicTypes.CURRENCY.ERC20 as any,
  value: FAUTokenAddress,
};

const sameCurrencyValue = (
  requestA: ClientTypes.IRequestData,
  requestB: ClientTypes.IRequestData,
): boolean => {
  return requestA.currencyInfo.value === requestB.currencyInfo.value;
};

const getData = (
  request1: ClientTypes.IRequestData,
  request2: ClientTypes.IRequestData,
): string => {
  if (sameCurrencyValue(request1, validRequest) && sameCurrencyValue(request2, validRequest)) {
    return '0xfa73314200000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002c0000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fef000000000000000000000000000000000000000000000000000000000000000200000000000000000000000038cf23c52bb4b13f051aec09580a2de845a7fa3500000000000000000000000038cf23c52bb4b13f051aec09580a2de845a7fa350000000000000000000000000000000000000000000000000000000000000002000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b732000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b732000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000003e8000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002';
  } else if (
    sameCurrencyValue(request1, validRequest) &&
    sameCurrencyValue(request2, fauValidRequest)
  ) {
    return '0xfa73314200000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002c0000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fef000000000000000000000000000000000000000000000000000000000000000200000000000000000000000038cf23c52bb4b13f051aec09580a2de845a7fa350000000000000000000000009fbda871d559710256a2502a2517b794b482db400000000000000000000000000000000000000000000000000000000000000002000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b732000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b732000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000003e8000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002';
  } else {
    throw 'wrong requests';
  }
};

const testSuite = (
  suiteName: string,
  requestTemplate1: ClientTypes.IRequestData,
  requestTemplate2: ClientTypes.IRequestData,
) => {
  describe(suiteName, () => {
    let request1: ClientTypes.IRequestData;
    let request2: ClientTypes.IRequestData;

    beforeEach(() => {
      jest.restoreAllMocks();
      request1 = Utils.deepCopy(requestTemplate1) as ClientTypes.IRequestData;
      request2 = Utils.deepCopy(requestTemplate2) as ClientTypes.IRequestData;
    });

    it('should throw an error if the request is not erc20', async () => {
      request2.currencyInfo.type = RequestLogicTypes.CURRENCY.ETH;
      await expect(
        payBatchProxyRequest([request1, request2], batchVersion, wallet, batchFee),
      ).rejects.toThrowError(
        'request cannot be processed, or is not an pn-erc20-fee-proxy-contract request',
      );
    });

    it("should throw an error if one request's currencyInfo has no value", async () => {
      request2.currencyInfo.value = '';
      await expect(
        payBatchProxyRequest([request1, request2], batchVersion, wallet, batchFee),
      ).rejects.toThrowError(
        'request cannot be processed, or is not an pn-erc20-fee-proxy-contract request',
      );
    });

    it("should throw an error if one request's currencyInfo has no network", async () => {
      request2.currencyInfo.network = '';
      await expect(
        payBatchProxyRequest([request1, request2], batchVersion, wallet, batchFee),
      ).rejects.toThrowError(
        'request cannot be processed, or is not an pn-erc20-fee-proxy-contract request',
      );
    });

    it('should throw an error if request has no extension', async () => {
      request2.extensions = [] as any;
      await expect(
        payBatchProxyRequest([request1, request2], batchVersion, wallet, batchFee),
      ).rejects.toThrowError('no payment network found');
    });

    it('should throw an error if there is a wrong version mapping', async () => {
      await expect(
        payBatchProxyRequest(
          [
            {
              ...request1,
              extensions: {
                [PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT]: {
                  ...validRequest.extensions[
                    PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT
                  ],
                  version: '0.1.0',
                },
              },
            } as any,
            {
              ...request2,
              extensions: {
                [PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT]: {
                  ...validRequest.extensions[
                    PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT
                  ],
                  version: '0.3.0',
                },
              },
            } as any,
          ],
          batchVersion,
          wallet,
          batchFee,
        ),
      ).rejects.toThrowError('Every payment network type and version must be identical');
    });

    describe('payBatchProxyRequest', () => {
      it('should consider override parameters', async () => {
        const spy = jest.fn();
        const originalSendTransaction = wallet.sendTransaction.bind(wallet);
        wallet.sendTransaction = spy;
        await payBatchProxyRequest([request1, request2], batchVersion, wallet, batchFee, {
          gasPrice: '20000000000',
        });
        expect(spy).toHaveBeenCalledWith({
          data: getData(request1, request2),
          gasPrice: '20000000000',
          to: getBatchProxyAddress(request1, '0.1.0'),
          value: 0,
        });
        wallet.sendTransaction = originalSendTransaction;
      });

      it('should pay an ERC20 request with fees', async () => {
        // first approve the contract
        const tmpRequest = Utils.deepCopy(request1);
        let amount = 1000;
        const isMultiToken = !sameCurrencyValue(request1, request2);

        if (!isMultiToken) {
          amount = 2 * amount;
          tmpRequest.expectedAmount = amount.toString();
        } else {
          const ApprovalTx2 = await approveErc20BatchIfNeeded(
            request2,
            wallet.address,
            batchVersion,
            wallet,
          );
          if (ApprovalTx2) {
            await ApprovalTx2.wait(1);
          }
        }

        const approvalTx = await approveErc20BatchIfNeeded(
          tmpRequest,
          wallet.address,
          batchVersion,
          wallet,
        );

        if (approvalTx) {
          await approvalTx.wait(1);
        }
        request1.extensions['pn-erc20-fee-proxy-contract'].values.feeAmount = '6';

        // get the balance
        const balanceEthBefore = await wallet.getBalance();
        const balanceErc20Before = await getErc20Balance(request1, wallet.address, provider);
        const feeBalanceErc20Before = await getErc20Balance(request1, feeAddress, provider);

        const balanceErc20Before2 = await getErc20Balance(request2, wallet.address, provider);
        const feeBalanceErc20Before2 = await getErc20Balance(request2, feeAddress, provider);

        // Batch payment
        const tx = await payBatchProxyRequest([request1, request2], batchVersion, wallet, batchFee);
        const confirmedTx = await tx.wait(1);

        const balanceEthAfter = await wallet.getBalance();
        const balanceErc20After = await getErc20Balance(request1, wallet.address, provider);
        const feeBalanceErc20After = await getErc20Balance(request1, feeAddress, provider);

        expect(confirmedTx.status).toBe(1);
        expect(tx.hash).not.toBeUndefined();
        expect(balanceEthAfter.lte(balanceEthBefore)).toBeTruthy(); // 'ETH balance should be lower'

        let feeAmount = 6 + 10 + (2 + 10);
        if (isMultiToken) {
          feeAmount = 6 + 10; // (2 + 10) will be sent on the 2nd token fee address
          const balanceErc20After2 = await getErc20Balance(request2, wallet.address, provider);
          const feeBalanceErc20After2 = await getErc20Balance(request2, feeAddress, provider);
          // compare request 2 balances
          expect(BigNumber.from(balanceErc20After2)).toEqual(
            BigNumber.from(balanceErc20Before2).sub(amount + (2 + 10)),
          );

          expect(BigNumber.from(feeBalanceErc20After2)).toEqual(
            BigNumber.from(feeBalanceErc20Before2).add(2 + 10),
          );
        }

        // compare request 1 balances
        expect(BigNumber.from(balanceErc20After)).toEqual(
          BigNumber.from(balanceErc20Before).sub(amount + feeAmount),
        );
        expect(BigNumber.from(feeBalanceErc20After)).toEqual(
          BigNumber.from(feeBalanceErc20Before).add(feeAmount),
        );
      });
    });
    describe('prepareBatchPaymentTransaction', () => {
      it('should consider the version mapping', () => {
        expect(
          prepareBatchPaymentTransaction(
            [
              {
                ...request1,
                extensions: {
                  [PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT]: {
                    ...request1.extensions[
                      PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT
                    ],
                    version: '0.1.0',
                  },
                },
              } as any,
              {
                ...request2,
                extensions: {
                  [PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT]: {
                    ...request2.extensions[
                      PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT
                    ],
                    version: '0.1.0',
                  },
                },
              } as any,
            ],
            batchVersion,
            batchFee,
          ).to,
        ).toBe(batchPaymentsArtifact.getAddress('private', '0.1.0'));
      });
    });
  });
};

describe('erc20-batch-proxy BIS', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });
  describe('getRequestPaymentValues', () => {
    it('handles ERC20', () => {
      const values = getRequestPaymentValues(validRequest);
      expect(values.feeAddress).toBe(feeAddress);
      expect(values.feeAmount).toBe('2');
      expect(values.paymentAddress).toBe(paymentAddress1);
      expect(values.paymentReference).toBe('86dfbccad783599a');
    });
  });

  testSuite('encodePayErc20BatchRequest for one type of ERC20', validRequest, validRequest);
  testSuite('encodePayErc20BatchRequest using two different ERC20', validRequest, fauValidRequest);
});
