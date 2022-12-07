import { BigNumber, BigNumberish } from 'ethers';

/** Returns the minimum of two big numbers */
const min = (a: BigNumberish, b: BigNumberish): BigNumber =>
  BigNumber.from(a).lt(b) ? BigNumber.from(a) : BigNumber.from(b);

/** Returns the maximum of two big numbers */
const max = (a: BigNumberish, b: BigNumberish): BigNumber =>
  BigNumber.from(a).gt(b) ? BigNumber.from(a) : BigNumber.from(b);

export default { min, max };
