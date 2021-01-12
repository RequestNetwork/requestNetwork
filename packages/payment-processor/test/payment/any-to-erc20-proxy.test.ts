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

import {getCurrencyHash} from '@requestnetwork/currency';
import Utils from '@requestnetwork/utils';

// import { getErc20Balance } from '../../src/payment/erc20';
// import { _getErc20FeeProxyPaymentUrl } from '../../src/payment/erc20-fee-proxy';
import { ERC20Contract } from '../../src/contracts/Erc20Contract';
import { approveErc20ForProxyConversion /*, approveErc20ForProxyConversionIfNeeded */ } from '../../src/payment/proxy-conversion-erc20';
import { payAnyToErc20ProxyRequest } from '../../src/payment/any-to-erc20-proxy';
import { bigNumberify } from 'ethers/utils';

// tslint:disable: no-magic-numbers
// tslint:disable: no-unused-expression

const erc20ContractAddress = '0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35';

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
  currency: 'EUR',
  currencyInfo: {
    type: RequestLogicTypes.CURRENCY.ISO4217,
    value: 'EUR',
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
        network: 'private',
        tokensAccepted: [erc20ContractAddress],
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

describe('conversion-erc20-fee-proxy', () => {
  describe('encodeSwapErc20FeeRequest', () => {
    it('should throw an error if the path is not valid', async () => {
      await expect(payAnyToErc20ProxyRequest(
        validRequest,
        [getCurrencyHash(validRequest.currencyInfo), erc20ContractAddress],
        // tslint:disable-next-line: no-magic-numbers
        bigNumberify(2).pow(256).sub(1),
        wallet,
        undefined,
        undefined,
        'private',
        )).rejects.toThrowError(
        'VM Exception while processing transaction: revert No aggregator found',
      );
    });

    it('should throw an error if the currencyInfo does not match the first of the path', async () => {
      const request = Utils.deepCopy(validRequest);
      request.currencyInfo.value = 'USD';

      await expect(payAnyToErc20ProxyRequest(
        request,
        [getCurrencyHash(validRequest.currencyInfo), getCurrencyHash({type:RequestLogicTypes.CURRENCY.ISO4217, value:'USD'}), erc20ContractAddress],
        // tslint:disable-next-line: no-magic-numbers
        bigNumberify(2).pow(256).sub(1),
        wallet,
        undefined,
        undefined,
        'private',
      )).rejects.toThrowError(
        'The first entry of the path does not match the request currency',
      );
    });

    it('should throw an error if the token is not accepted', async () => {
      await expect(payAnyToErc20ProxyRequest(
        validRequest,
        [getCurrencyHash(validRequest.currencyInfo), getCurrencyHash({type:RequestLogicTypes.CURRENCY.ISO4217, value:'USD'})],
        // tslint:disable-next-line: no-magic-numbers
        bigNumberify(2).pow(256).sub(1),
        wallet,
        undefined,
        undefined,
        'private',
      )).rejects.toThrowError(
        'The token 0x775eb53d00dd0acd3ec1696472105d579b9b386b is not accepted to pay this request',
      );
    });

    it('should throw an error if request has no extension', async () => {
      const request = Utils.deepCopy(validRequest);
      request.extensions = [] as any;

      await expect(payAnyToErc20ProxyRequest(
        request,
        [getCurrencyHash(validRequest.currencyInfo), getCurrencyHash({type:RequestLogicTypes.CURRENCY.ISO4217, value:'USD'}), erc20ContractAddress],
        // tslint:disable-next-line: no-magic-numbers
        bigNumberify(2).pow(256).sub(1),
        wallet,
        undefined,
        undefined,
        'private',)).rejects.toThrowError(
        'no payment network found',
      );
    });
  });

  describe('payAnyToErc20ProxyRequest', () => {
    it('should consider override parameters', async () => {
      const spy = jest.fn();
      const originalSendTransaction = wallet.sendTransaction.bind(wallet);
      wallet.sendTransaction = spy;
      await payAnyToErc20ProxyRequest(
        validRequest,
        [getCurrencyHash(validRequest.currencyInfo), getCurrencyHash({type:RequestLogicTypes.CURRENCY.ISO4217, value:'USD'}), erc20ContractAddress],
        // tslint:disable-next-line: no-magic-numbers
        bigNumberify(2).pow(256).sub(1),
        wallet,
        undefined,
        undefined,
        'private',
        {
          gasPrice: '20000000000',
        }
      );
      expect(spy).toHaveBeenCalledWith({
        data: '0x3af2c012000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b7320000000000000000000000000000000000000000000000000000000005f5e1000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000001e8480000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fefffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000017b4158805772ced11225e77339f90beb5aae968000000000000000000000000775eb53d00dd0acd3ec1696472105d579b9b386b00000000000000000000000038cf23c52bb4b13f051aec09580a2de845a7fa35000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000',
        gasPrice: '20000000000',
        to: '0xB9B7e0cb2EDF5Ea031C8B297A5A1Fa20379b6A0a',
        value: 0,
      });
      wallet.sendTransaction = originalSendTransaction;
    });

    it('should convert and pay with ERC20', async () => {
      // first approve the contract
      const approvalTx = await approveErc20ForProxyConversion(
        validRequest,
        erc20ContractAddress,
        wallet.provider,
      );

      expect(approvalTx).toBeDefined();
      if (approvalTx) {
        await approvalTx.wait(1);
      }
      // get the balances to compare after payment
      const balanceEthBefore = await wallet.getBalance();
      const balanceTokenBefore = await ERC20Contract.connect(erc20ContractAddress, provider).balanceOf(wallet.address);

      // convert and pay
      const tx = await payAnyToErc20ProxyRequest(
        validRequest,
        [getCurrencyHash(validRequest.currencyInfo), getCurrencyHash({type:RequestLogicTypes.CURRENCY.ISO4217, value:'USD'}), erc20ContractAddress],
        // tslint:disable-next-line: no-magic-numbers
        bigNumberify(2).pow(256).sub(1),
        wallet,
        undefined,
        undefined,
        'private',
      );

      const confirmedTx = await tx.wait(1);

      expect(confirmedTx.status).toEqual(1);
      expect(tx.hash).toBeDefined();

      // Get the new balances
      const balanceEthAfter = await wallet.getBalance();
      const balanceTokenAfter = await ERC20Contract.connect(erc20ContractAddress, provider).balanceOf(wallet.address);

      // Check each balance
      expect(bigNumberify(balanceEthBefore).sub(balanceEthAfter).toNumber()).toBeGreaterThan(0);
      expect(bigNumberify(balanceTokenBefore).sub(bigNumberify(balanceTokenAfter)).eq(bigNumberify('1211881188118811880'))).toEqual(true);
    })
  });
});
