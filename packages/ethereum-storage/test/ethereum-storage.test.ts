/* eslint-disable spellcheck/spell-checker */

import * as SmartContracts from '@requestnetwork/smart-contracts';
import { StorageTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import { EventEmitter } from 'events';

import EthereumStorage from '../src/ethereum-storage';
import IpfsConnectionError from '../src/ipfs-connection-error';

// tslint:disable:no-magic-numbers

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
  SmartContracts.requestHashSubmitterArtifact.getContractAbi(),
  SmartContracts.requestHashSubmitterArtifact.getAddress('private'),
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

// Define a mock for getPastEvents to be independent of the state of ganache instance
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
        'localhost',
        ipfsGatewayConnection,
        web3Connection,
      );
      await expect(ethereumStorageNotInitialized.getData()).rejects.toThrowError(
        'Ethereum storage must be initialized',
      );
      await expect(ethereumStorageNotInitialized.append('')).rejects.toThrowError(
        'Ethereum storage must be initialized',
      );
      await expect(ethereumStorageNotInitialized.read('')).rejects.toThrowError(
        'Ethereum storage must be initialized',
      );
    });

    it('cannot initialize if ipfs node not reachable', async () => {
      const ethereumStorageNotInitialized: EthereumStorage = new EthereumStorage(
        'localhost',
        invalidHostIpfsGatewayConnection,
        web3Connection,
      );
      await expect(ethereumStorageNotInitialized.initialize()).rejects.toThrowError(
        'IPFS node is not accessible or corrupted: Error: Ipfs id error: Error: getaddrinfo ENOTFOUND nonexistent',
      );
    });
    it('cannot initialize if ipfs node not in the right network', async () => {
      const ethereumStorageWithIpfsBootstrapNodesWrong: EthereumStorage = new EthereumStorage(
        'localhost',
        ipfsGatewayConnection,
        web3Connection,
      );
      ethereumStorageWithIpfsBootstrapNodesWrong.ipfsManager.getBootstrapList = async () => [
        'not findable node',
      ];

      await expect(ethereumStorageWithIpfsBootstrapNodesWrong.initialize()).rejects.toThrowError(
        `The list of bootstrap node in the ipfs config don't match the expected bootstrap nodes`,
      );
    });
    it('cannot initialize if ethereum node not reachable', async () => {
      const ethereumStorageNotInitialized: EthereumStorage = new EthereumStorage(
        'localhost',
        ipfsGatewayConnection,
        invalidHostWeb3Connection,
      );
      await expect(ethereumStorageNotInitialized.initialize()).rejects.toThrowError(
        'Ethereum node is not accessible: Error: Error when trying to reach Web3 provider: Error: Invalid JSON RPC response: ""',
      );
    });

    it('cannot initialize if ethereum node not listening', async () => {
      const ethereumStorageNotInitialized: EthereumStorage = new EthereumStorage(
        'localhost',
        ipfsGatewayConnection,
        web3Connection,
      );

      ethereumStorageNotInitialized.smartContractManager.eth.net.isListening = async () => false;

      await expect(ethereumStorageNotInitialized.initialize()).rejects.toThrowError(
        'Ethereum node is not accessible: Error: The Web3 provider is not listening',
      );
    });
    it('cannot initialize if contracts are not deployed', async () => {
      const ethereumStorageNotInitialized: EthereumStorage = new EthereumStorage(
        'localhost',
        ipfsGatewayConnection,
        web3Connection,
      );

      const invalidHashStorageAddress = '0x0000000000000000000000000000000000000000';
      const invalidHashSubmitterAddress = '0x0000000000000000000000000000000000000000';

      // Initialize smart contract instance
      ethereumStorageNotInitialized.smartContractManager.requestHashStorage = new eth.Contract(
        SmartContracts.requestHashStorageArtifact.getContractAbi(),
        invalidHashStorageAddress,
      );
      ethereumStorageNotInitialized.smartContractManager.requestHashSubmitter = new eth.Contract(
        SmartContracts.requestHashSubmitterArtifact.getContractAbi(),
        invalidHashSubmitterAddress,
      );

      await expect(ethereumStorageNotInitialized.initialize()).rejects.toThrowError(
        'Contracts are not deployed or not well configured:',
      );
    });
  });

  describe('append/read/getData', () => {
    beforeEach(async () => {
      ethereumStorage = new EthereumStorage('localhost', ipfsGatewayConnection, web3Connection);
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
      await expect(ethereumStorage.initialize()).rejects.toThrowError('already initialized');
    });

    it('allows to append a file', async () => {
      jest.useFakeTimers('modern');
      jest.setSystemTime(0);
      const timestamp = Utils.getCurrentTimestampInSecond();
      const result = await ethereumStorage.append(content1);

      const resultExpected: StorageTypes.IAppendResult = Object.assign(new EventEmitter(), {
        content: content1,
        id: hash1,
        meta: {
          ipfs: {
            size: realSize1,
          },
          local: { location: 'localhost' },
          state: StorageTypes.ContentState.PENDING,
          storageType: StorageTypes.StorageSystemType.LOCAL,
          timestamp,
        },
      });
      expect(result).toMatchObject(resultExpected);
      jest.useRealTimers();
    });

    it('cannot append if ipfs add fail', async () => {
      ethereumStorage.ipfsManager.add = () => {
        throw Error('expected error');
      };
      await expect(ethereumStorage.append(content1)).rejects.toThrowError(
        `Ipfs add request error: Error: expected error`,
      );
    });

    it('throws when append and addHashAndSizeToEthereum throws', (done) => {
      ethereumStorage.smartContractManager.addHashAndSizeToEthereum = async (): Promise<
        StorageTypes.IEthereumMetadata
      > => {
        throw Error('fake error');
      };

      expect.assertions(1);
      // tslint:disable-next-line: no-floating-promises
      ethereumStorage.append(content1).then((result) => {
        result
          .on('confirmed', () => {
            fail('addHashAndSizeToEthereum must have thrown');
          })
          .on('error', (error) => {
            expect(error.message).toEqual('fake error');
            done();
          });
      });
    });

    it(`allows to save dataId's Ethereum metadata into the metadata cache when append is called`, async () => {
      await expect(
        ethereumStorage.ethereumMetadataCache.metadataCache.get(hash1),
      ).resolves.toBeUndefined();

      const result = await ethereumStorage.append(content1);
      await expect(ethereumStorage.ethereumMetadataCache.metadataCache.get(hash1)).resolves.toEqual(
        result.meta.ethereum,
      );
    });

    it(`prevents already saved dataId's Ethereum metadata to be erased in the metadata cache when append is called`, async () => {
      await expect(
        ethereumStorage.ethereumMetadataCache.metadataCache.get(hash1),
      ).resolves.toBeUndefined();

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

      result1.on('confirmed', (resultConfirmed1) => {
        result2.on('confirmed', async (resultConfirmed2) => {
          expect(resultConfirmed1).not.toMatchObject(resultConfirmed2);
          await expect(
            ethereumStorage.ethereumMetadataCache.metadataCache.get(hash1),
          ).resolves.toEqual(resultConfirmed1.meta.ethereum);
        });
      });
    });

    it('allows to read a file', async () => {
      // For this test, we don't want to use the ethereum metadata cache
      // We want to force the retrieval of metadata with getPastEvents function
      ethereumStorage.ethereumMetadataCache.saveDataIdMeta = async (_dataId, _meta) => {};

      await ethereumStorage.append(content1);
      const result = await ethereumStorage.read(hash1);

      if (!result.meta.ethereum) {
        fail('result.meta.ethereum does not exist');
        return;
      }

      expect(result.content).toBe(content1);
      expect(result.meta.ipfs).toMatchObject({
        size: realSize1,
      });

      expect(result.meta.ethereum.blockNumber).toEqual(pastEventsMock[0].blockNumber);
      expect(result.meta.ethereum.networkName).toEqual('private');
      expect(result.meta.ethereum.smartContractAddress).toEqual(
        '0x345ca3e014aaf5dca488057592ee47305d9b3e10',
      );
      expect(result.meta.ethereum.blockNumber).toEqual(pastEventsMock[0].blockNumber);
      expect(result.meta.ethereum.blockConfirmation).toBeGreaterThan(1);
      expect(result.meta.ethereum.blockTimestamp).toBeDefined();
    });

    it('cannot read if ipfs read fail', async () => {
      ethereumStorage.ipfsManager.read = () => {
        throw Error('expected error');
      };
      await ethereumStorage.append(content1);
      await expect(ethereumStorage.read(hash1)).rejects.toThrowError(
        `Ipfs read request error: Error: expected error`,
      );
    });

    it('cannot read if ethereumMetadataCache.getDataIdMeta fail', async () => {
      ethereumStorage.ethereumMetadataCache.getDataIdMeta = async () => {
        throw Error('expected error');
      };
      await expect(ethereumStorage.read(content1)).rejects.toThrowError(
        `No content found from this id`,
      );
    });

    it('allows to retrieve all data id (even if pin fail)', async () => {
      ethereumStorage.ipfsManager.pin = () => {
        throw Error('expected error');
      };

      // These contents have to be appended in order to check their size
      await ethereumStorage.append(content1);
      await ethereumStorage.append(content2);
      const { entries } = await ethereumStorage.getData();

      if (!entries[0].meta.ethereum) {
        fail('entries[0].meta.ethereum does not exist');
        return;
      }
      expect(entries[0].meta.ipfs).toMatchObject({
        size: realSize1,
      });
      expect(entries[0].meta.ethereum.blockNumber).toEqual(pastEventsMock[0].blockNumber);
      expect(entries[0].meta.ethereum.networkName).toEqual('private');
      expect(entries[0].meta.ethereum.smartContractAddress).toEqual(
        '0x345ca3e014aaf5dca488057592ee47305d9b3e10',
      );
      expect(entries[0].meta.ethereum.blockNumber).toEqual(pastEventsMock[0].blockNumber);
      expect(entries[0].meta.ethereum.blockConfirmation).toBeGreaterThanOrEqual(1);
      expect(entries[0].meta.ethereum.blockTimestamp).toBeDefined();

      if (!entries[1].meta.ethereum) {
        fail('entries[1].meta.ethereum does not exist');
        return;
      }
      expect(entries[1].meta.ipfs).toMatchObject({
        size: realSize1,
      });
      expect(entries[1].meta.ethereum.blockNumber).toEqual(pastEventsMock[1].blockNumber);
      expect(entries[1].meta.ethereum.networkName).toEqual('private');
      expect(entries[1].meta.ethereum.smartContractAddress).toEqual(
        '0x345ca3e014aaf5dca488057592ee47305d9b3e10',
      );
      expect(entries[1].meta.ethereum.blockNumber).toEqual(pastEventsMock[1].blockNumber);
      expect(entries[1].meta.ethereum.blockConfirmation).toBeGreaterThanOrEqual(1);
      expect(entries[1].meta.ethereum.blockTimestamp).toBeDefined();

      if (!entries[2].meta.ethereum) {
        fail('entries[2].meta.ethereum does not exist');
        return;
      }

      expect(entries[2].meta.ipfs).toMatchObject({
        size: realSize2,
      });
      expect(entries[2].meta.ethereum.blockNumber).toEqual(pastEventsMock[2].blockNumber);
      expect(entries[2].meta.ethereum.networkName).toEqual('private');
      expect(entries[2].meta.ethereum.smartContractAddress).toEqual(
        '0x345ca3e014aaf5dca488057592ee47305d9b3e10',
      );
      expect(entries[2].meta.ethereum.blockNumber).toEqual(pastEventsMock[2].blockNumber);
      expect(entries[2].meta.ethereum.blockConfirmation).toBeGreaterThanOrEqual(1);
      expect(entries[2].meta.ethereum.blockTimestamp).toBeDefined();

      expect(entries.map(({ id }) => id)).toMatchObject([hash1, hash1, hash2]);
    });

    it('allows to retrieve all data', async () => {
      // For this test, we don't want to use the ethereum metadata cache
      // We want to force the retrieval of metadata with getPastEvents function
      ethereumStorage.ethereumMetadataCache.saveDataIdMeta = async (_dataId, _meta) => {};

      // These contents have to be appended in order to check their size
      await ethereumStorage.append(content1);
      await ethereumStorage.append(content2);
      const { entries } = await ethereumStorage.getData();

      if (!entries[0].meta.ethereum) {
        fail('entries[0].meta.ethereum does not exist');
        return;
      }
      expect(entries[0].meta.ipfs).toMatchObject({
        size: realSize1,
      });
      expect(entries[0].meta.ethereum.blockNumber).toEqual(pastEventsMock[0].blockNumber);
      expect(entries[0].meta.ethereum.networkName).toEqual('private');
      expect(entries[0].meta.ethereum.smartContractAddress).toEqual(
        '0x345ca3e014aaf5dca488057592ee47305d9b3e10',
      );
      expect(entries[0].meta.ethereum.blockNumber).toEqual(pastEventsMock[0].blockNumber);
      expect(entries[0].meta.ethereum.blockConfirmation).toBeGreaterThanOrEqual(1);
      expect(entries[0].meta.ethereum.blockTimestamp).toBeDefined();

      if (!entries[1].meta.ethereum) {
        fail('entries[1].meta.ethereum does not exist');
        return;
      }
      expect(entries[1].meta.ipfs).toMatchObject({
        size: realSize1,
      });
      expect(entries[1].meta.ethereum.blockNumber).toEqual(pastEventsMock[0].blockNumber);
      expect(entries[1].meta.ethereum.networkName).toEqual('private');
      expect(entries[1].meta.ethereum.smartContractAddress).toEqual(
        '0x345ca3e014aaf5dca488057592ee47305d9b3e10',
      );
      expect(entries[1].meta.ethereum.blockNumber).toEqual(pastEventsMock[0].blockNumber);
      expect(entries[1].meta.ethereum.blockConfirmation).toBeGreaterThanOrEqual(1);
      expect(entries[1].meta.ethereum.blockTimestamp).toBeDefined();

      if (!entries[2].meta.ethereum) {
        fail('entries[2].meta.ethereum does not exist');
        return;
      }
      expect(entries[2].meta.ipfs).toMatchObject({
        size: realSize2,
      });
      expect(entries[2].meta.ethereum.blockNumber).toEqual(pastEventsMock[2].blockNumber);
      expect(entries[2].meta.ethereum.networkName).toEqual('private');
      expect(entries[2].meta.ethereum.smartContractAddress).toEqual(
        '0x345ca3e014aaf5dca488057592ee47305d9b3e10',
      );
      expect(entries[2].meta.ethereum.blockNumber).toEqual(pastEventsMock[2].blockNumber);
      expect(entries[2].meta.ethereum.blockConfirmation).toBeGreaterThanOrEqual(1);
      expect(entries[2].meta.ethereum.blockTimestamp).toBeDefined();

      expect(entries.map(({ content }) => content)).toMatchObject([content1, content1, content2]);
      expect(entries.map(({ id }) => id)).toMatchObject([hash1, hash1, hash2]);
    });

    it('doest get meta data if the fees are too low', async () => {
      // For this test, we don't want to use the ethereum metadata cache
      // We want to force the retrieval of metadata with getPastEvents function
      ethereumStorage.ethereumMetadataCache.saveDataIdMeta = async (_dataId, _meta) => {};
      ethereumStorage.smartContractManager.getEntriesFromEthereum = async (): Promise<
        StorageTypes.IEthereumEntriesWithLastTimestamp
      > => {
        return {
          ethereumEntries: [
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
            },
          ],
          lastTimestamp: 0,
        };
      };

      const result = await ethereumStorage.getData();
      expect(result.entries.length).toBe(0);
    });

    it('append and read with no parameter should throw an error', async () => {
      await expect(ethereumStorage.append('')).rejects.toThrowError('No content provided');
      await expect(ethereumStorage.read('')).rejects.toThrowError('No id provided');
    });

    it('append and read on an invalid ipfs gateway should throw an error', async () => {
      await expect(
        ethereumStorage.updateIpfsGateway(invalidHostIpfsGatewayConnection),
      ).rejects.toThrowError(
        'IPFS node is not accessible or corrupted: Error: Ipfs id error: Error: getaddrinfo ENOTFOUND nonexistent',
      );
    });

    it('failed getContentLength from ipfs-manager in append and read functions should throw an error', async () => {
      // To test this case, we create a mock for getContentLength of the ipfs manager that always throws an error
      ethereumStorage.ipfsManager.getContentLength = async (_hash) => {
        throw Error('Any error in getContentLength');
      };
      await expect(ethereumStorage.append(content1)).rejects.toThrowError(
        'Ipfs get length request error',
      );
    });

    it('append content with an invalid web3 connection should throw an error', async () => {
      await expect(
        ethereumStorage.updateEthereumNetwork(invalidHostWeb3Connection),
      ).rejects.toThrowError(
        'Ethereum node is not accessible: Error: Error when trying to reach Web3 provider: Error: Invalid JSON RPC response: ""',
      );
    });

    it('getData should throw an error when data from getEntriesFromEthereum are incorrect', async () => {
      // Mock getEntriesFromEthereum of smartContractManager to return unexpected promise value
      ethereumStorage.smartContractManager.getEntriesFromEthereum = (): Promise<any> => {
        return Promise.resolve({
          ethereumEntries: [
            {
              feesParameters: { contentSize: 10 },
              meta: {} as StorageTypes.IEthereumMetadata,
            } as StorageTypes.IEthereumEntry,
          ],
          lastTimestamp: 0,
        });
      };
      await expect(ethereumStorage.getData()).rejects.toThrowError(
        'The event log has no hash or feesParameters',
      );

      // Test with no meta
      ethereumStorage.smartContractManager.getEntriesFromEthereum = (): Promise<
        StorageTypes.IEthereumEntriesWithLastTimestamp
      > => {
        return Promise.resolve({
          ethereumEntries: [
            {
              feesParameters: { contentSize: 10 },
              hash: '0xad',
            } as StorageTypes.IEthereumEntry,
          ],
          lastTimestamp: 0,
        });
      };

      await expect(ethereumStorage.getData()).rejects.toThrowError('The event log has no metadata');
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
          fail('result.meta.ethereum does not exist');
          return;
        }
        expect(result.content).toBe(content[index]);
        expect(result.meta.ipfs).toMatchObject({
          size: realSizes[index],
        });

        expect(result.meta.ethereum.blockNumber).toEqual(pastEventsMock[index + 1].blockNumber);
        expect(result.meta.ethereum.networkName).toEqual('private');
        expect(result.meta.ethereum.smartContractAddress).toEqual(
          '0x345ca3e014aaf5dca488057592ee47305d9b3e10',
        );
        expect(result.meta.ethereum.blockNumber).toEqual(pastEventsMock[index + 1].blockNumber);
        expect(result.meta.ethereum.blockConfirmation).toBeGreaterThanOrEqual(1);
        expect(result.meta.ethereum.blockTimestamp).toBeDefined();
      });
    });

    it('allows to IPFS pin a list of hashes', async () => {
      const spy = jest.fn().mockReturnValue(Promise.resolve(['']));
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

      expect(spy).toHaveBeenCalledTimes(1);

      hashes = new Array(200).fill(hash1);
      await ethereumStorage.pinDataToIPFS(hashes, pinConfig);
      expect(spy).toHaveBeenCalledTimes(3);
    });

    it('allows to read hash on IPFS with retries', async () => {
      // Mock to test IPFS read retry
      ethereumStorage.smartContractManager.getEntriesFromEthereum = (): Promise<
        StorageTypes.IEthereumEntriesWithLastTimestamp
      > => {
        return Promise.resolve({
          ethereumEntries: [
            {
              feesParameters: { contentSize: 10 },
              hash: '0x0',
              meta: {},
            } as StorageTypes.IEthereumEntry,
            {
              feesParameters: { contentSize: 10 },
              hash: '0x1',
              meta: {},
            } as StorageTypes.IEthereumEntry,
            {
              feesParameters: { contentSize: 10 },
              hash: '0x2',
              meta: {},
            } as StorageTypes.IEthereumEntry,
            {
              feesParameters: { contentSize: 10 },
              hash: '0x3',
              meta: {},
            } as StorageTypes.IEthereumEntry,
            {
              feesParameters: { contentSize: 10 },
              hash: '0x4',
              meta: {},
            } as StorageTypes.IEthereumEntry,
            {
              feesParameters: { contentSize: 10 },
              hash: '0x5',
              meta: {},
            } as StorageTypes.IEthereumEntry,
            {
              feesParameters: { contentSize: 10 },
              hash: '0x6',
              meta: {},
            } as StorageTypes.IEthereumEntry,
          ],
          lastTimestamp: 0,
        });
      };

      // Store how many time we tried to read a specific hash
      const hashTryCount: any = {};

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
            fail(`ipfsManager.read() unrocognized hash: ${hash}`);
        }

        throw Error('expected error');
      };

      await ethereumStorage.getData();

      // Check how many time we tried to get hashes
      expect(hashTryCount).toMatchObject({
        '0x0': 1,
        '0x1': 1,
        '0x2': 1,
        '0x3': 1,
        '0x4': 2,
        '0x5': 2,
        '0x6': 2,
      });
    });

    it('getData returns an empty array if no hash was found', async () => {
      ethereumStorage.smartContractManager.requestHashStorage.getPastEvents = () => [];
      const result = await ethereumStorage.getData({ from: 10000, to: 10001 });
      expect(result.entries).toMatchObject([]);
      expect(typeof result.lastTimestamp).toBe('number');
    });
  });

  describe('getIgnoredData', () => {
    it('cannot get ignored data if not initialized', async () => {
      ethereumStorage = new EthereumStorage('localhost', ipfsGatewayConnection, web3Connection);
      await expect(ethereumStorage.getIgnoredData()).rejects.toThrowError(
        'Ethereum storage must be initialized',
      );
    });
    it('can get ignored data', async () => {
      ethereumStorage = new EthereumStorage('localhost', ipfsGatewayConnection, web3Connection);
      await ethereumStorage.initialize();

      ethereumStorage.ignoredDataIds.getDataIdsToRetry = async (): Promise<
        StorageTypes.IEthereumEntry[]
      > => [
        {
          error: {
            message: 'Ipfs read request response error: test purpose',
            type: StorageTypes.ErrorEntries.IPFS_CONNECTION_ERROR,
          },
          feesParameters: {
            contentSize: 3,
          },
          hash: 'hConnectionError',
          meta: { blockTimestamp: 123 } as any,
        },
      ];

      ethereumStorage.ipfsManager.read = jest.fn(
        async (_hash: string): Promise<StorageTypes.IIpfsObject> => ({
          content: 'ok',
          ipfsLinks: [],
          ipfsSize: 2,
        }),
      );

      const entries = await ethereumStorage.getIgnoredData();
      // 'config wrong'
      expect(entries.length).toBe(1);
      // 'config wrong'
      expect(entries[0]).toEqual({
        content: 'ok',
        id: 'hConnectionError',
        meta: {
          ethereum: {
            blockTimestamp: 123,
          },
          ipfs: {
            size: 2,
          },
          state: 'confirmed',
          storageType: 'ethereumIpfs',
          timestamp: 123,
        },
      });
    });
    it('can get ignored data even if empty', async () => {
      ethereumStorage = new EthereumStorage('localhost', ipfsGatewayConnection, web3Connection);
      await ethereumStorage.initialize();

      const entries = await ethereumStorage.getIgnoredData();
      // 'config wrong'
      expect(entries.length).toBe(0);
    });
  });

  describe('_getStatus()', () => {
    it('can get status', async () => {
      ethereumStorage = new EthereumStorage('localhost', ipfsGatewayConnection, web3Connection);
      await ethereumStorage.initialize();
      await ethereumStorage.append(content1);
      await ethereumStorage.getData();

      const status = await ethereumStorage._getStatus();
      // 'config wrong'
      expect(status.dataIds.count).toBeGreaterThanOrEqual(0);
      // 'config wrong'
      expect(status.ignoredDataIds.count).toBeGreaterThanOrEqual(0);
      // 'config wrong'
      expect(status.ethereum).toEqual({
        creationBlockNumberHashStorage: 0,
        currentProvider: 'http://localhost:8545',
        hashStorageAddress: '0x345ca3e014aaf5dca488057592ee47305d9b3e10',
        hashSubmitterAddress: '0xf25186b5081ff5ce73482ad761db0eb0d25abfbf',
        maxConcurrency: 5,
        maxRetries: undefined,
        networkName: 'private',
        retryDelay: undefined,
      });
      // tslint:disable-next-line:no-unused-expression
      // 'config wrong'
      expect(status.ipfs).toBeDefined();
    }, 10000);
  });
});
