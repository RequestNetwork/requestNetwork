import { expect } from 'chai';
import 'mocha';

import LocalIndex from '../src/local-data-id-index';

const arbitraryDataId1 = 'dataid1';
const arbitraryDataId2 = 'dataid2';

const arbitraryTxIndex1 = 'index1';
const arbitraryTxIndex2 = 'index2';
const arbitraryTxIndex3 = 'index3';

const arbitraryBlockIndex1 = { index1: [0, 1, 2], index2: [0, 3] };
const arbitraryBlockIndex2 = { index1: [0, 1, 2], index3: [0, 3] };

/* tslint:disable:no-unused-expression */
describe('localIndex', () => {
  it('can pushDataIdIndexedWithBlockIndex() and getDataIdByIndex()', () => {
    const localIndex = new LocalIndex();
    localIndex.pushDataIdIndexedWithBlockIndex(
      arbitraryDataId1,
      arbitraryBlockIndex1,
    );

    const result = localIndex.getDataIdByIndex(arbitraryTxIndex1);
    expect(result, 'localIndex data is wrong').to.deep.equal([
      arbitraryDataId1,
    ]);

    const result2 = localIndex.getDataIdByIndex(arbitraryTxIndex2);
    expect(result2, 'localIndex data is wrong').to.deep.equal([
      arbitraryDataId1,
    ]);

    const resultEmpty = localIndex.getDataIdByIndex(arbitraryTxIndex3);
    expect(resultEmpty, 'localIndex data is wrong').to.deep.equal([]);
  });
  it('can pushDataIdIndexedWithBlockIndex() twice and getDataIdByIndex()', () => {
    const localIndex = new LocalIndex();
    localIndex.pushDataIdIndexedWithBlockIndex(
      arbitraryDataId1,
      arbitraryBlockIndex1,
    );
    localIndex.pushDataIdIndexedWithBlockIndex(
      arbitraryDataId2,
      arbitraryBlockIndex2,
    );

    const result = localIndex.getDataIdByIndex(arbitraryTxIndex1);
    expect(result, 'localIndex data is wrong').to.deep.equal([
      arbitraryDataId1,
      arbitraryDataId2,
    ]);

    const result2 = localIndex.getDataIdByIndex(arbitraryTxIndex2);
    expect(result2, 'localIndex data is wrong').to.deep.equal([
      arbitraryDataId1,
    ]);

    const resultEmpty = localIndex.getDataIdByIndex(arbitraryTxIndex3);
    expect(resultEmpty, 'localIndex data is wrong').to.deep.equal([
      arbitraryDataId2,
    ]);
  });
});
