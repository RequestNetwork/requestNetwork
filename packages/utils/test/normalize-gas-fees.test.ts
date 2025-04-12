import { normalizeGasFees } from '../src';
import { BigNumber } from 'ethers';

afterEach(() => {
  jest.clearAllMocks();
});

describe('Normalize Gas Fees', () => {
  it('should respect minimum gas fee', async () => {
    const normalizedGasFees = await normalizeGasFees({
      logger: console,
      suggestFees: async () => ({
        baseFee: '0',
        maxPriorityFee: '0',
      }),
      gasPriceMin: BigNumber.from('1000000000'),
    });
    expect(normalizedGasFees.maxPriorityFeePerGas?.toString()).toBe('1000000000');
    expect(normalizedGasFees.maxFeePerGas?.toString()).toBe('2000000000');
  });

  it('should respect maximum gas fee', async () => {
    const normalizedGasFees = await normalizeGasFees({
      logger: console,
      suggestFees: async () => ({
        baseFee: '400000000000', // 400 Gwei
        maxPriorityFee: '2000000000', // 2 Gwei
      }),
      gasPriceMax: BigNumber.from('250000000000'), // 250 Gwei
    });
    expect(normalizedGasFees.maxPriorityFeePerGas?.toString()).toBe('2000000000'); // 2 Gwei
    expect(normalizedGasFees.maxFeePerGas?.toString()).toBe('250000000000'); // 250 Gwei
  });

  it('should respect gas multiplier', async () => {
    const normalizedGasFees = await normalizeGasFees({
      logger: console,
      suggestFees: async () => ({
        baseFee: '20000000000', // 20 Gwei
        maxPriorityFee: '2000000000', // 2 Gwei
      }),
      gasPriceMultiplier: 200, // x2
    });
    expect(normalizedGasFees.maxPriorityFeePerGas?.toString()).toBe('2000000000'); // 2 Gwei
    expect(normalizedGasFees.maxFeePerGas?.toString()).toBe('44000000000'); // (20 + 2) x 2 = 44 Gwei
  });
});
