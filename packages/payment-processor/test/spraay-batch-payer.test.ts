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
});
