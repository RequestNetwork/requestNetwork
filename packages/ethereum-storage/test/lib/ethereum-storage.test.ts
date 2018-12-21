import { Storage as StorageTypes } from '@requestnetwork/types';
import { assert } from 'chai';
import EthereumStorage from '../../src/lib/ethereum-storage';

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';

const hdWalletProvider = require('truffle-hdwallet-provider');
const provider = new hdWalletProvider(mnemonic, 'http://localhost:8545');

const ipfsGatewayConnection: StorageTypes.IIpfsGatewayConnection = {
  host: 'localhost',
  port: 5001,
  protocol: StorageTypes.IpfsGatewayProtocol.HTTP,
  timeout: 10000,
};
const web3Connection: StorageTypes.IWeb3Connection = {
  networkId: StorageTypes.EthereumNetwork.PRIVATE,
  web3Provider: provider,
};
let ethereumStorage: EthereumStorage;

const content1 = 'this is a little test !';
const hash1 = 'QmNXA5DyFZkdf4XkUT81nmJSo3nS2bL25x7YepxeoDa6tY';
const realSize1 = 29;
const fakeSize1 = 50;

const content2 = 'content\nwith\nspecial\ncharacters\n';
const hash2 = 'QmQj8fQ9T16Ddrxfij5eyRnxXKTVxRXyQuazYnezt9iZpy';
const realSize2 = 38;
const fakeSize2 = 0;

// Define a mock for getPastEvents to be independant of the state of ganache instance
const pastEventsMock = [
  {
    event: 'NewHash',
    returnValues: {
      hash: hash1,
      size: realSize1,
    },
  },
  {
    event: 'NewHash',
    returnValues: {
      hash: hash1,
      size: fakeSize1,
    },
  },
  {
    event: 'NewHash',
    returnValues: {
      hash: hash2,
      size: realSize2,
    },
  },
  {
    event: 'NewHash',
    returnValues: {
      hash: hash2,
      size: fakeSize2,
    },
  },
];
const getPastEventsMock = () => pastEventsMock;

describe('EthereumStorage', () => {
  after(() => {
    // Stop web3 provider
    provider.engine.stop();
  });

  beforeEach(() => {
    ethereumStorage = new EthereumStorage(ipfsGatewayConnection, web3Connection);
    ethereumStorage.smartContractManager.requestHashStorage.getPastEvents = getPastEventsMock;
  });

  it('Allows to append a file', async () => {
    const result = await ethereumStorage.append(content1);

    const resultExpected: StorageTypes.IRequestStorageAppendReturn = {
      meta: {
        storageType: StorageTypes.StorageSystemType.ETHEREUM_IPFS,
      },
      result: { dataId: hash1 },
    };
    assert.deepEqual(resultExpected, result);
  });

  it('Allows to read a file', async () => {
    await ethereumStorage.append(content1);
    const result = await ethereumStorage.read(hash1);

    const resultExpected: StorageTypes.IRequestStorageReadReturn = {
      meta: {
        storageType: StorageTypes.StorageSystemType.ETHEREUM_IPFS,
      },
      result: { content: content1 },
    };
    assert.deepEqual(resultExpected, result);
  });

  it('Allow to retrieve all data id', async () => {
    // These contents have to be appended in order to check their size
    await ethereumStorage.append(content1);
    await ethereumStorage.append(content2);
    const result = await ethereumStorage.getAllDataId();

    assert.deepEqual(result, {
      meta: {
        metaDataIds: [
          { storageType: StorageTypes.StorageSystemType.ETHEREUM_IPFS },
          {},
          { storageType: StorageTypes.StorageSystemType.ETHEREUM_IPFS },
          {},
        ],
      },
      result: { dataIds: [hash1, '', hash2, ''] },
    });
  });

  it('Allow to retrieve all data', async () => {
    await ethereumStorage.append(content1);
    await ethereumStorage.append(content2);
    const result = await ethereumStorage.getAllData();

    const resultExpected: StorageTypes.IRequestStorageGetAllDataReturn = {
      meta: {
        metaData: [
          { storageType: StorageTypes.StorageSystemType.ETHEREUM_IPFS },
          {},
          { storageType: StorageTypes.StorageSystemType.ETHEREUM_IPFS },
          {},
        ],
      },
      result: { data: [content1, '', content2, ''] },
    };
    assert.deepEqual(result, resultExpected);
  });
});
