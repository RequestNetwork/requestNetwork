// @ts-nocheck
import { PaymentTypes } from '@requestnetwork/types';
import { Connection } from 'autobahn';

/**
 * Gets a list of transfer events for an address and payment reference
 */
export class NearInfoRetriever {
  private contractName: ReturnType<typeof getNearContractName>;
  private procedureName: ReturnType<typeof getProcedureName>;
  private nearWebSocketUrl: string;
  /**
   * @param toAddress Address to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The id of network we want to check
   * @param paymentReference The reference to identify the payment
   */
  constructor(
    private paymentAddress: string,
    private eventName: PaymentTypes.EVENTS_NAMES,
    private network: string,
    private paymentReference: string,
  ) {
    if (this.network !== 'aurora' && this.network !== 'aurora-testnet') {
      throw new Error('Near input data info-retriever only works with Near mainnet and testnet');
    }
    this.contractName = getNearContractName(this.network);
    this.procedureName = getProcedureName(this.network);
    this.nearWebSocketUrl = 'wss://near-explorer-wamp.onrender.com/ws';
  }

  public async getTransferEvents() {
    const events = await this.getTransactionsFromNearIndexerDatabase();
    return events.map((transaction) => ({
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
  }

  /**
   * Documentation: https://github.com/near/near-indexer-for-explorer/blob/master/docs/near-indexer-for-explorer-db.png
   */
  private async getTransactionsFromNearIndexerDatabase(): Promise<NearIndexerTransaction[]> {
    // _callback: (transactions: NearIndexerTransaction[]) => void,
    // try {
    //   // for Node.js
    //   var autobahn = require('autobahn');
    // } catch (e) {
    //   // for browsers (where AutobahnJS is available globally)
    //   throw new Error('TODO Autobahn');
    // }
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
      WHERE r.receiver_account_id = :paymentAddress
      AND r.predecessor_account_id != 'system'
      AND a.action_kind = 'FUNCTION_CALL'
      AND e.status = 'SUCCESS_VALUE'
      AND t.receiver_account_id = :contractName
      AND b.block_height >= (select MAX(block_height) from blocks) - 1e8
      AND (a.args::json->'args_json')::json->>'payment_reference' = :paymentReference
      AND ra.action_kind = 'TRANSFER'
      ORDER BY b.block_height DESC
      LIMIT 100`;
    return new Promise((resolve, reject) => {
      try {
        const connection = new Connection({
          url: this.nearWebSocketUrl,
          realm: 'near-explorer',
        });
        connection.onopen = async (session) => {
          await session
            .call(this.procedureName, [
              query,
              {
                contractName: this.contractName,
                paymentAddress: this.paymentAddress,
                paymentReference: `0x${this.paymentReference}`,
              },
            ])
            .then((data: any) => {
              connection.close();
              resolve(data as NearIndexerTransaction[]);
            })
            .catch((err: Error) => {
              throw Error(reason);
            });
        };
        connection.onclose = (reason, details) => {
          if (reason === 'unsupported' || reason === 'unreachable') {
            reject(`Could not connect to Near indexer web socket: ${reason}`);
          }
          return false;
        };
        connection.open();
      } catch (err) {
        reject(`Could not connect to Near indexer web socket: ${err.message}.\n${err.stack}`);
      }
    });
  }
}

export const getNearContractName = (chainName: string) => {
  switch (chainName) {
    case 'aurora':
      return 'request-network';
    case 'aurora-testnet':
      return 'dev-1626339335241-5544297';
    default:
      throw Error(`Unconfigured chain '${chainName}'.`);
  }
};

const getProcedureName = (chainName: string) => {
  // Public NEAR Indexer database (see: https://github.com/near/near-indexer-for-explorer)
  switch (chainName) {
    case 'aurora':
      return 'com.nearprotocol.mainnet.explorer.select:INDEXER_BACKEND';
    case 'aurora-testnet':
      return 'com.nearprotocol.testnet.explorer.select:INDEXER_BACKEND';
  }
  throw new Error(`Invalid chain name '${chainName} for Near info retriever.`);
};

export type NearIndexerTransaction = {
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
