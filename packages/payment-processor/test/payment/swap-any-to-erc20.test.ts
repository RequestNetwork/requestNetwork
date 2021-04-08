import { Wallet, providers, BigNumber } from 'ethers';

import {
  ClientTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
// import Utils from '@requestnetwork/utils';

// import { getErc20Balance } from '../../src/payment/erc20';
import { approveErc20ForSwapWithConversionIfNeeded } from '../../src/payment/swap-conversion-erc20';
import { ERC20__factory } from '@requestnetwork/smart-contracts/types';
import { ISwapSettings, swapToPayAnyToErc20Request } from '../../src/payment/swap-any-to-erc20';

/* eslint-disable no-magic-numbers */
/* eslint-disable @typescript-eslint/no-unused-expressions */

const erc20BeforeSwap = '0x9FBDa871d559710256a2502A2517b794B482Db40';
const erc20BeforeConversion = '0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35';

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
        acceptedTokens: [erc20BeforeConversion],
        // TODO missing stuff here !
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

const validSwapSettings: ISwapSettings = {
  deadline: 2599732187000, // This test will fail in 2052
  maxInputAmount: 204,
  path: [erc20BeforeSwap, erc20BeforeConversion],
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
      expect(approvalTx).toBeDefined();
      if (approvalTx) {
        await approvalTx.wait(1);
      }

      // get the balances to compare after payment
      const balanceEthBefore = await wallet.getBalance();
      const balanceAlphaBefore = await ERC20__factory.connect(
        erc20BeforeSwap,
        provider,
      ).balanceOf(wallet.address);
      // const issuerBalanceErc20Before = await getErc20Balance(
      //   validRequest,
      //   paymentAddress,
      //   provider,
      // );
      // const feeBalanceErc20Before = await getErc20Balance(validRequest, feeAddress, provider);

      // Swap and pay
      const tx = await swapToPayAnyToErc20Request(validRequest, wallet, {
        swap: validSwapSettings,
        conversion: {
          currency: {
            type: 'ERC20' as any,
            value: erc20BeforeConversion,
            network: 'private',
          }
        },
      })
      const confirmedTx = await tx.wait(1);

      expect(confirmedTx.status).toEqual(1);
      expect(tx.hash).toBeDefined();

      // Get the new balances
      const balanceEthAfter = await wallet.getBalance();
      const balanceAlphaAfter = await ERC20__factory.connect(erc20BeforeSwap, provider).balanceOf(
        wallet.address,
      );
      // const issuerBalanceErc20After = await getErc20Balance(validRequest, paymentAddress, provider);
      // const feeBalanceErc20After = await getErc20Balance(validRequest, feeAddress, provider);

      // Check each balance
      expect(BigNumber.from(balanceEthBefore).sub(balanceEthAfter).toNumber()).toBeGreaterThan(0);
      expect(BigNumber.from(balanceAlphaAfter).toString()).toEqual(
        BigNumber.from(balanceAlphaBefore).sub(204).toString(),
      );
      // expect(BigNumber.from(issuerBalanceErc20After).toString()).toEqual(
      //   BigNumber.from(issuerBalanceErc20Before).add(100).toString(),
      // );
      // expect(BigNumber.from(feeBalanceErc20After).toString()).toEqual(
      //   BigNumber.from(feeBalanceErc20Before).add(2).toString(),
      // );
    });
  });
});
