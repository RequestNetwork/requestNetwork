import { StorageTypes } from '@requestnetwork/types';
import { PendingStore } from '../src/pending-store';

describe(PendingStore, () => {
  const pendingStore = new PendingStore();
  it('can add an item', () => {
    pendingStore.add('abcd', {
      storageResult: {
        content: 'foobar',
        id: 'contentId',
        meta: { state: StorageTypes.ContentState.PENDING, timestamp: 1 },
      },
      topics: ['topic1', 'topic2'],
      transaction: { data: 'xxx' },
    });
  });

  it('can retrieve an item by channelId', () => {
    expect(pendingStore.get('abcd')).toMatchObject({
      storageResult: expect.objectContaining({ id: 'contentId' }),
      topics: ['topic1', 'topic2'],
      transaction: { data: 'xxx' },
    });
  });

  it('can retrieve items by a single topic', () => {
    expect(pendingStore.findByTopics(['topic1'])).toMatchObject([
      {
        storageResult: expect.objectContaining({ id: 'contentId' }),
        topics: ['topic1', 'topic2'],
        transaction: { data: 'xxx' },
      },
    ]);
  });

  it('can retrieve items by a multiple topic', () => {
    expect(pendingStore.findByTopics(['topic1'])).toMatchObject([
      {
        storageResult: expect.objectContaining({ id: 'contentId' }),
        topics: ['topic1', 'topic2'],
        transaction: { data: 'xxx' },
      },
    ]);
  });

  it("doesn't retrieve items with a wrong topic", () => {
    expect(pendingStore.findByTopics(['topic3'])).toMatchObject([]);
  });
});
