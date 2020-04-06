import 'mocha';

import DataIdsIgnored from '../src/dataIds-ignored';

import { expect } from 'chai';

const hash = 'QmNXA5DyFZkdf4XkUT81nmJSo3nS2bL25x7YepxeoDa6tY';
const reason = 'this is a little test !';
const hash2 = 'hash2';
const reason2 = 'this is a second test !';

let dataIdsIgnored: DataIdsIgnored;

// tslint:disable:no-magic-numbers
describe('DataIds ignored', () => {
  beforeEach(() => {
    dataIdsIgnored = new DataIdsIgnored();
  });

  describe('saveReason', () => {
    it('can saveReason()', async () => {
      await dataIdsIgnored.saveReason(hash, reason);

      expect(await dataIdsIgnored.getReason(hash)).to.be.equal(reason);
    });
    describe('getListDataIdWithReason', () => {
      it('can getListDataIdWithReason()', async () => {
        await dataIdsIgnored.saveReason(hash, reason);
        await dataIdsIgnored.saveReason(hash2, reason2);

        expect(await dataIdsIgnored.getListDataIdWithReason()).to.be.deep.equal({
          [hash]: reason,
          [hash2]: reason2,
        });
      });
      it('can getListDataIdWithReason() if empty', async () => {
        expect(await dataIdsIgnored.getListDataIdWithReason()).to.be.deep.equal({});
      });
    });
    describe('getListDataId', () => {
      it('can getListDataId()', async () => {
        await dataIdsIgnored.saveReason(hash, reason);
        await dataIdsIgnored.saveReason(hash2, reason2);

        expect(await dataIdsIgnored.getListDataId()).to.be.deep.equal([hash, hash2]);
      });
      it('can getListDataId() if empty', async () => {
        expect(await dataIdsIgnored.getListDataId()).to.be.deep.equal([]);
      });
    });
  });
});
