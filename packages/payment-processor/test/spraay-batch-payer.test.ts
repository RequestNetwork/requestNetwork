/**
 * Tests for SpraayBatchPayer
 *
 * Run: yarn test --grep "SpraayBatchPayer"
 */

import { expect } from "chai";
import { ethers } from "ethers";
import {
  SPRAAY_BATCH_CONTRACTS,
  USDC_ADDRESSES,
  CHAIN_NAMES,
} from "../src/payment/spraay-utils";
import { SpraayBatchPayer } from "../src/payment/spraay-batch-payer";

describe("SpraayBatchPayer", () => {
  describe("Contract addresses", () => {
    it("should have batch contracts for all supported chains", () => {
      const expectedChains = [8453, 1, 42161, 137, 56, 43114];
      for (const chainId of expectedChains) {
        expect(SPRAAY_BATCH_CONTRACTS[chainId]).to.be.a("string");
        expect(ethers.isAddress(SPRAAY_BATCH_CONTRACTS[chainId])).to.be.true;
      }
    });

    it("should have USDC addresses for all supported chains", () => {
      const expectedChains = [8453, 1, 42161, 137, 56, 43114];
      for (const chainId of expectedChains) {
        expect(USDC_ADDRESSES[chainId]).to.be.a("string");
        expect(ethers.isAddress(USDC_ADDRESSES[chainId])).to.be.true;
      }
    });

    it("should have chain names for all supported chains", () => {
      expect(CHAIN_NAMES[8453]).to.equal("Base");
      expect(CHAIN_NAMES[1]).to.equal("Ethereum");
      expect(CHAIN_NAMES[42161]).to.equal("Arbitrum One");
      expect(CHAIN_NAMES[137]).to.equal("Polygon");
    });
  });

  describe("Validation", () => {
    let spraay: SpraayBatchPayer;

    beforeEach(() => {
      const wallet = ethers.Wallet.createRandom();
      spraay = new SpraayBatchPayer(wallet, 8453);
    });

    it("should reject empty invoice list", async () => {
      try {
        await spraay.payInvoices({ invoices: [] });
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.message).to.include("No invoices provided");
      }
    });

    it("should reject more than 200 invoices", async () => {
      const invoices = Array.from({ length: 201 }, (_, i) => ({
        requestId: `req-${i}`,
        recipient: ethers.Wallet.createRandom().address,
        amount: "10.00",
      }));
      try {
        await spraay.payInvoices({ invoices });
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.message).to.include("200");
      }
    });

    it("should reject unsupported chain", async () => {
      try {
        await spraay.payInvoices({
          invoices: [
            {
              requestId: "test",
              recipient: ethers.Wallet.createRandom().address,
              amount: "10.00",
            },
          ],
          chainId: 999999,
        });
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.message).to.include("not available");
      }
    });

    it("should reject invalid recipient address", async () => {
      try {
        await spraay.payInvoices({
          invoices: [
            {
              requestId: "test",
              recipient: "not-an-address",
              amount: "10.00",
            },
          ],
        });
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.message).to.include("Invalid address");
      }
    });
  });

  describe("Pending invoice discovery", () => {
    // A fake Request Network client returning canned requests, so we can
    // assert the filtering logic without a live node.
    const makeClient = (requests: any[]) => ({
      fromIdentity: async () => requests.map((r) => ({ getData: () => r })),
    });

    const payer = "0x1111111111111111111111111111111111111111";
    const goodPayee = "0x2222222222222222222222222222222222222222";

    const baseRequest = (overrides: any = {}) => ({
      requestId: "01" + "a".repeat(62),
      state: "created",
      expectedAmount: "1000000", // 1 USDC (6 decimals)
      currency: {
        type: "ERC20",
        value: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base USDC
        network: "base",
      },
      payer: { value: payer },
      payee: { value: goodPayee },
      balance: { balance: "0" },
      contentData: { reason: "Invoice #1" },
      ...overrides,
    });

    it("skips invoices with a missing payee instead of aborting the batch", async () => {
      // Mix one valid invoice with one that has a null payee. The bad one
      // must be skipped, and the batch must still attempt with the good one.
      const client = makeClient([
        baseRequest(),
        baseRequest({ requestId: "02" + "b".repeat(62), payee: { value: undefined } }),
      ]);
      const wallet = ethers.Wallet.createRandom();
      const payer2 = new SpraayBatchPayer(wallet as any, 8453);

      // payInvoices will be reached and fail later (no provider/balance),
      // but it must NOT fail with an "Invalid address" abort from the empty
      // payee — that's the regression we're guarding against.
      try {
        await payer2.payPendingInvoices(client as any, payer);
      } catch (err: any) {
        expect(err.message).to.not.include("Invalid address");
      }
    });

    it("does not match USDC from a different chain", async () => {
      // Configure for Base but feed an Ethereum-USDC invoice; it must be
      // ignored, yielding "no pending invoices" rather than a wrong-chain pay.
      const ethUsdc = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
      const client = makeClient([
        baseRequest({ currency: { type: "ERC20", value: ethUsdc, network: "mainnet" } }),
      ]);
      const wallet = ethers.Wallet.createRandom();
      const payer2 = new SpraayBatchPayer(wallet as any, 8453);

      try {
        await payer2.payPendingInvoices(client as any, payer);
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.message).to.include("No pending USDC invoices");
      }
    });
  });
});
