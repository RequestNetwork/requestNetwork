/* eslint-disable spellcheck/spell-checker */
import { Wallet } from 'ethers';
import { JsonRpcProvider } from 'ethers/providers';

import {
  ClientTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import { approveErc20, getErc20Balance } from '../../src/payment/erc20';
import {
  _getErc20FeeProxyPaymentUrl,
  payErc20FeeProxyRequest,
} from '../../src/payment/erc20-fee-proxy';
import { getRequestPaymentValues } from '../../src/payment/utils';

// tslint:disable: no-magic-numbers
// tslint:disable: no-unused-expression

const erc20ContractAddress = '0x9FBDa871d559710256a2502A2517b794B482Db40';

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
const paymentAddress = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
const feeAddress = '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef';
const provider = new JsonRpcProvider('http://localhost:8545');
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

describe('erc20-fee-proxy', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });
  describe('getRequestPaymentValues', () => {
    it('handles ERC20', () => {
      const values = getRequestPaymentValues(validRequest);
      expect(values.feeAddress).toBe(feeAddress);
      expect(values.feeAmount).toBe('2');
      expect(values.paymentAddress).toBe(paymentAddress);
      expect(values.paymentReference).toBe('86dfbccad783599a');
    });
  });

  describe('payErc20FeeProxyRequest', () => {
    it('should throw an error if the request is not erc20', async () => {
      const request = Utils.deepCopy(validRequest) as ClientTypes.IRequestData;
      request.currencyInfo.type = RequestLogicTypes.CURRENCY.ETH;

      await expect(payErc20FeeProxyRequest(request, wallet)).rejects.toThrowError(
        'request cannot be processed, or is not an pn-erc20-fee-proxy-contract request',
      );
    });

    it('should throw an error if the currencyInfo has no value', async () => {
      const request = Utils.deepCopy(validRequest);
      request.currencyInfo.value = '';
      await expect(payErc20FeeProxyRequest(request, wallet)).rejects.toThrowError(
        'request cannot be processed, or is not an pn-erc20-fee-proxy-contract request',
      );
    });

    it('should throw an error if currencyInfo has no network', async () => {
      const request = Utils.deepCopy(validRequest);
      request.currencyInfo.network = '';
      await expect(payErc20FeeProxyRequest(request, wallet)).rejects.toThrowError(
        'request cannot be processed, or is not an pn-erc20-fee-proxy-contract request',
      );
    });

    it('should throw an error if request has no extension', async () => {
      const request = Utils.deepCopy(validRequest);
      request.extensions = [] as any;

      await expect(payErc20FeeProxyRequest(request, wallet)).rejects.toThrowError(
        'request cannot be processed, or is not an pn-erc20-fee-proxy-contract request',
      );
    });

    it('should consider override parameters', async () => {
      const spy = jest.fn();
      const originalSendTransaction = wallet.sendTransaction.bind(wallet);
      wallet.sendTransaction = spy;
      await payErc20FeeProxyRequest(validRequest, wallet, undefined, undefined, {
        gasPrice: '20000000000',
      });
      expect(spy).toHaveBeenCalledWith({
        data:
          '0xc219a14d0000000000000000000000009fbda871d559710256a2502a2517b794b482db40000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b732000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fef000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000',
        gasPrice: '20000000000',
        to: '0x75c35C980C0d37ef46DF04d31A140b65503c0eEd',
        value: 0,
      });
      wallet.sendTransaction = originalSendTransaction;
    });

    it('should pay an ERC20 request with fees', async () => {
      // first approve the contract
      const approvalTx = await approveErc20(validRequest, wallet);
      await approvalTx.wait(1);

      // get the balance to compare after payment

      const balanceEthBefore = await wallet.getBalance();
      const balanceErc20Before = await getErc20Balance(validRequest, wallet.address, provider);
      const feeBalanceErc20Before = await getErc20Balance(validRequest, feeAddress, provider);

      const tx = await payErc20FeeProxyRequest(validRequest, wallet);
      const confirmedTx = await tx.wait(1);

      const balanceEthAfter = await wallet.getBalance();
      const balanceErc20After = await getErc20Balance(validRequest, wallet.address, provider);
      const feeBalanceErc20After = await getErc20Balance(validRequest, feeAddress, provider);

      expect(confirmedTx.status).toBe(1);
      expect(tx.hash).not.toBeUndefined();

      expect(balanceEthAfter.lte(balanceEthBefore)).toBeTruthy(); // 'ETH balance should be lower'

      // ERC20 balance should be lower
      expect(balanceErc20After.eq(balanceErc20Before.sub(102))).toBeTruthy();
      // fee ERC20 balance should be higher
      expect(feeBalanceErc20After.eq(feeBalanceErc20Before.add(2))).toBeTruthy();
    });
  });

  describe('getErc20FeePaymentUrl', () => {
    it('can get an ERC20 url', () => {
      expect(_getErc20FeeProxyPaymentUrl(validRequest)).toBe(
        'ethereum:0x75c35C980C0d37ef46DF04d31A140b65503c0eEd/transferFromWithReferenceAndFee?address=0x9FBDa871d559710256a2502A2517b794B482Db40&address=0xf17f52151EbEF6C7334FAD080c5704D77216b732&uint256=100&bytes=86dfbccad783599a&uint256=2&address=0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef',
      );
    });
  });
});
