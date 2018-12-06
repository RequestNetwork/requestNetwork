import { expect } from 'chai';
import 'mocha';

import LocationByTopic from '../src/location-by-topic';

const arbitraryDataId1 = 'dataid1';
const arbitraryDataId2 = 'dataid2';

const arbitraryTxTopic1 = 'topic1';
const arbitraryTxTopic2 = 'topic2';
const arbitraryTxTopic3 = 'topic3';

const arbitraryBlockTopics1 = { topic1: [0, 1, 2], topic2: [0, 3] };
const arbitraryBlockTopics2 = { topic1: [0, 1, 2], topic3: [0, 3] };

/* tslint:disable:no-unused-expression */
describe('localIndex', () => {
  it('can pushLocationIndexedWithBlockTopics() and getLocationFromTopic()', () => {
    const localIndex = new LocationByTopic();
    localIndex.pushLocationIndexedWithBlockTopics(
      arbitraryDataId1,
      arbitraryBlockTopics1,
    );

    const result = localIndex.getLocationFromTopic(arbitraryTxTopic1);
    expect(result, 'localIndex data is wrong').to.deep.equal([
      arbitraryDataId1,
    ]);

    const result2 = localIndex.getLocationFromTopic(arbitraryTxTopic2);
    expect(result2, 'localIndex data is wrong').to.deep.equal([
      arbitraryDataId1,
    ]);

    const resultEmpty = localIndex.getLocationFromTopic(arbitraryTxTopic3);
    expect(resultEmpty, 'localIndex data is wrong').to.deep.equal([]);
  });
  it('can pushLocationIndexedWithBlockTopics() twice and getLocationFromTopic()', () => {
    const localIndex = new LocationByTopic();
    localIndex.pushLocationIndexedWithBlockTopics(
      arbitraryDataId1,
      arbitraryBlockTopics1,
    );
    localIndex.pushLocationIndexedWithBlockTopics(
      arbitraryDataId2,
      arbitraryBlockTopics2,
    );

    const result = localIndex.getLocationFromTopic(arbitraryTxTopic1);
    expect(result, 'localIndex data is wrong').to.deep.equal([
      arbitraryDataId1,
      arbitraryDataId2,
    ]);

    const result2 = localIndex.getLocationFromTopic(arbitraryTxTopic2);
    expect(result2, 'localIndex data is wrong').to.deep.equal([
      arbitraryDataId1,
    ]);

    const resultEmpty = localIndex.getLocationFromTopic(arbitraryTxTopic3);
    expect(resultEmpty, 'localIndex data is wrong').to.deep.equal([
      arbitraryDataId2,
    ]);
  });
});
