import 'mocha';

import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';

import EthereumBlocks from '../../src/lib/ethereum-blocks';

const chai = require('chai');
const spies = require('chai-spies');

// Extends chai for promises
chai.use(chaiAsPromised);
chai.use(spies);
const expect = chai.expect;
const sandbox = chai.spy.sandbox();

// tslint:disable:no-magic-numbers
const mockBlocksEthereum = [
  7,
  100,
  209,
  306,
  401,
  509,
  606,
  703,
  803,
  907,
  1004,
  1109,
  1202,
  1302,
  1403,
  1504,
  1604,
  1708,
  1802,
  1906,
  2002,
  2103,
  2203,
  2308,
  2402,
  2501,
  2600,
  2700,
  2806,
  2908,
  3009,
  3100,
  3206,
  3303,
  3400,
  3500,
  3606,
  3702,
  3805,
  3900,
  4008,
  4104,
  4206,
  4305,
  4401,
  4504,
  4609,
  4707,
  4809,
  4909,
  5000,
  5109,
  5205,
  5305,
  5407,
  5509,
  5604,
  5704,
  5805,
  5903,
  6003,
  6101,
  6207,
  6309,
  6402,
  6501,
  6601,
  6702,
  6808,
  6902,
  7009,
  7106,
  7207,
  7306,
  7401,
  7502,
  7605,
  7701,
  7800,
  7908,
  8009,
  8104,
  8202,
  8302,
  8407,
  8502,
  8602,
  8706,
  8802,
  8903,
  9006,
  9104,
  9205,
  9300,
  9406,
  9503,
  9603,
  9700,
  9807,
  9906,
];

const mockEth = {
  getBlock: (i: number): any => {
    return mockBlocksEthereum[i] ? { timestamp: mockBlocksEthereum[i] } : undefined;
  },
  // tslint:disable-next-line:typedef
  getBlockNumber: () => 99,
};

// tslint:disable:no-unused-expression
// tslint:disable:object-literal-sort-keys
describe('EthereumBlocks', () => {
  afterEach(() => {
    sandbox.restore();
  });

  describe('getLastBlockNumber', () => {
    it('getLastBlockNumber', async () => {
      const ethereumBlocks = new EthereumBlocks(mockEth, 10, 0, 0);
      expect(await ethereumBlocks.getLastBlockNumber()).to.be.equal(99);
    });

    it('respects the delay', async () => {
      // Generates a random block number
      const randEth = {
        getBlockNumber: (): number => Math.floor(Math.random() * 10e7),
      };
      const ethereumBlocks = new EthereumBlocks(randEth, 10, 0, 0, 10000);

      const clock = sinon.useFakeTimers();

      const block1 = await ethereumBlocks.getLastBlockNumber();
      const block2 = await ethereumBlocks.getLastBlockNumber();
      expect(block1).to.be.equal(block2);

      clock.tick(10000);

      const block3 = await ethereumBlocks.getLastBlockNumber();
      expect(block3).to.not.be.equal(block1);
      sinon.restore();
    });

    it('always fetches new with 0 as delay', async () => {
      // Generates a random block number
      const randEth = {
        getBlockNumber: (): number => Math.floor(Math.random() * 10e7),
      };
      const ethereumBlocks = new EthereumBlocks(randEth, 10, 0, 0, 0);

      const clock = sinon.useFakeTimers();

      const block1 = await ethereumBlocks.getLastBlockNumber();
      const block2 = await ethereumBlocks.getLastBlockNumber();
      expect(block1).to.not.be.equal(block2);
      clock.tick(10000);

      const block3 = await ethereumBlocks.getLastBlockNumber();
      expect(block3).to.not.be.equal(block1);
      sinon.restore();
    });
  });

  describe('getSecondLastBlockNumber', () => {
    it('getSecondLastBlockNumber', async () => {
      sandbox.on(mockEth, ['getBlock', 'getBlockNumber']);
      const ethereumBlocks = new EthereumBlocks(mockEth, 10, 0, 0);
      expect(await ethereumBlocks.getSecondLastBlockNumber()).to.be.equal(98);
    });
  });

  describe('getBlockTimestamp', () => {
    it('can getBlockTimestamp', async () => {
      const ethereumBlocks = new EthereumBlocks(mockEth, 10, 0, 0);
      expect(await ethereumBlocks.getBlockTimestamp(50)).to.be.equal(mockBlocksEthereum[50]);
    });

    it('can getBlockTimestamp without asking twice the same block number', async () => {
      sandbox.on(mockEth, ['getBlock']);
      const ethereumBlocks = new EthereumBlocks(mockEth, 10, 0, 0);
      expect(await ethereumBlocks.getBlockTimestamp(50)).to.be.equal(mockBlocksEthereum[50]);
      expect(await ethereumBlocks.getBlockTimestamp(50)).to.be.equal(mockBlocksEthereum[50]);
      expect(mockEth.getBlock).to.have.been.called.once;
    });

    it('cannot getBlockTimestamp of a block that doest not exist', async () => {
      const ethereumBlocks = new EthereumBlocks(mockEth, 10, 0, 0);
      await expect(
        ethereumBlocks.getBlockTimestamp(101),
        'should throw',
      ).to.eventually.be.rejectedWith(`block 101 not found`);
    });
  });

  describe('getConfirmationNumber', () => {
    it('can getConfirmationNumber', async () => {
      const ethereumBlocks = new EthereumBlocks(mockEth, 10, 0, 0);
      expect(await ethereumBlocks.getConfirmationNumber(30)).to.be.equal(69);
    });

    it('must throw an error when eth crash', async () => {
      const mockEthThrower = {
        // tslint:disable-next-line:typedef
        getBlockNumber: () => {
          throw Error('Exception to be caught');
        },
      };

      const ethereumBlocks = new EthereumBlocks(mockEthThrower, 10, 0, 0);
      await expect(
        ethereumBlocks.getConfirmationNumber(11),
        'should throw',
      ).to.eventually.be.rejectedWith(
        `Error getting the confirmation number: Error: Exception to be caught`,
      );
    });
  });

  describe('getBlockNumbersFromTimestamp', () => {
    it('getBlockNumbersFromTimestamp', async () => {
      const ethereumBlocks = new EthereumBlocks(mockEth, 10, 0, 0);
      expect(await ethereumBlocks.getBlockNumbersFromTimestamp(3190)).to.be.deep.equal({
        blockBefore: 31,
        blockAfter: 32,
      });
    });

    it('getBlockNumbersFromTimestamp some already known block', async () => {
      const ethereumBlocks = new EthereumBlocks(mockEth, 10, 0, 0);
      await ethereumBlocks.getBlockTimestamp(15);
      await ethereumBlocks.getBlockTimestamp(20);
      await ethereumBlocks.getBlockTimestamp(60);
      await ethereumBlocks.getBlockTimestamp(65);
      expect(await ethereumBlocks.getBlockNumbersFromTimestamp(3190)).to.be.deep.equal({
        blockBefore: 31,
        blockAfter: 32,
      });
      expect(await ethereumBlocks.getBlockNumbersFromTimestamp(3009)).to.be.deep.equal({
        blockAfter: 30,
        blockBefore: 30,
      });
    });

    it('getBlockNumbersFromTimestamp of edge case', async () => {
      const ethereumBlocks = new EthereumBlocks(mockEth, 10, 0, 0);

      // first dichotomy research
      expect(await ethereumBlocks.getBlockNumbersFromTimestamp(4401)).to.be.deep.equal({
        blockAfter: 44,
        blockBefore: 44,
      });

      // before anything
      expect(await ethereumBlocks.getBlockNumbersFromTimestamp(-1)).to.be.deep.equal({
        blockAfter: 10,
        blockBefore: 10,
      });

      // before first block
      expect(await ethereumBlocks.getBlockNumbersFromTimestamp(1)).to.be.deep.equal({
        blockAfter: 10,
        blockBefore: 10,
      });

      // at first block
      expect(await ethereumBlocks.getBlockNumbersFromTimestamp(1004)).to.be.deep.equal({
        blockAfter: 10,
        blockBefore: 10,
      });

      // at last block
      // getBlockNumbersFromTimestamp should return the second last block number
      expect(await ethereumBlocks.getBlockNumbersFromTimestamp(9906)).to.be.deep.equal({
        blockAfter: 98,
        blockBefore: 98,
      });

      // with timestamp over last block
      // getBlockNumbersFromTimestamp should return the second last block number
      expect(await ethereumBlocks.getBlockNumbersFromTimestamp(99999)).to.be.deep.equal({
        blockAfter: 98,
        blockBefore: 98,
      });
    });
  });
});
