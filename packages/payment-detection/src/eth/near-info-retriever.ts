import { PaymentTypes } from '@requestnetwork/types';
import { Client } from 'pg';

/**
 * Gets a list of transfer events for an address and payment reference
 */
export default class NearInfoRetriever {
  private contractName: ReturnType<typeof getContractName>;
  private connectionString: ReturnType<typeof getIndexerConnectionString>;
  /**
   * @param toAddress Address to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The id of network we want to check
   * @param paymentReference The reference to identify the payment
   */
  constructor(
    private toAddress: string,
    private eventName: PaymentTypes.EVENTS_NAMES,
    private network: string,
    private paymentReference: string,
  ) {
    if (this.network !== 'aurora' && this.network !== 'aurora-testnet') {
      throw new Error('Near input data info-retriever only works with Near mainnet and testnet');
    }
    this.contractName = getContractName(this.network);
    this.connectionString = getIndexerConnectionString(this.network);
  }

  public async getTransferEvents(): Promise<PaymentTypes.ETHPaymentNetworkEvent[]> {
    const events = (await this.getTransactionsFromNearIndexerDatabase()).map((transaction) => ({
      amount: transaction.amount,
      name: this.eventName,
      parameters: {
        block: transaction.block,
        confirmations: transaction.confirmations,
        txHash: transaction.txHash,
      },
      timestamp: Number(
        transaction.blockTimestamp.substring(0, transaction.blockTimestamp.length - 9),
      ),
    }));
    return events;
  }

  /**
   * Documentation: https://github.com/near/near-indexer-for-explorer/blob/master/docs/near-indexer-for-explorer-db.png
   */
  private async getTransactionsFromNearIndexerDatabase(): Promise<NearIndexerTransaction[]> {
    const query = `SELECT t.transaction_hash as "txHash",
        b.block_height as block,
        t.block_timestamp as "blockTimestamp",
        t.signer_account_id as payer,
        r.receiver_account_id as payee,
        COALESCE(a.args::json->>'deposit', '') as deposit,
        COALESCE(a.args::json->>'method_name', '') as method_name,
        COALESCE((a.args::json->'args_json')::json->>'to', '') as "to",
        COALESCE((a.args::json->'args_json')::json->>'amount', '') as amount,
        (a.args::json->'args_json')::json->>'payment_reference' as paymentReference,
        (select MAX(block_height) from blocks) - b.block_height as confirmations
      FROM transactions t
      INNER JOIN transaction_actions a ON (a.transaction_hash = t.transaction_hash)
      INNER JOIN receipts r ON (r.originated_from_transaction_hash = t.transaction_hash)
      INNER JOIN blocks b ON (b.block_timestamp = r.included_in_block_timestamp)
      INNER JOIN execution_outcomes e ON (e.receipt_id = r.receipt_id)
      INNER JOIN action_receipt_actions ra ON (ra.receipt_id = r.receipt_id)
      WHERE r.receiver_account_id = '${this.toAddress}'
      AND r.predecessor_account_id != 'system'
      AND a.action_kind = 'FUNCTION_CALL'
      AND e.status = 'SUCCESS_VALUE'
      AND t.receiver_account_id = $1
      AND b.block_height >= (select MAX(block_height) from blocks) - 1e8
      AND (a.args::json->'args_json')::json->>'payment_reference' = '0x${this.paymentReference}'
      AND ra.action_kind = 'TRANSFER'
      ORDER BY b.block_height DESC
      LIMIT 100`;

    try {
      const client = new Client({
        connectionString: this.connectionString,
      });
      await client.connect();
      const res = await client.query(query, [this.contractName]);
      await client.end();
      return res.rows as NearIndexerTransaction[];
    } catch (err) {
      console.log(err.stack);
      throw Error(`Error retrieving data: ${err.message}\n${err.stack}`);
    }
  }
}

const getContractName = (chainName: string) => {
  switch (chainName) {
    case 'aurora':
      return 'request-network';
    case 'aurora-testnet':
      return 'dev-1626339335241-5544297';
    default:
      throw Error(`Unconfigured chain '${chainName}'.`);
  }
};

const getIndexerConnectionString = (chainName: string) => {
  // Public NEAR Indexer database (see: https://github.com/near/near-indexer-for-explorer)
  switch (chainName) {
    case 'aurora':
      return 'postgres://public_readonly:nearprotocol@104.199.89.51/mainnet_explorer';
    case 'aurora-testnet':
      return 'postgres://public_readonly:nearprotocol@35.184.214.98/testnet_explorer';
  }
};

type NearIndexerTransaction = {
  txHash: string;
  block: number;
  blockTimestamp: string;
  confirmations: number;
  payer: string;
  payee: string;
  deposit: string;
  method_name: string;
  to: string;
  amount: string;
  paymentReference: string;
};
