import 'mocha';

import { StorageTypes } from '@requestnetwork/types';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import EthereumBlocks from '../../src/lib/ethereum-blocks';
import SmartContractManager from '../../src/lib/smart-contract-manager';

import * as artifactsRequestHashStorageUtils from '../../src/lib/artifacts-request-hash-storage-utils';
import * as artifactsRequestHashSubmitterUtils from '../../src/lib/artifacts-request-hash-submitter-utils';

// tslint:disable:no-magic-numbers

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

// Contract instance necessary to get event logs
const web3Utils = require('web3-utils');
const web3Eth = require('web3-eth');
const eth = new web3Eth(provider);

const invalidHostProvider = new web3HttpProvider('http://nonexistent:8545');
const invalidHostWeb3Connection: StorageTypes.IWeb3Connection = {
  networkId: StorageTypes.EthereumNetwork.PRIVATE,
  timeout: 1000,
  web3Provider: invalidHostProvider,
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
const realSizeBytes32Hex = web3Utils.padLeft(web3Utils.toHex(realSize), 64);
const fakeSize = 50;
const fakeSizeBytes32Hex = web3Utils.padLeft(web3Utils.toHex(fakeSize), 64);
const otherContent =
  'This is not a hash but but we should be able to add any content into Ethereum, the gas cost for the transaction will be higher';
const otherSize = 100000;
const otherSizeBytes32Hex = web3Utils.padLeft(web3Utils.toHex(otherSize), 64);

const contractHashStorage = new eth.Contract(
  artifactsRequestHashStorageUtils.getContractAbi(),
  artifactsRequestHashStorageUtils.getAddress('private'),
);

const contractHashSubmitter = new eth.Contract(
  artifactsRequestHashSubmitterUtils.getContractAbi(),
  artifactsRequestHashSubmitterUtils.getAddress('private'),
);
const addressRequestHashSubmitter = contractHashSubmitter._address;

// Define a mock for getPastEvents to be independant of the state of ganache instance
const pastEventsMock = [
  {
    blockNumber: 0,
    event: 'NewHash',
    returnValues: {
      feesParameters: realSizeBytes32Hex,
      hash: hashStr,
      hashSubmitter: addressRequestHashSubmitter,
    },
    transactionHash: '0xa',
  },
  // This event has an invalid size but it should not be ignored in smart contract manager
  {
    blockNumber: 4,
    event: 'NewHash',
    returnValues: {
      feesParameters: fakeSizeBytes32Hex,
      hash: hashStr,
      hashSubmitter: addressRequestHashSubmitter,
    },
    transactionHash: '0xb',
  },
  // We can add any data into the storage
  {
    blockNumber: 6,
    event: 'NewHash',
    returnValues: {
      feesParameters: otherSizeBytes32Hex,
      hash: otherContent,
      hashSubmitter: addressRequestHashSubmitter,
    },
    transactionHash: '0xc',
  },
  // We can add any data into the storage
  {
    blockNumber: 9,
    event: 'NewHash',
    returnValues: {
      feesParameters: otherSizeBytes32Hex,
      hash: otherContent,
      hashSubmitter: addressRequestHashSubmitter,
    },
  },
];

// Return past event from pastEventsMock from fromBlock
const getPastEventsMock = async (info: {
  event: string;
  fromBlock: number;
  toBlock: number | string;
}): Promise<any> => {
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
      feesParameters: fakeSizeBytes32Hex,
    },
    transactionHash: '0xb',
  },
];
// tslint:disable-next-line:typedef
const getBadEventsMock = async () => badEventsMock;

// This getPastEvents mock simulates cases where there could be more than 1000 results for a block interval
// txPerBlock describes number of result for each block between 0 and 9
// If the block interval provided by info contains more than 1000 results
// 'query returned more than 1000 results' is thrown
const noMoreThan1000ResultsGetPastEventsMock = async (
  txPerBlock: number[],
  info: {
    event: string;
    fromBlock: number;
    toBlock: number;
  },
): Promise<any[]> => {
  // Compute the total number of result
  let totalResult = 0;
  for (let i = info.fromBlock; i < info.toBlock; i++) {
    totalResult += txPerBlock[i];
  }

  // Return the concerned error if total number of result is more than 1000
  if (totalResult > 1000) {
    // We use totalResult for the message because we should handle any
    // "query returned more than XXX results" error message
    throw Error(`query returned more than ${totalResult} results`);
  }

  // Same return as previous mock
  return pastEventsMock.filter(
    block => block.blockNumber >= info.fromBlock && block.blockNumber <= info.toBlock,
  );
};

// Configuration where the recursive call of getPastEvents never happens
const txPerBlockConfiguration1 = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

// Configuration where the recursive call of getPastEvents happens for each range of more than 1 block
const txPerBlockConfiguration2 = [999, 999, 999, 999, 999, 999, 999, 999, 999, 999];

// Various configurations
const txPerBlockConfiguration3 = [999, 999, 999, 999, 999, 1, 1, 1, 1, 1];
const txPerBlockConfiguration4 = [1, 1, 1, 1, 1, 999, 999, 999, 999, 999];
const txPerBlockConfiguration5 = [100, 200, 150, 400, 1, 670, 300, 140, 20, 600];

// tslint:disable:no-magic-numbers
describe('SmartContractManager', () => {
  beforeEach(() => {
    smartContractManager = new SmartContractManager(web3Connection);
    smartContractManager.requestHashStorage.getPastEvents = getPastEventsMock;
    smartContractManager.ethereumBlocks.retryDelay = 0;
    smartContractManager.ethereumBlocks.maxRetries = 0;
  });

  it('getMainAccount should return the main account', async () => {
    const accounts = await eth.getAccounts();
    const mainAccount = await smartContractManager.getMainAccount();

    assert.equal(mainAccount, accounts[0]);
  });

  it('allows to add hashes to contractHashStorage', async () => {
    await smartContractManager.addHashAndSizeToEthereum(hashStr, { contentSize: realSize });

    // Reading last event log
    const events = await contractHashStorage.getPastEvents({
      event: 'NewHash',
      toBlock: 'latest',
    });

    // Only one event is parsed
    assert.equal(events.length, 1);

    assert.equal(events[0].returnValues.hash, hashStr);
    assert.equal(events[0].returnValues.hashSubmitter, addressRequestHashSubmitter);
    assert.equal(events[0].returnValues.feesParameters, realSizeBytes32Hex);
  });

  it('allows to add other content than hash to contractHashStorage', async () => {
    await smartContractManager.addHashAndSizeToEthereum(otherContent, { contentSize: otherSize });
    // Reading last event log
    const events = await contractHashStorage.getPastEvents({
      event: 'NewHash',
      toBlock: 'latest',
    });

    // Only one event is parsed
    assert.equal(events.length, 1);

    assert.equal(events[0].returnValues.hash, otherContent);
    assert.equal(events[0].returnValues.hashSubmitter, addressRequestHashSubmitter);
    assert.equal(events[0].returnValues.feesParameters, otherSizeBytes32Hex);
  });

  it('cannot add hash to ethereum if block of the transaction is not fetchable within 23 confirmation', async () => {
    // This mock is used to ensure any block is never fetchable
    smartContractManager.eth.getBlock = (_block: any): any => {
      return null;
    };

    await assert.isRejected(
      smartContractManager.addHashAndSizeToEthereum(hashStr, { contentSize: otherSize }),
      Error,
      'Maximum number of confirmation reached',
    );
  }).timeout(30000);

  it('allows to get all hashes', async () => {
    // Inside getBlockNumberFromNumberOrString, this function will be only called with parameter 'latest'
    // For getPastEventsMock the number of the latest block is 9
    smartContractManager.eth.getBlock = (_block: any): any => {
      return {
        number: 9,
      };
    };
    const { data: allHashesAndSizes } = await smartContractManager.getHashesAndSizesFromEthereum();

    assert.equal(allHashesAndSizes.length, 4);
    assert.equal(allHashesAndSizes[0].hash, hashStr);
    assert.deepEqual(allHashesAndSizes[0].feesParameters, { contentSize: realSize });
    assert.equal(allHashesAndSizes[1].hash, hashStr);
    assert.deepEqual(allHashesAndSizes[1].feesParameters, { contentSize: fakeSize });
    assert.equal(allHashesAndSizes[2].hash, otherContent);
    assert.deepEqual(allHashesAndSizes[2].feesParameters, { contentSize: otherSize });
    assert.equal(allHashesAndSizes[3].hash, otherContent);
    assert.deepEqual(allHashesAndSizes[3].feesParameters, { contentSize: otherSize });
  });

  it('allows to get all hashes with options from', async () => {
    // Inside getBlockNumberFromNumberOrString, this function will be only called with parameter 'latest'
    // For getPastEventsMock the number of the latest block is 9
    const mockBlocksEthereum = [7, 30, 45, 87, 100, 150, 209, 234, 290, 306];
    const mockEth = {
      getBlock: (i: number): any => {
        return mockBlocksEthereum[i] ? { timestamp: mockBlocksEthereum[i] } : undefined;
      },
      // tslint:disable-next-line:typedef
      getBlockNumber: () => 9,
    };
    smartContractManager.ethereumBlocks = new EthereumBlocks(mockEth, 1, 0, 0);
    smartContractManager.ethereumBlocks.getBlock = (_block: any): any => {
      return {
        number: 9,
      };
    };

    const { data: allHashesAndSizes } = await smartContractManager.getHashesAndSizesFromEthereum({
      from: 299,
    });

    assert.equal(allHashesAndSizes.length, 1);
    assert.equal(allHashesAndSizes[0].hash, otherContent);
    assert.deepEqual(allHashesAndSizes[0].feesParameters, { contentSize: otherSize });
  });

  it('allows to get all hashes with options to', async () => {
    const mockBlocksEthereum = [7, 30, 45, 87, 100, 150, 209, 234, 290, 306];
    const mockEth = {
      getBlock: (i: number): any => {
        return mockBlocksEthereum[i] ? { timestamp: mockBlocksEthereum[i] } : undefined;
      },
      // tslint:disable-next-line:typedef
      getBlockNumber: () => 9,
    };
    smartContractManager.ethereumBlocks = new EthereumBlocks(mockEth, 1, 0, 0);

    const { data: allHashesAndSizes } = await smartContractManager.getHashesAndSizesFromEthereum({
      to: 299,
    });
    assert.equal(allHashesAndSizes.length, 3);
    assert.equal(allHashesAndSizes[0].hash, hashStr);
    assert.deepEqual(allHashesAndSizes[0].feesParameters, { contentSize: realSize });
    assert.equal(allHashesAndSizes[1].hash, hashStr);
    assert.deepEqual(allHashesAndSizes[1].feesParameters, { contentSize: fakeSize });
    assert.equal(allHashesAndSizes[2].hash, otherContent);
    assert.deepEqual(allHashesAndSizes[2].feesParameters, { contentSize: otherSize });
  });

  it('allows to get all hashes with options from and to', async () => {
    const mockBlocksEthereum = [7, 30, 45, 87, 100, 150, 209, 234, 290, 306];
    const mockEth = {
      getBlock: (i: number): any => {
        return mockBlocksEthereum[i] ? { timestamp: mockBlocksEthereum[i] } : undefined;
      },
      // tslint:disable-next-line:typedef
      getBlockNumber: () => 9,
    };
    smartContractManager.ethereumBlocks = new EthereumBlocks(mockEth, 1, 0, 0);

    const { data: allHashesAndSizes } = await smartContractManager.getHashesAndSizesFromEthereum({
      from: 10,
      to: 299,
    });
    assert.equal(allHashesAndSizes.length, 2);
    assert.equal(allHashesAndSizes[0].hash, hashStr);
    assert.deepEqual(allHashesAndSizes[0].feesParameters, { contentSize: fakeSize });
    assert.equal(allHashesAndSizes[1].hash, otherContent);
    assert.deepEqual(allHashesAndSizes[1].feesParameters, { contentSize: otherSize });
  });

  it('getMainAccount with a invalid host provider should throw a timeout error', async () => {
    smartContractManager = new SmartContractManager(invalidHostWeb3Connection);
    await assert.isRejected(smartContractManager.getMainAccount(), Error);
  });

  it('addHashAndSizeToEthereum with a invalid host provider should throw a timeout error', async () => {
    smartContractManager = new SmartContractManager(invalidHostWeb3Connection);
    await assert.isRejected(
      smartContractManager.addHashAndSizeToEthereum(hashStr, { contentSize: realSize }),
      Error,
    );
  });

  it('getHashesAndSizesFromEthereum with a invalid host provider should throw a timeout error', async () => {
    smartContractManager = new SmartContractManager(invalidHostWeb3Connection);
    smartContractManager.ethereumBlocks.retryDelay = 0;
    smartContractManager.ethereumBlocks.maxRetries = 0;
    await assert.isRejected(smartContractManager.getHashesAndSizesFromEthereum(), Error);
  });

  it('getHashesAndSizesFromEthereum rejects if fromBlock is larger than toBlock', async () => {
    const mockBlocksEthereum = [7, 30, 45, 87, 100, 150, 209, 234, 290, 306];
    const mockEth = {
      getBlock: (i: number): any => {
        return mockBlocksEthereum[i] ? { timestamp: mockBlocksEthereum[i] } : undefined;
      },
      // tslint:disable-next-line:typedef
      getBlockNumber: () => 9,
    };
    smartContractManager.ethereumBlocks = new EthereumBlocks(mockEth, 1, 0, 0);

    await assert.isRejected(
      smartContractManager.getHashesAndSizesFromEthereum({
        from: 200,
        to: 10,
      }),
      Error,
      'toBlock must be larger than fromBlock',
    );
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

  it('getAddress in artifactsRequestHashStorageUtils with a invalid host network should throw an error', async () => {
    assert.throws(
      () => artifactsRequestHashStorageUtils.getAddress('nonexistent'),
      Error,
      'No deployment for network',
    );
  });

  it('getAddress in artifactsRequestHashSubmitterUtils with a invalid host network should throw an error', async () => {
    assert.throws(
      () => artifactsRequestHashSubmitterUtils.getAddress('nonexistent'),
      Error,
      'No deployment for network',
    );
  });

  it('getCreationBlockNumber in artifactsRequestHashSubmitterUtils', async () => {
    assert.equal(artifactsRequestHashSubmitterUtils.getCreationBlockNumber('private'), 1);
  });

  it('allows to getMetaFromEthereum() a hash', async () => {
    // Inside getBlockNumberFromNumberOrString, this function will be only called with parameter 'latest'
    // For getPastEventsMock the number of the latest block is 3
    smartContractManager.eth.getBlock = (_block: any): any => {
      return {
        number: 3,
      };
    };
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

    const allHashesPromise = smartContractManager.getHashesAndSizesFromEthereum();

    await assert.isRejected(
      allHashesPromise,
      Error,
      `event is incorrect: doesn't have a hash or feesParameters`,
    );
  });

  it('allows to get hashes and sizes from events on block interval with over 1000 results', async () => {
    smartContractManager.eth.getBlock = (_block: any): any => {
      return {
        number: 9,
      };
    };

    smartContractManager.requestHashStorage.getPastEvents = (info: {
      event: string;
      fromBlock: number;
      toBlock: number;
    }): Promise<any[]> => noMoreThan1000ResultsGetPastEventsMock(txPerBlockConfiguration1, info);

    let { data: allHashesAndSizes } = await smartContractManager.getHashesAndSizesFromEthereum();

    assert.equal(allHashesAndSizes.length, 4);
    assert.equal(allHashesAndSizes[0].hash, hashStr);
    assert.deepEqual(allHashesAndSizes[0].feesParameters, { contentSize: realSize });
    assert.equal(allHashesAndSizes[1].hash, hashStr);
    assert.deepEqual(allHashesAndSizes[1].feesParameters, { contentSize: fakeSize });
    assert.equal(allHashesAndSizes[2].hash, otherContent);
    assert.deepEqual(allHashesAndSizes[2].feesParameters, { contentSize: otherSize });
    assert.equal(allHashesAndSizes[3].hash, otherContent);
    assert.deepEqual(allHashesAndSizes[3].feesParameters, { contentSize: otherSize });

    smartContractManager.requestHashStorage.getPastEvents = (info: {
      event: string;
      fromBlock: number;
      toBlock: number;
    }): Promise<any[]> => noMoreThan1000ResultsGetPastEventsMock(txPerBlockConfiguration2, info);

    allHashesAndSizes = (await smartContractManager.getHashesAndSizesFromEthereum()).data;

    assert.equal(allHashesAndSizes.length, 4);
    assert.equal(allHashesAndSizes[0].hash, hashStr);
    assert.deepEqual(allHashesAndSizes[0].feesParameters, { contentSize: realSize });
    assert.equal(allHashesAndSizes[1].hash, hashStr);
    assert.deepEqual(allHashesAndSizes[1].feesParameters, { contentSize: fakeSize });
    assert.equal(allHashesAndSizes[2].hash, otherContent);
    assert.deepEqual(allHashesAndSizes[2].feesParameters, { contentSize: otherSize });
    assert.equal(allHashesAndSizes[3].hash, otherContent);
    assert.deepEqual(allHashesAndSizes[3].feesParameters, { contentSize: otherSize });

    smartContractManager.requestHashStorage.getPastEvents = (info: {
      event: string;
      fromBlock: number;
      toBlock: number;
    }): Promise<any[]> => noMoreThan1000ResultsGetPastEventsMock(txPerBlockConfiguration3, info);

    allHashesAndSizes = (await smartContractManager.getHashesAndSizesFromEthereum()).data;

    assert.equal(allHashesAndSizes.length, 4);
    assert.equal(allHashesAndSizes[0].hash, hashStr);
    assert.deepEqual(allHashesAndSizes[0].feesParameters, { contentSize: realSize });
    assert.equal(allHashesAndSizes[1].hash, hashStr);
    assert.deepEqual(allHashesAndSizes[1].feesParameters, { contentSize: fakeSize });
    assert.equal(allHashesAndSizes[2].hash, otherContent);
    assert.deepEqual(allHashesAndSizes[2].feesParameters, { contentSize: otherSize });
    assert.equal(allHashesAndSizes[3].hash, otherContent);
    assert.deepEqual(allHashesAndSizes[3].feesParameters, { contentSize: otherSize });

    smartContractManager.requestHashStorage.getPastEvents = (info: {
      event: string;
      fromBlock: number;
      toBlock: number;
    }): Promise<any[]> => noMoreThan1000ResultsGetPastEventsMock(txPerBlockConfiguration4, info);

    allHashesAndSizes = (await smartContractManager.getHashesAndSizesFromEthereum()).data;

    assert.equal(allHashesAndSizes.length, 4);
    assert.equal(allHashesAndSizes[0].hash, hashStr);
    assert.deepEqual(allHashesAndSizes[0].feesParameters, { contentSize: realSize });
    assert.equal(allHashesAndSizes[1].hash, hashStr);
    assert.deepEqual(allHashesAndSizes[1].feesParameters, { contentSize: fakeSize });
    assert.equal(allHashesAndSizes[2].hash, otherContent);
    assert.deepEqual(allHashesAndSizes[2].feesParameters, { contentSize: otherSize });
    assert.equal(allHashesAndSizes[3].hash, otherContent);
    assert.deepEqual(allHashesAndSizes[3].feesParameters, { contentSize: otherSize });

    smartContractManager.requestHashStorage.getPastEvents = (info: {
      event: string;
      fromBlock: number;
      toBlock: number;
    }): Promise<any[]> => noMoreThan1000ResultsGetPastEventsMock(txPerBlockConfiguration5, info);

    allHashesAndSizes = (await smartContractManager.getHashesAndSizesFromEthereum()).data;

    assert.equal(allHashesAndSizes.length, 4);
    assert.equal(allHashesAndSizes[0].hash, hashStr);
    assert.deepEqual(allHashesAndSizes[0].feesParameters, { contentSize: realSize });
    assert.equal(allHashesAndSizes[1].hash, hashStr);
    assert.deepEqual(allHashesAndSizes[1].feesParameters, { contentSize: fakeSize });
    assert.equal(allHashesAndSizes[2].hash, otherContent);
    assert.deepEqual(allHashesAndSizes[2].feesParameters, { contentSize: otherSize });
    assert.equal(allHashesAndSizes[3].hash, otherContent);
    assert.deepEqual(allHashesAndSizes[3].feesParameters, { contentSize: otherSize });
  });

  it('cannot get hashes and sizes from events with incorrect toBlock option', async () => {
    await assert.isRejected(
      smartContractManager.getHashesAndSizesFromEvents(0, 'incorrectBlockDescriber'),
      Error,
      `Cannot get the number of the block`,
    );
  });

  it('cannot get hashes and sizes from events with toBlock option containing no number', async () => {
    smartContractManager.eth.getBlock = (block: any): any => {
      if (block === 'pending') {
        return {
          transactions: ['0x10', '0x20', '0x30'],
        };
      }
      return null;
    };

    await assert.isRejected(
      smartContractManager.getHashesAndSizesFromEvents(0, 'pending'),
      Error,
      `Block pending has no number`,
    );
  });
});
