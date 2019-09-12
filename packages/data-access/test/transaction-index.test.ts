import 'mocha';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as spies from 'chai-spies';
// tslint:disable: await-promise
// tslint:disable: no-magic-numbers

chai.use(chaiAsPromised);
const expect = chai.expect;
chai.use(spies);

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
      await expect(transactionIndex.addTransaction('', testBlock, 0)).to.be.fulfilled;
    });

    it('calls locationByTopic and timestampByLocation', async () => {
      const pushStorageLocationIndexedWithBlockTopicsMock = chai.spy();
      (transactionIndex as any).locationByTopic.pushStorageLocationIndexedWithBlockTopics = pushStorageLocationIndexedWithBlockTopicsMock;

      const pushTimestampByLocationMock = chai.spy();
      (transactionIndex as any).timestampByLocation.pushTimestampByLocation = pushTimestampByLocationMock;

      await transactionIndex.addTransaction('abcd', testBlock, 2);

      expect(pushStorageLocationIndexedWithBlockTopicsMock).to.have.been.called.with(
        'abcd',
        testBlock,
      );
      expect(pushTimestampByLocationMock).to.have.been.called.with('abcd', 2);
    });
  });

  describe('getStorageLocationList', () => {
    beforeEach(async () => {
      // mock location by topic
      (transactionIndex as any).locationByTopic.getStorageLocationsFromChannelId = chai.spy(() => [
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
      await expect(transactionIndex.getStorageLocationList('')).to.be.fulfilled;
    });

    it('should return all if timestamp not specified', async () => {
      const storageLocationList = await transactionIndex.getStorageLocationList('');
      expect(storageLocationList).to.deep.equal(['a', 'b', 'c']);
    });

    it('should filter data if timestamp specified', async () => {
      const storageLocationList1 = await transactionIndex.getStorageLocationList('', {
        to: 10,
      });
      expect(storageLocationList1).to.deep.equal(['a', 'b']);

      const storageLocationList2 = await transactionIndex.getStorageLocationList('', {
        from: 10,
        to: 11,
      });
      expect(storageLocationList2).to.deep.equal(['b', 'c']);

      const storageLocationList3 = await transactionIndex.getStorageLocationList('', {
        from: 11,
        to: 12,
      });
      expect(storageLocationList3).to.deep.equal(['c']);

      const storageLocationList4 = await transactionIndex.getStorageLocationList('', {
        from: 12,
        to: 13,
      });
      expect(storageLocationList4).to.deep.equal([]);
    });
  });

  describe('getChannelIdsForTopic', () => {
    it('getChannelIdsForTopic() should be fullfilled', async () => {
      await expect(transactionIndex.getChannelIdsForTopic('')).to.be.fulfilled;
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
      expect(channels).to.deep.equal(['channel-1', 'channel-2']);
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

      expect(await transactionIndex.getChannelIdsForTopic('topic-a', { from: 3 })).to.deep.equal([
        'channel-2',
      ]);
      expect(await transactionIndex.getChannelIdsForTopic('topic-a', { to: 3 })).to.deep.equal([
        'channel-1',
        'channel-2',
      ]);

      expect(await transactionIndex.getChannelIdsForTopic('topic-a', { from: 11 })).to.deep.equal(
        [],
      );
      expect(await transactionIndex.getChannelIdsForTopic('topic-a', { to: 1 })).to.deep.equal([]);

      expect(await transactionIndex.getChannelIdsForTopic('topic-b', { to: 11 })).to.deep.equal([
        'channel-3',
      ]);
      expect(await transactionIndex.getChannelIdsForTopic('topic-b', { from: 11 })).to.deep.equal([
        'channel-3',
      ]);
    });
  });

  describe('getChannelIdsForMultipleTopics', () => {
    it('getChannelIdsForMultipleTopics() should be full filled', async () => {
      await expect(transactionIndex.getChannelIdsForMultipleTopics([])).to.be.fulfilled;
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
      expect(await transactionIndex.getChannelIdsForMultipleTopics(['topic-a'])).to.deep.equal([
        'channel-1',
        'channel-2',
      ]);
      expect(await transactionIndex.getChannelIdsForMultipleTopics(['topic-b'])).to.deep.equal([
        'channel-3',
        'channel-4',
      ]);
      expect(await transactionIndex.getChannelIdsForMultipleTopics(['topic-c'])).to.deep.equal([
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
      ).to.deep.equal(['channel-1', 'channel-5', 'channel-3']);
      expect(
        await transactionIndex.getChannelIdsForMultipleTopics(['topic-a', 'topic-b'], { from: 4 }),
      ).to.deep.equal(['channel-5']);
      expect(
        await transactionIndex.getChannelIdsForMultipleTopics(['topic-a', 'topic-b'], { to: 2 }),
      ).to.deep.equal(['channel-1', 'channel-2']);
      expect(
        await transactionIndex.getChannelIdsForMultipleTopics(['topic-a', 'topic-b'], {
          from: 2,
          to: 4,
        }),
      ).to.deep.equal(['channel-1', 'channel-3']);

      expect(
        await transactionIndex.getChannelIdsForMultipleTopics(['topic-b', 'topic-c'], { from: 2 }),
      ).to.deep.equal(['channel-3', 'channel-4']);
      expect(
        await transactionIndex.getChannelIdsForMultipleTopics(['topic-b', 'topic-c'], { from: 4 }),
      ).to.deep.equal(['channel-4']);
      expect(
        await transactionIndex.getChannelIdsForMultipleTopics(['topic-b', 'topic-c'], { to: 2 }),
      ).to.deep.equal(['channel-2']);
      expect(
        await transactionIndex.getChannelIdsForMultipleTopics(['topic-b', 'topic-c'], {
          from: 2,
          to: 4,
        }),
      ).to.deep.equal(['channel-3']);

      expect(
        await transactionIndex.getChannelIdsForMultipleTopics(['topic-d', 'topic-c'], { from: 2 }),
      ).to.deep.equal(['channel-5', 'channel-3', 'channel-4']);
      expect(
        await transactionIndex.getChannelIdsForMultipleTopics(['topic-d', 'topic-c'], { from: 4 }),
      ).to.deep.equal(['channel-5', 'channel-4']);
      expect(
        await transactionIndex.getChannelIdsForMultipleTopics(['topic-d', 'topic-c'], { to: 2 }),
      ).to.deep.equal([]);
      expect(
        await transactionIndex.getChannelIdsForMultipleTopics(['topic-d', 'topic-c'], {
          from: 2,
          to: 4,
        }),
      ).to.deep.equal(['channel-3']);

      expect(
        await transactionIndex.getChannelIdsForMultipleTopics([
          'topic-a',
          'topic-b',
          'topic-c',
          'topic-d',
        ]),
      ).to.deep.equal(['channel-1', 'channel-5', 'channel-2', 'channel-3', 'channel-4']);
      expect(
        await transactionIndex.getChannelIdsForMultipleTopics(
          ['topic-a', 'topic-b', 'topic-c', 'topic-d'],
          { from: 2 },
        ),
      ).to.deep.equal(['channel-1', 'channel-5', 'channel-3', 'channel-4']);
      expect(
        await transactionIndex.getChannelIdsForMultipleTopics(
          ['topic-a', 'topic-b', 'topic-c', 'topic-d'],
          { from: 4 },
        ),
      ).to.deep.equal(['channel-5', 'channel-4']);
      expect(
        await transactionIndex.getChannelIdsForMultipleTopics(
          ['topic-a', 'topic-b', 'topic-c', 'topic-d'],
          { to: 2 },
        ),
      ).to.deep.equal(['channel-1', 'channel-2']);
      expect(
        await transactionIndex.getChannelIdsForMultipleTopics(
          ['topic-a', 'topic-b', 'topic-c', 'topic-d'],
          { from: 2, to: 4 },
        ),
      ).to.deep.equal(['channel-1', 'channel-3']);
    });
  });
});
