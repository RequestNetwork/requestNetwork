import 'mocha';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as  spies from 'chai-spies';
// tslint:disable: await-promise
// tslint:disable: no-magic-numbers

chai.use(chaiAsPromised);
const expect = chai.expect;
chai.use(spies);

import TimestampByLocation from '../src/timestamp-by-location';
import InMemoryTransactionIndex from '../src/transaction-index/in-memory';

describe('InMemoryTransactionIndex', () => {
  describe('initialize', () => {
    it('can initialize ', async () => {
      const transactionIndex = new InMemoryTransactionIndex();

      expect(() => transactionIndex.initializeEmpty()).not.to.throw();
    });

    it('cannot initialize twice', () => {
      const transactionIndex = new InMemoryTransactionIndex();
      transactionIndex.initializeEmpty();

      expect(() => transactionIndex.initializeEmpty()).to.throw('already initialized');
    });

    it('addTransaction() should throw an error if not initialized', async () => {
      const transactionIndex = new InMemoryTransactionIndex();

      await expect(transactionIndex.addTransaction('', {}, 0)).to.be.rejectedWith('TransactionIndex must be initialized');
    });

    it('addTransaction() should be fullfilled if initialized', async () => {
      const transactionIndex = new InMemoryTransactionIndex();
      await transactionIndex.initializeEmpty();
      await expect(transactionIndex.addTransaction('', {}, 0)).to.be.fulfilled;
    });

    it('getChannelIdsForTopic() should throw an error if not initialized', async () => {
      const transactionIndex = new InMemoryTransactionIndex();

      await expect(transactionIndex.getChannelIdsForTopic('')).to.be.rejectedWith('TransactionIndex must be initialized');
    });

    it('getChannelIdsForTopic() should be fullfilled if initialized', async () => {
      const transactionIndex = new InMemoryTransactionIndex();
      await transactionIndex.initializeEmpty();
      await expect(transactionIndex.getChannelIdsForTopic('')).to.be.fulfilled;
    });

    it('getStorageLocationList() should throw an error if not initialized', async () => {
      const transactionIndex = new InMemoryTransactionIndex();

      await expect(transactionIndex.getStorageLocationList('')).to.be.rejectedWith('TransactionIndex must be initialized');
    });

    it('getStorageLocationList() should be fullfilled if initialized', async () => {
      const transactionIndex = new InMemoryTransactionIndex();
      await transactionIndex.initializeEmpty();
      await expect(transactionIndex.getStorageLocationList('')).to.be.fulfilled;
    });
  });

  describe('addTransaction', () => {
    let transactionIndex: InMemoryTransactionIndex;
    beforeEach(async () => {
      transactionIndex = new InMemoryTransactionIndex();
      await transactionIndex.initializeEmpty();
    });

    it('calls locationByTopic and timestampByLocation', async () => {
      const pushStorageLocationIndexedWithBlockTopicsMock = chai.spy();
      (transactionIndex as any).locationByTopic.pushStorageLocationIndexedWithBlockTopics = pushStorageLocationIndexedWithBlockTopicsMock;

      const pushTimestampByLocationMock = chai.spy();
      (transactionIndex as any).timestampByLocation.pushTimestampByLocation = pushTimestampByLocationMock;

      await transactionIndex.addTransaction('abcd', {
        foo: 'bar',
      }, 2);

      expect(pushStorageLocationIndexedWithBlockTopicsMock).to.have.been.called.with('abcd', {
        foo: 'bar',
      });
      expect(pushTimestampByLocationMock).to.have.been.called.with('abcd', 2);
    });
  });

  describe('addTransaction', () => {
    let transactionIndex: InMemoryTransactionIndex;
    beforeEach(async () => {
      transactionIndex = new InMemoryTransactionIndex();
      await transactionIndex.initializeEmpty();
    });

    it('calls locationByTopic and timestampByLocation', async () => {
      const pushStorageLocationIndexedWithBlockTopicsMock = chai.spy();
      (transactionIndex as any).locationByTopic.pushStorageLocationIndexedWithBlockTopics = pushStorageLocationIndexedWithBlockTopicsMock;

      const pushTimestampByLocationMock = chai.spy();
      (transactionIndex as any).timestampByLocation.pushTimestampByLocation = pushTimestampByLocationMock;

      await transactionIndex.addTransaction('abcd', {
        foo: 'bar',
      }, 2);

      expect(pushStorageLocationIndexedWithBlockTopicsMock).to.have.been.called.with('abcd', {
        foo: 'bar',
      });
      expect(pushTimestampByLocationMock).to.have.been.called.with('abcd', 2);
    });
  });

  describe('getStorageLocationList', () => {
    let transactionIndex: InMemoryTransactionIndex;
    beforeEach(async () => {
      transactionIndex = new InMemoryTransactionIndex();
      await transactionIndex.initializeEmpty();

      // mock location by topic
      (transactionIndex as any)
        .locationByTopic
        .getStorageLocationsFromChannelId =
        chai.spy(() => ['a', 'b', 'c']);

      const timestampByLocation: TimestampByLocation = (transactionIndex as any).timestampByLocation;
      timestampByLocation.pushTimestampByLocation('a', 9);
      timestampByLocation.pushTimestampByLocation('b', 10);
      timestampByLocation.pushTimestampByLocation('c', 11);
    });

    it('should return all if timestamp not specified', async () => {
      const storageLocationList = await transactionIndex.getStorageLocationList('');
      expect(storageLocationList).to.deep.equal(['a', 'b', 'c']);
    });

    it('should filter data if timestamp specified', async () => {

      const storageLocationList1 = await transactionIndex.getStorageLocationList('', {
        to: 10,
      });
      expect(storageLocationList1).to.deep.equal(['a', 'b']);

      const storageLocationList2 = await transactionIndex.getStorageLocationList('', {
        from: 10,
        to: 11,
      });
      expect(storageLocationList2).to.deep.equal(['b', 'c']);

      const storageLocationList3 = await transactionIndex.getStorageLocationList('', {
        from: 11,
        to: 12,
      });
      expect(storageLocationList3).to.deep.equal(['c']);

      const storageLocationList4 = await transactionIndex.getStorageLocationList('', {
        from: 12,
        to: 13,
      });
      expect(storageLocationList4).to.deep.equal([]);
    });
  });

});
