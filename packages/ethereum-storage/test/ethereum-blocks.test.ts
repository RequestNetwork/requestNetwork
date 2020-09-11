import EthereumBlocks from '../src/ethereum-blocks';

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
  getBlock: jest.fn((i: number): any => {
    return mockBlocksEthereum[i] ? { timestamp: mockBlocksEthereum[i] } : undefined;
  }),
  // tslint:disable-next-line:typedef
  getBlockNumber: jest.fn(() => Promise.resolve(99)),
};

// tslint:disable:no-unused-expression
// tslint:disable:object-literal-sort-keys
describe('EthereumBlocks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('getLastBlockNumber', () => {
    it('getLastBlockNumber', async () => {
      const ethereumBlocks = new EthereumBlocks(mockEth, 10, 0, 0);
      expect(await ethereumBlocks.getLastBlockNumber()).toEqual(99);
    });

    // TODO
    it('respects the delay', async () => {
      // Generates a random block number
      const randEth = {
        getBlockNumber: (): number => Math.floor(Math.random() * 10e7),
      };
      const ethereumBlocks = new EthereumBlocks(randEth, 10, 0, 0, 10000);

      jest.useFakeTimers('modern');
      jest.setSystemTime(0);

      const block1 = await ethereumBlocks.getLastBlockNumber();
      const block2 = await ethereumBlocks.getLastBlockNumber();
      expect(block1).toEqual(block2);

      jest.advanceTimersByTime(10000);

      const block3 = await ethereumBlocks.getLastBlockNumber();
      expect(block3).not.toEqual(block1);
      jest.useRealTimers();
    });

    it('always fetches new with 0 as delay', async () => {
      // Generates a random block number
      const randEth = {
        getBlockNumber: (): number => Math.floor(Math.random() * 10e7),
      };
      const ethereumBlocks = new EthereumBlocks(randEth, 10, 0, 0, 0);

      jest.useFakeTimers('modern');
      jest.setSystemTime(0);

      const block1 = await ethereumBlocks.getLastBlockNumber();
      const block2 = await ethereumBlocks.getLastBlockNumber();
      expect(block1).not.toEqual(block2);
      jest.advanceTimersByTime(10000);

      const block3 = await ethereumBlocks.getLastBlockNumber();
      expect(block3).not.toEqual(block1);
      jest.useRealTimers();
    });
  });

  describe('getSecondLastBlockNumber', () => {
    it('getSecondLastBlockNumber', async () => {
      const ethereumBlocks = new EthereumBlocks(mockEth, 10, 0, 0);

      await expect(ethereumBlocks.getSecondLastBlockNumber()).resolves.toEqual(98);
    });
  });

  describe('getBlockTimestamp', () => {
    it('can getBlockTimestamp', async () => {
      const ethereumBlocks = new EthereumBlocks(mockEth, 10, 0, 0);
      expect(await ethereumBlocks.getBlockTimestamp(50)).toEqual(mockBlocksEthereum[50]);
    });

    it('can getBlockTimestamp without asking twice the same block number', async () => {
      const ethereumBlocks = new EthereumBlocks(mockEth, 10, 0, 0);
      expect(await ethereumBlocks.getBlockTimestamp(50)).toEqual(mockBlocksEthereum[50]);
      expect(await ethereumBlocks.getBlockTimestamp(50)).toEqual(mockBlocksEthereum[50]);
      expect(mockEth.getBlock).toHaveBeenCalledTimes(1);
    });

    it('cannot getBlockTimestamp of a block that doest not exist', async () => {
      const ethereumBlocks = new EthereumBlocks(mockEth, 10, 0, 0);
      await expect(ethereumBlocks.getBlockTimestamp(101)).rejects.toThrowError(
        `block 101 not found`,
      );
    });
  });

  describe('getConfirmationNumber', () => {
    it('can getConfirmationNumber', async () => {
      const ethereumBlocks = new EthereumBlocks(mockEth, 10, 0, 0);
      expect(await ethereumBlocks.getConfirmationNumber(30)).toEqual(69);
    });

    it('must throw an error when eth crash', async () => {
      const mockEthThrower = {
        // tslint:disable-next-line:typedef
        getBlockNumber: () => {
          throw Error('Exception to be caught');
        },
      };

      const ethereumBlocks = new EthereumBlocks(mockEthThrower, 10, 0, 0);
      await expect(ethereumBlocks.getConfirmationNumber(11)).rejects.toThrowError(
        `Error getting the confirmation number: Error: Exception to be caught`,
      );
    });
  });

  describe('getBlockNumbersFromTimestamp', () => {
    it('getBlockNumbersFromTimestamp', async () => {
      const ethereumBlocks = new EthereumBlocks(mockEth, 10, 0, 0);
      expect(await ethereumBlocks.getBlockNumbersFromTimestamp(3190)).toMatchObject({
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
      expect(await ethereumBlocks.getBlockNumbersFromTimestamp(3190)).toMatchObject({
        blockBefore: 31,
        blockAfter: 32,
      });
      expect(await ethereumBlocks.getBlockNumbersFromTimestamp(3009)).toMatchObject({
        blockAfter: 30,
        blockBefore: 30,
      });
    });

    it('getBlockNumbersFromTimestamp of edge case', async () => {
      const ethereumBlocks = new EthereumBlocks(mockEth, 10, 0, 0);

      // first dichotomy research
      expect(await ethereumBlocks.getBlockNumbersFromTimestamp(4401)).toMatchObject({
        blockAfter: 44,
        blockBefore: 44,
      });

      // before anything
      expect(await ethereumBlocks.getBlockNumbersFromTimestamp(-1)).toMatchObject({
        blockAfter: 10,
        blockBefore: 10,
      });

      // before first block
      expect(await ethereumBlocks.getBlockNumbersFromTimestamp(1)).toMatchObject({
        blockAfter: 10,
        blockBefore: 10,
      });

      // at first block
      expect(await ethereumBlocks.getBlockNumbersFromTimestamp(1004)).toMatchObject({
        blockAfter: 10,
        blockBefore: 10,
      });

      // at last block
      // getBlockNumbersFromTimestamp should return the second last block number
      expect(await ethereumBlocks.getBlockNumbersFromTimestamp(9906)).toMatchObject({
        blockAfter: 98,
        blockBefore: 98,
      });

      // with timestamp over last block
      // getBlockNumbersFromTimestamp should return the second last block number
      expect(await ethereumBlocks.getBlockNumbersFromTimestamp(99999)).toMatchObject({
        blockAfter: 98,
        blockBefore: 98,
      });
    });
  });
});
