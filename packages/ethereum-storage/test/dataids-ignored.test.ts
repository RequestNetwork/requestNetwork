import 'mocha';

import IgnoredDataIds from '../src/ignored-dataIds';

import { expect } from 'chai';
import * as sinon from 'sinon';

const hash = 'QmNXA5DyFZkdf4XkUT81nmJSo3nS2bL25x7YepxeoDa6tY';
const reason = 'this is a little test !';
const hash2 = 'hash2';
const reason2 = 'this is a second test !';

let ignoredDataIds: IgnoredDataIds;

// tslint:disable:no-magic-numbers
describe('DataIds ignored', () => {
  beforeEach(() => {
    ignoredDataIds = new IgnoredDataIds();
  });

  describe('save', () => {
    it('can save()', async () => {
      await ignoredDataIds.save(hash, reason, true);

      expect(await ignoredDataIds.getReason(hash)).to.be.equal(reason);
    });
    describe('getDataIdsWithReasons', () => {
      it('can getDataIdsWithReasons()', async () => {
        sinon.useFakeTimers();

        await ignoredDataIds.save(hash, reason, true);
        await ignoredDataIds.save(hash2, reason2, false);

        expect(await ignoredDataIds.getDataIdsWithReasons()).to.be.deep.equal({
          [hash]: {
            iteration: 1,
            lastTryTimestamp: 0,
            reason,
            toRetry: true,
          },
          [hash2]: {
            iteration: 1,
            lastTryTimestamp: 0,
            reason: reason2,
            toRetry: false,
          },
        });
        sinon.restore();
      });
      it('can getDataIdsWithReasons() if empty', async () => {
        expect(await ignoredDataIds.getDataIdsWithReasons()).to.be.deep.equal({});
      });
    });
    describe('getDataIds', () => {
      it('can getDataIds()', async () => {
        await ignoredDataIds.save(hash, reason, true);
        await ignoredDataIds.save(hash2, reason2, true);

        expect(await ignoredDataIds.getDataIds()).to.be.deep.equal([hash, hash2]);
      });
      it('can getDataIds() if empty', async () => {
        expect(await ignoredDataIds.getDataIds()).to.be.deep.equal([]);
      });
    });
  });
});
