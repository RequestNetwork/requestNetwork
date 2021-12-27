import { Wallet, providers, BigNumber } from 'ethers';

import {
  ClientTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';

import Utils from '@requestnetwork/utils';

import { approveErc20ForProxyConversionIfNeeded } from '../../src/payment/conversion-erc20';
import { payAnyToErc20ProxyRequest } from '../../src/payment/any-to-erc20-proxy';
import { ERC20__factory } from '@requestnetwork/smart-contracts/types';
import { currencyManager } from './shared';
import { IConversionPaymentSettings } from '../../src/index';
import { UnsupportedCurrencyError } from '@requestnetwork/currency';

// Cf. ERC20Alpha in TestERC20.sol
const erc20ContractAddress = '0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35';
const alphaPaymentSettings: IConversionPaymentSettings = {
  currency: {
    type: RequestLogicTypes.CURRENCY.ERC20,
    value: erc20ContractAddress,
    network: 'private',
  },
  maxToSpend: BigNumber.from(2).pow(256).sub(1),
  currencyManager,
};

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
const paymentAddress = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
const feeAddress = '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef';
const provider = new providers.JsonRpcProvider('http://localhost:8545');
const wallet = Wallet.fromMnemonic(mnemonic).connect(provider);

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

describe('conversion-erc20-fee-proxy', () => {
  describe('error checking', () => {
    it('should throw an error if the token is not accepted', async () => {
      await expect(
        payAnyToErc20ProxyRequest(
          validEuroRequest,
          wallet,
          {
            ...alphaPaymentSettings,
            currency: {
              ...alphaPaymentSettings.currency,
              value: '0x775eb53d00dd0acd3ec1696472105d579b9b386b',
            },
          } as IConversionPaymentSettings,
          undefined,
          undefined,
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
        payAnyToErc20ProxyRequest(request, wallet, alphaPaymentSettings, undefined, undefined),
      ).rejects.toThrowError('no payment network found');
    });
  });

  describe('payment', () => {
    it('should consider override parameters', async () => {
      const spy = jest.fn();
      const originalSendTransaction = wallet.sendTransaction.bind(wallet);
      wallet.sendTransaction = spy;
      await payAnyToErc20ProxyRequest(
        validEuroRequest,
        wallet,
        alphaPaymentSettings,
        undefined,
        undefined,
        {
          gasPrice: '20000000000',
        },
      );
      expect(spy).toHaveBeenCalledWith({
        data:
          '0x3af2c012000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b7320000000000000000000000000000000000000000000000000000000005f5e1000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000001e8480000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fefffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000017b4158805772ced11225e77339f90beb5aae968000000000000000000000000775eb53d00dd0acd3ec1696472105d579b9b386b00000000000000000000000038cf23c52bb4b13f051aec09580a2de845a7fa35000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000',
        gasPrice: '20000000000',
        to: '0xdE5491f774F0Cb009ABcEA7326342E105dbb1B2E',
        value: 0,
      });
      wallet.sendTransaction = originalSendTransaction;
    });

    it('should convert and pay a request in EUR with ERC20', async () => {
      // first approve the contract
      const approvalTx = await approveErc20ForProxyConversionIfNeeded(
        validEuroRequest,
        wallet.address,
        erc20ContractAddress,
        wallet.provider,
        BigNumber.from(10).pow(20),
      );

      expect(approvalTx).toBeDefined();
      if (approvalTx) {
        await approvalTx.wait(1);
      }
      // get the balances to compare after payment
      const balanceEthBefore = await wallet.getBalance();
      const balanceTokenBefore = await ERC20__factory.connect(
        erc20ContractAddress,
        provider,
      ).balanceOf(wallet.address);

      // convert and pay
      const tx = await payAnyToErc20ProxyRequest(
        validEuroRequest,
        wallet,
        alphaPaymentSettings,
        undefined,
        undefined,
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
      expect(BigNumber.from(balanceEthBefore).sub(balanceEthAfter).toNumber()).toBeGreaterThan(0);
      expect(
        BigNumber.from(balanceTokenBefore).sub(BigNumber.from(balanceTokenAfter)).toString(),
        //   expectedAmount:      1.00
        //   feeAmount:        +   .02
        //                     =  1.02
        //   AggEurUsd.sol     x  1.20
        //   AggDaiUsd.sol     /  1.01
        //                     =  1.211881188118811880 (over 18 decimals for this ERC20)
      ).toEqual('1211881188118811880');
    });

    it('should convert and pay a request in ETH with ERC20', async () => {
      const validEthRequest = validEuroRequest;
      validEthRequest.currency = 'ETH';
      validEthRequest.currencyInfo = {
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
        network: 'mainnet',
      };
      validEthRequest.expectedAmount = '1000000000000000000'; // 1 ETH
      validEthRequest.extensions[
        PaymentTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY
      ].values.feeAmount = '1000000000000000'; // 0.001 ETH
      // first approve the contract
      const approvalTx = await approveErc20ForProxyConversionIfNeeded(
        validEthRequest,
        wallet.address,
        erc20ContractAddress,
        wallet.provider,
        BigNumber.from(10).pow(20),
      );

      if (approvalTx) {
        await approvalTx.wait(1);
      }
      // get the balances to compare after payment
      const balanceEthBefore = await wallet.getBalance();
      const balanceTokenBefore = await ERC20__factory.connect(
        erc20ContractAddress,
        provider,
      ).balanceOf(wallet.address);

      // convert and pay
      const tx = await payAnyToErc20ProxyRequest(
        validEuroRequest,
        wallet,
        alphaPaymentSettings,
        undefined,
        undefined,
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
      expect(BigNumber.from(balanceEthBefore).sub(balanceEthAfter).toNumber()).toBeGreaterThan(0);
      expect(
        BigNumber.from(balanceTokenBefore)
          .sub(BigNumber.from(balanceTokenAfter))
          //  expectedAmount:      1.00 (ETH)
          //  feeAmount:       +    .01 (ETH)
          //                   =   1.01
          //  AggEthUsd.sol    x 500.00
          //  AggDaiUsd.sol    /   1.01
          //                    = 495.54455 +/- precision
          .toString(),
      ).toEqual('495544554455445544553');
    });
  });
});
