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
});
