import { Storage as StorageTypes } from '@requestnetwork/types';
import { assert } from 'chai';
import 'mocha';
import MockStorage from '../src/mock-storage';

describe('mock-storage', () => {
  it('can append data', async () => {
    const storage = new MockStorage();
    const { result, meta } = await storage.append('stuff');

    assert.isString(result.dataId);
    assert.equal(meta.storageType, StorageTypes.StorageSystemType.IN_MEMORY_MOCK);
  });

  it('can read data', async () => {
    const storage = new MockStorage();
    const { result: resultAppend } = await storage.append('stuff');

    const { result: resultRead, meta } = await storage.read(resultAppend.dataId);

    assert.isString(resultRead.content, 'stuff');
    assert.equal(meta.storageType, StorageTypes.StorageSystemType.IN_MEMORY_MOCK);
  });

  it('can get all data Ids', async () => {
    const storage = new MockStorage();
    const { result: resultAppend1 } = await storage.append('stuff1');
    const { result: resultAppend2 } = await storage.append('stuff2');

    const { result, meta } = await storage.getAllDataId();

    assert.notEqual(resultAppend1.dataId, resultAppend2.dataId);
    assert.deepEqual(result.dataIds, [resultAppend1.dataId, resultAppend2.dataId]);
    assert.deepEqual(meta.metaDataIds, [
      { storageType: StorageTypes.StorageSystemType.IN_MEMORY_MOCK },
      { storageType: StorageTypes.StorageSystemType.IN_MEMORY_MOCK },
    ]);
  });

  it('can get all data', async () => {
    const storage = new MockStorage();
    const { result: resultAppend1 } = await storage.append('stuff1');
    const { result: resultAppend2 } = await storage.append('stuff2');

    const { result, meta } = await storage.getAllData();

    assert.notEqual(resultAppend1.dataId, resultAppend2.dataId);
    assert.deepEqual(result.data, ['stuff1', 'stuff2']);
    assert.deepEqual(meta.metaData, [
      { storageType: StorageTypes.StorageSystemType.IN_MEMORY_MOCK },
      { storageType: StorageTypes.StorageSystemType.IN_MEMORY_MOCK },
    ]);
  });

  it('can append the same data twice', async () => {
    const storage = new MockStorage();
    const { result: resultAppend1 } = await storage.append('stuff');
    const { result: resultAppend2 } = await storage.append('stuff');

    assert.equal(resultAppend1.dataId, resultAppend2.dataId);

    const { result: resultAllData } = await storage.getAllData();
    assert.equal(resultAllData.data.length, 1);

    const { result: resultAllDataId } = await storage.getAllDataId();
    assert.equal(resultAllDataId.dataIds.length, 1);
  });
});
