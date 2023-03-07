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

  it('Should return a consistent value compared to the default value', async () => {
    // Run some transactions so there is data to perform the estimation
    for (let i = 0; i < 20; i++) {
      await wallet.sendTransaction({
        to: dummyAddress,
        value: BigNumber.from(1),
      });
    }

    const estimation = await estimateGasFees({ provider });
    const tx = await wallet.sendTransaction({
      to: dummyAddress,
      value: BigNumber.from(1),
    });
    checkEstimation(estimation.maxFeePerGas as BigNumber, tx.maxFeePerGas as BigNumber, 0.1);
    checkEstimation(estimation.maxFeePerGas as BigNumber, tx.maxFeePerGas as BigNumber, 0.1);
  });
});
