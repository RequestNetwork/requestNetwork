import { expect } from 'chai';
import 'mocha';

import LocalIndex from '../src/local-data-id-topic';

const arbitraryDataId1 = 'dataid1';
const arbitraryDataId2 = 'dataid2';

const arbitraryTxTopic1 = 'topic1';
const arbitraryTxTopic2 = 'topic2';
const arbitraryTxTopic3 = 'topic3';

const arbitraryBlockTopics1 = { topic1: [0, 1, 2], topic2: [0, 3] };
const arbitraryBlockTopics2 = { topic1: [0, 1, 2], topic3: [0, 3] };

/* tslint:disable:no-unused-expression */
describe('localIndex', () => {
  it('can pushDataIdIndexedWithBlockTopics() and getDataIdFromTopic()', () => {
    const localIndex = new LocalIndex();
    localIndex.pushDataIdIndexedWithBlockTopics(
      arbitraryDataId1,
      arbitraryBlockTopics1,
    );

    const result = localIndex.getDataIdFromTopic(arbitraryTxTopic1);
    expect(result, 'localIndex data is wrong').to.deep.equal([
      arbitraryDataId1,
    ]);

    const result2 = localIndex.getDataIdFromTopic(arbitraryTxTopic2);
    expect(result2, 'localIndex data is wrong').to.deep.equal([
      arbitraryDataId1,
    ]);

    const resultEmpty = localIndex.getDataIdFromTopic(arbitraryTxTopic3);
    expect(resultEmpty, 'localIndex data is wrong').to.deep.equal([]);
  });
  it('can pushDataIdIndexedWithBlockTopics() twice and getDataIdFromTopic()', () => {
    const localIndex = new LocalIndex();
    localIndex.pushDataIdIndexedWithBlockTopics(
      arbitraryDataId1,
      arbitraryBlockTopics1,
    );
    localIndex.pushDataIdIndexedWithBlockTopics(
      arbitraryDataId2,
      arbitraryBlockTopics2,
    );

    const result = localIndex.getDataIdFromTopic(arbitraryTxTopic1);
    expect(result, 'localIndex data is wrong').to.deep.equal([
      arbitraryDataId1,
      arbitraryDataId2,
    ]);

    const result2 = localIndex.getDataIdFromTopic(arbitraryTxTopic2);
    expect(result2, 'localIndex data is wrong').to.deep.equal([
      arbitraryDataId1,
    ]);

    const resultEmpty = localIndex.getDataIdFromTopic(arbitraryTxTopic3);
    expect(resultEmpty, 'localIndex data is wrong').to.deep.equal([
      arbitraryDataId2,
    ]);
  });
});
