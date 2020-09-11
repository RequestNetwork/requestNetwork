import { DataAccessTypes, TransactionTypes } from '@requestnetwork/types';

import { Block } from '@requestnetwork/data-access';

import HttpMetamaskDataAccess from '../src/http-metamask-data-access';

// create a block and add the transaction in it
let block1: DataAccessTypes.IBlock = Block.pushTransaction(
  Block.createEmptyBlock(),
  { data: 'data1' },
  'channel1',
  ['topic1', 'topic11'],
);
block1 = Block.pushTransaction(block1, { data: 'data2' }, 'channel2', ['topic2', 'topic22']);

let block2: DataAccessTypes.IBlock = Block.pushTransaction(
  Block.createEmptyBlock(),
  { data: 'data11' },
  'channel1',
);
block2 = Block.pushTransaction(block2, { data: 'data22' }, 'channel2');

/* tslint:disable:no-unused-expression */
describe('HttpMetamaskDataAccess', () => {
  describe('getCacheAndClean()', () => {
    it('get transaction from cache and clean the one added', async () => {
      const httpMMDataAccess = new HttpMetamaskDataAccess();

      // set up cache:
      httpMMDataAccess.cache = {
        channel1: {
          location1: { block: block1, storageMeta: { blockTimestamp: 10 } },
          location2: { block: block2, storageMeta: { blockTimestamp: 20 } },
        },
      };

      const cacheCleaned = httpMMDataAccess.getCachedTransactionsAndCleanCache('channel1', [
        'location1',
      ]);

      expect(cacheCleaned).toMatchObject({
        meta: {
          storageMeta: [{ blockTimestamp: 20 }],
          transactionsStorageLocation: ['location2'],
        },
        result: {
          transactions: [
            {
              state: TransactionTypes.TransactionState.PENDING,
              timestamp: 20,
              transaction: { data: 'data11' },
            },
          ],
        },
      });

      expect(httpMMDataAccess.cache.channel1).toMatchObject({
        location1: null,
        location2: {
          block: block2,
          storageMeta: {
            blockTimestamp: 20,
          },
        },
      });
    });
  });
});
