/**
 * Spraay Batch Payment Integration for Request Network
 *
 * Settles multiple Request Network invoices in a single on-chain transaction
 * using Spraay Protocol's multi-recipient batch transfer contracts.
 *
 * @module @requestnetwork/payment-processor/spraay-batch-payer
 * @see https://spraay.app
 * @see https://github.com/plagtech/spraay-request-network
 */

import { ethers, Signer, Contract, ContractTransactionReceipt } from "ethers";
import {
  SPRAAY_BATCH_CONTRACTS,
  USDC_ADDRESSES,
  CHAIN_NAMES,
  EXPLORER_URLS,
  ERC20_ABI,
  SPRAAY_BATCH_ABI,
} from "./spraay-utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Single invoice payment descriptor */
export interface InvoicePayment {
  requestId: string;
  recipient: string;
  amount: string;
  memo?: string;
}

/** Input for a batch payment call */
export interface BatchPaymentRequest {
  invoices: InvoicePayment[];
  tokenAddress?: string;
  chainId?: number;
}

/** Per-invoice settlement status */
export interface PaymentSettlement {
  requestId: string;
  recipient: string;
  amount: string;
  status: "settled" | "failed";
}

/** Result of a batch payment execution */
export interface BatchPaymentResult {
  transactionHash: string;
  chainId: number;
  recipientCount: number;
  totalAmount: string;
  payments: PaymentSettlement[];
  blockNumber: number;
  explorerUrl: string;
}

/** Options for auto-discovery of pending invoices */
export interface PendingInvoiceOptions {
  maxInvoices?: number;
  minAmount?: string;
  maxAmount?: string;
}

/**
 * Minimal structural types for the Request Network client surface used here.
 * Mirrors the relevant parts of `@requestnetwork/request-client.js` and
 * `@requestnetwork/types` so callers get compile-time checking without us
 * depending on the full client type. The real `RequestNetwork` client and
 * `Request` objects satisfy these shapes.
 */
export interface RequestCurrencyInfo {
  type: string;
  value: string;
  network?: string;
}

export interface RequestData {
  requestId: string;
  state: string;
  expectedAmount: string;
  currency?: RequestCurrencyInfo;
  payer?: { value?: string };
  payee?: { value?: string };
  balance?: { balance?: string } | null;
  contentData?: { reason?: string };
}

export interface RequestLike {
  getData(): RequestData;
}

export interface RequestNetworkClientLike {
  fromIdentity(identity: {
    type: string;
    value: string;
  }): Promise<RequestLike[]>;
}

// ---------------------------------------------------------------------------
// SpraayBatchPayer
// ---------------------------------------------------------------------------

/**
 * Batch-pay multiple Request Network invoices in a single on-chain transaction.
 *
 * @example
 * ```typescript
 * const spraay = new SpraayBatchPayer(signer, 8453);
 *
 * const result = await spraay.payInvoices({
 *   invoices: [
 *     { requestId: "01...", recipient: "0xAlice", amount: "500.00" },
 *     { requestId: "02...", recipient: "0xBob",   amount: "250.00" },
 *   ],
 * });
 *
 * console.log(result.explorerUrl); // single tx covering both payments
 * ```
 */
export class SpraayBatchPayer {
  private signer: Signer;
  private chainId: number;

  constructor(signer: Signer, chainId: number = 8453) {
    this.signer = signer;
    this.chainId = chainId;
  }

  /**
   * Pay a specific list of invoices in one batch transaction.
   *
   * Steps:
   * 1. Validate all recipient addresses
   * 2. Parse amounts to token decimals
   * 3. Verify sender balance covers total
   * 4. Approve Spraay contract for USDC spend (if needed)
   * 5. Execute `batchTransfer(token, recipients[], amounts[])`
   * 6. Return tx receipt with per-invoice status
   */
  async payInvoices(request: BatchPaymentRequest): Promise<BatchPaymentResult> {
    const chainId = request.chainId ?? this.chainId;
    const batchContractAddr = SPRAAY_BATCH_CONTRACTS[chainId];
    const tokenAddr = request.tokenAddress ?? USDC_ADDRESSES[chainId];

    // Validate chain support
    if (!batchContractAddr) {
      const supported = Object.entries(CHAIN_NAMES)
        .map(([id, name]) => `${name} (${id})`)
        .join(", ");
      throw new Error(
        `Spraay batch contract not available on chain ${chainId}. Supported: ${supported}`
      );
    }
    if (!tokenAddr) {
      throw new Error(`USDC not configured for chain ${chainId}`);
    }
    if (request.invoices.length === 0) {
      throw new Error("No invoices provided");
    }
    if (request.invoices.length > 200) {
      throw new Error("Max 200 recipients per batch. Split into multiple calls.");
    }

    const token = new Contract(tokenAddr, ERC20_ABI, this.signer);
    const decimals: number = await token.decimals();
    const senderAddr = await this.signer.getAddress();

    // Build arrays
    const recipients: string[] = [];
    const amounts: bigint[] = [];

    for (const inv of request.invoices) {
      if (!ethers.isAddress(inv.recipient)) {
        throw new Error(`Invalid address for ${inv.requestId}: ${inv.recipient}`);
      }
      recipients.push(inv.recipient);
      amounts.push(ethers.parseUnits(inv.amount, decimals));
    }

    const total = amounts.reduce((s, a) => s + a, 0n);

    // Balance check
    const balance: bigint = await token.balanceOf(senderAddr);
    if (balance < total) {
      throw new Error(
        `Insufficient balance. Need ${ethers.formatUnits(total, decimals)} USDC, ` +
          `have ${ethers.formatUnits(balance, decimals)}.`
      );
    }

    // Approve if needed
    const allowance: bigint = await token.allowance(senderAddr, batchContractAddr);
    if (allowance < total) {
      const approveTx = await token.approve(batchContractAddr, total);
      const approveReceipt = await approveTx.wait();
      // ethers v6: wait() resolves to null if the tx was replaced/dropped.
      // Surface a clear error instead of falling through to a confusing
      // allowance failure in batchTransfer.
      if (!approveReceipt || approveReceipt.status !== 1) {
        throw new Error(
          "USDC approval transaction failed or was replaced before confirmation. " +
            "Please retry the batch payment."
        );
      }
    }

    // Execute batch
    const spraay = new Contract(batchContractAddr, SPRAAY_BATCH_ABI, this.signer);
    const tx = await spraay.batchTransfer(tokenAddr, recipients, amounts);
    const receipt: ContractTransactionReceipt | null = await tx.wait();

    if (!receipt) {
      throw new Error(
        "Batch transfer transaction was replaced or dropped before confirmation. " +
          "Check the transaction status before retrying to avoid double payment."
      );
    }

    // A mined-but-reverted transaction (status 0) means no funds moved. Throw
    // rather than returning a result with a real transactionHash, so callers
    // can't mistake a reverted batch for an attempted/successful one.
    if (receipt.status !== 1) {
      const explorerBase = EXPLORER_URLS[chainId] ?? "https://blockscan.com/tx/";
      throw new Error(
        `Batch transfer reverted on-chain (status ${receipt.status}). ` +
          `No funds were transferred. Tx: ${explorerBase}${receipt.hash}`
      );
    }

    const explorerBase = EXPLORER_URLS[chainId] ?? "https://blockscan.com/tx/";

    return {
      transactionHash: receipt.hash,
      chainId,
      recipientCount: recipients.length,
      totalAmount: ethers.formatUnits(total, decimals),
      payments: request.invoices.map((inv) => ({
        requestId: inv.requestId,
        recipient: inv.recipient,
        amount: inv.amount,
        status: "settled" as const,
      })),
      blockNumber: receipt.blockNumber,
      explorerUrl: `${explorerBase}${receipt.hash}`,
    };
  }

  /**
   * Auto-discover pending USDC invoices from a Request Network client
   * and batch-pay them all.
   *
   * @param requestClient - Initialized RequestNetwork client instance
   * @param payerAddress  - The payer's Ethereum address
   * @param options       - Filter options (max count, amount range)
   */
  async payPendingInvoices(
    requestClient: RequestNetworkClientLike,
    payerAddress: string,
    options?: PendingInvoiceOptions
  ): Promise<BatchPaymentResult> {
    const requests = await requestClient.fromIdentity({
      type: "ETHEREUM_ADDRESS",
      value: payerAddress,
    });

    // USDC uses 6 decimals on every chain Spraay supports. This is only used
    // to render a human-readable amount string; payInvoices() re-parses that
    // string against the live token.decimals() value, which is the
    // authoritative source for the actual on-chain amount.
    const USDC_DECIMALS = 6;

    const invoices: InvoicePayment[] = [];

    for (const req of requests) {
      const data = req.getData();

      if (data.state !== "created" && data.state !== "accepted") continue;
      if (data.payer?.value?.toLowerCase() !== payerAddress.toLowerCase()) continue;

      const currency = data.currency;
      if (currency?.type !== "ERC20") continue;
      // Only match USDC on the chain this payer is configured for — a USDC
      // address from another network must not be swept into this batch.
      if (!this.isUSDC(currency.value)) continue;

      // Skip invoices with a missing or invalid payee rather than pushing an
      // empty address, which would later abort the entire batch.
      const payeeAddress = data.payee?.value;
      if (!payeeAddress || !ethers.isAddress(payeeAddress)) continue;

      const paid = BigInt(data.balance?.balance ?? "0");
      const expected = BigInt(data.expectedAmount);
      const remaining = expected - paid;
      if (remaining <= 0n) continue;

      const amt = ethers.formatUnits(remaining, USDC_DECIMALS);

      if (options?.minAmount && parseFloat(amt) < parseFloat(options.minAmount)) continue;
      if (options?.maxAmount && parseFloat(amt) > parseFloat(options.maxAmount)) continue;

      invoices.push({
        requestId: data.requestId,
        recipient: payeeAddress,
        amount: amt,
        memo: data.contentData?.reason ?? data.requestId.slice(0, 8),
      });

      if (options?.maxInvoices && invoices.length >= options.maxInvoices) break;
    }

    if (invoices.length === 0) {
      throw new Error("No pending USDC invoices found");
    }

    return this.payInvoices({ invoices });
  }

  /**
   * Returns true only if `addr` is the USDC contract on this payer's
   * configured chain. Checking against a single chain (not every chain's
   * USDC) prevents cross-chain address collisions from being misclassified.
   */
  private isUSDC(addr: string): boolean {
    const usdcForChain = USDC_ADDRESSES[this.chainId];
    return (
      !!usdcForChain && usdcForChain.toLowerCase() === addr.toLowerCase()
    );
  }
}
