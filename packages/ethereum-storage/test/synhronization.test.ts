import 'mocha';

import * as sinon from 'sinon';

import { StorageTypes } from '@requestnetwork/types';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import EthereumStorage from '../src/ethereum-storage';
import IpfsConnectionError from '../src/ipfs-connection-error';

// tslint:disable:no-magic-numbers

// Extends chai for promises
chai.use(chaiAsPromised);
const expect = chai.expect;

import spies = require('chai-spies');
chai.use(spies);

const web3HttpProvider = require('web3-providers-http');

const ipfsGatewayConnection: StorageTypes.IIpfsGatewayConnection = {
  host: 'localhost',
  port: 5001,
  protocol: StorageTypes.IpfsGatewayProtocol.HTTP,
  timeout: 1000,
};

const provider = new web3HttpProvider('http://localhost:8545');
const web3Connection: StorageTypes.IWeb3Connection = {
  networkId: StorageTypes.EthereumNetwork.PRIVATE,
  timeout: 1000,
  web3Provider: provider,
};

let ethereumStorage: EthereumStorage;

// tslint:disable:no-unused-expression
describe('EthereumStorage synchronization', () => {
  beforeEach(async () => {
    ethereumStorage = new EthereumStorage('localhost', ipfsGatewayConnection, web3Connection);
    await ethereumStorage.initialize();
  });

  describe('_ethereumEntriesToEntries', () => {
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

      ethereumStorage.ipfsManager.read = chai.spy(
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
      const result = await ethereumStorage._ethereumEntriesToEntries(ethereumEntriesToProcess);

      expect(result.length).to.equal(1);
      expect(result[0]!.content).to.equal('ok');
      expect(result[0]!.id).to.equal('hOk');

      const ignoredData = await ethereumStorage.dataIdsIgnored.getDataIdsWithReasons();

      expect(ignoredData).to.deep.equal({
        hBiggerFile: {
          entry: {
            error: {
              message: 'Incorrect declared size',
              type: StorageTypes.ErrorEntries.wrongFees,
            },
            feesParameters: {
              contentSize: 3,
            },
            hash: 'hBiggerFile',
            meta: {},
          },
          iteration: 1,
          timeoutLastTry: 0,
          toRetry: false,
        },
        hConnectionError: {
          entry: {
            error: {
              message: 'Ipfs read request response error: test purpose',
              type: StorageTypes.ErrorEntries.ipfsConnectionError,
            },
            feesParameters: {
              contentSize: 3,
            },
            hash: 'hConnectionError',
            meta: {},
          },
          iteration: 1,
          timeoutLastTry: 0,
          toRetry: true,
        },
        hIncorrectFile: {
          entry: {
            error: {
              message: 'Incorrect file test',
              type: StorageTypes.ErrorEntries.incorrectFile,
            },
            feesParameters: {
              contentSize: 3,
            },
            hash: 'hIncorrectFile',
            meta: {},
          },
          iteration: 1,
          timeoutLastTry: 0,
          toRetry: false,
        },
      });

      expect(ethereumStorage.ipfsManager.read).to.have.been.called.exactly(5);
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
      ethereumStorage.ipfsManager.read = chai.spy(
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
      const result = await ethereumStorage._ethereumEntriesToEntries(ethereumEntriesToProcess);

      expect(result.length).to.equal(2);
      expect(result[0]!.content).to.equal('ok');
      expect(result[0]!.id).to.equal('hOk');
      expect(result[1]!.content).to.equal('ok');
      expect(result[1]!.id).to.equal('hConnectionError');

      const ignoredData = await ethereumStorage.dataIdsIgnored.getDataIdsWithReasons();

      expect(ignoredData).to.deep.equal({
        hBiggerFile: {
          entry: {
            error: {
              message: 'Incorrect declared size',
              type: StorageTypes.ErrorEntries.wrongFees,
            },
            feesParameters: {
              contentSize: 3,
            },
            hash: 'hBiggerFile',
            meta: {},
          },
          iteration: 1,
          timeoutLastTry: 0,
          toRetry: false,
        },
        hIncorrectFile: {
          entry: {
            error: {
              message: 'Incorrect file test',
              type: StorageTypes.ErrorEntries.incorrectFile,
            },
            feesParameters: {
              contentSize: 3,
            },
            hash: 'hIncorrectFile',
            meta: {},
          },
          iteration: 1,
          timeoutLastTry: 0,
          toRetry: false,
        },
      });

      expect(ethereumStorage.ipfsManager.read).to.have.been.called.exactly(5);
      expect(connectionErrorSpy).to.have.been.called.once;
      expect(incorrectErrorSpy).to.have.been.called.once;
      expect(biggerErrorSpy).to.have.been.called.once;
      expect(okSpy).to.have.been.called.twice;

      sinon.restore();
    });

    it('can store hash as ignored then remove it', async () => {
      sinon.useFakeTimers();

      ethereumStorage.ipfsManager.read = chai.spy(() => {
        throw new IpfsConnectionError(`Ipfs read request response error: test purpose`);
      });

      const ethereumEntriesToProcess: StorageTypes.IEthereumEntry[] = [
        { hash: 'hConnectionError', feesParameters: { contentSize: 3 }, meta: {} as any },
      ];
      let result = await ethereumStorage._ethereumEntriesToEntries(ethereumEntriesToProcess);

      expect(result.length).to.equal(0);

      let ignoredData = await ethereumStorage.dataIdsIgnored.getDataIdsWithReasons();

      expect(ignoredData).to.deep.equal({
        hConnectionError: {
          entry: {
            error: {
              message: 'Ipfs read request response error: test purpose',
              type: StorageTypes.ErrorEntries.ipfsConnectionError,
            },
            feesParameters: {
              contentSize: 3,
            },
            hash: 'hConnectionError',
            meta: {},
          },
          iteration: 1,
          timeoutLastTry: 0,
          toRetry: true,
        },
      });
      expect(ethereumStorage.ipfsManager.read).to.have.been.called.twice;

      // Then we find it:
      ethereumStorage.ipfsManager.read = chai.spy(
        async (_hash: string): Promise<StorageTypes.IIpfsObject> => ({
          content: 'ok',
          ipfsLinks: [],
          ipfsSize: 2,
        }),
      );
      result = await ethereumStorage._ethereumEntriesToEntries(ethereumEntriesToProcess);
      expect(result.length).to.equal(1);
      expect(result[0]!.content).to.equal('ok');
      expect(result[0]!.id).to.equal('hConnectionError');

      ignoredData = await ethereumStorage.dataIdsIgnored.getDataIdsWithReasons();

      expect(ignoredData).to.deep.equal({});

      sinon.restore();
    });

    it('can store hash as ignored it twice', async () => {
      const clock = sinon.useFakeTimers();

      ethereumStorage.ipfsManager.read = chai.spy(() => {
        throw new IpfsConnectionError(`Ipfs read request response error: test purpose`);
      });

      const ethereumEntriesToProcess: StorageTypes.IEthereumEntry[] = [
        { hash: 'hConnectionError', feesParameters: { contentSize: 3 }, meta: {} as any },
      ];
      let result = await ethereumStorage._ethereumEntriesToEntries(ethereumEntriesToProcess);
      expect(result.length).to.equal(0);

      let ignoredData = await ethereumStorage.dataIdsIgnored.getDataIdsWithReasons();

      expect(ignoredData).to.deep.equal({
        hConnectionError: {
          entry: {
            error: {
              message: 'Ipfs read request response error: test purpose',
              type: StorageTypes.ErrorEntries.ipfsConnectionError,
            },
            feesParameters: {
              contentSize: 3,
            },
            hash: 'hConnectionError',
            meta: {},
          },
          iteration: 1,
          timeoutLastTry: 0,
          toRetry: true,
        },
      });
      expect(ethereumStorage.ipfsManager.read).to.have.been.called.twice;

      clock.tick(100);
      result = await ethereumStorage._ethereumEntriesToEntries(ethereumEntriesToProcess);
      expect(result.length).to.equal(0);

      ignoredData = await ethereumStorage.dataIdsIgnored.getDataIdsWithReasons();

      expect(ignoredData).to.deep.equal({
        hConnectionError: {
          entry: {
            error: {
              message: 'Ipfs read request response error: test purpose',
              type: StorageTypes.ErrorEntries.ipfsConnectionError,
            },
            feesParameters: {
              contentSize: 3,
            },
            hash: 'hConnectionError',
            meta: {},
          },
          iteration: 2,
          timeoutLastTry: 100,
          toRetry: true,
        },
      });

      sinon.restore();
    });
  });

  describe('getIgnoredData', () => {
    it('can retry the right hashes after some time', async () => {
      const clock = sinon.useFakeTimers();

      const ethereumEntriesToProcess: StorageTypes.IEthereumEntry[] = [
        {
          error: {
            message: 'test purpose hConnectionError',
            type: StorageTypes.ErrorEntries.ipfsConnectionError,
          },
          feesParameters: { contentSize: 3 },
          hash: 'hConnectionError',
          meta: {} as any,
        },
        {
          error: {
            message: 'test purpose hIncorrectFile',
            type: StorageTypes.ErrorEntries.incorrectFile,
          },
          feesParameters: { contentSize: 3 },
          hash: 'hIncorrectFile',
          meta: {} as any,
        },
        {
          error: {
            message: 'test purpose hBiggerFile',
            type: StorageTypes.ErrorEntries.wrongFees,
          },
          feesParameters: { contentSize: 3 },
          hash: 'hBiggerFile',
          meta: {} as any,
        },
      ];
      await ethereumStorage.dataIdsIgnored.save(ethereumEntriesToProcess[0]);
      await ethereumStorage.dataIdsIgnored.save(ethereumEntriesToProcess[1]);
      await ethereumStorage.dataIdsIgnored.save(ethereumEntriesToProcess[2]);

      // const connectionErrorSpy = chai.spy(() => {
      //   throw new IpfsConnectionError(`Ipfs read request response error: test purpose`);
      // });
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

      ethereumStorage.ipfsManager.read = chai.spy(
        async (hash: string): Promise<StorageTypes.IIpfsObject> => {
          if (hash === 'hConnectionError') {
            return okSpy();
          } else if (hash === 'hIncorrectFile') {
            return incorrectErrorSpy();
          } else if (hash === 'hBiggerFile') {
            return biggerErrorSpy();
          } else {
            return okSpy();
          }
        },
      );

      // too soon
      clock.tick(100);
      let result = await ethereumStorage.getIgnoredData();
      expect(result.length).to.equal(0);

      expect(ethereumStorage.ipfsManager.read).to.have.not.been.called;
      expect(incorrectErrorSpy).to.have.not.been.called;
      expect(biggerErrorSpy).to.have.not.been.called;
      expect(okSpy).to.have.not.been.called;

      // after enough time
      clock.tick(100000);
      result = await ethereumStorage.getIgnoredData();
      expect(result.length).to.equal(1);
      expect(result[0]!.content).to.equal('ok');
      expect(result[0]!.id).to.equal('hConnectionError');

      expect(ethereumStorage.ipfsManager.read).to.have.been.called.once;
      expect(incorrectErrorSpy).to.have.not.been.called;
      expect(biggerErrorSpy).to.have.not.been.called;
      expect(okSpy).to.have.been.called.once;

      sinon.restore();
    });

    it('can retry the right hashes after some time and increment the iteration', async () => {
      const clock = sinon.useFakeTimers();

      await ethereumStorage.dataIdsIgnored.save({
        error: {
          message: 'test purpose hConnectionError',
          type: StorageTypes.ErrorEntries.ipfsConnectionError,
        },
        feesParameters: { contentSize: 3 },
        hash: 'hConnectionError',
        meta: {} as any,
      });

      const connectionErrorSpy = chai.spy(() => {
        throw new IpfsConnectionError(`Ipfs read request response error: test purpose`);
      });
      const okSpy = chai.spy(() => ({
        content: 'ok',
        ipfsLinks: [],
        ipfsSize: 2,
      }));

      let tryCount = 0;
      ethereumStorage.ipfsManager.read = chai.spy(
        async (hash: string): Promise<StorageTypes.IIpfsObject> => {
          if (hash === 'hConnectionError' && tryCount <= 1) {
            tryCount++;
            return connectionErrorSpy();
          } else {
            return okSpy();
          }
        },
      );

      // too soon
      clock.tick(100);
      let result = await ethereumStorage.getIgnoredData();
      expect(result.length).to.equal(0);
      expect(ethereumStorage.ipfsManager.read).to.have.not.been.called;
      expect(connectionErrorSpy).to.have.not.been.called;
      expect(okSpy).to.have.not.been.called;
      let ignoredData = await ethereumStorage.dataIdsIgnored.getDataIdsWithReasons();
      expect(ignoredData).to.deep.equal({
        hConnectionError: {
          entry: {
            error: {
              message: 'test purpose hConnectionError',
              type: StorageTypes.ErrorEntries.ipfsConnectionError,
            },
            feesParameters: {
              contentSize: 3,
            },
            hash: 'hConnectionError',
            meta: {},
          },
          iteration: 1,
          timeoutLastTry: 0,
          toRetry: true,
        },
      });

      // after enough time
      clock.tick(10000);
      result = await ethereumStorage.getIgnoredData();
      expect(result.length).to.equal(0);

      ignoredData = await ethereumStorage.dataIdsIgnored.getDataIdsWithReasons();
      expect(ignoredData).to.deep.equal({
        hConnectionError: {
          entry: {
            error: {
              message: 'Ipfs read request response error: test purpose',
              type: StorageTypes.ErrorEntries.ipfsConnectionError,
            },
            feesParameters: {
              contentSize: 3,
            },
            hash: 'hConnectionError',
            meta: {},
          },
          iteration: 2,
          timeoutLastTry: 10100,
          toRetry: true,
        },
      });

      expect(ethereumStorage.ipfsManager.read).to.have.been.called.twice;
      expect(connectionErrorSpy).to.have.been.called.twice;
      expect(okSpy).to.have.not.been.called;

      // after enough time
      clock.tick(10000);
      result = await ethereumStorage.getIgnoredData();
      expect(result.length).to.equal(1);
      expect(result[0]!.content).to.equal('ok');
      expect(result[0]!.id).to.equal('hConnectionError');

      ignoredData = await ethereumStorage.dataIdsIgnored.getDataIdsWithReasons();
      expect(ignoredData).to.deep.equal({});
      expect(ethereumStorage.ipfsManager.read).to.have.been.called.exactly(3);
      expect(connectionErrorSpy).to.have.been.called.twice;
      expect(okSpy).to.have.been.called.once;

      sinon.restore();
    });
  });
});
