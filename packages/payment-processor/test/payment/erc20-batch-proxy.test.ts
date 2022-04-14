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
} from '../../src/payment/batch-proxy';

/* eslint-disable no-magic-numbers */
/* eslint-disable @typescript-eslint/no-unused-expressions */

const paymentType = 'erc20';
const batchFee = 10;
const batchVersion = '0.1.0';
const erc20ContractAddress = '0x9FBDa871d559710256a2502A2517b794B482Db40';
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
    type: RequestLogicTypes.CURRENCY.ERC20,
    value: erc20ContractAddress,
  },
  events: [],
  expectedAmount: '100',
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

describe('erc20-batch-proxy', () => {
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

  describe('encodePayErc20BatchRequest', () => {
    it('should throw an error if the request is not erc20', async () => {
      const erc20Request = Utils.deepCopy(validRequest) as ClientTypes.IRequestData;
      const ethRequest = Utils.deepCopy(validRequest) as ClientTypes.IRequestData;
      ethRequest.currencyInfo.type = RequestLogicTypes.CURRENCY.ETH;

      await expect(
        payBatchProxyRequest(
          [erc20Request, ethRequest],
          paymentType,
          batchVersion,
          wallet,
          batchFee,
          false,
        ),
      ).rejects.toThrowError(
        'request cannot be processed, or is not an pn-erc20-fee-proxy-contract request',
      );
    });

    it('should throw an error if the currencyInfo has no value', async () => {
      const request = Utils.deepCopy(validRequest);
      request.currencyInfo.value = '';
      await expect(
        payBatchProxyRequest(
          [validRequest, request],
          paymentType,
          batchVersion,
          wallet,
          batchFee,
          false,
        ),
      ).rejects.toThrowError(
        'request cannot be processed, or is not an pn-erc20-fee-proxy-contract request',
      );
    });

    it('should throw an error if currencyInfo has no network', async () => {
      const request = Utils.deepCopy(validRequest);
      request.currencyInfo.network = '';
      await expect(
        payBatchProxyRequest(
          [validRequest, request],
          paymentType,
          batchVersion,
          wallet,
          batchFee,
          false,
        ),
      ).rejects.toThrowError(
        'request cannot be processed, or is not an pn-erc20-fee-proxy-contract request',
      );
    });

    it('should throw an error if request has no extension', async () => {
      const request = Utils.deepCopy(validRequest);
      request.extensions = [] as any;

      await expect(
        payBatchProxyRequest(
          [validRequest, request],
          paymentType,
          batchVersion,
          wallet,
          batchFee,
          false,
        ),
      ).rejects.toThrowError('no payment network found');
    });

    it('should throw an error if there is a wrong version mapping', async () => {
      await expect(
        payBatchProxyRequest(
          [
            {
              ...validRequest,
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
              ...validRequest,
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
          paymentType,
          batchVersion,
          wallet,
          batchFee,
          false,
        ),
      ).rejects.toThrowError('Every payment network type and version must be identical');
    });

    describe('payBatchProxyRequest', () => {
      it('should consider override parameters', async () => {
        const spy = jest.fn();
        const originalSendTransaction = wallet.sendTransaction.bind(wallet);
        wallet.sendTransaction = spy;
        await payBatchProxyRequest(
          [validRequest, validRequest],
          paymentType,
          batchVersion,
          wallet,
          batchFee,
          false,
          {
            gasPrice: '20000000000',
          },
        );
        expect(spy).toHaveBeenCalledWith({
          data:
            '0xc6e6d98b0000000000000000000000009fbda871d559710256a2502a2517b794b482db4000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000001800000000000000000000000000000000000000000000000000000000000000260000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fef0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b732000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b732000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002',
          gasPrice: '20000000000',
          to: '0x74e3FC764c2474f25369B9d021b7F92e8441A2Dc',
          value: 0,
        });
        wallet.sendTransaction = originalSendTransaction;
      });

      it('should pay an ERC20 request with fees', async () => {
        // first approve the contract
        const doubleValueRequest = Utils.deepCopy(validRequest);
        doubleValueRequest.expectedAmount = '200';

        const approvalTx = await approveErc20BatchIfNeeded(
          doubleValueRequest,
          wallet.address,
          batchVersion,
          wallet,
        );

        if (approvalTx) {
          await approvalTx.wait(1);
        }

        const request = Utils.deepCopy(validRequest);
        request.extensions['pn-erc20-fee-proxy-contract'].values.feeAmount = '6';

        // get the balance to compare after payment
        const balanceEthBefore = await wallet.getBalance();
        const balanceErc20Before = await getErc20Balance(validRequest, wallet.address, provider);
        const feeBalanceErc20Before = await getErc20Balance(validRequest, feeAddress, provider);

        const tx = await payBatchProxyRequest(
          [request, validRequest],
          paymentType,
          batchVersion,
          wallet,
          batchFee,
          false,
        );
        const confirmedTx = await tx.wait(1);

        const balanceEthAfter = await wallet.getBalance();
        const balanceErc20After = await getErc20Balance(validRequest, wallet.address, provider);
        const feeBalanceErc20After = await getErc20Balance(validRequest, feeAddress, provider);

        expect(confirmedTx.status).toBe(1);
        expect(tx.hash).not.toBeUndefined();
        expect(balanceEthAfter.lte(balanceEthBefore)).toBeTruthy(); // 'ETH balance should be lower'

        // ERC20 balance should be lower
        expect(
          BigNumber.from(balanceErc20After).eq(
            BigNumber.from(balanceErc20Before).sub(200 + (6 + 1) + (2 + 1)),
          ),
        ).toBeTruthy();
        // fee ERC20 balance should be higher
        expect(
          BigNumber.from(feeBalanceErc20After).eq(
            BigNumber.from(feeBalanceErc20Before).add(6 + 1 + (2 + 1)),
          ),
        ).toBeTruthy();
      });
    });

    describe('prepareBatchPaymentTransaction', () => {
      it('should consider the version mapping', () => {
        expect(
          prepareBatchPaymentTransaction(
            [
              {
                ...validRequest,
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
                ...validRequest,
                extensions: {
                  [PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT]: {
                    ...validRequest.extensions[
                      PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT
                    ],
                    version: '0.1.0',
                  },
                },
              } as any,
            ],
            paymentType,
            batchVersion,
            batchFee,
            false,
          ).to,
        ).toBe(batchPaymentsArtifact.getAddress('private', '0.1.0'));
      });
    });
  });

  describe('encodePayBatchRequest: multi tokens', () => {
    it('should throw an error if the request is not erc20', async () => {
      const erc20Request = Utils.deepCopy(validRequest) as ClientTypes.IRequestData;
      const ethRequest = Utils.deepCopy(validRequest) as ClientTypes.IRequestData;
      ethRequest.currencyInfo.type = RequestLogicTypes.CURRENCY.ETH;

      await expect(
        payBatchProxyRequest(
          [erc20Request, ethRequest],
          paymentType,
          batchVersion,
          wallet,
          batchFee,
          true,
        ),
      ).rejects.toThrowError(
        'request cannot be processed, or is not an pn-erc20-fee-proxy-contract request',
      );
    });

    it('should throw an error if the currencyInfo has no value', async () => {
      const request = Utils.deepCopy(validRequest);
      request.currencyInfo.value = '';
      await expect(
        payBatchProxyRequest(
          [validRequest, request],
          paymentType,
          batchVersion,
          wallet,
          batchFee,
          true,
        ),
      ).rejects.toThrowError(
        'request cannot be processed, or is not an pn-erc20-fee-proxy-contract request',
      );
    });

    it('should throw an error if currencyInfo has no network', async () => {
      const request = Utils.deepCopy(validRequest);
      request.currencyInfo.network = '';
      await expect(
        payBatchProxyRequest(
          [validRequest, request],
          paymentType,
          batchVersion,
          wallet,
          batchFee,
          true,
        ),
      ).rejects.toThrowError(
        'request cannot be processed, or is not an pn-erc20-fee-proxy-contract request',
      );
    });

    it('should throw an error if request has no extension', async () => {
      const request = Utils.deepCopy(validRequest);
      request.extensions = [] as any;

      await expect(
        payBatchProxyRequest(
          [validRequest, request],
          paymentType,
          batchVersion,
          wallet,
          batchFee,
          true,
        ),
      ).rejects.toThrowError('no payment network found');
    });

    it('should throw an error if there is a wrong version mapping', async () => {
      await expect(
        payBatchProxyRequest(
          [
            {
              ...validRequest,
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
              ...validRequest,
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
          paymentType,
          batchVersion,
          wallet,
          batchFee,
          true,
        ),
      ).rejects.toThrowError('Every payment network type and version must be identical');
    });

    describe('payBatchProxyRequest', () => {
      it('should consider override parameters', async () => {
        const spy = jest.fn();
        const originalSendTransaction = wallet.sendTransaction.bind(wallet);
        wallet.sendTransaction = spy;
        await payBatchProxyRequest(
          [validRequest, validRequest],
          paymentType,
          batchVersion,
          wallet,
          batchFee,
          true,
          {
            gasPrice: '20000000000',
          },
        );
        expect(spy).toHaveBeenCalledWith({
          data:
            '0xfa73314200000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002c0000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fef00000000000000000000000000000000000000000000000000000000000000020000000000000000000000009fbda871d559710256a2502a2517b794b482db400000000000000000000000009fbda871d559710256a2502a2517b794b482db400000000000000000000000000000000000000000000000000000000000000002000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b732000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b732000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002',
          gasPrice: '20000000000',
          to: '0x74e3FC764c2474f25369B9d021b7F92e8441A2Dc',
          value: 0,
        });
        wallet.sendTransaction = originalSendTransaction;
      });

      it('should pay an ERC20 request with fees', async () => {
        // first approve the contract
        const doubleValueRequest = Utils.deepCopy(validRequest);
        doubleValueRequest.expectedAmount = '200';

        const approvalTx = await approveErc20BatchIfNeeded(
          doubleValueRequest,
          wallet.address,
          batchVersion,
          wallet,
        );
        if (approvalTx) {
          await approvalTx.wait(1);
        }

        // get the balance to compare after payment
        const balanceEthBefore = await wallet.getBalance();
        const balanceErc20Before = await getErc20Balance(validRequest, wallet.address, provider);
        const feeBalanceErc20Before = await getErc20Balance(validRequest, feeAddress, provider);

        const tx = await payBatchProxyRequest(
          [validRequest, validRequest],
          paymentType,
          batchVersion,
          wallet,
          batchFee,
          true,
        );
        const confirmedTx = await tx.wait(1);

        const balanceEthAfter = await wallet.getBalance();
        const balanceErc20After = await getErc20Balance(validRequest, wallet.address, provider);
        const feeBalanceErc20After = await getErc20Balance(validRequest, feeAddress, provider);

        expect(confirmedTx.status).toBe(1);
        expect(tx.hash).not.toBeUndefined();

        expect(balanceEthAfter.lte(balanceEthBefore)).toBeTruthy(); // 'ETH balance should be lower'

        // ERC20 balance should be lower
        expect(
          BigNumber.from(balanceErc20After).eq(
            BigNumber.from(balanceErc20Before).sub((100 + (2 + 1)) * 2),
          ),
        ).toBeTruthy();
        // fee ERC20 balance should be higher
        expect(
          BigNumber.from(feeBalanceErc20After).eq(
            BigNumber.from(feeBalanceErc20Before).add((2 + 1) * 2),
          ),
        ).toBeTruthy();
      });
    });

    describe('prepareBatchPaymentTransaction', () => {
      it('should consider the version mapping', () => {
        expect(
          prepareBatchPaymentTransaction(
            [
              {
                ...validRequest,
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
                ...validRequest,
                extensions: {
                  [PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT]: {
                    ...validRequest.extensions[
                      PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT
                    ],
                    version: '0.1.0',
                  },
                },
              } as any,
            ],
            paymentType,
            batchVersion,
            batchFee,
            true,
          ).to,
        ).toBe(batchPaymentsArtifact.getAddress('private', '0.1.0'));
      });
    });
  });
});
