import { StorageTypes } from '@requestnetwork/types';

import MockStorage from '../src/mock-storage';

describe('mock-storage', () => {
  it('can append data', async () => {
    const storage = new MockStorage();
    const { id, meta } = await storage.append('stuff');

    expect(typeof id).toBe('string');
    expect(meta.storageType).toBe(StorageTypes.StorageSystemType.IN_MEMORY_MOCK);
  });

  it('cannot append no data ', async () => {
    const storage = new MockStorage();
    await expect(storage.append(null as any)).rejects.toThrowError('Error: no content provided');
  });

  it('can read data', async () => {
    const storage = new MockStorage();
    const { id } = await storage.append('stuff');

    const { content, meta } = await storage.read(id);

    expect(typeof content).toBe('string');
    expect(meta.storageType).toBe(StorageTypes.StorageSystemType.IN_MEMORY_MOCK);
  });

  it('cannot read no data ', async () => {
    const storage = new MockStorage();
    await expect(storage.read(null as any)).rejects.toThrowError('No id provided');
  });

  it('can get all data', async () => {
    const storage = new MockStorage();
    const { id: id1 } = await storage.append('stuff1');
    const { id: id2 } = await storage.append('stuff2');

    const { entries } = await storage.getData();

    expect(id1).not.toBe(id2);
    expect(entries.map(({ content }) => content)).toMatchObject(['stuff1', 'stuff2']);
    expect(entries.length).toBe(2);
  });

  it('can append the same data twice', async () => {
    const storage = new MockStorage();
    const { id: id1 } = await storage.append('stuff');
    const { id: id2 } = await storage.append('stuff');

    expect(id1).toBe(id2);

    const { entries } = await storage.getData();
    expect(entries.length).toBe(1);
  });
});
