// tslint:disable: await-promise
// tslint:disable: no-magic-numbers

import TimestampByLocationTransactionIndex from '../src/transaction-index/timestamp-by-location';

const arbitraryDataId1 = 'dataId1';

const arbitraryTimestamp = 10;

/* tslint:disable:no-unused-expression */
describe('LocationTimestamp', () => {
  it('can pushTimestampByLocation() and getTimestampFromLocation()', async () => {
    const timestampLocation = new TimestampByLocationTransactionIndex();
    await timestampLocation.pushTimestampByLocation(arbitraryDataId1, arbitraryTimestamp);

    const result = await timestampLocation.isDataInBoundaries(arbitraryDataId1, {
      from: arbitraryTimestamp,
      to: arbitraryTimestamp,
    });
    // 'timestampLocation is wrong'
    expect(result).toBe(true);
  });

  describe('isDataInBoundaries', () => {
    it('can isDataInBoundaries()', async () => {
      const timestampLocation = new TimestampByLocationTransactionIndex();
      await timestampLocation.pushTimestampByLocation(arbitraryDataId1, arbitraryTimestamp);

      await expect(
        timestampLocation.isDataInBoundaries(arbitraryDataId1, { from: 1, to: 100 }),
      ).resolves.toBe(true);
      await expect(
        timestampLocation.isDataInBoundaries(arbitraryDataId1, { from: 1 }),
      ).resolves.toBe(true);
      await expect(
        timestampLocation.isDataInBoundaries(arbitraryDataId1, { to: 100 }),
      ).resolves.toBe(true);
      await expect(timestampLocation.isDataInBoundaries(arbitraryDataId1)).resolves.toBe(true);

      await expect(
        timestampLocation.isDataInBoundaries(arbitraryDataId1, { from: 1, to: 9 }),
      ).resolves.toBe(false);
      await expect(
        timestampLocation.isDataInBoundaries(arbitraryDataId1, { from: 11, to: 100 }),
      ).resolves.toBe(false);
      await expect(
        timestampLocation.isDataInBoundaries(arbitraryDataId1, { from: 11 }),
      ).resolves.toBe(false);
      await expect(timestampLocation.isDataInBoundaries(arbitraryDataId1, { to: 9 })).resolves.toBe(
        false,
      );
    });

    it('cannot isDataInBoundaries() on dataId not pushed', async () => {
      const timestampLocation = new TimestampByLocationTransactionIndex();

      await expect(
        timestampLocation.isDataInBoundaries(arbitraryDataId1, { from: 1, to: 100 }),
      ).rejects.toThrowError(`Unknown timestamp for the dataId ${arbitraryDataId1}`);
    });
  });

  describe('getLatestTimestamp', () => {
    it('return null if empty', async () => {
      const timestampLocation = new TimestampByLocationTransactionIndex();
      const latest = await timestampLocation.getLastTransactionTimestamp();
      expect(latest).toBeNull();
    });

    it('return correct data', async () => {
      const timestampLocation = new TimestampByLocationTransactionIndex();
      await timestampLocation.pushTimestampByLocation('a', 2);
      await timestampLocation.pushTimestampByLocation('b', 3);
      await timestampLocation.pushTimestampByLocation('c', 1);

      const latest = await timestampLocation.getLastTransactionTimestamp();
      expect(latest).toBe(3);
    });
  });

  describe('getTimestampFromLocation', () => {
    it('can get getTimestamp From Location', async () => {
      const timestampLocation = new TimestampByLocationTransactionIndex();
      await timestampLocation.pushTimestampByLocation('a', 2);
      await timestampLocation.pushTimestampByLocation('b', 3);
      await timestampLocation.pushTimestampByLocation('c', 1);

      expect(await timestampLocation.getTimestampFromLocation('b')).toBe(3);
      expect(await timestampLocation.getTimestampFromLocation('c')).toBe(1);
      expect(await timestampLocation.getTimestampFromLocation('a')).toBe(2);
    });
    it('cannot get getTimestamp From Location not existing', async () => {
      const timestampLocation = new TimestampByLocationTransactionIndex();
      await timestampLocation.pushTimestampByLocation('a', 2);

      expect(await timestampLocation.getTimestampFromLocation('a')).toBe(2);
      expect(await timestampLocation.getTimestampFromLocation('b')).toBe(null);
    });
  });
});
