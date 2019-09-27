import { StorageTypes } from '@requestnetwork/types';
import { assert } from 'chai';
import 'mocha';
import MockStorage from '../src/mock-storage';

describe('mock-storage', () => {
  it('can append data', async () => {
    const storage = new MockStorage();
    const { id, meta } = await storage.append('stuff');

    assert.isString(id);
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
    const { id } = await storage.append('stuff');

    const { content, meta } = await storage.read(id);

    assert.isString(content, 'stuff');
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

  it('can get all data', async () => {
    const storage = new MockStorage();
    const { id: id1 } = await storage.append('stuff1');
    const { id: id2 } = await storage.append('stuff2');

    const { entries } = await storage.getData();

    assert.notEqual(id1, id2);
    assert.deepEqual(entries.map(({ content }) => content), ['stuff1', 'stuff2']);
    assert.equal(entries.length, 2);
  });

  it('can append the same data twice', async () => {
    const storage = new MockStorage();
    const { id: id1 } = await storage.append('stuff');
    const { id: id2 } = await storage.append('stuff');

    assert.equal(id1, id2);

    const { entries } = await storage.getData();
    assert.equal(entries.length, 1);
  });
});
