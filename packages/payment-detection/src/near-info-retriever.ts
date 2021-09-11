import { PaymentTypes } from '@requestnetwork/types';

const NEAR_WEB_SOCKET_URL = 'wss://near-explorer-wamp.onrender.com/ws';

/**
 * Gets a list of transfer events for a set of Near payment details
 */
export class NearInfoRetriever {
  private nearWebSocketUrl: string;
  /**
   * @param paymentReference The reference to identify the payment
   * @param toAddress Address to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The id of network we want to check
   */
  constructor(
    private paymentReference: string,
    private toAddress: string,
    private proxyContractName: string,
    private procedureName: string,
    private eventName: PaymentTypes.EVENTS_NAMES,
    private network: string,
  ) {
    if (this.network !== 'aurora' && this.network !== 'aurora-testnet') {
      throw new Error('Near input data info-retriever only works with Near mainnet and testnet');
    }
    this.nearWebSocketUrl = NEAR_WEB_SOCKET_URL;
  }

  public async getTransferEvents(): Promise<PaymentTypes.ETHPaymentNetworkEvent[]> {
    const events = await this.getTransactionsFromNearIndexerDatabase();
    return events.map((transaction) => ({
      amount: transaction.deposit,
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
    const query = `SELECT t.transaction_hash as "txHash",
        b.block_height as block,
        t.block_timestamp as "blockTimestamp",
        t.signer_account_id as payer,
        r.receiver_account_id as payee,
        COALESCE(a.args::json->>'deposit', '') as deposit,
        COALESCE(a.args::json->>'method_name', '') as method_name,
        COALESCE((a.args::json->'args_json')::json->>'to', '') as "to",
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
        const autobahn = require('autobahn');
        const connection: any = new autobahn.Connection({
          url: this.nearWebSocketUrl,
          realm: 'near-explorer',
        });
        connection.onopen = async (session: any) => {
          await session
            .call(this.procedureName, [
              query,
              {
                contractName: this.proxyContractName,
                paymentAddress: this.toAddress,
                paymentReference: this.paymentReference,
              },
            ])
            .then((data: any) => {
              connection.close();
              resolve(data as NearIndexerTransaction[]);
            })
            .catch((err: Error) => {
              reject(`Could not connect to Near indexer web socket: ${err.message}.\n${err.stack}`);
            });
        };
        connection.onclose = (reason: string) => {
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
  paymentReference: string;
};
