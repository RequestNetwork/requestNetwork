import { estimateGasFees } from '@requestnetwork/utils/src';
import { BigNumber, providers, Wallet } from 'ethers';

jest.setTimeout(10000);

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
const dummyAddress = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
const provider = new providers.JsonRpcProvider('http://localhost:8545');
const wallet = Wallet.fromMnemonic(mnemonic).connect(provider);

const checkEstimation = (
  baseEstimation: BigNumber,
  currentEstimation: BigNumber,
  ratioMax: number,
) => {
  const absRatio =
    Math.abs(baseEstimation.sub(currentEstimation).toNumber()) /
    Math.max(baseEstimation.toNumber(), currentEstimation?.toNumber());
  expect(absRatio).toBeLessThan(ratioMax);
};

afterEach(() => {
  jest.clearAllMocks();
});

describe('Gas fee estimation', () => {
  it('Should not be undefined', async () => {
    const estimation = await estimateGasFees({ logger: console, provider });
    expect(estimation.maxFeePerGas).toBeDefined();
    expect(estimation.maxPriorityFeePerGas).toBeDefined();
  });

  it('Should return a lower estimation when the previous block is empty', async () => {
    const firstEstimation = await estimateGasFees({ logger: console, provider });
    await provider.send('evm_mine', []);
    const secondEstimation = await estimateGasFees({ logger: console, provider });

    expect(
      firstEstimation.maxFeePerGas?.sub(secondEstimation.maxFeePerGas || 0).toNumber(),
    ).toBeGreaterThan(0);
  });

  it('Should return a consistent value compared to the default value', async () => {
    // Run some transactions so there is data to perform the estimation
    for (let i = 0; i < 20; i++) {
      await wallet.sendTransaction({
        to: dummyAddress,
        value: BigNumber.from(1),
      });
    }

    const estimation = await estimateGasFees({ logger: console, provider });
    const tx = await wallet.sendTransaction({
      to: dummyAddress,
      value: BigNumber.from(1),
    });
    checkEstimation(estimation.maxFeePerGas as BigNumber, tx.maxFeePerGas as BigNumber, 0.1);
  });

  it('Should handle estimation errors properly', async () => {
    jest.spyOn(provider, 'send').mockImplementation((command) => {
      if (command !== 'eth_feeHistory') throw new Error('unhandled command');
      return Promise.resolve({
        // random data, found on https://docs.infura.io/networks/ethereum/json-rpc-methods/eth_feehistory#body
        // not important in this test
        baseFeePerGas: [
          '0x3da8e7618',
          '0x3e1ba3b1b',
          '0x3dfd72b90',
          '0x3d64eee76',
          '0x3d4da2da0',
          '0x3ccbcac6b',
        ],
        gasUsedRatio: [
          0.5290747666666666, 0.49240453333333334, 0.4615576, 0.49407083333333335, 0.4669053,
        ],
        oldestBlock: '0xfab8ac',
        // Here, return all rewards as > 5 Gwei.
        // This is so that all blocks would be considered as outlier blocks in
        // https://github.com/rainbow-me/fee-suggestions/blob/76b9fe14d3740c9df7cedf40b2f85cd8871ff9c2/src/utils.ts#L123C11-L123C22
        // thus triggering an error.
        reward: [
          // 6000000000 wei
          ['x165A0BC00'],
          // 7000000000 wei
          ['x1A13B8600'],
          // 8000000000 wei
          ['x1DCD65000'],
        ],
      });
    });

    const loggerMock = {
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };

    const estimation = await estimateGasFees({ logger: loggerMock, provider });
    expect(estimation).toStrictEqual({});
    expect(loggerMock.error).toHaveBeenCalledWith(
      'estimateGasFees error: Error: Error: ema was undefined',
    );
  });
});
