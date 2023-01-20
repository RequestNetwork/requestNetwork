import { BigNumber, BigNumberish } from 'ethers';

/** Returns the minimum of two big numbers */
const minBigNumber = (a: BigNumberish, b: BigNumberish): BigNumber =>
  BigNumber.from(a).lt(b) ? BigNumber.from(a) : BigNumber.from(b);

/** Returns the maximum of two big numbers */
const maxBigNumber = (a: BigNumberish, b: BigNumberish): BigNumber =>
  BigNumber.from(a).gt(b) ? BigNumber.from(a) : BigNumber.from(b);

export { minBigNumber, maxBigNumber };
