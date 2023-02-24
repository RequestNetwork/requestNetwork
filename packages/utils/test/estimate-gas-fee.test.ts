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

describe('Gas fee estimation', () => {
  it('Should not be undefined', async () => {
    const estimation = await estimateGasFees({ provider });
    expect(estimation.maxFeePerGas).toBeDefined();
    expect(estimation.maxPriorityFeePerGas).toBeDefined();
  });

  it('Should return a lower estimation when the previous block is empty', async () => {
    const firstEstimation = await estimateGasFees({ provider });
    await provider.send('evm_mine', []);
    const secondEstimation = await estimateGasFees({ provider });

    expect(
      firstEstimation.maxFeePerGas?.sub(secondEstimation.maxFeePerGas || 0).toNumber(),
    ).toBeGreaterThan(0);
  });

  /**
   * The EMA used for estimation occur on the range of 100 blocks.
   * Over 50 blocks we randomly simulate empty or non-empty blocks.
   * We check that there's no discrepancy between the results:
   *  - Less than 20% difference between two consecutive estimations
   *  - Less than 40% difference between the first and the last estimations
   */
  it('Should return a consistent value after several transactions', async () => {
    const firstEstimation = await estimateGasFees({ provider });
    let baseEstimation = firstEstimation;

    for (let i = 0; i < 50; i++) {
      const r = Math.random();
      if (r >= 0.5) {
        await wallet.sendTransaction({
          to: dummyAddress,
          value: BigNumber.from(1),
        });
      } else {
        await provider.send('evm_mine', []);
      }
      const currentEstimation = await estimateGasFees({ provider });
      checkEstimation(
        baseEstimation.maxFeePerGas as BigNumber,
        currentEstimation.maxFeePerGas as BigNumber,
        0.2,
      );
      checkEstimation(
        baseEstimation.maxPriorityFeePerGas as BigNumber,
        currentEstimation.maxPriorityFeePerGas as BigNumber,
        0.2,
      );
      checkEstimation(
        firstEstimation.maxFeePerGas as BigNumber,
        currentEstimation.maxFeePerGas as BigNumber,
        0.4,
      );
      checkEstimation(
        firstEstimation.maxPriorityFeePerGas as BigNumber,
        currentEstimation.maxPriorityFeePerGas as BigNumber,
        0.4,
      );
      baseEstimation = currentEstimation;
    }
  });
});
