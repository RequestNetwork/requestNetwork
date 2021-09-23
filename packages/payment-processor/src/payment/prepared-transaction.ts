import { BigNumberish } from 'ethers';

export interface IPreparedTransaction {
  value: BigNumberish;
  data: string;
  to: string;
}
