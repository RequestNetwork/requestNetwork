import { StorageTypes } from '@requestnetwork/types';
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

  it('cannot append no data ', async () => {
    const storage = new MockStorage();
    try {
      await storage.append(null as any);
      assert.fail();
    } catch (e) {
      assert.equal(e.message, 'Error: no content provided');
    }
  });

  it('can read data', async () => {
    const storage = new MockStorage();
    const { result: resultAppend } = await storage.append('stuff');

    const { result: resultRead, meta } = await storage.read(resultAppend.dataId);

    assert.isString(resultRead.content, 'stuff');
    assert.equal(meta.storageType, StorageTypes.StorageSystemType.IN_MEMORY_MOCK);
  });

  it('cannot read no data ', async () => {
    const storage = new MockStorage();
    try {
      await storage.read(null as any);
      assert.fail();
    } catch (e) {
      assert.equal(e.message, 'No id provided');
    }
  });

  it('can get all data Ids', async () => {
    const storage = new MockStorage();
    const { result: resultAppend1 } = await storage.append('stuff1');
    const { result: resultAppend2 } = await storage.append('stuff2');

    const { result, meta } = await storage.getDataId();

    assert.notEqual(resultAppend1.dataId, resultAppend2.dataId);
    assert.deepEqual(result.dataIds, [resultAppend1.dataId, resultAppend2.dataId]);

    assert.equal(meta.length, 2);
  });

  it('can get all data', async () => {
    const storage = new MockStorage();
    const { result: resultAppend1 } = await storage.append('stuff1');
    const { result: resultAppend2 } = await storage.append('stuff2');

    const { result, meta } = await storage.getData();

    assert.notEqual(resultAppend1.dataId, resultAppend2.dataId);
    assert.deepEqual(result.contents, ['stuff1', 'stuff2']);
    assert.equal(meta.length, 2);
  });

  it('can append the same data twice', async () => {
    const storage = new MockStorage();
    const { result: resultAppend1 } = await storage.append('stuff');
    const { result: resultAppend2 } = await storage.append('stuff');

    assert.equal(resultAppend1.dataId, resultAppend2.dataId);

    const { result: resultData } = await storage.getData();
    assert.equal(resultData.contents.length, 1);

    const { result: resultDataId } = await storage.getDataId();
    assert.equal(resultDataId.dataIds.length, 1);
  });

  it('can get all data Ids', async () => {
    const storage = new MockStorage();
    const { result: resultAppend1 } = await storage.append('stuff1');
    const { result: resultAppend2 } = await storage.append('stuff2');

    const { result, meta } = await storage.getNewDataId();

    assert.notEqual(resultAppend1.dataId, resultAppend2.dataId);
    assert.deepEqual(result.dataIds, []);
    assert.deepEqual(meta, []);
  });
});
