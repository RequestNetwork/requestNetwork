import { EventEmitter } from 'events';
import TypedEmitter from 'typed-emitter';
import { Block } from '@requestnetwork/data-access';
import { DataAccessTypes, StorageTypes } from '@requestnetwork/types';

import { TheGraphDataAccess, TheGraphDataAccessOptions } from './TheGraphDataAccess';
import { waitFor } from './utils';

type BatchEventEmitter = TypedEmitter<{
  created: (meta: StorageTypes.IAppendResult) => void;
  confirmed: ({}: {}) => void;
}>;

export class TheGraphBatchedDataAccess extends TheGraphDataAccess {
  private queue: {
    transaction: DataAccessTypes.ITransaction;
    channelId: string;
    topics?: string[];
    eventEmitter: BatchEventEmitter;
  }[] = [];
  private timeout?: NodeJS.Timeout;
  private batchFrequency = 2000;

  constructor(options: TheGraphDataAccessOptions) {
    super(options);

    this.flush = this.flush.bind(this);
  }

  async initialize() {
    await super.initialize();
    this.timeout = setTimeout(this.flush, this.batchFrequency);
  }

  stop() {
    if (this.timeout) clearTimeout(this.timeout);
  }

  async persistTransaction(
    transaction: DataAccessTypes.ITransaction,
    channelId: string,
    topics?: string[],
  ): Promise<DataAccessTypes.IReturnPersistTransaction> {
    const batchEmitter = new EventEmitter() as BatchEventEmitter;
    this.queue.push({
      transaction,
      channelId,
      topics,
      eventEmitter: batchEmitter,
    });

    const storageResult = await waitFor(batchEmitter, 'created');

    return super.createPersistTransactionResult(
      channelId,
      transaction,
      storageResult,
      topics || [],
    );
  }

  private async flush() {
    if (this.queue.length > 0) {
      console.log(`flushing ${this.queue.length} transactions`);
      let block = Block.createEmptyBlock();
      const emitters: BatchEventEmitter[] = [];
      while (this.queue.length > 0) {
        const { transaction, channelId, topics, eventEmitter } = this.queue.pop()!;
        emitters.push(eventEmitter);
        block = Block.pushTransaction(block, transaction, channelId, topics);
      }
      const result = await this.storage.append(JSON.stringify(block));

      emitters.forEach((emitter) => emitter.emit('created', result));
      result.on('confirmed', () => {
        emitters.forEach((emitter) => emitter.emit('confirmed', {}));
      });
    }
    // TODO
    this.timeout = setTimeout(this.flush, this.batchFrequency);
  }
}
