import { Storage as StorageTypes } from '@requestnetwork/types';
import { assert } from 'chai';
import * as artifactsUtils from '../../src/lib/artifacts-utils';
import SmartContractManager from '../../src/lib/smart-contract-manager';

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';

const hdWalletProvider = require('truffle-hdwallet-provider');
const provider = new hdWalletProvider(mnemonic, 'http://localhost:8545');

const web3Connection: StorageTypes.IWeb3Connection = {
  networkId: StorageTypes.EthereumNetwork.PRIVATE,
  web3Provider: provider,
};
const smartContractManager = new SmartContractManager(web3Connection);

const hashStr = 'QmNXA5DyFZkdf4XkUT81nmJSo3nS2bL25x7YepxeoDa6tY';
const realSize = 29;
const fakeSize = 50;
const otherContent =
  'This is not a hash but but we should be able to add any content into Ethereum, the gas cost for the transaction will be higher';
const otherSize = 100000;

// Contract instance necessary to get event logs
const web3Eth = require('web3-eth');
const eth = new web3Eth(provider);

const contract = new eth.Contract(
  artifactsUtils.getContractAbi(),
  artifactsUtils.getAddress('private'),
);

// Define a mock for getPastEvents to be independant of the state of ganache instance
const pastEventsMock = [
  {
    blockNumber: 1,
    event: 'NewHash',
    returnValues: {
      hash: hashStr,
      size: realSize,
    },
    transactionHash: '0xa',
  },
  // This event has an invalid size but it should not be ignored in smart contract manager
  {
    blockNumber: 2,
    event: 'NewHash',
    returnValues: {
      hash: hashStr,
      size: fakeSize,
    },
    transactionHash: '0xb',
  },
  // We can add any data into the storage
  {
    blockNumber: 3,
    event: 'NewHash',
    returnValues: {
      hash: otherContent,
      size: otherSize,
    },
    transactionHash: '0xc',
  },
];
const getPastEventsMock = () => pastEventsMock;
smartContractManager.requestHashStorage.getPastEvents = getPastEventsMock;

describe('SmartContractManager', () => {
  after(() => {
    // Stop web3 provider
    provider.engine.stop();
  });

  it('Allows to add hashes to smart contract', async () => {
    await smartContractManager.addHashAndSizeToEthereum(hashStr, realSize);

    // Reading last event log
    const events = await contract.getPastEvents({
      event: 'NewHash',
      toBlock: 'latest',
    });

    // Only one event is parsed
    assert.equal(events.length, 1);

    assert.equal(events[0].returnValues.hash, hashStr);
    assert.equal(events[0].returnValues.size, realSize);
  });

  it('Allows to add other content than hash to smart contract', async () => {
    await smartContractManager.addHashAndSizeToEthereum(otherContent, otherSize);
    // Reading last event log
    const events = await contract.getPastEvents({
      event: 'NewHash',
      toBlock: 'latest',
    });

    // Only one event is parsed
    assert.equal(events.length, 1);

    assert.equal(events[0].returnValues.hash, otherContent);
    assert.equal(events[0].returnValues.size, otherSize);
  });

  it('Allows to get all hashes', async () => {
    const allHashesAndSizesPromise = await smartContractManager.getAllHashesAndSizesFromEthereum();
    const allHashesAndSizes = await Promise.all(allHashesAndSizesPromise);

    assert.equal(allHashesAndSizes[0].hash, hashStr);
    assert.equal(allHashesAndSizes[0].size, realSize);
    assert.equal(allHashesAndSizes[1].hash, hashStr);
    assert.equal(allHashesAndSizes[1].size, fakeSize);
    assert.equal(allHashesAndSizes[2].hash, otherContent);
    assert.equal(allHashesAndSizes[2].size, otherSize);
  });

  it('allows to getMetaFromEthereum() a hash', async () => {
    const meta = await smartContractManager.getMetaFromEthereum(hashStr);

    assert.equal(meta.blockNumber, pastEventsMock[0].blockNumber);
    assert.equal(meta.networkName, 'private');
    assert.equal(meta.smartContractAddress, '0x345ca3e014aaf5dca488057592ee47305d9b3e10');
    assert.equal(meta.transactionHash, '0xa');
    assert.isAtLeast(meta.blockConfirmation, 0);
  });

  it('allows to getMetaFromEthereum() a hash not indexed', async () => {
    try {
      await smartContractManager.getMetaFromEthereum('empty');
      assert.fail('must have exception');
    } catch (e) {
      assert.equal(e.message, 'contentHash not indexed on ethereum');
    }
  });
});
