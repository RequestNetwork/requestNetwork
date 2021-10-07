import { DataAccessTypes, StorageTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import Block from './block';
import { EventEmitter } from 'events';

type TransactionBuffered = {
  transaction: DataAccessTypes.ITransaction;
  channelId: string;
  topics: string[];
};

export type TypeFlushReturn = {
  block: DataAccessTypes.IBlock;
  subs: StorageTypes.IAppendResult[];
} | null;

export default class TransactionsBuffer {
  public transactionsBuffered: Map<string, TransactionBuffered> = new Map();
  public transactionsWaitingConfirmation: Map<string, StorageTypes.IAppendResult> = new Map();

  public async push(
    transaction: DataAccessTypes.ITransaction,
    channelId: string,
    topics: string[],
  ): Promise<StorageTypes.IAppendResult> {
    const newTx: TransactionBuffered = {
      transaction,
      channelId,
      topics,
    };
    const id = Utils.crypto.normalizeKeccak256Hash(newTx).value;

    this.transactionsBuffered.set(id, newTx);

    const timestamp = Utils.getCurrentTimestampInSecond();

    const result: StorageTypes.IAppendResult = Object.assign(new EventEmitter(), {
      id,
      content: '',
      meta: {
        storageType: StorageTypes.StorageSystemType.LOCAL,
        state: StorageTypes.ContentState.PENDING,
        local: { location: 'TODO buffer URL ?' },
        timestamp,
      },
    });

    this.transactionsWaitingConfirmation.set(id, result);

    return result;
  }

  // TODO divide this function in two
  public async flush(): Promise<TypeFlushReturn> {
    let block: DataAccessTypes.IBlock = Block.createEmptyBlock();
    const subs: StorageTypes.IAppendResult[] = [];

    for (const key in this.transactionsBuffered) {
      const tx = this.transactionsBuffered.get(key);
      block = Block.pushTransaction(
        Block.createEmptyBlock(),
        tx!.transaction,
        tx!.channelId,
        tx!.topics,
      );
      const sub = await this.transactionsWaitingConfirmation.get(key);
      if (!sub) {
        throw Error('TODO');
      }
      subs.push(sub);
    }

    // TODO empty buffer:
    await this.transactionsBuffered.clear();
    await this.transactionsWaitingConfirmation.clear();

    return {
      block,
      subs,
    };
  }
}
