# Batch USDC Payments with Spraay Protocol

> Settle multiple Request Network invoices in a single on-chain transaction.

## Overview

[Spraay Protocol](https://spraay.app) provides multi-recipient batch transfer contracts deployed across Base, Ethereum, Arbitrum, Polygon, BNB Chain, and Avalanche. This integration lets you batch-pay Request Network invoices — paying 10, 30, or even 200 recipients in one transaction instead of N separate ones.

## Installation

```bash
npm install @requestnetwork/payment-processor ethers
```

## Usage

### Pay specific invoices

```typescript
import { ethers } from "ethers";
import { SpraayBatchPayer } from "@requestnetwork/payment-processor";

const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

const spraay = new SpraayBatchPayer(signer, 8453); // Base

const result = await spraay.payInvoices({
  invoices: [
    { requestId: "01abc...", recipient: "0xAlice...", amount: "500.00" },
    { requestId: "02def...", recipient: "0xBob...", amount: "250.00" },
    { requestId: "03ghi...", recipient: "0xCarol...", amount: "1200.00" },
  ],
});

console.log(`Paid ${result.recipientCount} invoices in 1 tx: ${result.explorerUrl}`);
```

### Auto-discover and pay pending invoices

```typescript
import { RequestNetwork } from "@requestnetwork/request-client.js";

const requestClient = new RequestNetwork({
  nodeConnectionConfig: {
    baseURL: "https://gnosis.gateway.request.network/",
  },
});

const result = await spraay.payPendingInvoices(
  requestClient,
  payerAddress,
  {
    maxInvoices: 50,
    maxAmount: "10000", // skip large invoices for manual review
  }
);
```

## How It Works

1. **Fetch** — Retrieves pending USDC invoices where you are the payer
2. **Validate** — Checks all recipient addresses and amounts
3. **Balance check** — Verifies you have sufficient USDC
4. **Approve** — Grants the Spraay batch contract permission to transfer USDC (one-time per amount)
5. **Batch transfer** — Calls `batchTransfer(token, recipients[], amounts[])` — **one transaction**
6. **Confirm** — Returns tx hash, block number, explorer link, and per-invoice status

All payments are **atomic**: either every recipient gets paid, or the entire transaction reverts.

## Supported Chains

| Chain     | Chain ID | Status |
|-----------|----------|--------|
| Base      | 8453     | ✅ Live |
| Ethereum  | 1        | ✅ Live |
| Arbitrum  | 42161    | ✅ Live |
| Polygon   | 137      | ✅ Live |
| BNB Chain | 56       | ✅ Live |
| Avalanche | 43114    | ✅ Live |

## Gas Savings

| Invoices | Individual | Spraay Batch | Savings |
|----------|-----------|--------------|---------|
| 5        | ~$0.05    | ~$0.02       | 60%     |
| 10       | ~$0.10    | ~$0.02       | 80%     |
| 30       | ~$0.30    | ~$0.03       | 90%     |

*Estimates on Base L2. Ethereum L1 savings are proportionally larger.*

## Links

- [Spraay Protocol](https://spraay.app)
- [Spraay Gateway API](https://gateway.spraay.app) — 115+ paid endpoints, 13+ chains
- [Standalone integration package](https://github.com/plagtech/spraay-request-network)
- [Spraay MCP Server](https://smithery.ai/server/@plag/spraay-payments-mcp) — 120 AI agent tools
