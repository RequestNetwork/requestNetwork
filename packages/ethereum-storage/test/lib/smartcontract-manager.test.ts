import 'mocha';

import { Storage as StorageTypes } from '@requestnetwork/types';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as artifactsUtils from '../../src/lib/artifacts-utils';
import SmartContractManager from '../../src/lib/smart-contract-manager';

// Extends chai for promises
chai.use(chaiAsPromised);
const assert = chai.assert;

const web3HttpProvider = require('web3-providers-http');

const provider = new web3HttpProvider('http://localhost:8545');
const web3Connection: StorageTypes.IWeb3Connection = {
  networkId: StorageTypes.EthereumNetwork.PRIVATE,
  timeout: 1000,
  web3Provider: provider,
};

const invalidHostProvider = new web3HttpProvider('http://nonexistent:8545');
const invalidHostWeb3Connection: StorageTypes.IWeb3Connection = {
  networkId: StorageTypes.EthereumNetwork.PRIVATE,
  timeout: 1000,
  web3Provider: invalidHostProvider,
};

const mainnetProvider = new web3HttpProvider(
  'https://mainnet.infura.io/v3/336bb135413f4f5f92138d4539ae4300',
);
const mainnetWeb3Connection: StorageTypes.IWeb3Connection = {
  web3Provider: mainnetProvider,
};

const invalidProvider = 'invalidProvider';
const invalidWeb3Connection: StorageTypes.IWeb3Connection = {
  networkId: StorageTypes.EthereumNetwork.PRIVATE,
  timeout: 1000,
  web3Provider: invalidProvider,
};

const invalidNetwork = 999999;
const invalidNetworkWeb3Connection: StorageTypes.IWeb3Connection = {
  networkId: invalidNetwork,
  timeout: 1000,
  web3Provider: provider,
};

let smartContractManager: SmartContractManager;

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
    blockNumber: 0,
    event: 'NewHash',
    returnValues: {
      hash: hashStr,
      size: realSize,
    },
    transactionHash: '0xa',
  },
  // This event has an invalid size but it should not be ignored in smart contract manager
  {
    blockNumber: 1,
    event: 'NewHash',
    returnValues: {
      hash: hashStr,
      size: fakeSize,
    },
    transactionHash: '0xb',
  },
  // We can add any data into the storage
  {
    blockNumber: 2,
    event: 'NewHash',
    returnValues: {
      hash: otherContent,
      size: otherSize,
    },
    transactionHash: '0xc',
  },
  // We can add any data into the storage
  {
    blockNumber: 3,
    event: 'NewHash',
    returnValues: {
      hash: otherContent,
      size: otherSize,
    },
  },
];

// Return past event from pastEventsMock from fromBlock
const getPastEventsMock = (info: { event: string; fromBlock: number; toBlock: string }): any => {
  const returnedPastEvents = pastEventsMock.slice();
  // Removes event while blockNumber < fromBlock
  while (returnedPastEvents.length > 0 && returnedPastEvents[0].blockNumber < info.fromBlock) {
    returnedPastEvents.shift();
  }
  return returnedPastEvents;
};

// Mock to test case whare events are badly formatted
const badEventsMock = [
  {
    blockNumber: 2,
    event: 'NewHash',
    returnValues: {
      size: fakeSize,
    },
    transactionHash: '0xb',
  },
];
const getBadEventsMock = () => badEventsMock;

describe('SmartContractManager', () => {
  beforeEach(() => {
    smartContractManager = new SmartContractManager(web3Connection);
    smartContractManager.requestHashStorage.getPastEvents = getPastEventsMock;
  });

  it('getMainAccount should return the main account', async () => {
    const accounts = await eth.getAccounts();
    const mainAccount = await smartContractManager.getMainAccount();

    assert.equal(mainAccount, accounts[0]);
  });

  it('allows to add hashes to smart contract', async () => {
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

  it('allows to add other content than hash to smart contract', async () => {
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

  it('allows to get all hashes', async () => {
    const allHashesAndSizesPromise = await smartContractManager.getAllHashesAndSizesFromEthereum();
    const allHashesAndSizes = await Promise.all(allHashesAndSizesPromise);

    assert.equal(allHashesAndSizes.length, 4);
    assert.equal(allHashesAndSizes[0].hash, hashStr);
    assert.equal(allHashesAndSizes[0].size, realSize);
    assert.equal(allHashesAndSizes[1].hash, hashStr);
    assert.equal(allHashesAndSizes[1].size, fakeSize);
    assert.equal(allHashesAndSizes[2].hash, otherContent);
    assert.equal(allHashesAndSizes[2].size, otherSize);
    assert.equal(allHashesAndSizes[3].hash, otherContent);
    assert.equal(allHashesAndSizes[3].size, otherSize);
  });

  // Additionnal event logs
  const additionalPastEvents = [
    {
      blockNumber: 4,
      event: 'NewHash',
      returnValues: {
        hash: otherContent,
        size: otherSize,
      },
      transactionHash: '0xd',
    },
    {
      blockNumber: 5,
      event: 'NewHash',
      returnValues: {
        hash: hashStr,
        size: fakeSize,
      },
      transactionHash: '0xe',
    },
  ];

  it('allows to get new hashes added to event logs', async () => {
    // We create a copy of pastEventsMock because this array will be modified with new events
    // We create another getPastEvents function for this new array
    let temporaryPastEvents = pastEventsMock.slice();
    smartContractManager.requestHashStorage.getPastEvents = (info: {
      event: string;
      fromBlock: number;
      toBlock: string;
    }): any => {
      const returnedPastEvents = temporaryPastEvents.slice();
      // Removes event while blockNumber < fromBlock
      while (returnedPastEvents.length > 0 && returnedPastEvents[0].blockNumber < info.fromBlock) {
        returnedPastEvents.shift();
      }

      return returnedPastEvents;
    };

    // The last event of temporaryPastEvents has a block number of 3
    // Therefore the value returned by eth.getBlockNumber should be 4
    // when getAllHashesAndSizesFromEthereum is called
    smartContractManager.eth.getBlockNumber = () => 4;

    // Get the hashes
    const allHashesAndSizesPromise = await smartContractManager.getAllHashesAndSizesFromEthereum();
    await Promise.all(allHashesAndSizesPromise);

    // Add the new hashes
    temporaryPastEvents = temporaryPastEvents.concat(additionalPastEvents);

    // 2 new blocks has been added therefore the value returned by eth.getBlockNumber
    // should be 6
    smartContractManager.eth.getBlockNumber = () => 6;

    let newHashesAndSizesPromise = await smartContractManager.getHashesAndSizesFromLastSyncedBlockFromEthereum();
    const newHashesAndSizes = await Promise.all(newHashesAndSizesPromise);

    assert.equal(newHashesAndSizes.length, 2);
    assert.equal(newHashesAndSizes[0].hash, otherContent);
    assert.equal(newHashesAndSizes[0].size, otherSize);
    assert.equal(newHashesAndSizes[1].hash, hashStr);
    assert.equal(newHashesAndSizes[1].size, fakeSize);

    // New call should return no new hash
    newHashesAndSizesPromise = await smartContractManager.getHashesAndSizesFromLastSyncedBlockFromEthereum();
    assert.equal(newHashesAndSizesPromise.length, 0);
  });

  it('getMainAccount with a invalid host provider should throw a timeout error', async () => {
    smartContractManager = new SmartContractManager(invalidHostWeb3Connection);
    await assert.isRejected(smartContractManager.getMainAccount(), Error);
  });

  it('getMainAccount when web3 provider is initialized with no account should throw an error', async () => {
    smartContractManager = new SmartContractManager(mainnetWeb3Connection);
    await assert.isRejected(smartContractManager.getMainAccount(), Error, 'No account found');
  });

  it('addHashAndSizeToEthereum with a invalid host provider should throw a timeout error', async () => {
    smartContractManager = new SmartContractManager(invalidHostWeb3Connection);
    await assert.isRejected(
      smartContractManager.addHashAndSizeToEthereum(hashStr, realSize),
      Error,
    );
  });

  it('getAllHashesAndSizesFromEthereum with a invalid host provider should throw a timeout error', async () => {
    smartContractManager = new SmartContractManager(invalidHostWeb3Connection);
    await assert.isRejected(smartContractManager.getAllHashesAndSizesFromEthereum(), Error);
  });

  it('initializes smartcontract-manager with default values should not throw an error', async () => {
    assert.doesNotThrow(() => new SmartContractManager(), Error);
  });

  it('initializes smartcontract-manager with an invalid provider should throw an error', async () => {
    assert.throws(
      () => new SmartContractManager(invalidWeb3Connection),
      Error,
      `Can't initialize web3-eth`,
    );
  });

  it('initializes smartcontract-manager with an invalid network should throw an error', async () => {
    assert.throws(
      () => new SmartContractManager(invalidNetworkWeb3Connection),
      Error,
      `The network id ${invalidNetwork} doesn't exist`,
    );
  });

  it('getAddress in artifacts-utils with a invalid host network should throw an error', async () => {
    assert.throws(
      () => artifactsUtils.getAddress('nonexistent'),
      Error,
      'No deployment for network',
    );
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

  it('badly formatted events from web3 should throw an error', async () => {
    smartContractManager.requestHashStorage.getPastEvents = getBadEventsMock;

    const allHashesPromises = await smartContractManager.getAllHashesAndSizesFromEthereum();

    await assert.isRejected(
      Promise.all(allHashesPromises),
      Error,
      `event is incorrect: doesn't have a hash or size`,
    );
  });
});
