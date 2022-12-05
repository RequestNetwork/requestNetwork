import { Wallet, providers, Contract, BigNumber } from 'ethers';

import {
  ClientTypes,
  ExtensionTypes,
  IdentityTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';

import {
  approveUnderlyingToken,
  checkSuperTokenUnderlyingAllowance,
  getRequestUnderlyingToken,
  getUnderlyingTokenBalanceOf,
  unwrapSuperToken,
  wrapUnderlyingToken,
} from '../../src/payment/erc777-utils';
import { getErc20Balance } from '../../src/payment/erc20';
const daiABI = require('../abis/fDAIABI');

/* eslint-disable no-magic-numbers */
/* eslint-disable @typescript-eslint/no-unused-expressions */

export const DAIX_ADDRESS = '0x7D782D2cc2755CA324De57D42e28Cc63278dFE12';

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
const paymentAddress = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
const initialUnderlyingAmount = '1000000000000000000000';
const arbitraryWrappedAmount = '100000000';
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

describe('erc777-utils', () => {
  describe('underlying token', () => {
    it('returns the underlying token', async () => {
      const underlyingToken = await getRequestUnderlyingToken(validRequest, provider);
      expect(underlyingToken).toBeDefined();
    });
  });

  describe('underlying balance', () => {
    it('returns the balance of the user associated to the underlying token', async () => {
      const underlyingBalance = await getUnderlyingTokenBalanceOf(
        validRequest,
        wallet.address,
        provider,
      );
      expect(underlyingBalance.toString()).toEqual('0');

      // Mint some fake DAI
      const underlyingToken = await getRequestUnderlyingToken(validRequest, provider);
      const dai = new Contract(underlyingToken.address, daiABI, wallet);
      const tx = await dai
        .connect(wallet)
        .mint(wallet.address, BigNumber.from(initialUnderlyingAmount));
      await tx.wait(1);

      const underlyingBalanceAfter = await getUnderlyingTokenBalanceOf(
        validRequest,
        wallet.address,
      );
      expect(underlyingBalanceAfter.toString()).toEqual(initialUnderlyingAmount);
    });
  });

  describe('underlying allowance', () => {
    it('should return the allowance granted to a supertoken by a user', async () => {
      const hasAllowance = await checkSuperTokenUnderlyingAllowance(
        validRequest,
        wallet.address,
        provider,
        BigNumber.from(arbitraryWrappedAmount),
      );
      expect(hasAllowance).toEqual(false);
    });

    it('should increase the allowance granted to a supertoken by a user', async () => {
      const tx = await approveUnderlyingToken(
        validRequest,
        wallet,
        BigNumber.from(arbitraryWrappedAmount),
      );
      await tx.wait(1);

      const hasAllowance = await checkSuperTokenUnderlyingAllowance(
        validRequest,
        wallet.address,
        provider,
        BigNumber.from(arbitraryWrappedAmount),
      );
      expect(hasAllowance).toEqual(true);
    });
  });

  describe('SuperToken wrapping and unwrapping', () => {
    it('should fail without the necessary allowance', async () => {
      // allowance tx
      const allowanceTx = await approveUnderlyingToken(validRequest, wallet, BigNumber.from(0));
      await allowanceTx.wait(1);

      await expect(
        wrapUnderlyingToken(validRequest, wallet, BigNumber.from(arbitraryWrappedAmount)),
      ).rejects.toThrowError('Supertoken not allowed to wrap this amount of underlying');
    });

    it('should wrap the underlying token into super token', async () => {
      // allowance tx
      const allowanceTx = await approveUnderlyingToken(
        validRequest,
        wallet,
        BigNumber.from(arbitraryWrappedAmount),
      );
      await allowanceTx.wait(1);

      const superTokenBalanceBefore = await getErc20Balance(validRequest, wallet.address, provider);
      const underlyingBalanceBefore = await getUnderlyingTokenBalanceOf(
        validRequest,
        wallet.address,
        provider,
      );

      // Wrap tx
      const tx = await wrapUnderlyingToken(
        validRequest,
        wallet,
        BigNumber.from(arbitraryWrappedAmount),
      );
      await tx.wait(1);

      const superTokenBalanceAfter = await getErc20Balance(validRequest, wallet.address, provider);
      const underlyingBalanceAfter = await getUnderlyingTokenBalanceOf(
        validRequest,
        wallet.address,
        provider,
      );
      expect(superTokenBalanceAfter.toString()).toEqual(
        BigNumber.from(superTokenBalanceBefore).add(arbitraryWrappedAmount).toString(),
      );
      expect(underlyingBalanceAfter.toString()).toEqual(
        BigNumber.from(underlyingBalanceBefore).sub(arbitraryWrappedAmount).toString(),
      );
    });

    it('should unwrap supertoken into underlying tokens', async () => {
      const superTokenBalanceBefore = await getErc20Balance(validRequest, wallet.address, provider);
      const underlyingBalanceBefore = await getUnderlyingTokenBalanceOf(
        validRequest,
        wallet.address,
        provider,
      );

      const tx = await unwrapSuperToken(
        validRequest,
        wallet,
        BigNumber.from(arbitraryWrappedAmount),
      );
      await tx.wait(1);

      const superTokenBalanceAfter = await getErc20Balance(validRequest, wallet.address, provider);
      const underlyingBalanceAfter = await getUnderlyingTokenBalanceOf(
        validRequest,
        wallet.address,
        provider,
      );
      expect(superTokenBalanceAfter.toString()).toEqual(
        BigNumber.from(superTokenBalanceBefore).sub(arbitraryWrappedAmount).toString(),
      );
      expect(underlyingBalanceAfter.toString()).toEqual(
        BigNumber.from(underlyingBalanceBefore).add(arbitraryWrappedAmount).toString(),
      );
    });
  });
});
