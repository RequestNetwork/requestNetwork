// tslint:disable: await-promise
// tslint:disable: no-magic-numbers

import { DataAccessTypes } from '@requestnetwork/types';

import TransactionIndex from '../src/transaction-index/index';
import TimestampByLocation from '../src/transaction-index/timestamp-by-location';

const testBlock: DataAccessTypes.IBlockHeader = {
  channelIds: { 'request-1': [1] },
  topics: { 'request-1': ['topic-1'] },
  version: '2.0',
};

describe('TransactionIndex', () => {
  let transactionIndex: TransactionIndex;
  beforeEach(async () => {
    transactionIndex = new TransactionIndex();
  });

  describe('addTransaction', () => {
    it('addTransaction() should be fullfilled', async () => {
      await transactionIndex.addTransaction('', testBlock, 0);
    });

    it('calls locationByTopic and timestampByLocation', async () => {
      const pushStorageLocationIndexedWithBlockTopicsMock = jest.fn();
      (transactionIndex as any).locationByTopic.pushStorageLocationIndexedWithBlockTopics = pushStorageLocationIndexedWithBlockTopicsMock;

      const pushTimestampByLocationMock = jest.fn();
      (transactionIndex as any).timestampByLocation.pushTimestampByLocation = pushTimestampByLocationMock;

      await transactionIndex.addTransaction('abcd', testBlock, 2);

      expect(pushStorageLocationIndexedWithBlockTopicsMock).toHaveBeenCalledWith('abcd', testBlock);
      expect(pushTimestampByLocationMock).toHaveBeenCalledWith('abcd', 2);
    });
  });

  describe('getStorageLocationList', () => {
    beforeEach(async () => {
      // mock location by topic
      (transactionIndex as any).locationByTopic.getStorageLocationsFromChannelId = jest.fn(() => [
        'a',
        'b',
        'c',
      ]);

      const timestampByLocation: TimestampByLocation = (transactionIndex as any)
        .timestampByLocation;
      await timestampByLocation.pushTimestampByLocation('a', 9);
      await timestampByLocation.pushTimestampByLocation('b', 10);
      await timestampByLocation.pushTimestampByLocation('c', 11);
    });

    it('getStorageLocationList() should be fullfilled', async () => {
      await expect(transactionIndex.getStorageLocationList(''));
    });

    it('should return all if timestamp not specified', async () => {
      const storageLocationList = await transactionIndex.getStorageLocationList('');
      expect(storageLocationList).toEqual(['a', 'b', 'c']);
    });

    it('should filter data if timestamp specified', async () => {
      const storageLocationList1 = await transactionIndex.getStorageLocationList('', {
        to: 10,
      });
      expect(storageLocationList1).toEqual(['a', 'b']);

      const storageLocationList2 = await transactionIndex.getStorageLocationList('', {
        from: 10,
        to: 11,
      });
      expect(storageLocationList2).toEqual(['b', 'c']);

      const storageLocationList3 = await transactionIndex.getStorageLocationList('', {
        from: 11,
        to: 12,
      });
      expect(storageLocationList3).toEqual(['c']);

      const storageLocationList4 = await transactionIndex.getStorageLocationList('', {
        from: 12,
        to: 13,
      });
      expect(storageLocationList4).toEqual([]);
    });
  });

  describe('getChannelIdsForTopic', () => {
    it('getChannelIdsForTopic() should be fullfilled', async () => {
      await expect(transactionIndex.getChannelIdsForTopic(''));
    });

    it('getChannelIdsForTopic() should support multiple channel ids for topic', async () => {
      await transactionIndex.addTransaction(
        'dataId1',
        {
          channelIds: {
            'channel-1': [1],
            'channel-2': [2],
          },
          topics: {
            'channel-1': ['topic-a'],
            'channel-2': ['topic-a'],
          },
          version: '2.0',
        },
        1,
      );
      const channels = await transactionIndex.getChannelIdsForTopic('topic-a');
      expect(channels).toEqual(['channel-1', 'channel-2']);
    });

    it('getChannelIdsForTopic() should support multiple channel ids for topic with time boundaries', async () => {
      await transactionIndex.addTransaction(
        'dataId1',
        {
          channelIds: {
            'channel-1': [1],
            'channel-2': [2],
          },
          topics: {
            'channel-1': ['topic-a'],
            'channel-2': ['topic-a'],
          },
          version: '2.0',
        },
        2,
      );

      await transactionIndex.addTransaction(
        'dataId2',
        {
          channelIds: {
            'channel-2': [1],
            'channel-3': [2],
          },
          topics: {},
          version: '2.0',
        },
        10,
      );

      await transactionIndex.addTransaction(
        'dataId3',
        {
          channelIds: {
            'channel-3': [0],
          },
          topics: {
            'channel-3': ['topic-b'],
          },
          version: '2.0',
        },
        20,
      );

      expect(await transactionIndex.getChannelIdsForTopic('topic-a', { from: 3 })).toEqual([
        'channel-2',
      ]);
      expect(await transactionIndex.getChannelIdsForTopic('topic-a', { to: 3 })).toEqual([
        'channel-1',
        'channel-2',
      ]);

      expect(await transactionIndex.getChannelIdsForTopic('topic-a', { from: 11 })).toEqual([]);
      expect(await transactionIndex.getChannelIdsForTopic('topic-a', { to: 1 })).toEqual([]);

      expect(await transactionIndex.getChannelIdsForTopic('topic-b', { to: 11 })).toEqual([
        'channel-3',
      ]);
      expect(await transactionIndex.getChannelIdsForTopic('topic-b', { from: 11 })).toEqual([
        'channel-3',
      ]);
    });
  });

  describe('getChannelIdsForMultipleTopics', () => {
    it('getChannelIdsForMultipleTopics() should be full filled', async () => {
      await expect(transactionIndex.getChannelIdsForMultipleTopics([]));
    });

    it('getChannelIdsForMultipleTopics() should support multiple channel ids for multiple topics', async () => {
      await transactionIndex.addTransaction(
        'dataId1',
        {
          channelIds: {
            'channel-1': [1],
            'channel-2': [2],
            'channel-3': [3],
          },
          topics: {
            'channel-1': ['topic-a'],
            'channel-2': ['topic-a'],
            'channel-3': ['topic-b'],
            'channel-4': ['topic-b', 'topic-c'],
          },
          version: '2.0',
        },
        1,
      );
      expect(await transactionIndex.getChannelIdsForMultipleTopics(['topic-a'])).toEqual([
        'channel-1',
        'channel-2',
      ]);
      expect(await transactionIndex.getChannelIdsForMultipleTopics(['topic-b'])).toEqual([
        'channel-3',
        'channel-4',
      ]);
      expect(await transactionIndex.getChannelIdsForMultipleTopics(['topic-c'])).toEqual([
        'channel-4',
      ]);
    });

    it('getChannelIdsForMultipleTopics() should support multiple channel ids for multiple topics with boundaries', async () => {
      await transactionIndex.addTransaction(
        'dataId1',
        {
          channelIds: {
            'channel-1': [1],
            'channel-2': [2],
          },
          topics: {
            'channel-1': ['topic-a'],
            'channel-2': ['topic-b'],
          },
          version: '2.0',
        },
        1,
      );
      await transactionIndex.addTransaction(
        'dataId2',
        {
          channelIds: {
            'channel-1': [1],
            'channel-3': [2],
          },
          topics: {
            'channel-3': ['topic-c', 'topic-b'],
          },
          version: '2.0',
        },
        3,
      );
      await transactionIndex.addTransaction(
        'dataId3',
        {
          channelIds: {
            'channel-4': [1],
            'channel-5': [2],
          },
          topics: {
            'channel-4': ['topic-c'],
            'channel-5': ['topic-d', 'topic-a'],
          },
          version: '2.0',
        },
        10,
      );

      expect(
        await transactionIndex.getChannelIdsForMultipleTopics(['topic-a', 'topic-b'], { from: 2 }),
      ).toEqual(['channel-1', 'channel-5', 'channel-3']);
      expect(
        await transactionIndex.getChannelIdsForMultipleTopics(['topic-a', 'topic-b'], { from: 4 }),
      ).toEqual(['channel-5']);
      expect(
        await transactionIndex.getChannelIdsForMultipleTopics(['topic-a', 'topic-b'], { to: 2 }),
      ).toEqual(['channel-1', 'channel-2']);
      expect(
        await transactionIndex.getChannelIdsForMultipleTopics(['topic-a', 'topic-b'], {
          from: 2,
          to: 4,
        }),
      ).toEqual(['channel-1', 'channel-3']);

      expect(
        await transactionIndex.getChannelIdsForMultipleTopics(['topic-b', 'topic-c'], { from: 2 }),
      ).toEqual(['channel-3', 'channel-4']);
      expect(
        await transactionIndex.getChannelIdsForMultipleTopics(['topic-b', 'topic-c'], { from: 4 }),
      ).toEqual(['channel-4']);
      expect(
        await transactionIndex.getChannelIdsForMultipleTopics(['topic-b', 'topic-c'], { to: 2 }),
      ).toEqual(['channel-2']);
      expect(
        await transactionIndex.getChannelIdsForMultipleTopics(['topic-b', 'topic-c'], {
          from: 2,
          to: 4,
        }),
      ).toEqual(['channel-3']);

      expect(
        await transactionIndex.getChannelIdsForMultipleTopics(['topic-d', 'topic-c'], { from: 2 }),
      ).toEqual(['channel-5', 'channel-3', 'channel-4']);
      expect(
        await transactionIndex.getChannelIdsForMultipleTopics(['topic-d', 'topic-c'], { from: 4 }),
      ).toEqual(['channel-5', 'channel-4']);
      expect(
        await transactionIndex.getChannelIdsForMultipleTopics(['topic-d', 'topic-c'], { to: 2 }),
      ).toEqual([]);
      expect(
        await transactionIndex.getChannelIdsForMultipleTopics(['topic-d', 'topic-c'], {
          from: 2,
          to: 4,
        }),
      ).toEqual(['channel-3']);

      expect(
        await transactionIndex.getChannelIdsForMultipleTopics([
          'topic-a',
          'topic-b',
          'topic-c',
          'topic-d',
        ]),
      ).toEqual(['channel-1', 'channel-5', 'channel-2', 'channel-3', 'channel-4']);
      expect(
        await transactionIndex.getChannelIdsForMultipleTopics(
          ['topic-a', 'topic-b', 'topic-c', 'topic-d'],
          { from: 2 },
        ),
      ).toEqual(['channel-1', 'channel-5', 'channel-3', 'channel-4']);
      expect(
        await transactionIndex.getChannelIdsForMultipleTopics(
          ['topic-a', 'topic-b', 'topic-c', 'topic-d'],
          { from: 4 },
        ),
      ).toEqual(['channel-5', 'channel-4']);
      expect(
        await transactionIndex.getChannelIdsForMultipleTopics(
          ['topic-a', 'topic-b', 'topic-c', 'topic-d'],
          { to: 2 },
        ),
      ).toEqual(['channel-1', 'channel-2']);
      expect(
        await transactionIndex.getChannelIdsForMultipleTopics(
          ['topic-a', 'topic-b', 'topic-c', 'topic-d'],
          { from: 2, to: 4 },
        ),
      ).toEqual(['channel-1', 'channel-3']);
    });
  });
});
