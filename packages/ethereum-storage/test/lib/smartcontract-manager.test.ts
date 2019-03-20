import 'mocha';

import { Storage as StorageTypes } from '@requestnetwork/types';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as artifactsUtils from '../../src/lib/artifacts-utils';
import EthereumBlocks from '../../src/lib/ethereum-blocks';
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
const getPastEventsMock = (info: {
  event: string;
  fromBlock: number;
  toBlock: number | string;
}): any => {
  const toBlock = info.toBlock === 'latest' ? Infinity : info.toBlock;

  return pastEventsMock.filter(
    block => block.blockNumber >= info.fromBlock && block.blockNumber <= toBlock,
  );
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
// tslint:disable-next-line:typedef
const getBadEventsMock = () => badEventsMock;

// tslint:disable:no-magic-numbers
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
    const hashesAndSizesPromise = await smartContractManager.getHashesAndSizesFromEthereum();
    const allHashesAndSizes = await Promise.all(hashesAndSizesPromise);

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

  it('allows to get all hashes with options from', async () => {
    const mockBlocksEthereum = [7, 100, 209, 306];
    const mockEth = {
      getBlock: (i: number): any => {
        return mockBlocksEthereum[i] ? { timestamp: mockBlocksEthereum[i] } : undefined;
      },
      // tslint:disable-next-line:typedef
      getBlockNumber: () => 3,
    };
    smartContractManager.ethereumBlocks = new EthereumBlocks(mockEth, 1);

    const hashesAndSizesPromise = await smartContractManager.getHashesAndSizesFromEthereum({
      from: 299,
    });
    const allHashesAndSizes = await Promise.all(hashesAndSizesPromise);

    assert.equal(allHashesAndSizes.length, 1);
    assert.equal(allHashesAndSizes[0].hash, otherContent);
    assert.equal(allHashesAndSizes[0].size, otherSize);
  });

  it('allows to get all hashes with options to', async () => {
    const mockBlocksEthereum = [7, 100, 209, 306];
    const mockEth = {
      getBlock: (i: number): any => {
        return mockBlocksEthereum[i] ? { timestamp: mockBlocksEthereum[i] } : undefined;
      },
      // tslint:disable-next-line:typedef
      getBlockNumber: () => 3,
    };
    smartContractManager.ethereumBlocks = new EthereumBlocks(mockEth, 1);

    const hashesAndSizesPromise = await smartContractManager.getHashesAndSizesFromEthereum({
      to: 299,
    });
    const allHashesAndSizes = await Promise.all(hashesAndSizesPromise);
    assert.equal(allHashesAndSizes.length, 3);
    assert.equal(allHashesAndSizes[0].hash, hashStr);
    assert.equal(allHashesAndSizes[0].size, realSize);
    assert.equal(allHashesAndSizes[1].hash, hashStr);
    assert.equal(allHashesAndSizes[1].size, fakeSize);
    assert.equal(allHashesAndSizes[2].hash, otherContent);
    assert.equal(allHashesAndSizes[2].size, otherSize);
  });

  it('allows to get all hashes with options from and to', async () => {
    const mockBlocksEthereum = [7, 100, 209, 306];
    const mockEth = {
      getBlock: (i: number): any => {
        return mockBlocksEthereum[i] ? { timestamp: mockBlocksEthereum[i] } : undefined;
      },
      // tslint:disable-next-line:typedef
      getBlockNumber: () => 3,
    };
    smartContractManager.ethereumBlocks = new EthereumBlocks(mockEth, 1);

    const hashesAndSizesPromise = await smartContractManager.getHashesAndSizesFromEthereum({
      from: 10,
      to: 299,
    });
    const allHashesAndSizes = await Promise.all(hashesAndSizesPromise);
    assert.equal(allHashesAndSizes.length, 2);
    assert.equal(allHashesAndSizes[0].hash, hashStr);
    assert.equal(allHashesAndSizes[0].size, fakeSize);
    assert.equal(allHashesAndSizes[1].hash, otherContent);
    assert.equal(allHashesAndSizes[1].size, otherSize);
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

  it('getHashesAndSizesFromEthereum with a invalid host provider should throw a timeout error', async () => {
    smartContractManager = new SmartContractManager(invalidHostWeb3Connection);
    await assert.isRejected(smartContractManager.getHashesAndSizesFromEthereum(), Error);
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

    const allHashesPromises = await smartContractManager.getHashesAndSizesFromEthereum();

    await assert.isRejected(
      Promise.all(allHashesPromises),
      Error,
      `event is incorrect: doesn't have a hash or size`,
    );
  });
});
