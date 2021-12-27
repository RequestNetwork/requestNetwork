import { Wallet, providers, BigNumber } from 'ethers';

import {
  ClientTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import { approveErc20ForSwapWithConversionIfNeeded } from '../../src/payment/swap-conversion-erc20';
import { ERC20, ERC20__factory } from '@requestnetwork/smart-contracts/types';
import { swapToPayAnyToErc20Request } from '../../src/payment/swap-any-to-erc20';
import { IConversionSettings } from '../../src/payment/settings';

import { currencyManager } from './shared';
import { UnsupportedCurrencyError } from '@requestnetwork/currency';

/* eslint-disable no-magic-numbers */
/* eslint-disable @typescript-eslint/no-unused-expressions */

const paymentTokenAddress = '0x9FBDa871d559710256a2502A2517b794B482Db40';
const acceptedTokenAddress = '0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35';
let paymentToken: ERC20;
let acceptedToken: ERC20;

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
  currency: 'USD',
  currencyInfo: {
    type: RequestLogicTypes.CURRENCY.ISO4217,
    value: 'USD',
  },

  events: [],
  expectedAmount: '100',
  extensions: {
    [PaymentTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY]: {
      events: [],
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        feeAddress,
        feeAmount: '2',
        paymentAddress,
        salt: 'salt',
        acceptedTokens: [acceptedTokenAddress],
        network: 'private',
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

const validSwapSettings = {
  deadline: 2599732187000, // This test will fail in 2052
  maxInputAmount: '3000000000000000000',
  path: [paymentTokenAddress, acceptedTokenAddress],
};
const validConversionSettings: IConversionSettings = {
  currency: {
    type: 'ERC20' as any,
    value: acceptedTokenAddress,
    network: 'private',
  },
  currencyManager,
};

beforeAll(async () => {
  paymentToken = await ERC20__factory.connect(paymentTokenAddress, provider);
  acceptedToken = await ERC20__factory.connect(acceptedTokenAddress, provider);
});

describe('swap-any-to-erc20', () => {
  describe('swapErc20FeeProxyRequest', () => {
    it('should throw an error if the settings are missing', async () => {
      await expect(
        swapToPayAnyToErc20Request(validRequest, wallet, {
          conversion: validConversionSettings,
        }),
      ).rejects.toThrowError('Swap Settings are required');

      await expect(
        swapToPayAnyToErc20Request(validRequest, wallet, {
          swap: validSwapSettings,
        }),
      ).rejects.toThrowError('Conversion Settings are required');
    });

    it('should throw an error if the payment network is wrong', async () => {
      const request = Utils.deepCopy(validRequest);
      delete request.extensions[PaymentTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY];

      await expect(
        swapToPayAnyToErc20Request(request, wallet, {
          conversion: validConversionSettings,
          swap: validSwapSettings,
        }),
      ).rejects.toThrowError('The request must have the payment network any-to-erc20-proxy');
    });

    it('should throw an error if the conversion path is impossible', async () => {
      const request = Utils.deepCopy(validRequest);
      (request.currencyInfo = {
        type: RequestLogicTypes.CURRENCY.ISO4217,
        value: 'XXX',
      }),
        await expect(
          swapToPayAnyToErc20Request(request, wallet, {
            conversion: validConversionSettings,
            swap: validSwapSettings,
          }),
        ).rejects.toThrowError(
          /Impossible to find a conversion path between from XXX \(0x.*\) to ERC20_1 \(0x.*\)/,
        );
    });

    it('should throw an error if the conversion currency is not an acceptedTokens', async () => {
      const wrongCurrency = {
        type: 'ERC20' as any,
        value: '0x17b4158805772ced11225e77339f90beb5aae968',
        network: 'private',
      };
      await expect(
        swapToPayAnyToErc20Request(validRequest, wallet, {
          conversion: {
            currency: wrongCurrency,
            currencyManager,
          },
          swap: {
            deadline: 2599732187000, // This test will fail in 2052
            maxInputAmount: '3000000000000000000',
            path: [paymentTokenAddress, wrongCurrency.value],
          },
        }),
      ).rejects.toThrowError(new UnsupportedCurrencyError(wrongCurrency));
    });

    it('should swap and pay with an ERC20 request with fees', async () => {
      // first approve the SwapToPay contract to spend tokens
      const approvalTx = await approveErc20ForSwapWithConversionIfNeeded(
        validRequest,
        wallet.address,
        paymentTokenAddress,
        wallet.provider,
        BigNumber.from(204).mul(BigNumber.from(10).pow(18)),
      );
      if (approvalTx) {
        await approvalTx.wait(1);
      }

      // get the balances to compare after payment
      const initialPayerBalance = await paymentToken.balanceOf(wallet.address);
      const initialPayeeBalance = await acceptedToken.balanceOf(paymentAddress);
      const initialBuilderBalance = await acceptedToken.balanceOf(feeAddress);

      // Swap and pay
      const tx = await swapToPayAnyToErc20Request(validRequest, wallet, {
        swap: validSwapSettings,
        conversion: validConversionSettings,
      });

      const confirmedTx = await tx.wait(1);

      expect(confirmedTx.status).toEqual(1);
      expect(tx.hash).toBeDefined();

      // Get the new balances
      const finalPayerBalance = await paymentToken.balanceOf(wallet.address);
      const finalPayeeBalance = await acceptedToken.balanceOf(paymentAddress);
      const finalBuilderBalance = await acceptedToken.balanceOf(feeAddress);

      // Check each balance

      //   expectedAmount:      100000000
      //   feeAmount:        +    2000000
      //                     =  102000000 (8 decimals)
      //   AggDaiUsd.sol     /  101000000
      //                     =  1009900990099009900 (18 decimals)
      //   Swapper           *  2
      //                     =  2019801980198019800 (18 decimals) paid by payer in erc20BeforeSwap
      expect(finalPayerBalance.toString()).toEqual(
        initialPayerBalance.sub('2019801980198019800').toString(),
      );

      //   expectedAmount:      100000000 (8 decimals)
      //   AggDaiUsd.sol     /  101000000
      //                     =  990099009900990099 (18 decimals) received by payee in erc20AfterConversion
      expect(finalPayeeBalance.toString()).toEqual(
        initialPayeeBalance.add('990099009900990099').toString(),
      );

      //   feeAmount:           2000000 (8 decimals)
      //   AggDaiUsd.sol     /  101000000
      //                     =  19801980198019801 (18 decimals) received by fee address in erc20AfterConversion
      expect(finalBuilderBalance.toString()).toEqual(
        initialBuilderBalance.add('19801980198019801').toString(),
      );
    });
  });
});
