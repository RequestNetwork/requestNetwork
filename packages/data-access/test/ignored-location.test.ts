import 'mocha';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as spies from 'chai-spies';
// tslint:disable: await-promise
// tslint:disable: no-magic-numbers

chai.use(chaiAsPromised);
const expect = chai.expect;
chai.use(spies);

import IgnoredLocation from '../src/ignored-location';

const arbitraryDataId1 = 'dataId1';
const arbitraryDataId2 = 'dataId2';
const arbitraryReason = 'reason1';
const arbitraryReason2 = 'reason2';

/* tslint:disable:no-unused-expression */
describe('IgnoredLocation', () => {
  describe('pushReasonByLocation', () => {
    it('can pushReasonByLocation()', async () => {
      const ignoredLocation = new IgnoredLocation();
      await ignoredLocation.pushReasonByLocation(arbitraryDataId1, arbitraryReason);

      expect(await ignoredLocation.getReasonFromLocation(arbitraryDataId1)).to.equal(
        arbitraryReason,
      );
    });
  });
  describe('removeReasonByLocation', () => {
    it('can removeReasonByLocation()', async () => {
      const ignoredLocation = new IgnoredLocation();
      await ignoredLocation.pushReasonByLocation(arbitraryDataId1, arbitraryReason);
      await ignoredLocation.removeReasonByLocation(arbitraryDataId1);

      expect(await ignoredLocation.getReasonFromLocation(arbitraryDataId1)).to.be.null;
    });
  });

  describe('getIgnoredLocations', () => {
    it('can getIgnoredLocations()', async () => {
      const ignoredLocation = new IgnoredLocation();
      await ignoredLocation.pushReasonByLocation(arbitraryDataId1, arbitraryReason);
      await ignoredLocation.pushReasonByLocation(arbitraryDataId2, arbitraryReason2);

      expect(await ignoredLocation.getIgnoredLocations()).to.be.deep.equal({
        [arbitraryDataId1]: arbitraryReason,
        [arbitraryDataId2]: arbitraryReason2,
      });
    });
    it('can getIgnoredLocations() if empty', async () => {
      const ignoredLocation = new IgnoredLocation();

      expect(await ignoredLocation.getIgnoredLocations()).to.be.deep.equal({});
    });
  });
});
