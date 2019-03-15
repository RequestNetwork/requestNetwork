import { expect } from 'chai';
import 'mocha';

import LocationByTopic from '../src/location-by-topic';

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
// const arbitraryBlockTopics2 = { topic1: [0, 1, 2], topic3: [0, 3] };

/* tslint:disable:no-unused-expression */
describe('localIndex', () => {
  it('can pushStorageLocationIndexedWithBlockTopics(), getStorageLocationsFromChannelId() and  getStorageLocationFromTopic()', () => {
    const localIndex = new LocationByTopic();
    localIndex.pushStorageLocationIndexedWithBlockTopics(arbitraryDataId1, arbitraryBlockHeader1);

    const result = localIndex.getStorageLocationFromTopic(arbitraryTxTopic1);
    expect(result, 'localIndex data is wrong').to.deep.equal([arbitraryDataId1]);

    const result2 = localIndex.getStorageLocationFromTopic(arbitraryTxTopic2);
    expect(result2, 'localIndex data is wrong').to.deep.equal([arbitraryDataId1]);

    const resultEmpty = localIndex.getStorageLocationFromTopic(arbitraryTxTopic3);
    expect(resultEmpty, 'localIndex data is wrong').to.deep.equal([]);

    expect(
      localIndex.getStorageLocationsFromChannelId(arbitraryId1),
      'getStorageLocationsFromChannelId is wrong',
    ).to.deep.equal([arbitraryDataId1]);
    expect(
      localIndex.getStorageLocationsFromChannelId(arbitraryId2),
      'getStorageLocationsFromChannelId is wrong',
    ).to.deep.equal([arbitraryDataId1]);
    expect(
      localIndex.getStorageLocationsFromChannelId(arbitraryId3),
      'getStorageLocationsFromChannelId is wrong',
    ).to.deep.equal([]);
  });
  it('can pushStorageLocationIndexedWithBlockTopics() twice, getStorageLocationsFromChannelId() and getStorageLocationFromTopic()', () => {
    const localIndex = new LocationByTopic();
    localIndex.pushStorageLocationIndexedWithBlockTopics(arbitraryDataId1, arbitraryBlockHeader1);
    localIndex.pushStorageLocationIndexedWithBlockTopics(arbitraryDataId2, arbitraryBlockHeader2);

    const result = localIndex.getStorageLocationFromTopic(arbitraryTxTopic1);
    expect(result, 'localIndex is wrong').to.deep.equal([arbitraryDataId1, arbitraryDataId2]);

    const result2 = localIndex.getStorageLocationFromTopic(arbitraryTxTopic2);
    expect(result2, 'localIndex is wrong').to.deep.equal([arbitraryDataId1]);

    const resultEmpty = localIndex.getStorageLocationFromTopic(arbitraryTxTopic3);
    expect(resultEmpty, 'localIndex is wrong').to.deep.equal([arbitraryDataId2]);

    expect(
      localIndex.getStorageLocationsFromChannelId(arbitraryId1),
      'getStorageLocationsFromChannelId is wrong',
    ).to.deep.equal([arbitraryDataId1, arbitraryDataId2]);
    expect(
      localIndex.getStorageLocationsFromChannelId(arbitraryId2),
      'getStorageLocationsFromChannelId is wrong',
    ).to.deep.equal([arbitraryDataId1]);
    expect(
      localIndex.getStorageLocationsFromChannelId(arbitraryId3),
      'getStorageLocationsFromChannelId is wrong',
    ).to.deep.equal([arbitraryDataId2]);
  });
});
