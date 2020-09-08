import LocationByTopic from '../src/transaction-index/location-by-topic';

const arbitraryId1 = 'id1';
const arbitraryId2 = 'id2';
const arbitraryId3 = 'id3';

const arbitraryDataId1 = 'dataid1';
const arbitraryDataId2 = 'dataid2';

const arbitraryTxTopic1 = 'topic1';
const arbitraryTxTopic2 = 'topic2';
const arbitraryTxTopic3 = 'topic3';

const arbitraryBlockHeader1 = {
  channelIds: { id1: [0, 2], id2: [1] },
  topics: {
    id1: [arbitraryTxTopic1],
    id2: [arbitraryTxTopic1, arbitraryTxTopic2],
  },
  version: '0.1.0',
};
const arbitraryBlockHeader2 = {
  channelIds: { id1: [0], id3: [1, 2] },
  topics: {
    id3: [arbitraryTxTopic3],
  },
  version: '0.1.0',
};

/* tslint:disable:no-unused-expression */
describe('LocationByTopic', () => {
  describe('pushStorageLocationIndexedWithBlockTopics', () => {
    it('can index new block', async () => {
      const localIndex = new LocationByTopic();

      const spy = jest.fn((_returns: any): Promise<true> => Promise.resolve(true as true));
      // Mock the set function to parse the calls
      localIndex.storageLocationByChannelId.set = spy;

      await localIndex.pushStorageLocationIndexedWithBlockTopics(
        arbitraryDataId1,
        arbitraryBlockHeader1,
      );

      expect(spy).toHaveBeenCalled();
    });

    it('can index channel ids', async () => {
      const localIndex = new LocationByTopic();

      const spy = jest.fn((_returns: any): Promise<true> => Promise.resolve(true as true));
      // Mock the set function to parse the calls
      localIndex.channelIdByTopics.set = spy;

      await localIndex.pushStorageLocationIndexedWithBlockTopics(
        arbitraryDataId1,
        arbitraryBlockHeader1,
      );

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('getStorageLocationsFromChannelId', () => {
    it('can getStorageLocationsFromChannelId with one block', async () => {
      const localIndex = new LocationByTopic();
      await localIndex.pushStorageLocationIndexedWithBlockTopics(
        arbitraryDataId1,
        arbitraryBlockHeader1,
      );

      // getStorageLocationsFromChannelId is wrong
      await expect(
        localIndex.getStorageLocationsFromChannelId(arbitraryId1),
      ).resolves.toMatchObject([arbitraryDataId1]);
      await expect(
        localIndex.getStorageLocationsFromChannelId(arbitraryId2),
      ).resolves.toMatchObject([arbitraryDataId1]);
      await expect(
        localIndex.getStorageLocationsFromChannelId(arbitraryId3),
      ).resolves.toMatchObject([]);
    });
    it('can getStorageLocationsFromChannelId with two blocks', async () => {
      const localIndex = new LocationByTopic();
      await localIndex.pushStorageLocationIndexedWithBlockTopics(
        arbitraryDataId1,
        arbitraryBlockHeader1,
      );
      await localIndex.pushStorageLocationIndexedWithBlockTopics(
        arbitraryDataId2,
        arbitraryBlockHeader2,
      );

      // getStorageLocationsFromChannelId is wrong
      await expect(
        localIndex.getStorageLocationsFromChannelId(arbitraryId1),
      ).resolves.toMatchObject([arbitraryDataId1, arbitraryDataId2]);
      await expect(
        localIndex.getStorageLocationsFromChannelId(arbitraryId2),
      ).resolves.toMatchObject([arbitraryDataId1]);
      await expect(
        localIndex.getStorageLocationsFromChannelId(arbitraryId3),
      ).resolves.toMatchObject([arbitraryDataId2]);
    });
  });

  describe('getChannelIdsFromTopic', () => {
    it('can get ChannelIds From one Topic', async () => {
      const localIndex = new LocationByTopic();
      await localIndex.pushStorageLocationIndexedWithBlockTopics(
        arbitraryDataId1,
        arbitraryBlockHeader1,
      );

      await localIndex.pushStorageLocationIndexedWithBlockTopics(
        arbitraryDataId2,
        arbitraryBlockHeader2,
      );

      expect(await localIndex.getChannelIdsFromTopic(arbitraryTxTopic1)).toMatchObject([
        arbitraryId1,
        arbitraryId2,
      ]);
      expect(await localIndex.getChannelIdsFromTopic(arbitraryTxTopic2)).toMatchObject([
        arbitraryId2,
      ]);
      expect(await localIndex.getChannelIdsFromTopic(arbitraryTxTopic3)).toMatchObject([
        arbitraryId3,
      ]);
      expect(await localIndex.getChannelIdsFromTopic('topic not used')).toMatchObject([]);
    });
  });

  describe('getChannelIdsFromMultipleTopics', () => {
    it('can get ChannelIds From Multiple Topic giving only one topic', async () => {
      const localIndex = new LocationByTopic();
      await localIndex.pushStorageLocationIndexedWithBlockTopics(
        arbitraryDataId1,
        arbitraryBlockHeader1,
      );

      await localIndex.pushStorageLocationIndexedWithBlockTopics(
        arbitraryDataId2,
        arbitraryBlockHeader2,
      );

      expect(
        await localIndex.getChannelIdsFromMultipleTopics([arbitraryTxTopic1, arbitraryTxTopic2]),
      ).toMatchObject([arbitraryId1, arbitraryId2]);
      expect(
        await localIndex.getChannelIdsFromMultipleTopics([
          arbitraryTxTopic1,
          arbitraryTxTopic2,
          arbitraryTxTopic3,
        ]),
      ).toMatchObject([arbitraryId1, arbitraryId2, arbitraryId3]);
      expect(
        await localIndex.getChannelIdsFromMultipleTopics(['topic not used', arbitraryTxTopic3]),
      ).toMatchObject([arbitraryId3]);
      expect(await localIndex.getChannelIdsFromMultipleTopics([])).toMatchObject([]);
    });

    it('can get ChannelIds From Multiple Topic giving only one topic', async () => {
      const localIndex = new LocationByTopic();
      await localIndex.pushStorageLocationIndexedWithBlockTopics(
        arbitraryDataId1,
        arbitraryBlockHeader1,
      );

      await localIndex.pushStorageLocationIndexedWithBlockTopics(
        arbitraryDataId2,
        arbitraryBlockHeader2,
      );

      expect(await localIndex.getChannelIdsFromMultipleTopics([arbitraryTxTopic1])).toMatchObject([
        arbitraryId1,
        arbitraryId2,
      ]);
      expect(await localIndex.getChannelIdsFromMultipleTopics([arbitraryTxTopic2])).toMatchObject([
        arbitraryId2,
      ]);
      expect(await localIndex.getChannelIdsFromMultipleTopics([arbitraryTxTopic3])).toMatchObject([
        arbitraryId3,
      ]);
      expect(await localIndex.getChannelIdsFromMultipleTopics(['topic not used'])).toMatchObject(
        [],
      );
    });
  });
});
