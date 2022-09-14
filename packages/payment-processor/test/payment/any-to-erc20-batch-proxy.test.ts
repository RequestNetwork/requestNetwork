import { Wallet, providers, BigNumber } from 'ethers';

import {
  ClientTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { getErc20Balance } from '../../src/payment/erc20';
import Utils from '@requestnetwork/utils';
import { revokeErc20Approval } from '@requestnetwork/payment-processor/src/payment/utils';
import { EnrichedRequest, IConversionPaymentSettings } from '../../src/index';
import { currencyManager } from './shared';
import {
  approveErc20BatchConversionIfNeeded,
  getBatchConversionProxyAddress,
  payBatchConversionProxyRequest,
  prepareBatchConversionPaymentTransaction,
} from '../../src/payment/batch-conversion-proxy';
import { batchConversionPaymentsArtifact } from '@requestnetwork/smart-contracts';
import { UnsupportedCurrencyError } from '@requestnetwork/currency';
import { ERC20__factory } from '@requestnetwork/smart-contracts/types';
import { BATCH_PAYMENT_NETWORK_ID } from '@requestnetwork/types/dist/payment-types';

/* eslint-disable no-magic-numbers */
/* eslint-disable @typescript-eslint/no-unused-expressions */

/** Used to to calculate batch fees */
const BATCH_DENOMINATOR = 10000;
const BATCH_FEE = 30;
const BATCH_CONV_FEE = 30;
const batchConvVersion = '0.1.0';
const DAITokenAddress = '0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35';
const FAUTokenAddress = '0x9FBDa871d559710256a2502A2517b794B482Db40';
const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
const paymentAddress = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
const feeAddress = '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef';
const provider = new providers.JsonRpcProvider('http://localhost:8545');
const wallet = Wallet.fromMnemonic(mnemonic).connect(provider);

// Cf. ERC20Alpha in TestERC20.sol
const alphaPaymentSettings: IConversionPaymentSettings = {
  currency: {
    type: RequestLogicTypes.CURRENCY.ERC20,
    value: DAITokenAddress,
    network: 'private',
  },
  maxToSpend: '10000000000000000000000000000',
  currencyManager,
};

const EURExpectedAmount = 100;
const EURFeeAmount = 2;
// amounts used for DAI and FAU requests
const expectedAmount = 100000;
const feeAmount = 100;

const validEURRequest: ClientTypes.IRequestData = {
  balance: {
    balance: '0',
    events: [],
  },
  contentData: {},
  creator: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: wallet.address,
  },
  currency: 'EUR',
  currencyInfo: {
    type: RequestLogicTypes.CURRENCY.ISO4217,
    value: 'EUR',
  },
  events: [],
  expectedAmount: EURExpectedAmount,
  extensions: {
    [PaymentTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY]: {
      events: [],
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        feeAddress,
        feeAmount: EURFeeAmount,
        paymentAddress,
        salt: 'salt',
        network: 'private',
        tokensAccepted: [DAITokenAddress],
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

const DAIValidRequest: ClientTypes.IRequestData = {
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
  expectedAmount: expectedAmount,
  extensions: {
    [PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT]: {
      events: [],
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        feeAddress,
        feeAmount: feeAmount,
        paymentAddress: paymentAddress,
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

const FAUValidRequest = Utils.deepCopy(DAIValidRequest) as ClientTypes.IRequestData;
FAUValidRequest.currencyInfo = {
  network: 'private',
  type: RequestLogicTypes.CURRENCY.ERC20 as any,
  value: FAUTokenAddress,
};

let enrichedRequests: EnrichedRequest[] = [];
// EUR and FAU requests modified within tests to throw errors
let EURRequest: ClientTypes.IRequestData;
let FAURequest: ClientTypes.IRequestData;

/**
 * Calcul the expected amount to pay for X euro into Y tokens
 * @param amount in fiat: EUR
 */
const expectedConversionAmount = (amount: number): BigNumber => {
  //   token decimals       10**18
  //   amount               amount / 100
  //   AggEurUsd.sol     x  1.20
  //   AggDaiUsd.sol     /  1.01
  return BigNumber.from(10).pow(18).mul(amount).div(100).mul(120).div(100).mul(100).div(101);
};

describe('erc20-batch-conversion-proxy', () => {
  beforeAll(async () => {
    // revoke DAI and FAU approvals
    await revokeErc20Approval(
      getBatchConversionProxyAddress(validEURRequest, batchConvVersion),
      DAITokenAddress,
      wallet,
    );
    await revokeErc20Approval(
      getBatchConversionProxyAddress(FAUValidRequest, batchConvVersion),
      DAITokenAddress,
      wallet,
    );
  });
  describe(`Conversion:`, () => {
    beforeEach(() => {
      jest.restoreAllMocks();
      EURRequest = Utils.deepCopy(validEURRequest);
      enrichedRequests = [
        {
          paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_CONVERSION_PAYMENTS,
          request: validEURRequest,
          paymentSettings: alphaPaymentSettings,
        },
        {
          paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_CONVERSION_PAYMENTS,
          request: EURRequest,
          paymentSettings: alphaPaymentSettings,
        },
      ];
    });

    describe('Throw an error', () => {
      it('should throw an error if the token is not accepted', async () => {
        await expect(
          payBatchConversionProxyRequest(
            [
              {
                paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_CONVERSION_PAYMENTS,
                request: validEURRequest,
                paymentSettings: {
                  ...alphaPaymentSettings,
                  currency: {
                    ...alphaPaymentSettings.currency,
                    value: '0x775eb53d00dd0acd3ec1696472105d579b9b386b',
                  },
                } as IConversionPaymentSettings,
              },
            ],
            batchConvVersion,
            wallet,
          ),
        ).rejects.toThrowError(
          new UnsupportedCurrencyError({
            value: '0x775eb53d00dd0acd3ec1696472105d579b9b386b',
            network: 'private',
          }),
        );
      });
      it('should throw an error if request has no extension', async () => {
        EURRequest.extensions = [] as any;

        await expect(
          payBatchConversionProxyRequest(
            [
              {
                paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_CONVERSION_PAYMENTS,
                request: EURRequest,
                paymentSettings: alphaPaymentSettings,
              },
            ],
            batchConvVersion,
            wallet,
          ),
        ).rejects.toThrowError('no payment network found');
      });
      it('should throw an error if request has no paymentSettings', async () => {
        await expect(
          payBatchConversionProxyRequest(
            [
              {
                paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_CONVERSION_PAYMENTS,
                request: EURRequest,
                paymentSettings: undefined,
              },
            ],
            batchConvVersion,
            wallet,
          ),
        ).rejects.toThrowError('the enrichedRequest has no paymentSettings');
      });
      it('should throw an error if the request is ETH', async () => {
        EURRequest.currencyInfo.type = RequestLogicTypes.CURRENCY.ETH;
        await expect(
          payBatchConversionProxyRequest(enrichedRequests, batchConvVersion, wallet),
        ).rejects.toThrowError(`wrong request currencyInfo type`);
      });
      it('should throw an error if the request has a wrong payment network id', async () => {
        EURRequest.extensions = {
          // ERC20_FEE_PROXY_CONTRACT instead of ANY_TO_ERC20_PROXY
          [PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT]: {
            events: [],
            id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT,
            type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
            values: {
              feeAddress,
              feeAmount: feeAmount,
              paymentAddress: paymentAddress,
              salt: 'salt',
            },
            version: '0.1.0',
          },
        };

        await expect(
          payBatchConversionProxyRequest(enrichedRequests, batchConvVersion, wallet),
        ).rejects.toThrowError(
          'request cannot be processed, or is not an pn-any-to-erc20-proxy request',
        );
      });
      it("should throw an error if one request's currencyInfo has no value", async () => {
        EURRequest.currencyInfo.value = '';
        await expect(
          payBatchConversionProxyRequest(enrichedRequests, batchConvVersion, wallet),
        ).rejects.toThrowError("The currency '' is unknown or not supported");
      });
      it('should throw an error if request has no extension', async () => {
        EURRequest.extensions = [] as any;
        await expect(
          payBatchConversionProxyRequest(enrichedRequests, batchConvVersion, wallet),
        ).rejects.toThrowError('no payment network found');
      });
      it('should throw an error if there is a wrong version mapping', async () => {
        EURRequest.extensions = {
          [PaymentTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY]: {
            ...EURRequest.extensions[PaymentTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY],
            version: '0.3.0',
          },
        };
        await expect(
          payBatchConversionProxyRequest(enrichedRequests, batchConvVersion, wallet),
        ).rejects.toThrowError('Every payment network type and version must be identical');
      });
    });

    describe('payment', () => {
      it('should consider override parameters', async () => {
        const spy = jest.fn();
        const originalSendTransaction = wallet.sendTransaction.bind(wallet);
        wallet.sendTransaction = spy;
        await payBatchConversionProxyRequest(
          [
            {
              paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_CONVERSION_PAYMENTS,
              request: validEURRequest,
              paymentSettings: alphaPaymentSettings,
            },
          ],
          batchConvVersion,
          wallet,
          { gasPrice: '20000000000' },
        );
        expect(spy).toHaveBeenCalledWith({
          data: '0xf0fa379f0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fef0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000024000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b7320000000000000000000000000000000000000000000000000000000005f5e10000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000001e84800000000000000000000000000000000000000000204fce5e3e250261100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000017b4158805772ced11225e77339f90beb5aae968000000000000000000000000775eb53d00dd0acd3ec1696472105d579b9b386b00000000000000000000000038cf23c52bb4b13f051aec09580a2de845a7fa35000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
          gasPrice: '20000000000',
          to: getBatchConversionProxyAddress(validEURRequest, '0.1.0'),
          value: 0,
        });
        wallet.sendTransaction = originalSendTransaction;
      });
      it('should convert and pay a request in EUR with ERC20', async () => {
        // Approve the contract
        const approvalTx = await approveErc20BatchConversionIfNeeded(
          validEURRequest,
          wallet.address,
          batchConvVersion,
          wallet.provider,
          alphaPaymentSettings,
        );
        expect(approvalTx).toBeDefined();
        if (approvalTx) {
          await approvalTx.wait(1);
        }

        // Get the balances to compare after payment
        const initialETHFromBalance = await wallet.getBalance();
        const initialDAIFromBalance = await ERC20__factory.connect(
          DAITokenAddress,
          provider,
        ).balanceOf(wallet.address);

        // Convert and pay
        const tx = await payBatchConversionProxyRequest(
          [
            {
              paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_CONVERSION_PAYMENTS,
              request: validEURRequest,
              paymentSettings: alphaPaymentSettings,
            },
          ],
          batchConvVersion,
          wallet,
        );
        const confirmedTx = await tx.wait(1);
        expect(confirmedTx.status).toEqual(1);
        expect(tx.hash).toBeDefined();
        // Get the new balances
        const ETHFromBalance = await wallet.getBalance();
        const DAIFromBalance = await ERC20__factory.connect(DAITokenAddress, provider).balanceOf(
          wallet.address,
        );
        // Check each balance
        const amountToPay = expectedConversionAmount(EURExpectedAmount);
        const feeToPay = expectedConversionAmount(EURFeeAmount);
        const expectedAmountToPay = amountToPay
          .add(feeToPay)
          .mul(BATCH_DENOMINATOR + BATCH_CONV_FEE)
          .div(BATCH_DENOMINATOR);
        expect(
          BigNumber.from(initialETHFromBalance).sub(ETHFromBalance).toNumber(),
        ).toBeGreaterThan(0);
        expect(
          BigNumber.from(initialDAIFromBalance).sub(BigNumber.from(DAIFromBalance)),
          // Calculation of expectedAmountToPay
          //   expectedAmount:      1.00
          //   feeAmount:        +   .02
          //                     =  1.02
          //   AggEurUsd.sol     x  1.20
          //   AggDaiUsd.sol     /  1.01
          //   BATCH_CONV_FEE      x  1.003
          //   (exact result)    =  1.215516831683168316 (over 18 decimals for this ERC20)
        ).toEqual(expectedAmountToPay);
      });
      it('should convert and pay two requests in EUR with ERC20', async () => {
        // Get the balances to compare after payment
        const initialETHFromBalance = await wallet.getBalance();
        const initialDAIFromBalance = await ERC20__factory.connect(
          DAITokenAddress,
          provider,
        ).balanceOf(wallet.address);

        // Convert and pay
        const tx = await payBatchConversionProxyRequest(
          Array(2).fill({
            paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_CONVERSION_PAYMENTS,
            request: validEURRequest,
            paymentSettings: alphaPaymentSettings,
          }),
          batchConvVersion,
          wallet,
        );
        const confirmedTx = await tx.wait(1);
        expect(confirmedTx.status).toEqual(1);
        expect(tx.hash).toBeDefined();
        // Get the new balances
        const ETHFromBalance = await wallet.getBalance();
        const DAIFromBalance = await ERC20__factory.connect(DAITokenAddress, provider).balanceOf(
          wallet.address,
        );
        // Check each balance
        const amountToPay = expectedConversionAmount(EURExpectedAmount).mul(2); // multiply by the number of requests: 2
        const feeToPay = expectedConversionAmount(EURFeeAmount).mul(2); // multiply by the number of requests: 2
        const expectedAmoutToPay = amountToPay
          .add(feeToPay)
          .mul(BATCH_DENOMINATOR + BATCH_CONV_FEE)
          .div(BATCH_DENOMINATOR);
        expect(
          BigNumber.from(initialETHFromBalance).sub(ETHFromBalance).toNumber(),
        ).toBeGreaterThan(0);
        expect(BigNumber.from(initialDAIFromBalance).sub(BigNumber.from(DAIFromBalance))).toEqual(
          expectedAmoutToPay,
        );
      });
      it('should pay 3 heterogeneous ERC20 payments with and without conversion', async () => {
        // Get the balances to compare after payment
        const initialETHFromBalance = await wallet.getBalance();
        const initialDAIFromBalance = await ERC20__factory.connect(
          DAITokenAddress,
          provider,
        ).balanceOf(wallet.address);

        // Convert the two first requests and pay the three requests
        const tx = await payBatchConversionProxyRequest(
          [
            {
              paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_CONVERSION_PAYMENTS,
              request: validEURRequest,
              paymentSettings: alphaPaymentSettings,
            },
            {
              paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_CONVERSION_PAYMENTS,
              request: validEURRequest,
              paymentSettings: alphaPaymentSettings,
            },
            {
              paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_PAYMENTS,
              request: DAIValidRequest,
            },
          ],
          batchConvVersion,
          wallet,
        );
        const confirmedTx = await tx.wait(1);
        expect(confirmedTx.status).toEqual(1);
        expect(tx.hash).toBeDefined();
        // Get the new balances
        const ETHFromBalance = await wallet.getBalance();
        const DAIFromBalance = await ERC20__factory.connect(DAITokenAddress, provider).balanceOf(
          wallet.address,
        );

        // Check each balance
        let expectedConvAmountToPay = expectedConversionAmount(EURExpectedAmount).mul(2); // multiply by the number of conversion requests: 2
        const feeToPay = expectedConversionAmount(EURFeeAmount).mul(2); // multiply by the number of conversion requests: 2
        // expectedConvAmountToPay with fees and batch fees
        expectedConvAmountToPay = expectedConvAmountToPay
          .add(feeToPay)
          .mul(BATCH_DENOMINATOR + BATCH_CONV_FEE)
          .div(BATCH_DENOMINATOR);

        const expectedNoConvAmountToPay = BigNumber.from(DAIValidRequest.expectedAmount)
          .add(feeAmount)
          .mul(BATCH_DENOMINATOR + BATCH_FEE)
          .div(BATCH_DENOMINATOR);

        expect(
          BigNumber.from(initialETHFromBalance).sub(ETHFromBalance).toNumber(),
        ).toBeGreaterThan(0);
        expect(BigNumber.from(initialDAIFromBalance).sub(BigNumber.from(DAIFromBalance))).toEqual(
          expectedConvAmountToPay.add(expectedNoConvAmountToPay),
        );
      });
    });
  });

  describe('No conversion:', () => {
    beforeEach(() => {
      FAURequest = Utils.deepCopy(FAUValidRequest);
      enrichedRequests = [
        {
          paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_PAYMENTS,
          request: DAIValidRequest,
        },
        {
          paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_PAYMENTS,
          request: FAURequest,
        },
      ];
    });

    describe('Throw an error', () => {
      it('should throw an error if the request is not erc20', async () => {
        FAURequest.currencyInfo.type = RequestLogicTypes.CURRENCY.ETH;
        await expect(
          payBatchConversionProxyRequest(enrichedRequests, batchConvVersion, wallet),
        ).rejects.toThrowError(
          'request cannot be processed, or is not an pn-erc20-fee-proxy-contract request',
        );
      });

      it("should throw an error if one request's currencyInfo has no value", async () => {
        FAURequest.currencyInfo.value = '';
        await expect(
          payBatchConversionProxyRequest(enrichedRequests, batchConvVersion, wallet),
        ).rejects.toThrowError(
          'request cannot be processed, or is not an pn-erc20-fee-proxy-contract request',
        );
      });

      it("should throw an error if one request's currencyInfo has no network", async () => {
        FAURequest.currencyInfo.network = '';
        await expect(
          payBatchConversionProxyRequest(enrichedRequests, batchConvVersion, wallet),
        ).rejects.toThrowError(
          'request cannot be processed, or is not an pn-erc20-fee-proxy-contract request',
        );
      });

      it('should throw an error if request has no extension', async () => {
        FAURequest.extensions = [] as any;
        await expect(
          payBatchConversionProxyRequest(enrichedRequests, batchConvVersion, wallet),
        ).rejects.toThrowError('no payment network found');
      });

      it('should throw an error if there is a wrong version mapping', async () => {
        FAURequest.extensions = {
          [PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT]: {
            ...DAIValidRequest.extensions[PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT],
            version: '0.3.0',
          },
        };
        await expect(
          payBatchConversionProxyRequest(enrichedRequests, batchConvVersion, wallet),
        ).rejects.toThrowError('Every payment network type and version must be identical');
      });
    });

    describe('payBatchConversionProxyRequest', () => {
      it('should consider override parameters', async () => {
        const spy = jest.fn();
        const originalSendTransaction = wallet.sendTransaction.bind(wallet);
        wallet.sendTransaction = spy;
        await payBatchConversionProxyRequest(enrichedRequests, batchConvVersion, wallet, {
          gasPrice: '20000000000',
        });
        expect(spy).toHaveBeenCalledWith({
          data: '0xf0fa379f0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fef00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000002a0000000000000000000000000000000000000000000000000000000000000000200000000000000000000000038cf23c52bb4b13f051aec09580a2de845a7fa350000000000000000000000009fbda871d559710256a2502a2517b794b482db400000000000000000000000000000000000000000000000000000000000000002000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b732000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b732000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000186a000000000000000000000000000000000000000000000000000000000000186a0000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000064',
          gasPrice: '20000000000',
          to: getBatchConversionProxyAddress(DAIValidRequest, '0.1.0'),
          value: 0,
        });
        wallet.sendTransaction = originalSendTransaction;
      });
      it(`should pay 2 differents ERC20 requests with fees`, async () => {
        // approve the contract for DAI and FAU tokens
        const FAUApprovalTx = await approveErc20BatchConversionIfNeeded(
          FAUValidRequest,
          wallet.address,
          batchConvVersion,
          wallet,
        );
        if (FAUApprovalTx) await FAUApprovalTx.wait(1);

        const DAIApprovalTx = await approveErc20BatchConversionIfNeeded(
          DAIValidRequest,
          wallet.address,
          batchConvVersion,
          wallet,
        );
        if (DAIApprovalTx) await DAIApprovalTx.wait(1);

        // get the balance
        const initialETHFromBalance = await wallet.getBalance();
        const initialDAIFromBalance = await getErc20Balance(
          DAIValidRequest,
          wallet.address,
          provider,
        );
        const initialDAIFeeBalance = await getErc20Balance(DAIValidRequest, feeAddress, provider);

        const initialFAUFromBalance = await getErc20Balance(
          FAUValidRequest,
          wallet.address,
          provider,
        );
        const initialFAUFeeBalance = await getErc20Balance(FAUValidRequest, feeAddress, provider);

        // Batch payment
        const tx = await payBatchConversionProxyRequest(enrichedRequests, batchConvVersion, wallet);
        const confirmedTx = await tx.wait(1);

        const ETHFromBalance = await wallet.getBalance();
        const DAIFromBalance = await getErc20Balance(DAIValidRequest, wallet.address, provider);
        const DAIFeeBalance = await getErc20Balance(DAIValidRequest, feeAddress, provider);
        const FAUFromBalance = await getErc20Balance(FAUValidRequest, wallet.address, provider);
        const FAUFeeBalance = await getErc20Balance(FAUValidRequest, feeAddress, provider);

        expect(confirmedTx.status).toBe(1);
        expect(tx.hash).not.toBeUndefined();
        expect(ETHFromBalance.lte(initialETHFromBalance)).toBeTruthy(); // 'ETH balance should be lower'

        const expectedDAIFeeAmountToPay =
          feeAmount + ((DAIValidRequest.expectedAmount as number) * BATCH_FEE) / BATCH_DENOMINATOR;
        const expectedFAUFeeAmountToPay =
          feeAmount + ((FAUValidRequest.expectedAmount as number) * BATCH_FEE) / BATCH_DENOMINATOR;

        // Compare FAUValidRequest balances
        expect(BigNumber.from(FAUFromBalance)).toEqual(
          BigNumber.from(initialFAUFromBalance).sub(
            (FAUValidRequest.expectedAmount as number) + expectedFAUFeeAmountToPay,
          ),
        );
        expect(BigNumber.from(FAUFeeBalance)).toEqual(
          BigNumber.from(initialFAUFeeBalance).add(expectedFAUFeeAmountToPay),
        );
        // compare DAIValidRequest balances
        expect(BigNumber.from(DAIFromBalance)).toEqual(
          BigNumber.from(initialDAIFromBalance)
            .sub(DAIValidRequest.expectedAmount as number)
            .sub(expectedDAIFeeAmountToPay),
        );
        expect(BigNumber.from(DAIFeeBalance)).toEqual(
          BigNumber.from(initialDAIFeeBalance).add(expectedDAIFeeAmountToPay),
        );
      });
    });

    describe('prepareBatchPaymentTransaction', () => {
      it('should consider the version mapping', () => {
        expect(
          prepareBatchConversionPaymentTransaction(
            [
              {
                paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_PAYMENTS,
                request: {
                  ...DAIValidRequest,
                  extensions: {
                    [PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT]: {
                      ...DAIValidRequest.extensions[
                        PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT
                      ],
                      version: '0.1.0',
                    },
                  },
                } as any,
              } as EnrichedRequest,
              {
                request: {
                  ...FAUValidRequest,
                  extensions: {
                    [PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT]: {
                      ...FAUValidRequest.extensions[
                        PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT
                      ],
                      version: '0.1.0',
                    },
                  },
                } as any,
              } as EnrichedRequest,
            ],
            batchConvVersion,
          ).to,
        ).toBe(batchConversionPaymentsArtifact.getAddress('private', '0.1.0'));
      });
    });
  });
});
