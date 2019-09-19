import 'mocha';

import { StorageTypes } from '@requestnetwork/types';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import EthereumStorage from '../../src/lib/ethereum-storage';
import IpfsConnectionError from '../../src/lib/ipfs-connection-error';

import * as artifactsRequestHashStorageUtils from '../../src/lib/artifacts-request-hash-storage-utils';
import * as artifactsRequestHashSubmitterUtils from '../../src/lib/artifacts-request-hash-submitter-utils';

// tslint:disable:no-magic-numbers

// Extends chai for promises
chai.use(chaiAsPromised);
const assert = chai.assert;
const expect = chai.expect;

const spies = require('chai-spies');
chai.use(spies);

const web3HttpProvider = require('web3-providers-http');
const web3Utils = require('web3-utils');

const ipfsGatewayConnection: StorageTypes.IIpfsGatewayConnection = {
  host: 'localhost',
  port: 5001,
  protocol: StorageTypes.IpfsGatewayProtocol.HTTP,
  timeout: 1000,
};

const invalidHostIpfsGatewayConnection: StorageTypes.IIpfsGatewayConnection = {
  host: 'nonexistent',
  port: 5001,
  protocol: StorageTypes.IpfsGatewayProtocol.HTTP,
  timeout: 1000,
};

const provider = new web3HttpProvider('http://localhost:8545');
const web3Connection: StorageTypes.IWeb3Connection = {
  networkId: StorageTypes.EthereumNetwork.PRIVATE,
  timeout: 1000,
  web3Provider: provider,
};

const invalidHostNetworkProvider = new web3HttpProvider('http://nonexistentnetwork:8545');
const invalidHostWeb3Connection: StorageTypes.IWeb3Connection = {
  networkId: StorageTypes.EthereumNetwork.PRIVATE,
  timeout: 1000,
  web3Provider: invalidHostNetworkProvider,
};

const web3Eth = require('web3-eth');
const eth = new web3Eth(provider);

const contractHashSubmitter = new eth.Contract(
  artifactsRequestHashSubmitterUtils.getContractAbi(),
  artifactsRequestHashSubmitterUtils.getAddress('private'),
);
const addressRequestHashSubmitter = contractHashSubmitter._address;

let ethereumStorage: EthereumStorage;

const content1 = 'this is a little test !';
const hash1 = 'QmNXA5DyFZkdf4XkUT81nmJSo3nS2bL25x7YepxeoDa6tY';
const realSize1 = 29;
const realSize1Bytes32Hex = web3Utils.padLeft(web3Utils.toHex(realSize1), 64);
const fakeSize1 = 50;
const fakeSize1Bytes32Hex = web3Utils.padLeft(web3Utils.toHex(fakeSize1), 64);

const content2 = 'content\nwith\nspecial\ncharacters\n';
const hash2 = 'QmQj8fQ9T16Ddrxfij5eyRnxXKTVxRXyQuazYnezt9iZpy';
const realSize2 = 38;
const realSize2Bytes32Hex = web3Utils.padLeft(web3Utils.toHex(realSize2), 64);
const fakeSize2 = 0;
const fakeSize2Bytes32Hex = web3Utils.padLeft(web3Utils.toHex(fakeSize2), 64);

// Define a mock for getPastEvents to be independant of the state of ganache instance
const pastEventsMock = [
  {
    blockNumber: 1,
    event: 'NewHash',
    returnValues: {
      feesParameters: realSize1Bytes32Hex,
      hash: hash1,
      hashSubmitter: addressRequestHashSubmitter,
    },
    transactionHash: '0xa',
  },
  {
    blockNumber: 1,
    event: 'NewHash',
    returnValues: {
      feesParameters: fakeSize1Bytes32Hex,
      hash: hash1,
      hashSubmitter: addressRequestHashSubmitter,
    },
    transactionHash: '0xa',
  },
  {
    blockNumber: 2,
    event: 'NewHash',
    returnValues: {
      feesParameters: realSize2Bytes32Hex,
      hash: hash2,
      hashSubmitter: addressRequestHashSubmitter,
    },
    transactionHash: '0xb',
  },
  {
    blockNumber: 3,
    event: 'NewHash',
    returnValues: {
      feesParameters: fakeSize2Bytes32Hex,
      hash: hash2,
      hashSubmitter: addressRequestHashSubmitter,
    },
    transactionHash: '0xc',
  },
  {
    blockNumber: 3,
    event: 'NewHash',
    returnValues: {
      feesParameters: fakeSize2Bytes32Hex,
      hash: 'notAHash',
      hashSubmitter: addressRequestHashSubmitter,
    },
    transactionHash: '0xc',
  },
];
// tslint:disable:typedef
const getPastEventsMock = () => pastEventsMock;

describe('EthereumStorage', () => {
  describe('initialize', () => {
    it('cannot use functions when not initialized', async () => {
      const ethereumStorageNotInitialized: EthereumStorage = new EthereumStorage(
        ipfsGatewayConnection,
        web3Connection,
      );
      await expect(ethereumStorageNotInitialized.getDataId()).to.eventually.rejectedWith(
        'Ethereum storage must be initialized',
      );
      await expect(ethereumStorageNotInitialized.getData()).to.eventually.rejectedWith(
        'Ethereum storage must be initialized',
      );
      await expect(ethereumStorageNotInitialized.append('')).to.eventually.rejectedWith(
        'Ethereum storage must be initialized',
      );
      await expect(ethereumStorageNotInitialized.read('')).to.eventually.rejectedWith(
        'Ethereum storage must be initialized',
      );
    });

    it('cannot initialize if ipfs node not reachable', async () => {
      const ethereumStorageNotInitialized: EthereumStorage = new EthereumStorage(
        invalidHostIpfsGatewayConnection,
        web3Connection,
      );
      await expect(ethereumStorageNotInitialized.initialize()).to.eventually.rejectedWith(
        'IPFS node is not accessible or corrupted: Error: Ipfs id error: Error: getaddrinfo ENOTFOUND nonexistent nonexistent:5001',
      );
    });
    it('cannot initialize if ipfs node not in the right network', async () => {
      const ethereumStorageWithIpfsBootstrapNodesWrong: EthereumStorage = new EthereumStorage(
        ipfsGatewayConnection,
        web3Connection,
      );
      ethereumStorageWithIpfsBootstrapNodesWrong.ipfsManager.getBootstrapList = async () => [
        'not findable node',
      ];

      await expect(
        ethereumStorageWithIpfsBootstrapNodesWrong.initialize(),
      ).to.eventually.rejectedWith(
        `The list of bootstrap node in the ipfs config don't match the expected bootstrap nodes`,
      );
    });
    it('cannot initialize if ethereum node not reachable', async () => {
      const ethereumStorageNotInitialized: EthereumStorage = new EthereumStorage(
        ipfsGatewayConnection,
        invalidHostWeb3Connection,
      );
      await expect(ethereumStorageNotInitialized.initialize()).to.eventually.rejectedWith(
        'Ethereum node is not accessible: Error: Error when trying to reach Web3 provider: Error: Invalid JSON RPC response: ""',
      );
    });

    it('cannot initialize if ethereum node not listening', async () => {
      const ethereumStorageNotInitialized: EthereumStorage = new EthereumStorage(
        ipfsGatewayConnection,
        web3Connection,
      );

      ethereumStorageNotInitialized.smartContractManager.eth.net.isListening = async () => false;

      await expect(ethereumStorageNotInitialized.initialize()).to.eventually.rejectedWith(
        'Ethereum node is not accessible: Error: The Web3 provider is not listening',
      );
    });
    it('cannot initialize if contracts are not deployed', async () => {
      const ethereumStorageNotInitialized: EthereumStorage = new EthereumStorage(
        ipfsGatewayConnection,
        web3Connection,
      );

      const invalidHashStorageAddress = '0x0000000000000000000000000000000000000000';
      const invalidHashSubmitterAddress = '0x0000000000000000000000000000000000000000';

      // Initialize smart contract instance
      ethereumStorageNotInitialized.smartContractManager.requestHashStorage = new eth.Contract(
        artifactsRequestHashStorageUtils.getContractAbi(),
        invalidHashStorageAddress,
      );
      ethereumStorageNotInitialized.smartContractManager.requestHashSubmitter = new eth.Contract(
        artifactsRequestHashSubmitterUtils.getContractAbi(),
        invalidHashSubmitterAddress,
      );

      await expect(ethereumStorageNotInitialized.initialize()).to.eventually.rejectedWith(
        'Contracts are not deployed or not well configured:',
      );
    });
  });

  describe('append/read/getDataId/getData', () => {
    beforeEach(async () => {
      ethereumStorage = new EthereumStorage(ipfsGatewayConnection, web3Connection);
      await ethereumStorage.initialize();

      ethereumStorage.smartContractManager.requestHashStorage.getPastEvents = getPastEventsMock;
      ethereumStorage.smartContractManager.addHashAndSizeToEthereum = async (): Promise<
        StorageTypes.IEthereumMetadata
      > => {
        return {
          blockConfirmation: 10,
          blockNumber: 10,
          blockTimestamp: 1545816416,
          cost: '110',
          fee: '100',
          gasFee: '10',
          networkName: 'private',
          smartContractAddress: '0x345ca3e014aaf5dca488057592ee47305d9b3e10',
          transactionHash: '0x7c45c575a54893dc8dc7230e3044e1de5c8714cd0a1374cf3a66378c639627a3',
        };
      };
    });

    it('cannot be initialized twice', async () => {
      await expect(ethereumStorage.initialize()).to.eventually.rejectedWith('already initialized');
    });

    it('allows to append a file', async () => {
      const result = await ethereumStorage.append(content1);

      if (!result.meta.ethereum) {
        assert.fail('result.meta.ethereum does not exist');
        return;
      }

      const resultExpected: StorageTypes.IOneDataIdAndMeta = {
        meta: {
          ethereum: {
            blockConfirmation: 10,
            blockNumber: 10,
            blockTimestamp: 1545816416,
            cost: '110',
            fee: '100',
            gasFee: '10',
            networkName: 'private',
            smartContractAddress: '0x345ca3e014aaf5dca488057592ee47305d9b3e10',
            transactionHash: '0x7c45c575a54893dc8dc7230e3044e1de5c8714cd0a1374cf3a66378c639627a3',
          },
          ipfs: {
            size: realSize1,
          },
          storageType: StorageTypes.StorageSystemType.ETHEREUM_IPFS,
          timestamp: 1545816416,
        },
        result: { dataId: hash1 },
      };
      assert.deepEqual(result, resultExpected);
    });

    it('cannot append if ipfs add fail', async () => {
      ethereumStorage.ipfsManager.add = () => {
        throw Error('expected error');
      };
      await expect(ethereumStorage.append(content1)).to.eventually.rejectedWith(
        `Ipfs add request error: Error: expected error`,
      );
    });

    it('throws when append and addHashAndSizeToEthereum throws', async () => {
      ethereumStorage.smartContractManager.addHashAndSizeToEthereum = async (): Promise<
        StorageTypes.IEthereumMetadata
      > => {
        throw Error('fake error');
      };
      try {
        await ethereumStorage.append(content1);
        assert.fail('result.meta.ethereum does not exist');
      } catch (e) {
        assert.equal(e.message, 'Smart contract error: Error: fake error');
      }
    });
    it(`allows to save dataId's Ethereum metadata into the metadata cache when append is called`, async () => {
      await expect(ethereumStorage.ethereumMetadataCache.metadataCache.get(hash1)).to.eventually.be
        .undefined;

      const result = await ethereumStorage.append(content1);
      await expect(
        ethereumStorage.ethereumMetadataCache.metadataCache.get(hash1),
      ).to.eventually.deep.equal(result.meta.ethereum);
    });

    it(`prevents already saved dataId's Ethereum metadata to be erased in the metadata cache when append is called`, async () => {
      await expect(ethereumStorage.ethereumMetadataCache.metadataCache.get(hash1)).to.eventually.be
        .undefined;

      const result1 = await ethereumStorage.append(content1);

      // Ethereum metadata is determined by the return data of addHashAndSizeToEthereum
      // We change the return data of this function to ensure the second call of append contain different metadata
      ethereumStorage.smartContractManager.addHashAndSizeToEthereum = async (): Promise<
        StorageTypes.IEthereumMetadata
      > => {
        return {
          blockConfirmation: 20,
          blockNumber: 11,
          blockTimestamp: 1545816416,
          cost: '110',
          fee: '1',
          gasFee: '100',
          networkName: 'private',
          smartContractAddress: '0x345ca3e014aaf5dca488057592ee47305d9b3e10',
          transactionHash: '0x7c45c575a54893dc8dc7230e3044e1de5c8714cd0a1374cf3a66378c639627a3',
        };
      };

      const result2 = await ethereumStorage.append(content1);

      await assert.notDeepEqual(result1, result2);
      await expect(
        ethereumStorage.ethereumMetadataCache.metadataCache.get(hash1),
      ).to.eventually.deep.equal(result1.meta.ethereum);
    });

    it('allows to read a file', async () => {
      // For this test, we don't want to use the ethereum metadata cache
      // We want to force the retrieval of metadata with getPastEvents function
      ethereumStorage.ethereumMetadataCache.saveDataIdMeta = async (_dataId, _meta) => {};

      await ethereumStorage.append(content1);
      const result = await ethereumStorage.read(hash1);

      if (!result.meta.ethereum) {
        assert.fail('result.meta.ethereum does not exist');
        return;
      }

      assert.deepEqual(result.result, { content: content1 });
      assert.deepEqual(result.meta.ipfs, {
        size: realSize1,
      });

      assert.equal(result.meta.ethereum.blockNumber, pastEventsMock[0].blockNumber);
      assert.equal(result.meta.ethereum.networkName, 'private');
      assert.equal(
        result.meta.ethereum.smartContractAddress,
        '0x345ca3e014aaf5dca488057592ee47305d9b3e10',
      );
      assert.equal(result.meta.ethereum.blockNumber, pastEventsMock[0].blockNumber);
      assert.isAtLeast(result.meta.ethereum.blockConfirmation, 1);
      assert.exists(result.meta.ethereum.blockTimestamp);
    });

    it('cannot read if ipfs read fail', async () => {
      ethereumStorage.ipfsManager.read = () => {
        throw Error('expected error');
      };
      await ethereumStorage.append(content1);
      await expect(ethereumStorage.read(hash1)).to.eventually.rejectedWith(
        `Ipfs read request error: Error: expected error`,
      );
    });

    it('cannot read if ethereumMetadataCache.getDataIdMeta fail', async () => {
      ethereumStorage.ethereumMetadataCache.getDataIdMeta = async () => {
        throw Error('expected error');
      };
      await expect(ethereumStorage.read(content1)).to.eventually.rejectedWith(
        `Ethereum meta read request error: Error: expected error`,
      );
    });

    it('allows to retrieve all data id (even if pin fail)', async () => {
      ethereumStorage.ipfsManager.pin = () => {
        throw Error('expected error');
      };

      // These contents have to be appended in order to check their size
      await ethereumStorage.append(content1);
      await ethereumStorage.append(content2);
      const result = await ethereumStorage.getDataId();

      if (!result.meta.metaData[0].ethereum) {
        assert.fail('result.meta.metaData[0].ethereum does not exist');
        return;
      }
      assert.deepEqual(result.meta.metaData[0].ipfs, {
        size: realSize1,
      });
      assert.equal(result.meta.metaData[0].ethereum.blockNumber, pastEventsMock[0].blockNumber);
      assert.equal(result.meta.metaData[0].ethereum.networkName, 'private');
      assert.equal(
        result.meta.metaData[0].ethereum.smartContractAddress,
        '0x345ca3e014aaf5dca488057592ee47305d9b3e10',
      );
      assert.equal(result.meta.metaData[0].ethereum.blockNumber, pastEventsMock[0].blockNumber);
      assert.isAtLeast(result.meta.metaData[0].ethereum.blockConfirmation, 1);
      assert.exists(result.meta.metaData[0].ethereum.blockTimestamp);

      if (!result.meta.metaData[1].ethereum) {
        assert.fail('result.meta.metaData[1].ethereum does not exist');
        return;
      }
      assert.deepEqual(result.meta.metaData[1].ipfs, {
        size: realSize1,
      });
      assert.equal(result.meta.metaData[1].ethereum.blockNumber, pastEventsMock[1].blockNumber);
      assert.equal(result.meta.metaData[1].ethereum.networkName, 'private');
      assert.equal(
        result.meta.metaData[1].ethereum.smartContractAddress,
        '0x345ca3e014aaf5dca488057592ee47305d9b3e10',
      );
      assert.equal(result.meta.metaData[1].ethereum.blockNumber, pastEventsMock[1].blockNumber);
      assert.isAtLeast(result.meta.metaData[1].ethereum.blockConfirmation, 1);
      assert.exists(result.meta.metaData[1].ethereum.blockTimestamp);

      if (!result.meta.metaData[2].ethereum) {
        assert.fail('result.meta.metaData[2].ethereum does not exist');
        return;
      }

      assert.deepEqual(result.meta.metaData[2].ipfs, {
        size: realSize2,
      });
      assert.equal(result.meta.metaData[2].ethereum.blockNumber, pastEventsMock[2].blockNumber);
      assert.equal(result.meta.metaData[2].ethereum.networkName, 'private');
      assert.equal(
        result.meta.metaData[2].ethereum.smartContractAddress,
        '0x345ca3e014aaf5dca488057592ee47305d9b3e10',
      );
      assert.equal(result.meta.metaData[2].ethereum.blockNumber, pastEventsMock[2].blockNumber);
      assert.isAtLeast(result.meta.metaData[2].ethereum.blockConfirmation, 1);
      assert.exists(result.meta.metaData[2].ethereum.blockTimestamp);

      assert.deepEqual(result.result, { dataIds: [hash1, hash1, hash2] });
    });

    it('allows to retrieve all data', async () => {
      // For this test, we don't want to use the ethereum metadata cache
      // We want to force the retrieval of metadata with getPastEvents function
      ethereumStorage.ethereumMetadataCache.saveDataIdMeta = async (_dataId, _meta) => {};

      // These contents have to be appended in order to check their size
      await ethereumStorage.append(content1);
      await ethereumStorage.append(content2);
      const result = await ethereumStorage.getData();

      if (!result.meta.metaData[0].ethereum) {
        assert.fail('result.meta.metaData[0].ethereum does not exist');
        return;
      }
      assert.deepEqual(result.meta.metaData[0].ipfs, {
        size: realSize1,
      });
      assert.equal(result.meta.metaData[0].ethereum.blockNumber, pastEventsMock[0].blockNumber);
      assert.equal(result.meta.metaData[0].ethereum.networkName, 'private');
      assert.equal(
        result.meta.metaData[0].ethereum.smartContractAddress,
        '0x345ca3e014aaf5dca488057592ee47305d9b3e10',
      );
      assert.equal(result.meta.metaData[0].ethereum.blockNumber, pastEventsMock[0].blockNumber);
      assert.isAtLeast(result.meta.metaData[0].ethereum.blockConfirmation, 1);
      assert.exists(result.meta.metaData[0].ethereum.blockTimestamp);

      if (!result.meta.metaData[1].ethereum) {
        assert.fail('result.meta.metaData[1].ethereum does not exist');
        return;
      }
      assert.deepEqual(result.meta.metaData[1].ipfs, {
        size: realSize1,
      });
      assert.equal(result.meta.metaData[1].ethereum.blockNumber, pastEventsMock[0].blockNumber);
      assert.equal(result.meta.metaData[1].ethereum.networkName, 'private');
      assert.equal(
        result.meta.metaData[1].ethereum.smartContractAddress,
        '0x345ca3e014aaf5dca488057592ee47305d9b3e10',
      );
      assert.equal(result.meta.metaData[1].ethereum.blockNumber, pastEventsMock[0].blockNumber);
      assert.isAtLeast(result.meta.metaData[1].ethereum.blockConfirmation, 1);
      assert.exists(result.meta.metaData[1].ethereum.blockTimestamp);

      if (!result.meta.metaData[2].ethereum) {
        assert.fail('result.meta.metaData[2].ethereum does not exist');
        return;
      }
      assert.deepEqual(result.meta.metaData[2].ipfs, {
        size: realSize2,
      });
      assert.equal(result.meta.metaData[2].ethereum.blockNumber, pastEventsMock[2].blockNumber);
      assert.equal(result.meta.metaData[2].ethereum.networkName, 'private');
      assert.equal(
        result.meta.metaData[2].ethereum.smartContractAddress,
        '0x345ca3e014aaf5dca488057592ee47305d9b3e10',
      );
      assert.equal(result.meta.metaData[2].ethereum.blockNumber, pastEventsMock[2].blockNumber);
      assert.isAtLeast(result.meta.metaData[2].ethereum.blockConfirmation, 1);
      assert.exists(result.meta.metaData[2].ethereum.blockTimestamp);

      assert.deepEqual(result.result, {
        data: [content1, content1, content2],
        dataIds: [hash1, hash1, hash2],
      });
    });

    it('doest get meta data if the fees are too low', async () => {
      // For this test, we don't want to use the ethereum metadata cache
      // We want to force the retrieval of metadata with getPastEvents function
      ethereumStorage.ethereumMetadataCache.saveDataIdMeta = async (_dataId, _meta) => {};
      ethereumStorage.smartContractManager.getHashesAndSizesFromEthereum = async (): Promise<
        any
      > => {
        return {
          data: [
            {
              feesParameters: { contentSize: 1 },
              hash: hash1,
              meta: {
                blockConfirmation: 1561192254600,
                blockNumber: 1,
                blockTimestamp: 1561191682,
                networkName: 'private',
                smartContractAddress: '0x345ca3e014aaf5dca488057592ee47305d9b3e10',
                transactionHash: '0xa',
              },
              timestamp: 1,
            },
          ],
          meta: {
            lastBlockTimestamp: 0,
          },
        };
      };

      const result = await ethereumStorage.getData();
      expect(result.result.data.length).to.equal(0);
    });

    it('append and read with no parameter should throw an error', async () => {
      await assert.isRejected(ethereumStorage.append(''), Error, 'No content provided');
      await assert.isRejected(ethereumStorage.read(''), Error, 'No id provided');
    });

    it('append and read on an invalid ipfs gateway should throw an error', async () => {
      await expect(
        ethereumStorage.updateIpfsGateway(invalidHostIpfsGatewayConnection),
      ).to.eventually.rejectedWith(
        'IPFS node is not accessible or corrupted: Error: Ipfs id error: Error: getaddrinfo ENOTFOUND nonexistent nonexistent:5001',
      );
    });

    it('failed getContentLength from ipfs-manager in append and read functions should throw an error', async () => {
      // To test this case, we create a mock for getContentLength of the ipfs manager that always throws an error
      ethereumStorage.ipfsManager.getContentLength = async _hash => {
        throw Error('Any error in getContentLength');
      };

      await assert.isRejected(
        ethereumStorage.append(content1),
        Error,
        'Ipfs get length request error',
      );
    });

    it('append content with an invalid web3 connection should throw an error', async () => {
      await expect(
        ethereumStorage.updateEthereumNetwork(invalidHostWeb3Connection),
      ).to.eventually.rejectedWith(
        'Ethereum node is not accessible: Error: Error when trying to reach Web3 provider: Error: Invalid JSON RPC response: ""',
      );
    });

    it('getDataId should throw an error when data from getAllHashesAndSizesFromEthereum are incorrect', async () => {
      // Mock getAllHashesAndSizesFromEthereum of smartContractManager to return unexpected promise value
      ethereumStorage.smartContractManager.getHashesAndSizesFromEthereum = (): Promise<any> => {
        return Promise.resolve({
          data: [
            {
              feesParameters: { contentSize: 10 },
              meta: {} as StorageTypes.IEthereumMetadata,
            } as StorageTypes.IGetAllHashesAndSizes,
          ],
          meta: {
            lastBlockTimestamp: 0,
          },
        });
      };

      await assert.isRejected(
        ethereumStorage.getDataId(),
        Error,
        'The event log has no hash or feesParameters',
      );

      // Test with no meta
      ethereumStorage.smartContractManager.getHashesAndSizesFromEthereum = (): Promise<any> => {
        return Promise.resolve({
          data: [
            {
              feesParameters: { contentSize: 10 },
              hash: '0xad',
            } as StorageTypes.IGetAllHashesAndSizes,
          ],
          meta: {
            lastBlockTimestamp: 0,
          },
        });
      };

      await assert.isRejected(ethereumStorage.getDataId(), Error, 'The event log has no metadata');
    });

    it('allows to read a file', async () => {
      ethereumStorage.ethereumMetadataCache.saveDataIdMeta = async (_dataId, _meta) => {};

      const content = [content1, content2];
      const realSizes = [realSize1, realSize2];

      await ethereumStorage.append(content1);
      await ethereumStorage.append(content2);
      const results = await ethereumStorage.readMany([hash1, hash2]);

      results.forEach((result, index) => {
        if (!result.meta.ethereum) {
          assert.fail('result.meta.ethereum does not exist');
          return;
        }
        assert.deepEqual(result.result, { content: content[index] });
        assert.deepEqual(result.meta.ipfs, {
          size: realSizes[index],
        });

        assert.equal(result.meta.ethereum.blockNumber, pastEventsMock[index + 1].blockNumber);
        assert.equal(result.meta.ethereum.networkName, 'private');
        assert.equal(
          result.meta.ethereum.smartContractAddress,
          '0x345ca3e014aaf5dca488057592ee47305d9b3e10',
        );
        assert.equal(result.meta.ethereum.blockNumber, pastEventsMock[index + 1].blockNumber);
        assert.isAtLeast(result.meta.ethereum.blockConfirmation, 1);
        assert.exists(result.meta.ethereum.blockTimestamp);
      });
    });

    it('allows to IPFS pin a list of hashes', async () => {
      const spy = chai.spy.returns(Promise.resolve(['']));
      ethereumStorage.ipfsManager.pin = spy as (
        hashes: string[],
        overrideTimeout?: number | undefined,
      ) => Promise<string[]>;

      const pinConfig = {
        delayBetweenCalls: 0,
        maxSize: 100,
        timeout: 1000,
      };

      let hashes = new Array(100).fill(hash1);

      await ethereumStorage.pinDataToIPFS(hashes, pinConfig);

      await expect(spy).to.have.been.called.once;

      hashes = new Array(200).fill(hash1);
      await ethereumStorage.pinDataToIPFS(hashes, pinConfig);
      await expect(spy).to.have.been.called.exactly(3);
    });

    it('allows to read hash on IPFS with retries', async () => {
      // Mock to test IPFS read retry
      ethereumStorage.smartContractManager.getHashesAndSizesFromEthereum = (): Promise<any> => {
        return Promise.resolve({
          data: [
            {
              feesParameters: { contentSize: 10 },
              hash: '0x0',
              meta: {},
            } as StorageTypes.IGetAllHashesAndSizes,
            {
              feesParameters: { contentSize: 10 },
              hash: '0x1',
              meta: {},
            } as StorageTypes.IGetAllHashesAndSizes,
            {
              feesParameters: { contentSize: 10 },
              hash: '0x2',
              meta: {},
            } as StorageTypes.IGetAllHashesAndSizes,
            {
              feesParameters: { contentSize: 10 },
              hash: '0x3',
              meta: {},
            } as StorageTypes.IGetAllHashesAndSizes,
            {
              feesParameters: { contentSize: 10 },
              hash: '0x4',
              meta: {},
            } as StorageTypes.IGetAllHashesAndSizes,
            {
              feesParameters: { contentSize: 10 },
              hash: '0x5',
              meta: {},
            } as StorageTypes.IGetAllHashesAndSizes,
            {
              feesParameters: { contentSize: 10 },
              hash: '0x6',
              meta: {},
            } as StorageTypes.IGetAllHashesAndSizes,
          ],
          meta: {
            lastBlockTimestamp: 0,
          },
        });
      };

      // Store how many time we tried to read a specific hash
      const hashTryCount: any = {};

      ethereumStorage.maxIpfsReadRetry = 4;

      // This mock simulates ipfsManager.read() when we try to read the hash on IPFS differente times
      ethereumStorage.ipfsManager.read = async (hash: string) => {
        hashTryCount[hash] ? hashTryCount[hash]++ : (hashTryCount[hash] = 1);

        switch (hash) {
          case '0x0':
            throw new Error(`File size (1) exceeds maximum file size of 0`);
          case '0x1':
            throw new Error('Ipfs object get request response cannot be parsed into JSON format');
          case '0x2':
            throw new Error('Ipfs object get failed');
          case '0x3':
            return {
              content: '0000',
              ipfsSize: 20,
            } as StorageTypes.IIpfsObject;
          case '0x4':
            if (hashTryCount[hash] < 2) {
              throw new IpfsConnectionError('Timeout');
            }

            return {
              content: '0000',
              ipfsSize: 10,
            } as StorageTypes.IIpfsObject;
          case '0x5':
            if (hashTryCount[hash] < 3) {
              throw new IpfsConnectionError('Timeout');
            }

            return {
              content: '0000',
              ipfsSize: 10,
            } as StorageTypes.IIpfsObject;
          case '0x6':
            if (hashTryCount[hash] < 10) {
              throw new IpfsConnectionError('Timeout');
            }

            return {
              content: '0000',
              ipfsSize: 10,
            } as StorageTypes.IIpfsObject;
          default:
            assert.fail(`ipfsManager.read() unrocognized hash: ${hash}`);
        }

        throw Error('expected error');
      };

      await ethereumStorage.getData();

      // Check how many time we tried to get hashes
      assert.deepEqual(hashTryCount, {
        '0x0': 1,
        '0x1': 1,
        '0x2': 1,
        '0x3': 1,
        '0x4': 2,
        '0x5': 3,
        '0x6': 5,
      });
    });
  });
});
