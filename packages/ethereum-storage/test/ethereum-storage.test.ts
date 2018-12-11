import { Storage as StorageTypes } from '@requestnetwork/types';
import { assert } from 'chai';
import { EthereumStorage } from '../src/ethereum-storage';

const mnemonic =
  'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';

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
const ethereumStorage = new EthereumStorage(
  ipfsGatewayConnection,
  web3Connection,
);

const content = 'this is a little test !';
const hash = 'QmNXA5DyFZkdf4XkUT81nmJSo3nS2bL25x7YepxeoDa6tY';

describe('Index', () => {
  after(() => {
    // Stop web3 provider
    provider.engine.stop();
  });

  it.skip('Allows to append a file', async () => {
    const hashReturned = await ethereumStorage.append(content);
    assert.equal(hash, hashReturned);
  });

  it.skip('Allows to read a file', async () => {
    await ethereumStorage.append(content);
    const contentReturned = await ethereumStorage.read(hash);
    assert.equal(content, contentReturned);
  });

  it.skip('Allow to retrieve all data id', async () => {
    await ethereumStorage.append(content);
    const idArray = await ethereumStorage.getAllDataId();
    assert.equal(idArray, [hash]);
  });

  it.skip('Allow to retrieve all data', async () => {
    let dataArray = await ethereumStorage.getAllData();
    dataArray = dataArray.filter(id => id.length > 0);
    assert.equal(dataArray, [content]);
  });
});
