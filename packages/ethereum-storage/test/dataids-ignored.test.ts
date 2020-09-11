/* eslint-disable spellcheck/spell-checker */
import { StorageTypes } from '@requestnetwork/types';
import IgnoredDataIds from '../src/ignored-dataIds';

const entry: StorageTypes.IEthereumEntry = {
  error: {
    message: 'this is a little test !',
    type: StorageTypes.ErrorEntries.IPFS_CONNECTION_ERROR,
  },
  feesParameters: { contentSize: 3 },
  hash: 'QmNXA5DyFZkdf4XkUT81nmJSo3nS2bL25x7YepxeoDa6tY',
  meta: {} as any,
};
const entry2: StorageTypes.IEthereumEntry = {
  error: { message: 'this is a second test !', type: StorageTypes.ErrorEntries.INCORRECT_FILE },
  feesParameters: { contentSize: 3 },
  hash: 'hash2',
  meta: {} as any,
};

let ignoredDataIds: IgnoredDataIds;

// tslint:disable:no-magic-numbers
// tslint:disable:no-unused-expression
describe('Ignored DataIds', () => {
  beforeEach(() => {
    ignoredDataIds = new IgnoredDataIds();
  });

  describe('save', () => {
    it('can save()', async () => {
      await ignoredDataIds.save(entry);
      expect(await ignoredDataIds.getReason(entry.hash)).toBe(entry.error!.message);
    });
    it('can save() something already saved that can be retried', async () => {
      jest.useFakeTimers('modern');
      jest.setSystemTime(0);
      await ignoredDataIds.save(entry);
      expect(await ignoredDataIds.getDataIdsWithReasons()).toEqual({
        [entry.hash]: {
          entry,
          iteration: 1,
          lastTryTimestamp: 0,
          toRetry: true,
        },
      });

      jest.advanceTimersByTime(10);
      await ignoredDataIds.save(entry);
      expect(await ignoredDataIds.getDataIdsWithReasons()).toEqual({
        [entry.hash]: {
          entry,
          iteration: 2,
          lastTryTimestamp: 10,
          toRetry: true,
        },
      });
    });
    it('can save() something already saved that cannot be retried', async () => {
      jest.useFakeTimers('modern');
      jest.setSystemTime(0);
      await ignoredDataIds.save(entry2);
      expect(await ignoredDataIds.getDataIdsWithReasons()).toEqual({
        [entry2.hash]: {
          entry: entry2,
          iteration: 1,
          lastTryTimestamp: 0,
          toRetry: false,
        },
      });

      jest.advanceTimersByTime(10);

      await ignoredDataIds.save(entry2);
      expect(await ignoredDataIds.getDataIdsWithReasons()).toEqual({
        [entry2.hash]: {
          entry: entry2,
          iteration: 1,
          lastTryTimestamp: 0,
          toRetry: false,
        },
      });
      jest.useRealTimers();
    });
  });

  describe('getDataIdsWithReasons', () => {
    it('can getDataIdsWithReasons()', async () => {
      jest.useFakeTimers('modern');
      jest.setSystemTime(0);

      await ignoredDataIds.save(entry);
      await ignoredDataIds.save(entry2);

      expect(await ignoredDataIds.getDataIdsWithReasons()).toEqual({
        [entry.hash]: {
          entry,
          iteration: 1,
          lastTryTimestamp: 0,
          toRetry: true,
        },
        [entry2.hash]: {
          entry: entry2,
          iteration: 1,
          lastTryTimestamp: 0,
          toRetry: false,
        },
      });
      jest.useRealTimers();
    });
    it('can getDataIdsWithReasons() if empty', async () => {
      expect(await ignoredDataIds.getDataIdsWithReasons()).toEqual({});
    });
  });

  describe('getDataIdsToRetry', () => {
    it('can getDataIdsToRetry()', async () => {
      jest.useFakeTimers('modern');
      jest.setSystemTime(0);

      await ignoredDataIds.save(entry);
      expect(await ignoredDataIds.getDataIdsToRetry()).toEqual([]);

      jest.advanceTimersByTime(120001);
      expect(await ignoredDataIds.getDataIdsToRetry()).toEqual([entry]);

      jest.useRealTimers();
    });
  });

  describe('delete', () => {
    it('can delete()', async () => {
      await ignoredDataIds.save(entry);
      expect(await ignoredDataIds.getReason(entry.hash)).toBe(entry.error!.message);
      expect(await ignoredDataIds.getDataIds()).toEqual([entry.hash]);

      await ignoredDataIds.delete(entry.hash);
      expect(await ignoredDataIds.getReason(entry.hash)).toBeUndefined();
      expect(await ignoredDataIds.getDataIds()).toEqual([]);
    });
  });

  describe('getDataIds', () => {
    it('can getDataIds()', async () => {
      await ignoredDataIds.save(entry);
      await ignoredDataIds.save(entry2);

      expect(await ignoredDataIds.getDataIds()).toEqual([entry.hash, entry2.hash]);
    });
    it('can getDataIds() if empty', async () => {
      expect(await ignoredDataIds.getDataIds()).toEqual([]);
    });
  });
});
