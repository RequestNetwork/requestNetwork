/* eslint-disable spellcheck/spell-checker */
import { StorageTypes } from '@requestnetwork/types';
import EthereumMetadataCache from '../src/ethereum-metadata-cache';
import SmartContractManager from '../src/smart-contract-manager';
import { createSandbox } from 'jest-sandbox';

const sandbox = createSandbox();

let ethereumMetadataCache: EthereumMetadataCache;

const ethereumMetadataExample1: StorageTypes.IEthereumMetadata = {
  blockConfirmation: 3,
  blockNumber: 0,
  blockTimestamp: 1000,
  networkName: 'ropsten',
  smartContractAddress: '0xaaa',
  transactionHash: '0xbbb',
};

const ethereumMetadataExample2: StorageTypes.IEthereumMetadata = {
  blockConfirmation: 5,
  blockNumber: 0,
  blockTimestamp: 4000,
  networkName: 'rinkeby',
  smartContractAddress: '0xccc',
  transactionHash: '0xddd',
};

const ethereumMetadataExample3: StorageTypes.IEthereumMetadata = {
  blockConfirmation: 3,
  blockNumber: 0,
  blockTimestamp: 300,
  networkName: 'kovan',
  smartContractAddress: '0xeee',
  transactionHash: '0xfff',
};

const hashExample1: string = '0xabc';
const hashExample2: string = '0xefg';
const hashExample3: string = '0xhij';

let smartContractManager: SmartContractManager;

const getMetaFromEthereumMock = async (hash: string): Promise<StorageTypes.IEthereumMetadata> => {
  const ret = ({
    '0xabc': ethereumMetadataExample1,
    '0xefg': ethereumMetadataExample2,
    '0xhij': ethereumMetadataExample3,
  } as any)[hash];
  return ret;
};

describe('EthereumMetadataCache', () => {
  beforeEach(() => {
    sandbox.restore();
    smartContractManager = new SmartContractManager();
    ethereumMetadataCache = new EthereumMetadataCache(smartContractManager);
  });

  it('allows to save metadata', async () => {
    await expect(ethereumMetadataCache.metadataCache.get(hashExample1)).resolves.toBeUndefined();
    await expect(ethereumMetadataCache.metadataCache.get(hashExample2)).resolves.toBeUndefined();
    await expect(ethereumMetadataCache.metadataCache.get(hashExample3)).resolves.toBeUndefined();

    await ethereumMetadataCache.saveDataIdMeta(hashExample1, ethereumMetadataExample1);
    await ethereumMetadataCache.saveDataIdMeta(hashExample2, ethereumMetadataExample2);
    await ethereumMetadataCache.saveDataIdMeta(hashExample3, ethereumMetadataExample3);

    await expect(ethereumMetadataCache.metadataCache.get(hashExample1)).resolves.toEqual(
      ethereumMetadataExample1,
    );
    await expect(ethereumMetadataCache.metadataCache.get(hashExample2)).resolves.toEqual(
      ethereumMetadataExample2,
    );
    await expect(ethereumMetadataCache.metadataCache.get(hashExample3)).resolves.toEqual(
      ethereumMetadataExample3,
    );
  });

  it('allows to retrieve saved metadata', async () => {
    const spy = sandbox.spyOn(smartContractManager, 'getMetaFromEthereum');

    await ethereumMetadataCache.saveDataIdMeta(hashExample1, ethereumMetadataExample1);
    await ethereumMetadataCache.saveDataIdMeta(hashExample2, ethereumMetadataExample2);
    await ethereumMetadataCache.saveDataIdMeta(hashExample3, ethereumMetadataExample3);

    const readReturn1 = await ethereumMetadataCache.getDataIdMeta(hashExample1);
    const readReturn2 = await ethereumMetadataCache.getDataIdMeta(hashExample2);
    const readReturn3 = await ethereumMetadataCache.getDataIdMeta(hashExample3);

    expect(readReturn1).toEqual(ethereumMetadataExample1);
    expect(readReturn2).toEqual(ethereumMetadataExample2);
    expect(readReturn3).toEqual(ethereumMetadataExample3);

    expect(spy).not.toHaveBeenCalled();
  });

  it('allows to save when trying to read new metadata', async () => {
    smartContractManager.getMetaFromEthereum = getMetaFromEthereumMock;

    const spy = sandbox.spyOn(smartContractManager, 'getMetaFromEthereum');

    await expect(ethereumMetadataCache.metadataCache.get(hashExample1)).resolves.toBeUndefined();
    await expect(ethereumMetadataCache.metadataCache.get(hashExample2)).resolves.toBeUndefined();
    await expect(ethereumMetadataCache.metadataCache.get(hashExample3)).resolves.toBeUndefined();

    const readReturn1 = await ethereumMetadataCache.getDataIdMeta(hashExample1);
    await expect(readReturn1).resolves.toEqual(ethereumMetadataExample1);
    expect(spy).toHaveBeenCalledTimes(1);
    await expect(ethereumMetadataCache.metadataCache.get(hashExample2)).resolves.toBeUndefined();
    await expect(ethereumMetadataCache.metadataCache.get(hashExample3)).resolves.toBeUndefined();

    const readReturn2 = await ethereumMetadataCache.getDataIdMeta(hashExample2);
    expect(readReturn2).toEqual(ethereumMetadataExample2);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(ethereumMetadataCache.metadataCache.get(hashExample3)).toBeUndefined();

    const readReturn3 = await ethereumMetadataCache.getDataIdMeta(hashExample3);
    expect(readReturn3).toEqual(ethereumMetadataExample3);
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('cannot erase metadata of dataId with new metadata', async () => {
    await ethereumMetadataCache.saveDataIdMeta(hashExample1, ethereumMetadataExample1);
    await ethereumMetadataCache.saveDataIdMeta(hashExample1, ethereumMetadataExample2);

    await expect(ethereumMetadataCache.metadataCache.get(hashExample1)).resolves.toEqual(
      ethereumMetadataExample1,
    );
  });
});
