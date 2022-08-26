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
} from '../../src/payment/batch-conv-proxy';
import { sameCurrencyValue } from './shared';
import { batchConversionPaymentsArtifact } from '@requestnetwork/smart-contracts';
import { UnsupportedCurrencyError } from '@requestnetwork/currency';
import { ERC20__factory } from '@requestnetwork/smart-contracts/types';

/* eslint-disable no-magic-numbers */
/* eslint-disable @typescript-eslint/no-unused-expressions */

// Cf. ERC20Alpha in TestERC20.sol
const erc20ContractAddress = '0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35';
const alphaPaymentSettings: IConversionPaymentSettings = {
  currency: {
    type: RequestLogicTypes.CURRENCY.ERC20,
    value: erc20ContractAddress,
    network: 'private',
  },
  maxToSpend: BigNumber.from(2).pow(250).sub(1), // is updated later
  currencyManager,
};

/** Used to to calculate batch fees */
const tenThousand = 10000;
const batchFee = 30;
const batchConvFee = 30;
const batchConvVersion = '0.1.0';
const DAITokenAddress = '0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35';
const FAUTokenAddress = '0x9FBDa871d559710256a2502A2517b794B482Db40'; // TestERC20 address
const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
const paymentAddress = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
const feeAddress = '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef';
const provider = new providers.JsonRpcProvider('http://localhost:8545');
const wallet = Wallet.fromMnemonic(mnemonic).connect(provider);

const EURExpectedAmount = 100;
const EURFeeAmount = 2;
const validEuroRequest: ClientTypes.IRequestData = {
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
        tokensAccepted: [erc20ContractAddress],
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

const expectedAmount = 100000;
const feeAmount = 100;
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

const fauValidRequest = Utils.deepCopy(validRequest) as ClientTypes.IRequestData;
fauValidRequest.currencyInfo = {
  network: 'private',
  type: RequestLogicTypes.CURRENCY.ERC20 as any,
  value: FAUTokenAddress,
};

let request1: ClientTypes.IRequestData;
let request2: ClientTypes.IRequestData;
let enrichedRequests: EnrichedRequest[] = [];

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

/**
 * Gets the encoding depending of two ERC20 (no conversion) requests predefined:
 * validRequest and fauValidRequest
 */
const expectedEncoding = (
  request1: ClientTypes.IRequestData,
  request2: ClientTypes.IRequestData,
): string => {
  if (sameCurrencyValue(request1, validRequest) && sameCurrencyValue(request2, validRequest)) {
    return '0xf0fa379f0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fef00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000002a0000000000000000000000000000000000000000000000000000000000000000200000000000000000000000038cf23c52bb4b13f051aec09580a2de845a7fa3500000000000000000000000038cf23c52bb4b13f051aec09580a2de845a7fa350000000000000000000000000000000000000000000000000000000000000002000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b732000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b732000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000186a000000000000000000000000000000000000000000000000000000000000186a0000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000064';
  } else {
    return '0xf0fa379f0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fef00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000002a0000000000000000000000000000000000000000000000000000000000000000200000000000000000000000038cf23c52bb4b13f051aec09580a2de845a7fa350000000000000000000000009fbda871d559710256a2502a2517b794b482db400000000000000000000000000000000000000000000000000000000000000002000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b732000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b732000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000186a000000000000000000000000000000000000000000000000000000000000186a0000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000064';
  }
};

describe(`[Conversion]: erc20-batch-conversion-proxy`, () => {
  beforeAll(async () => {
    // revoke DAI approval
    await revokeErc20Approval(
      getBatchConversionProxyAddress(validEuroRequest, batchConvVersion, alphaPaymentSettings),
      erc20ContractAddress,
      wallet,
    );
    // revoke FAU approval
    await revokeErc20Approval(
      getBatchConversionProxyAddress(fauValidRequest, batchConvVersion),
      erc20ContractAddress,
      wallet,
    );
    // maxToSpend should be around the amountToPay * 1.03, it depends of the front end
    // we do a simplification for the purpose of the test with: requestedAmount < maxToSpend < payeerBalance
    alphaPaymentSettings.maxToSpend = '10000000000000000000000000000';
  });

  beforeEach(() => {
    jest.restoreAllMocks();
    request1 = Utils.deepCopy(validEuroRequest) as ClientTypes.IRequestData;
    request2 = Utils.deepCopy(validEuroRequest) as ClientTypes.IRequestData;
    enrichedRequests = [
      {
        paymentNetworkId: 0,
        request: request1,
        paymentSettings: alphaPaymentSettings,
      },
      {
        paymentNetworkId: 0,
        request: request2,
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
              paymentNetworkId: 0,
              request: request1,
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
      const request = Utils.deepCopy(validEuroRequest);
      request.extensions = [] as any;

      await expect(
        payBatchConversionProxyRequest(
          [
            {
              paymentNetworkId: 0,
              request: request,
              paymentSettings: alphaPaymentSettings,
            },
          ],
          batchConvVersion,
          wallet,
        ),
      ).rejects.toThrowError('no payment network found');
    });
    it('should throw an error if the request is ETH', async () => {
      request2.currencyInfo.type = RequestLogicTypes.CURRENCY.ETH;
      await expect(
        payBatchConversionProxyRequest(enrichedRequests, batchConvVersion, wallet),
      ).rejects.toThrowError(`wrong request currencyInfo type`);
    });
    it("should throw an error if one request's currencyInfo has no value", async () => {
      request2.currencyInfo.value = '';
      await expect(
        payBatchConversionProxyRequest(enrichedRequests, batchConvVersion, wallet),
      ).rejects.toThrowError("The currency '' is unknown or not supported");
    });
    it('should throw an error if request has no extension', async () => {
      request2.extensions = [] as any;
      await expect(
        payBatchConversionProxyRequest(enrichedRequests, batchConvVersion, wallet),
      ).rejects.toThrowError('no payment network found');
    });
    it('should throw an error if there is a wrong version mapping', async () => {
      request2.extensions = {
        [PaymentTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY]: {
          ...request2.extensions[PaymentTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY],
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
            paymentNetworkId: 0,
            request: request1,
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
        to: getBatchConversionProxyAddress(request1, '0.1.0', alphaPaymentSettings),
        value: 0,
      });
      wallet.sendTransaction = originalSendTransaction;
    });
    it('should convert and pay a request in EUR with ERC20', async () => {
      // Approve the contract
      const approvalTx = await approveErc20BatchConversionIfNeeded(
        validEuroRequest,
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
      const balanceEthBefore = await wallet.getBalance();
      const balanceTokenBefore = await ERC20__factory.connect(
        erc20ContractAddress,
        provider,
      ).balanceOf(wallet.address);

      // Convert and pay
      const tx = await payBatchConversionProxyRequest(
        [
          {
            paymentNetworkId: 0,
            request: validEuroRequest,
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
      const balanceEthAfter = await wallet.getBalance();
      const balanceTokenAfter = await ERC20__factory.connect(
        erc20ContractAddress,
        provider,
      ).balanceOf(wallet.address);
      // Check each balance
      const amountToPay = expectedConversionAmount(EURExpectedAmount);
      const feeToPay = expectedConversionAmount(EURFeeAmount);
      const expectedAmountToPay = amountToPay
        .add(feeToPay)
        .mul(tenThousand + batchConvFee)
        .div(tenThousand);
      expect(BigNumber.from(balanceEthBefore).sub(balanceEthAfter).toNumber()).toBeGreaterThan(0);
      expect(
        BigNumber.from(balanceTokenBefore).sub(BigNumber.from(balanceTokenAfter)),
        // Here is simplified approximation of the calcul
        //   expectedAmount:      1.00
        //   feeAmount:        +   .02
        //                     =  1.02
        //   AggEurUsd.sol     x  1.20
        //   AggDaiUsd.sol     /  1.01
        //   batchConvFee      x  1.003
        //   (exact result)    =  1.215516831683168316 (over 18 decimals for this ERC20)
      ).toEqual(expectedAmountToPay);
    });
    it('should convert and pay two requests in EUR with ERC20', async () => {
      // Get the balances to compare after payment
      const balanceEthBefore = await wallet.getBalance();
      const balanceTokenBefore = await ERC20__factory.connect(
        erc20ContractAddress,
        provider,
      ).balanceOf(wallet.address);

      // Convert and pay
      const tx = await payBatchConversionProxyRequest(
        [
          {
            paymentNetworkId: 0,
            request: validEuroRequest,
            paymentSettings: alphaPaymentSettings,
          },
          {
            paymentNetworkId: 0,
            request: validEuroRequest,
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
      const balanceEthAfter = await wallet.getBalance();
      const balanceTokenAfter = await ERC20__factory.connect(
        erc20ContractAddress,
        provider,
      ).balanceOf(wallet.address);
      // Check each balance
      const amountToPay = expectedConversionAmount(EURExpectedAmount).mul(2); // multiply by the number of requests: 2
      const feeToPay = expectedConversionAmount(EURFeeAmount).mul(2); // multiply by the number of requests: 2
      const expectedAmout = amountToPay
        .add(feeToPay)
        .mul(tenThousand + batchConvFee)
        .div(tenThousand);
      expect(BigNumber.from(balanceEthBefore).sub(balanceEthAfter).toNumber()).toBeGreaterThan(0);
      expect(BigNumber.from(balanceTokenBefore).sub(BigNumber.from(balanceTokenAfter))).toEqual(
        expectedAmout,
      );
    });
    it('should convert and pay two requests in EUR with ERC20 and one ERC20 payment', async () => {
      // Get the balances to compare after payment
      const balanceEthBefore = await wallet.getBalance();
      const balanceTokenBefore = await ERC20__factory.connect(
        erc20ContractAddress,
        provider,
      ).balanceOf(wallet.address);

      // Convert the two first requests and pay the three requests
      const tx = await payBatchConversionProxyRequest(
        [
          {
            paymentNetworkId: 0,
            request: validEuroRequest,
            paymentSettings: alphaPaymentSettings,
          },
          {
            paymentNetworkId: 0,
            request: validEuroRequest,
            paymentSettings: alphaPaymentSettings,
          },
          {
            paymentNetworkId: 2,
            request: validRequest,
          },
        ],
        batchConvVersion,
        wallet,
      );
      const confirmedTx = await tx.wait(1);
      expect(confirmedTx.status).toEqual(1);
      expect(tx.hash).toBeDefined();
      // Get the new balances
      const balanceEthAfter = await wallet.getBalance();
      const balanceTokenAfter = await ERC20__factory.connect(
        erc20ContractAddress,
        provider,
      ).balanceOf(wallet.address);

      // Check each balance
      // amountToPay without fees
      let amountToPay = expectedConversionAmount(EURExpectedAmount).mul(2); // multiply by the number of conversion requests: 2
      const feeToPay = expectedConversionAmount(EURFeeAmount).mul(2); // multiply by the number of conversion requests: 2
      // amountToPay with fees
      amountToPay = amountToPay
        .add(feeToPay)
        .mul(tenThousand + batchConvFee)
        .div(tenThousand);

      const noConvExpectedAmount = BigNumber.from(validRequest.expectedAmount);
      const noConvAmountToPay = noConvExpectedAmount
        .add(feeAmount)
        .mul(tenThousand + batchFee)
        .div(tenThousand);

      expect(BigNumber.from(balanceEthBefore).sub(balanceEthAfter).toNumber()).toBeGreaterThan(0);
      expect(BigNumber.from(balanceTokenBefore).sub(BigNumber.from(balanceTokenAfter))).toEqual(
        amountToPay.add(noConvAmountToPay),
      );
    });
  });
});

/**
 * Test only ERC20 requests. No Conversion
 * @param _request1 ERC20 request to test/pay, no conversion
 * @param _request2 ERC20 request to test/pay, no conversion
 */
const testERC20Batch = (
  testDescription: string,
  _request1: ClientTypes.IRequestData,
  _request2: ClientTypes.IRequestData,
) => {
  describe(`[No conversion]: erc20-batch-conversion-proxy ${testDescription}`, () => {
    beforeAll(async () => {
      // revoke DAI approval
      await revokeErc20Approval(
        getBatchConversionProxyAddress(validRequest, batchConvVersion),
        erc20ContractAddress,
        wallet,
      );
      // revoke FAU approval
      await revokeErc20Approval(
        getBatchConversionProxyAddress(fauValidRequest, batchConvVersion),
        erc20ContractAddress,
        wallet,
      );
    });

    beforeEach(() => {
      request1 = Utils.deepCopy(_request1);
      request2 = Utils.deepCopy(_request2);
      enrichedRequests = [
        {
          paymentNetworkId: 2,
          request: request1,
        },
        {
          paymentNetworkId: 2,
          request: request2,
        },
      ];
    });

    describe('Throw an error', () => {
      it('should throw an error if the request is not erc20', async () => {
        request2.currencyInfo.type = RequestLogicTypes.CURRENCY.ETH;
        await expect(
          payBatchConversionProxyRequest(enrichedRequests, batchConvVersion, wallet),
        ).rejects.toThrowError(
          'request cannot be processed, or is not an pn-erc20-fee-proxy-contract request',
        );
      });

      it("should throw an error if one request's currencyInfo has no value", async () => {
        request2.currencyInfo.value = '';
        await expect(
          payBatchConversionProxyRequest(enrichedRequests, batchConvVersion, wallet),
        ).rejects.toThrowError(
          'request cannot be processed, or is not an pn-erc20-fee-proxy-contract request',
        );
      });

      it("should throw an error if one request's currencyInfo has no network", async () => {
        request2.currencyInfo.network = '';
        await expect(
          payBatchConversionProxyRequest(enrichedRequests, batchConvVersion, wallet),
        ).rejects.toThrowError(
          'request cannot be processed, or is not an pn-erc20-fee-proxy-contract request',
        );
      });

      it('should throw an error if request has no extension', async () => {
        request2.extensions = [] as any;
        await expect(
          payBatchConversionProxyRequest(enrichedRequests, batchConvVersion, wallet),
        ).rejects.toThrowError('no payment network found');
      });

      it('should throw an error if there is a wrong version mapping', async () => {
        request2.extensions = {
          [PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT]: {
            ...validRequest.extensions[PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT],
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
          data: expectedEncoding(request1, request2),
          gasPrice: '20000000000',
          to: getBatchConversionProxyAddress(request1, '0.1.0'),
          value: 0,
        });
        wallet.sendTransaction = originalSendTransaction;
      });
      it(`should pay 2 ERC20 requests with fees`, async () => {
        // first approve the contract
        const tmpRequest1 = Utils.deepCopy(request1);
        const isMultiToken = !sameCurrencyValue(request1, request2);
        let amount = BigNumber.from(request1.expectedAmount);
        if (!isMultiToken) {
          amount = amount.add(BigNumber.from(request2.expectedAmount));
          tmpRequest1.expectedAmount = amount.toString();
        } else {
          const ApprovalTx2 = await approveErc20BatchConversionIfNeeded(
            request2,
            wallet.address,
            batchConvVersion,
            wallet,
          );
          if (ApprovalTx2) {
            await ApprovalTx2.wait(1);
          }
        }
        const approvalTx1 = await approveErc20BatchConversionIfNeeded(
          tmpRequest1,
          wallet.address,
          batchConvVersion,
          wallet,
        );

        if (approvalTx1) {
          await approvalTx1.wait(1);
        }

        // get the balance
        const balanceEthBefore = await wallet.getBalance();
        const balanceErc20Before = await getErc20Balance(request1, wallet.address, provider);
        const feeBalanceErc20Before = await getErc20Balance(request1, feeAddress, provider);

        const balanceErc20Before2 = await getErc20Balance(request2, wallet.address, provider);
        const feeBalanceErc20Before2 = await getErc20Balance(request2, feeAddress, provider);

        // Batch payment
        const tx = await payBatchConversionProxyRequest(enrichedRequests, batchConvVersion, wallet);
        const confirmedTx = await tx.wait(1);

        const balanceEthAfter = await wallet.getBalance();
        const balanceErc20After = await getErc20Balance(request1, wallet.address, provider);
        const feeBalanceErc20After = await getErc20Balance(request1, feeAddress, provider);

        expect(confirmedTx.status).toBe(1);
        expect(tx.hash).not.toBeUndefined();
        expect(balanceEthAfter.lte(balanceEthBefore)).toBeTruthy(); // 'ETH balance should be lower'

        let feeAmountExpected =
          feeAmount +
          (expectedAmount * batchFee) / tenThousand +
          (feeAmount + (expectedAmount * batchFee) / tenThousand);
        if (isMultiToken) {
          feeAmountExpected = feeAmount + (expectedAmount * batchFee) / tenThousand; // Will be sent on the 2nd token fee address
          const balanceErc20After2 = await getErc20Balance(request2, wallet.address, provider);
          const feeBalanceErc20After2 = await getErc20Balance(request2, feeAddress, provider);
          // Compare request2 balances
          expect(BigNumber.from(balanceErc20After2)).toEqual(
            BigNumber.from(balanceErc20Before2).sub(expectedAmount + feeAmountExpected),
          );
          expect(BigNumber.from(feeBalanceErc20After2)).toEqual(
            BigNumber.from(feeBalanceErc20Before2).add(feeAmountExpected),
          );
        }
        // compare request 1 balances
        expect(BigNumber.from(balanceErc20After)).toEqual(
          BigNumber.from(balanceErc20Before).sub(amount.add(feeAmountExpected)),
        );
        expect(BigNumber.from(feeBalanceErc20After)).toEqual(
          BigNumber.from(feeBalanceErc20Before).add(feeAmountExpected),
        );
      });
    });

    describe('prepareBatchPaymentTransaction', () => {
      it('should consider the version mapping', () => {
        expect(
          prepareBatchConversionPaymentTransaction(
            [
              {
                paymentNetworkId: 2,
                request: {
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
              } as EnrichedRequest,
              {
                request: {
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
              } as EnrichedRequest,
            ],
            batchConvVersion,
          ).to,
        ).toBe(batchConversionPaymentsArtifact.getAddress('private', '0.1.0'));
      });
    });
  });
};

testERC20Batch('Same tokens', validRequest, validRequest);
testERC20Batch('Different tokens', validRequest, fauValidRequest);
