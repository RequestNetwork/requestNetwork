import 'mocha';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as spies from 'chai-spies';
// tslint:disable: await-promise
// tslint:disable: no-magic-numbers

chai.use(chaiAsPromised);
const expect = chai.expect;
chai.use(spies);

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
    expect(result, 'timestampLocation is wrong').to.be.true;
  });

  describe('isDataInBoundaries', () => {
    it('can isDataInBoundaries()', async () => {
      const timestampLocation = new TimestampByLocationTransactionIndex();
      await timestampLocation.pushTimestampByLocation(arbitraryDataId1, arbitraryTimestamp);

      await expect(
        timestampLocation.isDataInBoundaries(arbitraryDataId1, { from: 1, to: 100 }),
        'isDataInBoundaries is wrong',
      ).to.eventually.be.true;
      await expect(
        timestampLocation.isDataInBoundaries(arbitraryDataId1, { from: 1 }),
        'isDataInBoundaries is wrong',
      ).to.eventually.be.true;
      await expect(
        timestampLocation.isDataInBoundaries(arbitraryDataId1, { to: 100 }),
        'isDataInBoundaries is wrong',
      ).to.eventually.be.true;
      await expect(
        timestampLocation.isDataInBoundaries(arbitraryDataId1),
        'isDataInBoundaries is wrong',
      ).to.eventually.be.true;

      await expect(
        timestampLocation.isDataInBoundaries(arbitraryDataId1, { from: 1, to: 9 }),
        'isDataInBoundaries is wrong',
      ).to.eventually.be.false;
      await expect(
        timestampLocation.isDataInBoundaries(arbitraryDataId1, { from: 11, to: 100 }),
        'isDataInBoundaries is wrong',
      ).to.eventually.be.false;
      await expect(
        timestampLocation.isDataInBoundaries(arbitraryDataId1, { from: 11 }),
        'isDataInBoundaries is wrong',
      ).to.eventually.be.false;
      await expect(
        timestampLocation.isDataInBoundaries(arbitraryDataId1, { to: 9 }),
        'isDataInBoundaries is wrong',
      ).to.eventually.be.false;
    });

    it('cannot isDataInBoundaries() on dataId not pushed', async () => {
      const timestampLocation = new TimestampByLocationTransactionIndex();

      await expect(
        timestampLocation.isDataInBoundaries(arbitraryDataId1, { from: 1, to: 100 }),
        'must throw',
      ).to.rejectedWith(`Unknown timestamp for the dataId ${arbitraryDataId1}`);
    });
  });

  describe('getLatestTimestamp', () => {
    it('return null if empty', async () => {
      const timestampLocation = new TimestampByLocationTransactionIndex();
      const latest = await timestampLocation.getLastTransactionTimestamp();
      expect(latest).to.be.null;
    });

    it('return correct data', async () => {
      const timestampLocation = new TimestampByLocationTransactionIndex();
      await timestampLocation.pushTimestampByLocation('a', 2);
      await timestampLocation.pushTimestampByLocation('b', 3);
      await timestampLocation.pushTimestampByLocation('c', 1);

      const latest = await timestampLocation.getLastTransactionTimestamp();
      expect(latest).to.be.eq(3);
    });
  });

  describe('getTimestampFromLocation', () => {
    it('can get getTimestamp From Location', async () => {
      const timestampLocation = new TimestampByLocationTransactionIndex();
      await timestampLocation.pushTimestampByLocation('a', 2);
      await timestampLocation.pushTimestampByLocation('b', 3);
      await timestampLocation.pushTimestampByLocation('c', 1);

      expect(await timestampLocation.getTimestampFromLocation('b')).to.be.eq(3);
      expect(await timestampLocation.getTimestampFromLocation('c')).to.be.eq(1);
      expect(await timestampLocation.getTimestampFromLocation('a')).to.be.eq(2);
    });
    it('cannot get getTimestamp From Location not existing', async () => {
      const timestampLocation = new TimestampByLocationTransactionIndex();
      await timestampLocation.pushTimestampByLocation('a', 2);

      expect(await timestampLocation.getTimestampFromLocation('a')).to.be.eq(2);
      expect(await timestampLocation.getTimestampFromLocation('b')).to.be.eq(null);
    });
  });
});
