import * as sinon from 'sinon';

import { StorageTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import ethereumEntriesToIpfsContent from '../src/ethereum-entries-to-ipfs-content';
import IgnoredDataIndex from '../src/ignored-dataIds';
import IpfsConnectionError from '../src/ipfs-connection-error';

// tslint:disable:no-magic-numbers

// Extends chai for promises
chai.use(chaiAsPromised);
const expect = chai.expect;

import spies = require('chai-spies');
chai.use(spies);

let ignoredDataIndex: IgnoredDataIndex;
let ipfsManager: any;

// tslint:disable:no-unused-expression
describe('ethereum-entries-to-ipfs-content', () => {
  beforeEach(async () => {
    ignoredDataIndex = new IgnoredDataIndex();
    ipfsManager = {};
  });

  it('can retry the right hashes', async () => {
    sinon.useFakeTimers();

    const connectionErrorSpy = chai.spy(() => {
      throw new IpfsConnectionError(`Ipfs read request response error: test purpose`);
    });
    const incorrectErrorSpy = chai.spy(() => {
      throw new Error('Incorrect file test');
    });
    const biggerErrorSpy = chai.spy(() => ({
      content: 'bigger',
      ipfsLinks: [],
      ipfsSize: 5,
    }));
    const okSpy = chai.spy(() => ({
      content: 'ok',
      ipfsLinks: [],
      ipfsSize: 2,
    }));

    ipfsManager.read = chai.spy(
      async (hash: string): Promise<StorageTypes.IIpfsObject> => {
        if (hash === 'hConnectionError') {
          return connectionErrorSpy();
        } else if (hash === 'hIncorrectFile') {
          return incorrectErrorSpy();
        } else if (hash === 'hBiggerFile') {
          return biggerErrorSpy();
        } else {
          return okSpy();
        }
      },
    );

    const ethereumEntriesToProcess: StorageTypes.IEthereumEntry[] = [
      { hash: 'hConnectionError', feesParameters: { contentSize: 3 }, meta: {} as any },
      { hash: 'hIncorrectFile', feesParameters: { contentSize: 3 }, meta: {} as any },
      { hash: 'hBiggerFile', feesParameters: { contentSize: 3 }, meta: {} as any },
      { hash: 'hOk', feesParameters: { contentSize: 3 }, meta: {} as any },
    ];
    const result = await ethereumEntriesToIpfsContent(
      ethereumEntriesToProcess,
      ipfsManager,
      ignoredDataIndex,
      new Utils.SimpleLogger(),
      5,
    );

    expect(result.length).to.equal(1);
    expect(result[0]!.content).to.equal('ok');
    expect(result[0]!.id).to.equal('hOk');

    const ignoredData = await ignoredDataIndex.getDataIdsWithReasons();

    expect(ignoredData).to.deep.equal({
      hBiggerFile: {
        entry: {
          error: {
            message: 'Incorrect declared size',
            type: StorageTypes.ErrorEntries.WRONG_FEES,
          },
          feesParameters: {
            contentSize: 3,
          },
          hash: 'hBiggerFile',
          meta: {},
        },
        iteration: 1,
        lastTryTimestamp: 0,
        toRetry: false,
      },
      hConnectionError: {
        entry: {
          error: {
            message: 'Ipfs read request response error: test purpose',
            type: StorageTypes.ErrorEntries.IPFS_CONNECTION_ERROR,
          },
          feesParameters: {
            contentSize: 3,
          },
          hash: 'hConnectionError',
          meta: {},
        },
        iteration: 1,
        lastTryTimestamp: 0,
        toRetry: true,
      },
      hIncorrectFile: {
        entry: {
          error: {
            message: 'Incorrect file test',
            type: StorageTypes.ErrorEntries.INCORRECT_FILE,
          },
          feesParameters: {
            contentSize: 3,
          },
          hash: 'hIncorrectFile',
          meta: {},
        },
        iteration: 1,
        lastTryTimestamp: 0,
        toRetry: false,
      },
    });

    expect(ipfsManager.read).to.have.been.called.exactly(5);
    expect(connectionErrorSpy).to.have.been.called.twice;
    expect(incorrectErrorSpy).to.have.been.called.once;
    expect(biggerErrorSpy).to.have.been.called.once;
    expect(okSpy).to.have.been.called.once;

    sinon.restore();
  });

  it('can retry right hashes but find it after the retry', async () => {
    sinon.useFakeTimers();

    const connectionErrorSpy = chai.spy(() => {
      throw new IpfsConnectionError(`Ipfs read request response error: test purpose`);
    });
    const incorrectErrorSpy = chai.spy(() => {
      throw new Error('Incorrect file test');
    });
    const biggerErrorSpy = chai.spy(() => ({
      content: 'bigger',
      ipfsLinks: [],
      ipfsSize: 5,
    }));
    const okSpy = chai.spy(() => ({
      content: 'ok',
      ipfsLinks: [],
      ipfsSize: 2,
    }));

    let tryCount = 0;
    ipfsManager.read = chai.spy(
      async (hash: string): Promise<StorageTypes.IIpfsObject> => {
        if (hash === 'hConnectionError' && tryCount === 0) {
          tryCount++;
          return connectionErrorSpy();
        } else if (hash === 'hIncorrectFile') {
          return incorrectErrorSpy();
        } else if (hash === 'hBiggerFile') {
          return biggerErrorSpy();
        } else {
          return okSpy();
        }
      },
    );

    const ethereumEntriesToProcess: StorageTypes.IEthereumEntry[] = [
      { hash: 'hConnectionError', feesParameters: { contentSize: 3 }, meta: {} as any },
      { hash: 'hIncorrectFile', feesParameters: { contentSize: 3 }, meta: {} as any },
      { hash: 'hBiggerFile', feesParameters: { contentSize: 3 }, meta: {} as any },
      { hash: 'hOk', feesParameters: { contentSize: 3 }, meta: {} as any },
    ];
    const result = await ethereumEntriesToIpfsContent(
      ethereumEntriesToProcess,
      ipfsManager,
      ignoredDataIndex,
      new Utils.SimpleLogger(),
      5,
    );

    expect(result.length).to.equal(2);
    expect(result[0]!.content).to.equal('ok');
    expect(result[0]!.id).to.equal('hOk');
    expect(result[1]!.content).to.equal('ok');
    expect(result[1]!.id).to.equal('hConnectionError');

    const ignoredData = await ignoredDataIndex.getDataIdsWithReasons();

    expect(ignoredData).to.deep.equal({
      hBiggerFile: {
        entry: {
          error: {
            message: 'Incorrect declared size',
            type: StorageTypes.ErrorEntries.WRONG_FEES,
          },
          feesParameters: {
            contentSize: 3,
          },
          hash: 'hBiggerFile',
          meta: {},
        },
        iteration: 1,
        lastTryTimestamp: 0,
        toRetry: false,
      },
      hIncorrectFile: {
        entry: {
          error: {
            message: 'Incorrect file test',
            type: StorageTypes.ErrorEntries.INCORRECT_FILE,
          },
          feesParameters: {
            contentSize: 3,
          },
          hash: 'hIncorrectFile',
          meta: {},
        },
        iteration: 1,
        lastTryTimestamp: 0,
        toRetry: false,
      },
    });

    expect(ipfsManager.read).to.have.been.called.exactly(5);
    expect(connectionErrorSpy).to.have.been.called.once;
    expect(incorrectErrorSpy).to.have.been.called.once;
    expect(biggerErrorSpy).to.have.been.called.once;
    expect(okSpy).to.have.been.called.twice;

    sinon.restore();
  });

  it('can store hash as ignored then remove it', async () => {
    sinon.useFakeTimers();

    ipfsManager.read = chai.spy(() => {
      throw new IpfsConnectionError(`Ipfs read request response error: test purpose`);
    });

    const ethereumEntriesToProcess: StorageTypes.IEthereumEntry[] = [
      { hash: 'hConnectionError', feesParameters: { contentSize: 3 }, meta: {} as any },
    ];
    let result = await ethereumEntriesToIpfsContent(
      ethereumEntriesToProcess,
      ipfsManager,
      ignoredDataIndex,
      new Utils.SimpleLogger(),
      5,
    );

    expect(result.length).to.equal(0);

    let ignoredData = await ignoredDataIndex.getDataIdsWithReasons();

    expect(ignoredData).to.deep.equal({
      hConnectionError: {
        entry: {
          error: {
            message: 'Ipfs read request response error: test purpose',
            type: StorageTypes.ErrorEntries.IPFS_CONNECTION_ERROR,
          },
          feesParameters: {
            contentSize: 3,
          },
          hash: 'hConnectionError',
          meta: {},
        },
        iteration: 1,
        lastTryTimestamp: 0,
        toRetry: true,
      },
    });

    expect(ipfsManager.read).to.have.been.called.twice;

    // Then we find it:
    ipfsManager.read = chai.spy(
      async (_hash: string): Promise<StorageTypes.IIpfsObject> => ({
        content: 'ok',
        ipfsLinks: [],
        ipfsSize: 2,
      }),
    );
    result = await ethereumEntriesToIpfsContent(
      ethereumEntriesToProcess,
      ipfsManager,
      ignoredDataIndex,
      new Utils.SimpleLogger(),
      5,
    );
    expect(result.length).to.equal(1);
    expect(result[0]!.content).to.equal('ok');
    expect(result[0]!.id).to.equal('hConnectionError');

    ignoredData = await ignoredDataIndex.getDataIdsWithReasons();

    expect(ignoredData).to.deep.equal({});

    sinon.restore();
  });

  it('can store hash as ignored it twice', async () => {
    const clock = sinon.useFakeTimers();

    ipfsManager.read = chai.spy(() => {
      throw new IpfsConnectionError(`Ipfs read request response error: test purpose`);
    });

    const ethereumEntriesToProcess: StorageTypes.IEthereumEntry[] = [
      { hash: 'hConnectionError', feesParameters: { contentSize: 3 }, meta: {} as any },
    ];
    let result = await ethereumEntriesToIpfsContent(
      ethereumEntriesToProcess,
      ipfsManager,
      ignoredDataIndex,
      new Utils.SimpleLogger(),
      5,
    );
    expect(result.length).to.equal(0);

    let ignoredData = await ignoredDataIndex.getDataIdsWithReasons();

    expect(ignoredData).to.deep.equal({
      hConnectionError: {
        entry: {
          error: {
            message: 'Ipfs read request response error: test purpose',
            type: StorageTypes.ErrorEntries.IPFS_CONNECTION_ERROR,
          },
          feesParameters: {
            contentSize: 3,
          },
          hash: 'hConnectionError',
          meta: {},
        },
        iteration: 1,
        lastTryTimestamp: 0,
        toRetry: true,
      },
    });

    expect(ipfsManager.read).to.have.been.called.twice;

    clock.tick(100);
    result = await ethereumEntriesToIpfsContent(
      ethereumEntriesToProcess,
      ipfsManager,
      ignoredDataIndex,
      new Utils.SimpleLogger(),
      5,
    );
    expect(result.length).to.equal(0);

    ignoredData = await ignoredDataIndex.getDataIdsWithReasons();

    expect(ignoredData).to.deep.equal({
      hConnectionError: {
        entry: {
          error: {
            message: 'Ipfs read request response error: test purpose',
            type: StorageTypes.ErrorEntries.IPFS_CONNECTION_ERROR,
          },
          feesParameters: {
            contentSize: 3,
          },
          hash: 'hConnectionError',
          meta: {},
        },
        iteration: 2,
        lastTryTimestamp: 100,
        toRetry: true,
      },
    });

    sinon.restore();
  });
});
