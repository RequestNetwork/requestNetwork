import { Wallet, providers, Contract, utils as ethersUtils, BigNumber } from 'ethers';
import { Framework } from '@superfluid-finance/sdk-core';

import {
  ClientTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import { payErc777StreamRequest } from '../../src/payment/erc777-stream';
import { getRequestPaymentValues } from '../../src/payment/utils';
const daiABI = require('../abis/fDAIABI');

/* eslint-disable no-magic-numbers */
/* eslint-disable @typescript-eslint/no-unused-expressions */

const erc777ContractAddress = '0x921c6a682E6c6aE959dc5AE66cf1baBdF90E8E33';
const resolverAddress = '0x8e4C131B37383E431B9cd0635D3cF9f3F628EDae';

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
const paymentAddress = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
const expectedFlowRate = '100000';
const expectedStartDate = '1643041225';
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
  currency: 'DAIx',
  currencyInfo: {
    network: 'private',
    type: RequestLogicTypes.CURRENCY.ERC777,
    value: erc777ContractAddress,
  },

  events: [],
  expectedAmount: '100',
  extensions: {
    [PaymentTypes.PAYMENT_NETWORK_ID.ERC777_STREAM]: {
      events: [],
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        expectedStartDate: expectedStartDate,
        expectedFlowRate: expectedFlowRate,
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

describe('erc777-stream', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });
  describe('getRequestPaymentValues', () => {
    it('handles ERC777', () => {
      const values = getRequestPaymentValues(validRequest);
      expect(values.expectedStartDate).toBe(expectedStartDate);
      expect(values.expectedFlowRate).toBe(expectedFlowRate);
      expect(values.paymentAddress).toBe(paymentAddress);
      expect(values.paymentReference).toBe('86dfbccad783599a');
    });
  });

  describe('encodePayErc20FeeRequest (used to pay and swap to pay)', () => {
    it('should throw an error if the request is not erc777', async () => {
      const request = Utils.deepCopy(validRequest) as ClientTypes.IRequestData;
      request.currencyInfo.type = RequestLogicTypes.CURRENCY.ETH;

      await expect(payErc777StreamRequest(request, wallet)).rejects.toThrowError(
        'request cannot be processed, or is not an pn-erc777-stream request',
      );
    });

    it('should throw an error if the currencyInfo has no value', async () => {
      const request = Utils.deepCopy(validRequest);
      request.currencyInfo.value = '';
      await expect(payErc777StreamRequest(request, wallet)).rejects.toThrowError(
        'request cannot be processed, or is not an pn-erc777-stream request',
      );
    });

    it('should throw an error if currencyInfo has no network', async () => {
      const request = Utils.deepCopy(validRequest);
      request.currencyInfo.network = '';
      await expect(payErc777StreamRequest(request, wallet)).rejects.toThrowError(
        'request cannot be processed, or is not an pn-erc777-stream request',
      );
    });

    it('should throw an error if request has no extension', async () => {
      const request = Utils.deepCopy(validRequest);
      request.extensions = [] as any;

      await expect(payErc777StreamRequest(request, wallet)).rejects.toThrowError(
        'Not a supported ERC777 payment network request',
      );
    });
  });

  describe('payErc777StreamRequest', () => {
    it('should pay an ERC777 request with fees', async () => {
      let tx;
      let confirmedTx;
      //initialize the superfluid framework...put custom and web3 only bc we are using ganache locally
      const sf = await Framework.create({
        networkName: 'custom',
        provider,
        dataMode: 'WEB3_ONLY',
        resolverAddress: resolverAddress,
        protocolReleaseVersion: 'test',
      });

      //use the framework to get the SuperToken
      const daix = await sf.loadSuperToken('fDAIx');

      //get the contract object for the erc20 token
      const daiAddress = daix.underlyingToken.address;
      const dai = new Contract(daiAddress, daiABI, wallet);

      // //minting fDAI
      const daiBalBefore = await dai.balanceOf(wallet.address);
      tx = await dai.connect(wallet).mint(wallet.address, ethersUtils.parseEther('1000'));
      confirmedTx = await tx.wait(1);
      expect(confirmedTx.status).toBe(1);
      expect(tx.hash).toBeDefined();
      const daiBalAfter = await dai.balanceOf(wallet.address);
      expect(daiBalAfter.sub(daiBalBefore).toString()).toBe('1000000000000000000000');

      //approving SuperToken contract to access minted fDAI
      tx = await dai.connect(wallet).approve(daix.address, ethersUtils.parseEther('1000'));
      confirmedTx = await tx.wait(1);
      expect(confirmedTx.status).toBe(1);
      expect(tx.hash).toBeDefined();
      const amountAllowed = await dai.allowance(wallet.address, daix.address);
      expect(amountAllowed.toString()).toBe('1000000000000000000000');

      // wrapping fDAI into fDAIx
      const daixBalBefore = await daix.balanceOf({
        account: wallet.address,
        providerOrSigner: wallet,
      });
      const daixUpgradeOperation = daix.upgrade({
        amount: ethersUtils.parseEther('1000').toString(),
      });
      tx = await daixUpgradeOperation.exec(wallet);
      confirmedTx = await tx.wait(1);
      expect(confirmedTx.status).toBe(1);
      expect(tx.hash).not.toBeUndefined();
      const daixBalAfter = await daix.balanceOf({
        account: wallet.address,
        providerOrSigner: wallet,
      });
      expect(BigNumber.from(daixBalAfter).sub(daixBalBefore).toString()).toBe(
        '1000000000000000000000',
      );

      // Paying fDAIX stream request
      tx = await payErc777StreamRequest(validRequest, wallet);
      confirmedTx = await tx.wait(1);
      expect(confirmedTx.status).toBe(1);
      expect(tx.hash).not.toBeUndefined();

      const wFlowRate = await sf.cfaV1.getNetFlow({
        superToken: daix.address,
        account: wallet.address,
        providerOrSigner: provider,
      });
      expect(wFlowRate).toBe(`-${expectedFlowRate}`);
      const pFlowRate = await sf.cfaV1.getNetFlow({
        superToken: daix.address,
        account: paymentAddress,
        providerOrSigner: provider,
      });
      expect(pFlowRate).toBe(expectedFlowRate);
    });
  });
});
