import { StorageTypes } from '@requestnetwork/types';
import EthereumMetadataCache from '../src/ethereum-metadata-cache';

let metadataCache: EthereumMetadataCache;

const metadataExample1: StorageTypes.IEthereumMetadata = {
  blockConfirmation: 3,
  blockNumber: 0,
  blockTimestamp: 1000,
  networkName: 'ropsten',
  smartContractAddress: '0xaaa',
  transactionHash: '0xbbb',
};

const metadataExample2: StorageTypes.IEthereumMetadata = {
  blockConfirmation: 5,
  blockNumber: 0,
  blockTimestamp: 4000,
  networkName: 'rinkeby',
  smartContractAddress: '0xccc',
  transactionHash: '0xddd',
};

const metadataExample3: StorageTypes.IEthereumMetadata = {
  blockConfirmation: 3,
  blockNumber: 0,
  blockTimestamp: 300,
  networkName: 'kovan',
  smartContractAddress: '0xeee',
  transactionHash: '0xfff',
};

const hashExample1 = '0xabc';
const hashExample2 = '0xefg';
const hashExample3 = '0xhij';

describe('EthereumMetadataCache', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    metadataCache = new EthereumMetadataCache();
  });

  it('allows to save metadata', async () => {
    await expect(metadataCache.metadataCache.get(hashExample1)).resolves.toBeUndefined();
    await expect(metadataCache.metadataCache.get(hashExample2)).resolves.toBeUndefined();
    await expect(metadataCache.metadataCache.get(hashExample3)).resolves.toBeUndefined();

    await metadataCache.saveDataIdMeta(hashExample1, metadataExample1);
    await metadataCache.saveDataIdMeta(hashExample2, metadataExample2);
    await metadataCache.saveDataIdMeta(hashExample3, metadataExample3);

    await expect(metadataCache.metadataCache.get(hashExample1)).resolves.toEqual(metadataExample1);
    await expect(metadataCache.metadataCache.get(hashExample2)).resolves.toEqual(metadataExample2);
    await expect(metadataCache.metadataCache.get(hashExample3)).resolves.toEqual(metadataExample3);
  });

  it('cannot erase metadata of dataId with new metadata', async () => {
    await metadataCache.saveDataIdMeta(hashExample1, metadataExample1);
    await metadataCache.saveDataIdMeta(hashExample1, metadataExample2);

    await expect(metadataCache.metadataCache.get(hashExample1)).resolves.toEqual(metadataExample1);
  });
});
