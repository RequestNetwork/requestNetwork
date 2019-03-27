import { expect } from 'chai';
import 'mocha';

import TimestampLocation from '../src/timestamp-by-location';

const arbitraryDataId1 = 'dataId1';

const arbitraryTimestamp = 10;

/* tslint:disable:no-unused-expression */
describe('LocationTimestamp', () => {
  it('can pushTimestampByLocation() and getTimestampFromLocation()', () => {
    const timestampLocation = new TimestampLocation();
    timestampLocation.pushTimestampByLocation(arbitraryDataId1, arbitraryTimestamp);

    const result = timestampLocation.getTimestampFromLocation(arbitraryDataId1);
    expect(result, 'timestampLocation is wrong').to.equal(arbitraryTimestamp);
  });

  describe('isDataInBoundaries', () => {
    it('can isDataInBoundaries()', () => {
      const timestampLocation = new TimestampLocation();
      timestampLocation.pushTimestampByLocation(arbitraryDataId1, arbitraryTimestamp);

      expect(
        timestampLocation.isDataInBoundaries(arbitraryDataId1, { from: 1, to: 100 }),
        'isDataInBoundaries is wrong',
      ).to.be.true;
      expect(
        timestampLocation.isDataInBoundaries(arbitraryDataId1, { from: 1 }),
        'isDataInBoundaries is wrong',
      ).to.be.true;
      expect(
        timestampLocation.isDataInBoundaries(arbitraryDataId1, { to: 100 }),
        'isDataInBoundaries is wrong',
      ).to.be.true;
      expect(timestampLocation.isDataInBoundaries(arbitraryDataId1), 'isDataInBoundaries is wrong')
        .to.be.true;

      expect(
        timestampLocation.isDataInBoundaries(arbitraryDataId1, { from: 1, to: 9 }),
        'isDataInBoundaries is wrong',
      ).to.be.false;
      expect(
        timestampLocation.isDataInBoundaries(arbitraryDataId1, { from: 11, to: 100 }),
        'isDataInBoundaries is wrong',
      ).to.be.false;
      expect(
        timestampLocation.isDataInBoundaries(arbitraryDataId1, { from: 11 }),
        'isDataInBoundaries is wrong',
      ).to.be.false;
      expect(
        timestampLocation.isDataInBoundaries(arbitraryDataId1, { to: 9 }),
        'isDataInBoundaries is wrong',
      ).to.be.false;
    });

    it('cannot isDataInBoundaries() on dataId not pushed', () => {
      const timestampLocation = new TimestampLocation();

      expect(() => {
        timestampLocation.isDataInBoundaries(arbitraryDataId1, { from: 1, to: 100 });
      }, 'must throw').to.throw(`Timestamp not know for the dataId ${arbitraryDataId1}`);
    });
  });
});
