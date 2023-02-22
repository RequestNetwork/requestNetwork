import { Wallet, providers, Contract, utils as ethersUtils, BigNumber } from 'ethers';
import { Framework } from '@superfluid-finance/sdk-core';

import {
  ClientTypes,
  ExtensionTypes,
  IdentityTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { deepCopy, getDefaultProvider } from '@requestnetwork/utils';

import {
  closeErc777StreamRequest,
  getSuperFluidFramework,
  makeErc777OneOffPayment,
  payErc777StreamRequest,
  RESOLVER_ADDRESS,
} from '../../src/payment/erc777-stream';
import { getRequestPaymentValues } from '../../src/payment/utils';
import { wrapUnderlyingToken } from '../../src/payment/erc777-utils';
const daiABI = require('../abis/fDAIABI');

/* eslint-disable no-magic-numbers */
/* eslint-disable @typescript-eslint/no-unused-expressions */

export const DAIX_ADDRESS = '0x7D782D2cc2755CA324De57D42e28Cc63278dFE12';

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
const paymentAddress = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
const expectedFlowRate = '100000';
const expectedStartDate = '1643041225';
const provider = new providers.JsonRpcProvider('http://localhost:8545');
const wallet = Wallet.fromMnemonic(mnemonic).connect(provider);
const oneOffPaymentAmount = '1000000000';

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
    value: DAIX_ADDRESS,
  },

  events: [],
  expectedAmount: '100',
  extensions: {
    [ExtensionTypes.PAYMENT_NETWORK_ID.ERC777_STREAM]: {
      events: [],
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC777_STREAM,
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

  describe('Superfluid framework', () => {
    it.each([
      { network: 'goerli' },
      { network: 'matic' },
      { network: 'xdai' },
      { network: 'optimism' },
      { network: 'avalanche' },
      { network: 'arbitrum-one' },
    ])('Should initialize superfluid framework on $network', async ({ network }) => {
      const provider = getDefaultProvider(network);
      const networkValidRequest = {
        ...validRequest,
        currencyInfo: {
          ...validRequest.currencyInfo,
          network,
        },
      };
      const sf = await getSuperFluidFramework(networkValidRequest, provider);
      expect(sf).toBeDefined();
    });
  });

  describe('encodePayErc20FeeRequest (used to pay and swap to pay)', () => {
    it('should throw an error if the request is not erc777', async () => {
      const request = deepCopy(validRequest) as ClientTypes.IRequestData;
      request.currencyInfo.type = RequestLogicTypes.CURRENCY.ETH;

      await expect(payErc777StreamRequest(request, wallet)).rejects.toThrowError(
        'request cannot be processed, or is not an pn-erc777-stream request',
      );
    });

    it('should throw an error if the currencyInfo has no value', async () => {
      const request = deepCopy(validRequest);
      request.currencyInfo.value = '';
      await expect(payErc777StreamRequest(request, wallet)).rejects.toThrowError(
        'request cannot be processed, or is not an pn-erc777-stream request',
      );
    });

    it('should throw an error if currencyInfo has no network', async () => {
      const request = deepCopy(validRequest);
      request.currencyInfo.network = '';
      await expect(payErc777StreamRequest(request, wallet)).rejects.toThrowError(
        'request cannot be processed, or is not an pn-erc777-stream request',
      );
    });

    it('should throw an error if request has no extension', async () => {
      const request = deepCopy(validRequest);
      request.extensions = [] as any;

      await expect(payErc777StreamRequest(request, wallet)).rejects.toThrowError(
        'no payment network found',
      );
    });
  });

  describe('Streams management', () => {
    it('payErc777StreamRequest should pay an ERC777 request', async () => {
      let tx;
      let confirmedTx;
      // initialize the superfluid framework...put custom and web3 only bc we are using ganache locally
      const sf = await Framework.create({
        chainId: provider.network.chainId,
        provider,
        resolverAddress: RESOLVER_ADDRESS,
        protocolReleaseVersion: 'test',
      });

      // use the framework to get the SuperToken
      const daix = await sf.loadSuperToken('fDAIx');

      // get the contract object for the erc20 token
      const daiAddress = daix.underlyingToken?.address as string;
      const dai = new Contract(daiAddress, daiABI, wallet);

      // minting fDAI
      const daiBalBefore = await dai.balanceOf(wallet.address);
      tx = await dai.connect(wallet).mint(wallet.address, ethersUtils.parseEther('1000'));
      confirmedTx = await tx.wait(1);
      expect(confirmedTx.status).toBe(1);
      expect(tx.hash).toBeDefined();
      const daiBalAfter = await dai.balanceOf(wallet.address);
      expect(daiBalAfter.sub(daiBalBefore).toString()).toBe('1000000000000000000000');

      // approving SuperToken contract to access minted fDAI
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
      const upgradeTx = await wrapUnderlyingToken(
        validRequest,
        wallet,
        ethersUtils.parseEther('1000'),
      );
      confirmedTx = await upgradeTx.wait(1);
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

      const walletFlowRate = await sf.cfaV1.getNetFlow({
        superToken: daix.address,
        account: wallet.address,
        providerOrSigner: provider,
      });
      expect(walletFlowRate).toBe(`-${expectedFlowRate}`);
      const paymentFlowRate = await sf.cfaV1.getNetFlow({
        superToken: daix.address,
        account: paymentAddress,
        providerOrSigner: provider,
      });
      expect(paymentFlowRate).toBe(expectedFlowRate);
    });

    it('closeErc777StreamRequest should close an ERC777 request', async () => {
      let tx;
      let confirmedTx;
      // initialize the superfluid framework...put custom and web3 only bc we are using ganache locally
      const sf = await Framework.create({
        chainId: provider.network.chainId,
        provider,
        resolverAddress: RESOLVER_ADDRESS,
        protocolReleaseVersion: 'test',
      });

      // use the framework to get the SuperToken
      const daix = await sf.loadSuperToken('fDAIx');

      // wait 2 seconds of streaming to avoid failing
      await new Promise((r) => setTimeout(r, 2000));

      // Stopping fDAIX stream request
      tx = await closeErc777StreamRequest(validRequest, wallet);
      confirmedTx = await tx.wait(1);
      expect(confirmedTx.status).toBe(1);
      expect(tx.hash).not.toBeUndefined();

      const walletFlowRate = await sf.cfaV1.getNetFlow({
        superToken: daix.address,
        account: wallet.address,
        providerOrSigner: provider,
      });
      expect(walletFlowRate).toBe('0');
      const paymentFlowRate = await sf.cfaV1.getNetFlow({
        superToken: daix.address,
        account: paymentAddress,
        providerOrSigner: provider,
      });
      expect(paymentFlowRate).toBe('0');
    });
  });

  describe('makeErc777OneOffPayment', () => {
    it('Should perform a payment', async () => {
      // initialize the superfluid framework...put custom and web3 only bc we are using ganache locally
      const sf = await Framework.create({
        chainId: provider.network.chainId,
        provider,
        resolverAddress: RESOLVER_ADDRESS,
        protocolReleaseVersion: 'test',
      });

      // use the framework to get the SuperToken
      const daix = await sf.loadSuperToken('fDAIx');

      const senderBalanceBefore = await daix.balanceOf({
        account: wallet.address,
        providerOrSigner: provider,
      });
      const recipientBalanceBefore = await daix.balanceOf({
        account: paymentAddress,
        providerOrSigner: provider,
      });

      // Perform the payment
      const tx = await makeErc777OneOffPayment(
        validRequest,
        BigNumber.from(oneOffPaymentAmount),
        wallet,
      );
      await tx.wait(1);

      const senderBalanceAfter = await daix.balanceOf({
        account: wallet.address,
        providerOrSigner: provider,
      });
      const recipientBalanceAfter = await daix.balanceOf({
        account: paymentAddress,
        providerOrSigner: provider,
      });

      expect(BigNumber.from(senderBalanceBefore)).toEqual(
        BigNumber.from(senderBalanceAfter).add(oneOffPaymentAmount),
      );
      expect(BigNumber.from(recipientBalanceAfter)).toEqual(
        BigNumber.from(recipientBalanceBefore).add(oneOffPaymentAmount),
      );
    });
  });
});
