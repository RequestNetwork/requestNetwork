import { Wallet, providers, BigNumber } from 'ethers';

import {
  ClientTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';

import { approveErc20ForSwapWithConversionIfNeeded } from '../../src/payment/swap-conversion-erc20';
import { ERC20__factory } from '@requestnetwork/smart-contracts/types';
import { swapToPayAnyToErc20Request } from '../../src/payment/swap-any-to-erc20';

/* eslint-disable no-magic-numbers */
/* eslint-disable @typescript-eslint/no-unused-expressions */

const erc20BeforeSwap = '0x9FBDa871d559710256a2502A2517b794B482Db40';
const erc20AfterConversion = '0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35';

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
        acceptedTokens: [erc20AfterConversion],
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

describe('swap-any-to-erc20', () => {
  describe('swapErc20FeeProxyRequest', () => {
    it('should swap and pay with an ERC20 request with fees', async () => {
      // first approve the SwapToPay contract to spend tokens
      const approvalTx = await approveErc20ForSwapWithConversionIfNeeded(
        validRequest,
        wallet.address,
        erc20BeforeSwap,
        wallet.provider,
        BigNumber.from(204).mul(BigNumber.from(10).pow(18)),
      );
      // expect(approvalTx).toBeDefined();
      if (approvalTx) {
        await approvalTx.wait(1);
      }

      // get the balances to compare after payment
      const balancePayerBSwapBefore = await ERC20__factory.connect(
        erc20BeforeSwap,
        provider,
      ).balanceOf(wallet.address);
      const balancePayeeAConversionBefore = await ERC20__factory.connect(
        erc20AfterConversion,
        provider,
      ).balanceOf(paymentAddress);
      const balanceFeeAConversionBefore = await ERC20__factory.connect(
        erc20AfterConversion,
        provider,
      ).balanceOf(feeAddress);

      // Swap and pay
      const tx = await swapToPayAnyToErc20Request(validRequest, wallet, {
        swap: {
          deadline: 2599732187000, // This test will fail in 2052
          maxInputAmount: '3000000000000000000',
          path: [erc20BeforeSwap, erc20AfterConversion],
        },
        conversion: {
          currency: {
            type: 'ERC20' as any,
            value: erc20AfterConversion,
            network: 'private',
          }
        },
        overrides: {
          gasLimit: 1000000
        }
      })

      const confirmedTx = await tx.wait(1);

      expect(confirmedTx.status).toEqual(1);
      expect(tx.hash).toBeDefined();

      // Get the new balances
      const balancePayerBSwapAfter = await ERC20__factory.connect(erc20BeforeSwap, provider).balanceOf(
        wallet.address,
      );
      const balancePayeeAConversionAfter = await ERC20__factory.connect(erc20AfterConversion, provider).balanceOf(
        paymentAddress,
      );
      const balanceFeeAConversionAfter = await ERC20__factory.connect(erc20AfterConversion, provider).balanceOf(
        feeAddress,
      );
      
      // Check each balance

      //   expectedAmount:      100000000
      //   feeAmount:        +    2000000
      //                     =  102000000 (8 decimals)
      //   AggDaiUsd.sol     /  101000000
      //                     =  1009900990099009900 (18 decimals)
      //   Swapper           *  2
      //                     =  2019801980198019800 (18 decimals) paid by payer in erc20BeforeSwap
      expect(BigNumber.from(balancePayerBSwapAfter).toString()).toEqual(
        BigNumber.from(balancePayerBSwapBefore).sub('2019801980198019800').toString(),
      );

      //   expectedAmount:      100000000 (8 decimals)
      //   AggDaiUsd.sol     /  101000000
      //                     =  990099009900990099 (18 decimals) received by payee in erc20AfterConversion
      expect(BigNumber.from(balancePayeeAConversionAfter).toString()).toEqual(
        BigNumber.from(balancePayeeAConversionBefore).add('990099009900990099').toString(),
      );

      //   feeAmount:           2000000 (8 decimals)
      //   AggDaiUsd.sol     /  101000000
      //                     =  19801980198019801 (18 decimals) received by fee address in erc20AfterConversion
      expect(BigNumber.from(balanceFeeAConversionAfter).toString()).toEqual(
        BigNumber.from(balanceFeeAConversionBefore).add('19801980198019801').toString(),
      );      
      
    });
  });
});
