import 'mocha';

import { StorageTypes } from '@requestnetwork/types';
import DataIdsIgnored from '../src/dataIds-ignored';

import { expect } from 'chai';
import * as sinon from 'sinon';

const entry: StorageTypes.IEthereumEntry = {
  error: {
    message: 'this is a little test !',
    type: StorageTypes.ErrorEntries.ipfsConnectionError,
  },
  feesParameters: { contentSize: 3 },
  hash: 'QmNXA5DyFZkdf4XkUT81nmJSo3nS2bL25x7YepxeoDa6tY',
  meta: {} as any,
};
const entry2: StorageTypes.IEthereumEntry = {
  error: { message: 'this is a second test !', type: StorageTypes.ErrorEntries.incorrectFile },
  feesParameters: { contentSize: 3 },
  hash: 'hash2',
  meta: {} as any,
};

let dataIdsIgnored: DataIdsIgnored;

// tslint:disable:no-magic-numbers
// tslint:disable:no-unused-expression
describe('DataIds ignored', () => {
  beforeEach(() => {
    dataIdsIgnored = new DataIdsIgnored();
  });

  describe('save', () => {
    it('can save()', async () => {
      await dataIdsIgnored.save(entry);
      expect(await dataIdsIgnored.getReason(entry.hash)).to.be.equal(entry.error!.message);
    });
    it('can save() something already saved that can be retried', async () => {
      const clock = sinon.useFakeTimers();
      await dataIdsIgnored.save(entry);
      expect(await dataIdsIgnored.getDataIdsWithReasons()).to.be.deep.equal({
        [entry.hash]: {
          entry,
          iteration: 1,
          timeoutLastTry: 0,
          toRetry: true,
        },
      });

      clock.tick(10);

      await dataIdsIgnored.save(entry);
      expect(await dataIdsIgnored.getDataIdsWithReasons()).to.be.deep.equal({
        [entry.hash]: {
          entry,
          iteration: 2,
          timeoutLastTry: 10,
          toRetry: true,
        },
      });
      sinon.restore();
    });
    it('can save() something already saved that cannot be retried', async () => {
      const clock = sinon.useFakeTimers();
      await dataIdsIgnored.save(entry2);
      expect(await dataIdsIgnored.getDataIdsWithReasons()).to.be.deep.equal({
        [entry2.hash]: {
          entry: entry2,
          iteration: 1,
          timeoutLastTry: 0,
          toRetry: false,
        },
      });

      clock.tick(10);

      await dataIdsIgnored.save(entry2);
      expect(await dataIdsIgnored.getDataIdsWithReasons()).to.be.deep.equal({
        [entry2.hash]: {
          entry: entry2,
          iteration: 1,
          timeoutLastTry: 0,
          toRetry: false,
        },
      });
      sinon.restore();
    });
  });

  describe('getDataIdsToRetry', () => {
    it('can getDataIdsToRetry()', async () => {
      const clock = sinon.useFakeTimers();
      await dataIdsIgnored.save(entry);

      expect(await dataIdsIgnored.getDataIdsToRetry()).to.be.deep.equal([]);

      clock.tick(10000);
      expect(await dataIdsIgnored.getDataIdsToRetry()).to.be.deep.equal([entry]);

      sinon.restore();
    });
  });

  describe('delete', () => {
    it('can delete()', async () => {
      await dataIdsIgnored.save(entry);
      expect(await dataIdsIgnored.getReason(entry.hash)).to.be.equal(entry.error!.message);
      expect(await dataIdsIgnored.getDataIds()).to.be.deep.equal([entry.hash]);

      await dataIdsIgnored.delete(entry.hash);
      expect(await dataIdsIgnored.getReason(entry.hash)).to.be.undefined;
      expect(await dataIdsIgnored.getDataIds()).to.be.deep.equal([]);
    });
  });

  describe('getDataIdsWithReasons', () => {
    it('can getDataIdsWithReasons()', async () => {
      sinon.useFakeTimers();

      await dataIdsIgnored.save(entry);
      await dataIdsIgnored.save(entry2);

      expect(await dataIdsIgnored.getDataIdsWithReasons()).to.be.deep.equal({
        [entry.hash]: {
          entry,
          iteration: 1,
          timeoutLastTry: 0,
          toRetry: true,
        },
        [entry2.hash]: {
          entry: entry2,
          iteration: 1,
          timeoutLastTry: 0,
          toRetry: false,
        },
      });
      sinon.restore();
    });
    it('can getDataIdsWithReasons() if empty', async () => {
      expect(await dataIdsIgnored.getDataIdsWithReasons()).to.be.deep.equal({});
    });
  });
  describe('getDataIds', () => {
    it('can getDataIds()', async () => {
      await dataIdsIgnored.save(entry);
      await dataIdsIgnored.save(entry2);

      expect(await dataIdsIgnored.getDataIds()).to.be.deep.equal([entry.hash, entry2.hash]);
    });
    it('can getDataIds() if empty', async () => {
      expect(await dataIdsIgnored.getDataIds()).to.be.deep.equal([]);
    });
  });
});
