import 'mocha';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { StorageTypes } from '@requestnetwork/types';
import EthereumMetadataCache from '../src/ethereum-metadata-cache';
import SmartContractManager from '../src/smart-contract-manager';

const spies = require('chai-spies');
chai.use(spies);
chai.use(chaiAsPromised);
const expect = chai.expect;
const sandbox = chai.spy.sandbox();

let ethereumMetadataCache: EthereumMetadataCache;

const ethereumMetadataExample1: StorageTypes.IEthereumMetadata = {
  blockConfirmation: 3,
  blockNumber: 0,
  blockTimestamp: 1000,
  networkName: 'ropsten',
  smartContractAddress: '0xaaa',
  transactionHash: '0xbbb',
};

const ethereumMetadataExample2: StorageTypes.IEthereumMetadata = {
  blockConfirmation: 5,
  blockNumber: 0,
  blockTimestamp: 4000,
  networkName: 'rinkeby',
  smartContractAddress: '0xccc',
  transactionHash: '0xddd',
};

const ethereumMetadataExample3: StorageTypes.IEthereumMetadata = {
  blockConfirmation: 3,
  blockNumber: 0,
  blockTimestamp: 300,
  networkName: 'kovan',
  smartContractAddress: '0xeee',
  transactionHash: '0xfff',
};

const hashExample1: string = '0xabc';
const hashExample2: string = '0xefg';
const hashExample3: string = '0xhij';

let smartContractManager: SmartContractManager;

const getMetaFromEthereumMock = async (hash: string): Promise<StorageTypes.IEthereumMetadata> => {
  const ret = ({
    '0xabc': ethereumMetadataExample1,
    '0xefg': ethereumMetadataExample2,
    '0xhij': ethereumMetadataExample3,
  } as any)[hash];
  return ret;
};

describe('EthereumMetadataCache', () => {
  beforeEach(() => {
    sandbox.restore();
    smartContractManager = new SmartContractManager();
    ethereumMetadataCache = new EthereumMetadataCache(smartContractManager);
  });

  it('allows to save metadata', async () => {
    await expect(ethereumMetadataCache.metadataCache.get(hashExample1)).to.eventually.be.undefined;
    await expect(ethereumMetadataCache.metadataCache.get(hashExample2)).to.eventually.be.undefined;
    await expect(ethereumMetadataCache.metadataCache.get(hashExample3)).to.eventually.be.undefined;

    await ethereumMetadataCache.saveDataIdMeta(hashExample1, ethereumMetadataExample1);
    await ethereumMetadataCache.saveDataIdMeta(hashExample2, ethereumMetadataExample2);
    await ethereumMetadataCache.saveDataIdMeta(hashExample3, ethereumMetadataExample3);

    await expect(ethereumMetadataCache.metadataCache.get(hashExample1)).to.eventually.deep.equal(
      ethereumMetadataExample1,
    );
    await expect(ethereumMetadataCache.metadataCache.get(hashExample2)).to.eventually.deep.equal(
      ethereumMetadataExample2,
    );
    await expect(ethereumMetadataCache.metadataCache.get(hashExample3)).to.eventually.deep.equal(
      ethereumMetadataExample3,
    );
  });

  it('allows to retrieve saved metadata', async () => {
    const spy = sandbox.on(smartContractManager, 'getMetaFromEthereum');

    await ethereumMetadataCache.saveDataIdMeta(hashExample1, ethereumMetadataExample1);
    await ethereumMetadataCache.saveDataIdMeta(hashExample2, ethereumMetadataExample2);
    await ethereumMetadataCache.saveDataIdMeta(hashExample3, ethereumMetadataExample3);

    const readReturn1 = await ethereumMetadataCache.getDataIdMeta(hashExample1);
    const readReturn2 = await ethereumMetadataCache.getDataIdMeta(hashExample2);
    const readReturn3 = await ethereumMetadataCache.getDataIdMeta(hashExample3);

    await expect(readReturn1).to.deep.equal(ethereumMetadataExample1);
    await expect(readReturn2).to.deep.equal(ethereumMetadataExample2);
    await expect(readReturn3).to.deep.equal(ethereumMetadataExample3);

    await expect(spy).to.have.not.been.called;
  });

  it('allows to save when trying to read new metadata', async () => {
    smartContractManager.getMetaFromEthereum = getMetaFromEthereumMock;

    const spy = sandbox.on(smartContractManager, 'getMetaFromEthereum');

    await expect(ethereumMetadataCache.metadataCache.get(hashExample1)).to.eventually.be.undefined;
    await expect(ethereumMetadataCache.metadataCache.get(hashExample2)).to.eventually.be.undefined;
    await expect(ethereumMetadataCache.metadataCache.get(hashExample3)).to.eventually.be.undefined;

    const readReturn1 = await ethereumMetadataCache.getDataIdMeta(hashExample1);
    await expect(readReturn1).to.deep.equal(ethereumMetadataExample1);
    await expect(spy).to.have.been.called.once;
    await expect(ethereumMetadataCache.metadataCache.get(hashExample2)).to.eventually.be.undefined;
    await expect(ethereumMetadataCache.metadataCache.get(hashExample3)).to.eventually.be.undefined;

    const readReturn2 = await ethereumMetadataCache.getDataIdMeta(hashExample2);
    await expect(readReturn2).to.deep.equal(ethereumMetadataExample2);
    await expect(spy).to.have.been.called.twice;
    await expect(ethereumMetadataCache.metadataCache.get(hashExample3)).to.eventually.be.undefined;

    const readReturn3 = await ethereumMetadataCache.getDataIdMeta(hashExample3);
    await expect(readReturn3).to.deep.equal(ethereumMetadataExample3);
    await expect(spy).to.have.been.called.exactly(3);
  });

  it('cannot erase metadata of dataId with new metadata', async () => {
    await ethereumMetadataCache.saveDataIdMeta(hashExample1, ethereumMetadataExample1);
    await ethereumMetadataCache.saveDataIdMeta(hashExample1, ethereumMetadataExample2);

    await expect(ethereumMetadataCache.metadataCache.get(hashExample1)).to.eventually.deep.equal(
      ethereumMetadataExample1,
    );
  });
});
