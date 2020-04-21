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
        iteration: 1,
        reason: 'Incorrect declared size',
        timeoutLastTry: 0,
        toRetry: false,
      },
      hConnectionError: {
        iteration: 1,
        reason: 'Ipfs read request response error: test purpose',
        timeoutLastTry: 0,
        toRetry: true,
      },
      hIncorrectFile: {
        iteration: 1,
        reason: 'Incorrect file test',
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
        iteration: 1,
        reason: 'Incorrect declared size',
        timeoutLastTry: 0,
        toRetry: false,
      },
      hIncorrectFile: {
        iteration: 1,
        reason: 'Incorrect file test',
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
        iteration: 1,
        reason: 'Ipfs read request response error: test purpose',
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
});
