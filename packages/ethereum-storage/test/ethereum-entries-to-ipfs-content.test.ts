import { StorageTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import ethereumEntriesToIpfsContent from '../src/ethereum-entries-to-ipfs-content';
import IgnoredDataIndex from '../src/ignored-dataIds';
import IpfsConnectionError from '../src/ipfs-connection-error';

// tslint:disable:no-magic-numbers

let ignoredDataIndex: IgnoredDataIndex;
let ipfsManager: any;

// tslint:disable:no-unused-expression
describe('ethereum-entries-to-ipfs-content', () => {
  beforeEach(async () => {
    ignoredDataIndex = new IgnoredDataIndex();
    ipfsManager = {};
  });

  it('can retry the right hashes', async () => {
    jest.useFakeTimers('modern');
    jest.setSystemTime(0);

    const connectionErrorSpy = jest.fn(() => {
      throw new IpfsConnectionError(`Ipfs read request response error: test purpose`);
    });
    const incorrectErrorSpy = jest.fn(() => {
      throw new Error('Incorrect file test');
    });
    const biggerErrorSpy = jest.fn(() => ({
      content: 'bigger',
      ipfsLinks: [],
      ipfsSize: 5,
    }));
    const okSpy = jest.fn(() => ({
      content: 'ok',
      ipfsLinks: [],
      ipfsSize: 2,
    }));

    ipfsManager.read = jest.fn(
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

    expect(result.length).toBe(1);
    expect(result[0]!.content).toBe('ok');
    expect(result[0]!.id).toBe('hOk');

    const ignoredData = await ignoredDataIndex.getDataIdsWithReasons();

    expect(ignoredData).toEqual({
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

    expect(ipfsManager.read).toHaveBeenCalledTimes(5);
    expect(connectionErrorSpy).toHaveBeenCalledTimes(2);
    expect(incorrectErrorSpy).toHaveBeenCalledTimes(1);
    expect(biggerErrorSpy).toHaveBeenCalledTimes(1);
    expect(okSpy).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it('can retry right hashes but find it after the retry', async () => {
    jest.useFakeTimers('modern');
    jest.setSystemTime(0);

    const connectionErrorSpy = jest.fn(() => {
      throw new IpfsConnectionError(`Ipfs read request response error: test purpose`);
    });
    const incorrectErrorSpy = jest.fn(() => {
      throw new Error('Incorrect file test');
    });
    const biggerErrorSpy = jest.fn(() => ({
      content: 'bigger',
      ipfsLinks: [],
      ipfsSize: 5,
    }));
    const okSpy = jest.fn(() => ({
      content: 'ok',
      ipfsLinks: [],
      ipfsSize: 2,
    }));

    let tryCount = 0;
    ipfsManager.read = jest.fn(
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

    expect(result.length).toBe(2);
    expect(result[0]!.content).toBe('ok');
    expect(result[0]!.id).toBe('hOk');
    expect(result[1]!.content).toBe('ok');
    expect(result[1]!.id).toBe('hConnectionError');

    const ignoredData = await ignoredDataIndex.getDataIdsWithReasons();

    expect(ignoredData).toEqual({
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

    expect(ipfsManager.read).toHaveBeenCalledTimes(5);
    expect(connectionErrorSpy).toHaveBeenCalledTimes(1);
    expect(incorrectErrorSpy).toHaveBeenCalledTimes(1);
    expect(biggerErrorSpy).toHaveBeenCalledTimes(1);
    expect(okSpy).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  it('can store hash as ignored then remove it', async () => {
    jest.useFakeTimers('modern');
    jest.setSystemTime(0);

    ipfsManager.read = jest.fn(() => {
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

    expect(result.length).toBe(0);

    let ignoredData = await ignoredDataIndex.getDataIdsWithReasons();

    expect(ignoredData).toEqual({
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

    expect(ipfsManager.read).toHaveBeenCalledTimes(2);

    // Then we find it:
    ipfsManager.read = jest.fn(
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
    expect(result.length).toBe(1);
    expect(result[0]!.content).toBe('ok');
    expect(result[0]!.id).toBe('hConnectionError');

    ignoredData = await ignoredDataIndex.getDataIdsWithReasons();

    expect(ignoredData).toEqual({});

    jest.useRealTimers();
  });

  it('can store hash as ignored it twice', async () => {
    jest.useFakeTimers('modern');
    jest.setSystemTime(0);

    ipfsManager.read = jest.fn(() => {
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
    expect(result.length).toBe(0);

    let ignoredData = await ignoredDataIndex.getDataIdsWithReasons();

    expect(ignoredData).toEqual({
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

    expect(ipfsManager.read).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(100);
    result = await ethereumEntriesToIpfsContent(
      ethereumEntriesToProcess,
      ipfsManager,
      ignoredDataIndex,
      new Utils.SimpleLogger(),
      5,
    );
    expect(result.length).toBe(0);

    ignoredData = await ignoredDataIndex.getDataIdsWithReasons();

    expect(ignoredData).toEqual({
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

    jest.useRealTimers();
  });
});
