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
const ethereumStorage = new EthereumStorage(ipfsGatewayConnection, web3Connection);

const content = 'this is a little test !';
const hash = 'QmNXA5DyFZkdf4XkUT81nmJSo3nS2bL25x7YepxeoDa6tY';

describe('Index', () => {
  after(() => {
    // Stop web3 provider
    provider.engine.stop();
  });

  it.skip('Allows to append a file', async () => {
    const result = await ethereumStorage.append(content);

    const resultExpected: StorageTypes.IRequestStorageAppendReturn = {
      meta: {
        storageType: StorageTypes.StorageSystemType.ETHEREUM_IPFS,
      },
      result: { dataId: hash },
    };
    assert.deepEqual(resultExpected, result);
  });

  it.skip('Allows to read a file', async () => {
    await ethereumStorage.append(content);
    const result = await ethereumStorage.read(hash);

    const resultExpected: StorageTypes.IRequestStorageReadReturn = {
      meta: {
        storageType: StorageTypes.StorageSystemType.ETHEREUM_IPFS,
      },
      result: { content },
    };
    assert.deepEqual(resultExpected, result);
  });

  it.skip('Allow to retrieve all data id', async () => {
    await ethereumStorage.append(content);
    const result = await ethereumStorage.getAllDataId();

    assert.deepEqual(result, {
      meta: {
        metaDataIds: [{ storageType: StorageTypes.StorageSystemType.ETHEREUM_IPFS }],
      },
      result: { dataIds: [hash] },
    });
  });

  it.skip('Allow to retrieve all data', async () => {
    const result = await ethereumStorage.getAllData();

    const resultExpected: StorageTypes.IRequestStorageGetAllDataReturn = {
      meta: {
        metaData: [{ storageType: StorageTypes.StorageSystemType.ETHEREUM_IPFS }],
      },
      result: { data: [content] },
    };
    assert.deepEqual(result, resultExpected);
  });
});
