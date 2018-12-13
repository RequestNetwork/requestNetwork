import { Storage as StorageTypes } from '@requestnetwork/types';
import { assert } from 'chai';
import config from '../src/config';
import SmartContractManager from '../src/smart-contract-manager';

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
  config.ethereum.contracts.RequestHashStorage.abi,
  config.ethereum.contracts.RequestHashStorage.private.address,
);

// Define a mock for getPastEvents to be independant of the state of ganache instance
const pastEventsMock = [
  {
    returnValues: {
      hash: hashStr,
      size: realSize,
    },
  },
  {
    // This event should be ignored
    returnValues: {
      hash: hashStr,
      size: fakeSize,
    },
  },
];
const getPastEventsMock = () => pastEventsMock;
smartContractManager.requestHashStorage.getPastEvents = getPastEventsMock;

describe('SmartContractManager', () => {
  after(() => {
    // Stop web3 provider
    provider.engine.stop();
  });

  it.skip('Allows to add hashes to smart contract', async () => {
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

  it.skip('Allows to add other content than hash to smart contract', async () => {
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

  it.skip('Allows to get all hashes', async () => {
    const allHashesAndSizesPromise = await smartContractManager.getAllHashesAndSizesFromEthereum();
    const allHashesAndSizes = await Promise.all(allHashesAndSizesPromise);

    assert.equal(allHashesAndSizes[0].hash, hashStr);
    assert.equal(allHashesAndSizes[0].size, realSize);
    assert.equal(allHashesAndSizes[1].hash, hashStr);
    assert.equal(allHashesAndSizes[1].size, fakeSize);
  });
});
