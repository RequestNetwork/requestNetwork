import { BigNumberish } from 'ethers/utils';

/**
 * Overrides transaction parameters
 * https://docs.ethers.io/ethers.js/html/api-contract.html#overrides
 */
export interface ITransactionOverrides {
  nonce?: BigNumberish | Promise<BigNumberish>;
  gasLimit?: BigNumberish | Promise<BigNumberish>;
  gasPrice?: BigNumberish | Promise<BigNumberish>;
  value?: BigNumberish | Promise<BigNumberish>;
  chainId?: number | Promise<number>;
}
