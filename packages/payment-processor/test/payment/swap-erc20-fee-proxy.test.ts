import { Wallet, providers, BigNumber } from 'ethers';

import {
  ClientTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import { getErc20Balance } from '../../src/payment/erc20';
import { approveErc20ForSwapToPayIfNeeded } from '../../src/payment/swap-erc20';
import { ERC20__factory } from '@requestnetwork/smart-contracts/types';
import { ISwapSettings, swapErc20FeeProxyRequest } from '../../src/payment/swap-erc20-fee-proxy';
import { erc20SwapToPayArtifact } from '@requestnetwork/smart-contracts';
import { revokeErc20Approval } from '../../src/payment/utils';

/* eslint-disable no-magic-numbers */
/* eslint-disable @typescript-eslint/no-unused-expressions */

const erc20ContractAddress = '0x9FBDa871d559710256a2502A2517b794B482Db40';
const alphaErc20Address = '0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35';

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

const validSwapSettings: ISwapSettings = {
  deadline: 2599732187000, // This test will fail in 2052
  maxInputAmount: 204,
  path: [alphaErc20Address, erc20ContractAddress],
};

describe('swap-erc20-fee-proxy', () => {
  describe('encodeSwapErc20FeeRequest', () => {
    beforeAll(async () => {
      // revoke erc20SwapToPay approval
      await revokeErc20Approval(
        erc20SwapToPayArtifact.getAddress(validRequest.currencyInfo.network!),
        alphaErc20Address,
        wallet.provider,
      );
    });
    it('should throw an error if the request is not erc20', async () => {
      const request = Utils.deepCopy(validRequest) as ClientTypes.IRequestData;
      request.currencyInfo.type = RequestLogicTypes.CURRENCY.ETH;

      await expect(
        swapErc20FeeProxyRequest(request, wallet, validSwapSettings),
      ).rejects.toThrowError(
        'request cannot be processed, or is not an pn-erc20-fee-proxy-contract request',
      );
    });

    it('should throw an error if the currencyInfo has no value', async () => {
      const request = Utils.deepCopy(validRequest);
      request.currencyInfo.value = '';
      await expect(
        swapErc20FeeProxyRequest(request, wallet, validSwapSettings),
      ).rejects.toThrowError(
        'request cannot be processed, or is not an pn-erc20-fee-proxy-contract request',
      );
    });

    it('should throw an error if currencyInfo has no network', async () => {
      const request = Utils.deepCopy(validRequest);
      request.currencyInfo.network = '';
      await expect(
        swapErc20FeeProxyRequest(request, wallet, validSwapSettings),
      ).rejects.toThrowError(
        'request cannot be processed, or is not an pn-erc20-fee-proxy-contract request',
      );
    });

    it('should throw an error if request has no extension', async () => {
      const request = Utils.deepCopy(validRequest);
      request.extensions = [] as any;

      await expect(
        swapErc20FeeProxyRequest(request, wallet, validSwapSettings),
      ).rejects.toThrowError('no payment network found');
    });
  });

  describe('swapErc20FeeProxyRequest', () => {
    it('should consider override parameters', async () => {
      const spy = jest.fn();
      const originalSendTransaction = wallet.sendTransaction.bind(wallet);
      wallet.sendTransaction = spy;
      await swapErc20FeeProxyRequest(
        validRequest,
        wallet,
        {
          deadline: 2599732187000, // This test will fail in 2052
          maxInputAmount: 204,
          path: [alphaErc20Address, erc20ContractAddress],
        },
        {
          overrides: { gasPrice: '20000000000' },
        },
      );
      expect(spy).toHaveBeenCalledWith({
        data: '0x8d09fe2b000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b732000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000cc000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fef000000000000000000000000000000000000000000000000000000009af4c3db000000000000000000000000000000000000000000000000000000000000000200000000000000000000000038cf23c52bb4b13f051aec09580a2de845a7fa350000000000000000000000009fbda871d559710256a2502a2517b794b482db40000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000',
        gasPrice: '20000000000',
        to: '0xA4392264a2d8c998901D10C154C91725b1BF0158',
        value: 0,
      });
      wallet.sendTransaction = originalSendTransaction;
    });

    it('should swap and pay with an ERC20 request with fees', async () => {
      // first approve the SwapToPay contract to spend ALPHA tokens
      const approvalTx = await approveErc20ForSwapToPayIfNeeded(
        validRequest,
        wallet.address,
        alphaErc20Address,
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
        alphaErc20Address,
        provider,
      ).balanceOf(wallet.address);
      const issuerBalanceErc20Before = await getErc20Balance(
        validRequest,
        paymentAddress,
        provider,
      );
      const feeBalanceErc20Before = await getErc20Balance(validRequest, feeAddress, provider);

      // Swap and pay
      const tx = await swapErc20FeeProxyRequest(validRequest, wallet, {
        deadline: Date.now() + 1000,
        maxInputAmount: 204,
        path: [alphaErc20Address, erc20ContractAddress],
      });
      const confirmedTx = await tx.wait(1);

      expect(confirmedTx.status).toEqual(1);
      expect(tx.hash).toBeDefined();

      // Get the new balances
      const balanceEthAfter = await wallet.getBalance();
      const balanceAlphaAfter = await ERC20__factory.connect(alphaErc20Address, provider).balanceOf(
        wallet.address,
      );
      const issuerBalanceErc20After = await getErc20Balance(validRequest, paymentAddress, provider);
      const feeBalanceErc20After = await getErc20Balance(validRequest, feeAddress, provider);

      // Check each balance
      expect(BigNumber.from(balanceEthBefore).sub(balanceEthAfter).toNumber()).toBeGreaterThan(0);
      expect(BigNumber.from(balanceAlphaAfter).toString()).toEqual(
        BigNumber.from(balanceAlphaBefore).sub(204).toString(),
      );
      expect(BigNumber.from(issuerBalanceErc20After).toString()).toEqual(
        BigNumber.from(issuerBalanceErc20Before).add(100).toString(),
      );
      expect(BigNumber.from(feeBalanceErc20After).toString()).toEqual(
        BigNumber.from(feeBalanceErc20Before).add(2).toString(),
      );
    });
  });
});
